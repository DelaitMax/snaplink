## backend

Node.js + Express + TypeScript API сервиса сокращения ссылок:
создание/редирект коротких ссылок, статистика переходов, аккаунты с
ролями (`admin`/`user`) и "мои ссылки" для залогиненных пользователей.

- `src/config/` — конфигурация приложения, валидация env через zod
- `src/controllers/` — HTTP-контроллеры (тонкий слой над services)
- `src/services/` — бизнес-логика, отдельно от контроллеров
- `src/middleware/` — error.middleware, logger.middleware, rate limiting, auth
- `src/db/schema` — модели данных Drizzle ORM
- `src/db/migrations` — миграции БД
- `src/routes/` — роуты (публичный redirect vs приватный API)
- `src/utils/` — вспомогательные функции (IP-извлечение, AppError и т.д.)
- `src/types/` — общие TypeScript-типы backend
- `tests/` — автотесты

### API

Публичное:
- `GET /:code` — редирект по короткому коду (302)
- `POST /api/links` — создать короткую ссылку; тело:
  `{ "url": "https://example.com", "alias"?: "my-code", "ttlSeconds"?: 3600 }`;
  ответ: `{ shortCode, shareUrl, statsUrl, originalUrl, expiresAt, createdAt }`.
  Работает анонимно; если запрос пришёл с валидной сессией — ссылка
  дополнительно привязывается к пользователю (см. "Аккаунты и роли" ниже)
- `GET /api/links/:token/stats` — статистика по ссылке по `statsToken`
  (капабилити-токен: доступ без логина, всем, у кого есть ссылка)
- `GET /api/links/:token/clicks` / `GET /api/links/:token/clicks/export` —
  пагинированная история переходов и её CSV-экспорт
- `POST /api/links/:token/deactivate` — ручная деактивация ссылки
- `GET /health` — health-check

Аутентификация:
- `POST /auth/register` — самостоятельная регистрация (email + пароль),
  сразу логинит; всегда создаёт роль `user`
- `POST /auth/login` / `POST /auth/logout` — вход/выход (httpOnly-cookie с JWT)
- `GET /auth/me` — текущий пользователь, требует сессию

Требуют сессию:
- `GET /api/links/mine` — ссылки текущего пользователя (в т.ч. `statsToken`
  каждой — переход на её статистику без необходимости хранить токен отдельно)
- `GET /api/admin/links`, `GET /api/admin/stats`, `GET /api/admin/stats/export`
  — весь сервис целиком: список всех ссылок, глобальная статистика
  (totalLinks, totalClicks, clicksByDay, deviceBreakdown, browserBreakdown,
  osBreakdown, топ-10 ссылок по кликам) и её CSV-экспорт. Требуют роль `admin`

### Аккаунты и роли

Два уровня доступа, независимых друг от друга:

1. **`statsToken`** — капабилити-токен, выдаётся при создании ссылки и не
   требует аккаунта: у кого есть ссылка на страницу статистики, у того есть
   доступ к ней. Работает для всех ссылок, включая созданные анонимно.
2. **Аккаунт** (`users.role`: `admin` | `user`, дефолт `user`) — поверх
   первого уровня. Роль `admin` достижима только через `db/seed.ts`
   (`ADMIN_EMAIL`/`ADMIN_PASSWORD`), самостоятельная регистрация её никогда
   не выдаёт. Обычный `user` видит только свои ссылки (`GET /api/links/mine`,
   фильтр по `links.userId`); `admin` — весь сервис (`/api/admin/*`,
   `requireAdmin` middleware, для не-admin — 403).

Пароли — bcrypt (`bcryptjs`, 12 раундов); один и тот же текст ошибки для
"нет такого email" и "неверный пароль", чтобы перебором нельзя было узнать
зарегистрированные email.

### Безопасность и надёжность

- **SSRF-защита** (`src/utils/urlSafety.ts`): блокируются `localhost`,
  loopback/private/link-local IPv4- и IPv6-диапазоны, в том числе по итогам
  DNS-резолва домена (защита от DNS rebinding)
- **Обработка ошибок**: `AppError` + централизованный `error.middleware.ts` —
  штатные ошибки (`AppError`, `ZodError`) превращаются в предсказуемый
  JSON-ответ, неожиданные логируются со стеком
- **Логирование**: pino — уровень через `LOG_LEVEL`, pretty-print в
  development, структурированный JSON в остальных окружениях;
  `logger.middleware.ts` логирует каждый запрос после ответа с уровнем по
  статус-коду (`>=500` → error, `>=400` → warn, иначе → info)
- **Rate limiting** (`express-rate-limit`): глобально 100 запросов/мин на IP
  на весь API кроме `/health`; отдельно 10 запросов/15мин на весь `/auth`
  (включая `/auth/register`)
- **`getClientIp`** (`src/utils/getClientIp.ts`): реальный IP с учётом
  `X-Forwarded-For`/`X-Real-IP` (актуально за прокси/докером), нормализация
  IPv4-mapped IPv6-адресов (`::ffff:x.x.x.x`); при localhost/unknown — `null`
  вместо падения запроса

### Статистика переходов

- Каждый переход (`clicks`) пишет дату, IP, регион (geo), браузер+версию,
  ОС+версию, тип устройства, флаг бота
- `ua-parser-js` — браузер/версия/ОС/тип устройства из User-Agent;
  `isbot` — фильтрация ботов/краулеров: пишутся в БД (`isBot: true`), но
  исключены из всей агрегированной статистики и списков кликов
- Geo — через настраиваемый провайдер в формате ip-api.com
  (`src/services/geo.service.ts`, `GEO_API_BASE_URL`); таймаут и любая
  сетевая ошибка не роняют запись клика, geo-поля просто остаются `null`;
  успешный результат кэшируется в Redis по IP (`GEO_CACHE_TTL_SECONDS`,
  по умолчанию 6 часов) — экономит лимит бесплатного API (45 запросов/мин
  без ключа у ip-api.com) на повторных кликах с одних и тех же IP
- Запись клика — асинхронно, после отправки редиректа, чтобы geo-lookup не
  задерживал ответ пользователю
- Redis-кэш перед БД на redirect-эндпоинте (`src/lib/redis.ts`,
  `REDIS_LINK_CACHE_TTL_SECONDS`); при недоступности Redis — прозрачный
  fallback на БД; ручная деактивация инвалидирует кэш сразу, TTL-истечение
  проверяется по `expiresAt` даже для закэшированного значения
- Пагинация (`src/utils/pagination.ts`, `?page=&pageSize=`) и экспорт в CSV
  (`csv-stringify`, `src/utils/csv.ts`) — и по одной ссылке, и по всему сервису

### Качество кода

- ESLint (flat config, `eslint.config.mjs`): `@typescript-eslint` +
  `eslint-config-prettier`. Type-aware линтинг `src/**` через `tsconfig.json`
  и `tests/**` через отдельный `tsconfig.test.json`
- `tsconfig.json`: строгий набор флагов, включая `exactOptionalPropertyTypes`,
  `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`
- Path alias `@/*` → `src/*` и `@tests/*` → `tests/*` — работает одинаково в
  dev (`tsx`), тестах (`vitest`, через `resolve.alias`) и проде (`tsc` +
  `tsc-alias` переписывает `@/...` обратно в относительные пути в `dist/`
  при `npm run build`)

### Тесты

Vitest: юнит-тесты (`tests/unit/`, без БД — чистые функции и zod-схемы:
SSRF-валидация, генерация кодов, пагинация, CSV, бот-детекция, UA-парсинг,
`AppError`, auth-схемы) и интеграционные тесты (`tests/integration/`, через
`supertest` против реального Express-приложения + тестовый PostgreSQL/Redis:
создание/редирект/TTL/деактивация ссылок, регистрация/логин/`/me`, "мои
ссылки", клики и агрегированная статистика с ботами, admin-эндпоинты и
проверка роли).

- `npm test` — всё; `npm run test:unit` / `npm run test:integration` — по отдельности
- Тестовое окружение — `tests/setupEnv.ts` (дефолты через `??=`,
  переопределяются реальными env в CI); geo-провайдер в тестах указывает на
  заведомо закрытый порт, чтобы не ходить в реальный ip-api.com
- `truncateAll()` между тестами чистит и Postgres (`TRUNCATE ... CASCADE`),
  и Redis (`FLUSHDB`) — без этого закэшированные redirect-записи одного
  теста "протекают" в следующий
- `authRateLimiter` (10 запросов/15мин) общий на всё время жизни
  Express-приложения внутри одного тестового файла — интеграционные тесты
  на `/auth/*` держат общее количество запросов в файле под этим лимитом

### Docker

Только backend (frontend в Docker не участвует — см. корневой README и
`frontend/README.md`).

- Многостадийный `Dockerfile` (`deps` → `build` → `prod-deps` → `runner`):
  собирается `dist/` через `npm run build`, в финальный образ (`node:24-alpine`)
  копируются только прод-зависимости и скомпилированный код — никакого `src/`,
  `tests/`, TypeScript-тулинга. Контейнер работает от встроенного
  непривилегированного пользователя `node`, есть `HEALTHCHECK` на `/health`
- **Миграции — ручные.** Контейнер их не прогоняет сам при старте: `CMD` —
  просто `node dist/index.js`. Прогнать явно перед первым стартом и после
  каждого обновления схемы:
  ```bash
  docker compose run --rm backend node dist/db/migrate.js
  ```
- `npm run build` дополнительно копирует `src/db/migrations/*.sql` в
  `dist/db/migrations/` (`copy:migrations`); `migrate.ts` резолвит папку
  миграций через `path.join(__dirname, "migrations")`, поэтому корректно
  работает и в dev (`src/db`), и в собранном `dist/db`
- `docker-compose.yml` в корне репозитория: `postgres` + `redis` + `backend`,
  с health-check'ами и `depends_on: condition: service_healthy`. Все три
  сервиса доступны с портов хоста — удобно для локальной разработки. Пример
  переменных — в корневом `.env.example`
- `docker-compose.prod.yml` — прод-оверрайд (`postgres`/`redis` скрыты
  полностью, `backend` — только на `127.0.0.1`, единственная внешняя точка
  входа — nginx на хосте, см. `deploy/nginx.conf.example`). Подробности —
  в корневом README

```bash
# из корня репозитория
cp .env.example .env
docker compose up --build -d
docker compose run --rm backend node dist/db/migrate.js  # миграции — вручную
docker compose run --rm backend node dist/db/seed.js      # разово — создать администратора
docker compose logs -f backend
```

### CI/CD

`.gitlab-ci.yml` (в корне репозитория) — GitLab CI/CD, четыре стадии
(`lint` → `test` → `build` → `deploy`):

1. `lint-and-typecheck-backend` — `typecheck`, `typecheck:tests`, `lint`
2. `test-backend` — `npm test` с реальными Postgres/Redis как GitLab CI
   `services:`; джоба сама ждёт готовности Postgres через `pg_isready` в
   цикле перед запуском тестов (в отличие от GitHub Actions, у GitLab нет
   встроенного health-check для services)
3. `build-image-backend` — собирает `Dockerfile` (без пуша, через
   `docker:dind`), чтобы поймать поломки сборки образа; идёт после
   успешных lint/typecheck/test (`needs:`)
4. `deploy` — по SSH деплоит backend на VPS, только на push в `main`;
   подробности — в разделе "Деплой" ниже

Для frontend — `lint-and-typecheck-frontend` (+ `vite build` как
дополнительная проверка) и `test-frontend`, без сборки образа и без участия
в `deploy` (только гейтят его: `deploy` не запустится, если frontend
сломан) — фронтенд собирается локально и деплоится отдельно, см.
`frontend/README.md`.

### Деплой

`deploy` — джоба в `.gitlab-ci.yml` (stage `deploy`, только на push в
`main`): по SSH подключается к VPS, `git reset --hard` на актуальный
`main`, пересобирает backend через
`docker compose -f docker-compose.yml -f docker-compose.prod.yml build`
(БД скрыта, backend — только на `127.0.0.1`, см. `docker-compose.prod.yml`),
поднимает его, прогоняет миграции (`node dist/db/migrate.js`) и чистит
неиспользуемые образы. Frontend этой джобой не деплоится — собирается
локально и выкладывается отдельно (см. `frontend/README.md`).

Нужные CI/CD-переменные проекта (GitLab: Settings → CI/CD → Variables,
Protected + Masked):
- `VPS_HOST`, `VPS_USER` — адрес и пользователь для SSH
- `VPS_SSH_KEY` — приватный ключ (без пароля) с доступом на сервер
- `VPS_PATH` — путь к уже склонированному репозиторию на сервере

На VPS перед первым деплоем нужно один раз вручную: склонировать
репозиторий в `$VPS_PATH`, положить туда `.env` (см. корневой
`.env.example`), поставить Docker + Compose plugin и настроить внешний
nginx (см. `deploy/nginx.conf.example`) — дальше каждый push в `main`
деплоит backend сам; frontend выкладывается отдельно.

Managed-хостинг (Railway/Render/Fly.io/etc вместо своего VPS) тоже
подходит: собрать образ (`docker build -t <registry>/snaplink-backend
./backend`), запушить в container registry и прокинуть переменные
окружения из `.env.example`, указав `DATABASE_URL`/`REDIS_URL` от
managed-провайдера вместо `postgres`/`redis` из compose-сети.

### Локальный запуск

Через Docker — см. раздел "Docker" выше и `docker compose up` из корня
репозитория. Без Docker (например, для разработки с hot-reload) — вручную:

```bash
cp .env.example .env      # указать DATABASE_URL, JWT_SECRET (мин. 32 символа) на свой PostgreSQL
npm install
npm run db:generate       # сгенерировать SQL-миграцию из схемы
npm run db:migrate        # применить миграции
npm run db:seed           # создать администратора из ADMIN_EMAIL/ADMIN_PASSWORD
npm run dev                # http://localhost:3000, требует PostgreSQL;
                            # Redis и geo-провайдер опциональны (см. graceful degradation выше)
npm test                   # юнит + интеграционные тесты (интеграционным нужен PostgreSQL)
npm run lint                # ESLint
```
