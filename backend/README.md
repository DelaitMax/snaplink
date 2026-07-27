## backend

Node.js + Express + TypeScript API.

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

### Что реализовано (шаг 1)

- `POST /api/links` — создать короткую ссылку
  - тело: `{ "url": "https://example.com", "alias"?: "my-code", "ttlSeconds"?: 3600 }`
  - ответ: `{ shortCode, shareUrl, statsUrl, originalUrl, expiresAt, createdAt }`
- `GET /:code` — публичный редирект по короткому коду (302)
- `GET /api/links/:token/stats` — базовая информация по ссылке по `statsToken`
  (полноценная аналитика — в следующих шагах)
- `POST /api/links/:token/deactivate` — ручная деактивация ссылки по `statsToken`
- `GET /health` — health-check
- Валидация URL + защита от SSRF (`src/utils/urlSafety.ts`): блокируются
  `localhost`, loopback/private/link-local IPv4- и IPv6-диапазоны, в том числе
  по итогам DNS-резолва домена (защита от DNS rebinding)
- Модель `links` в PostgreSQL через Drizzle ORM (`src/db/schema/links.ts`)
- Кастомные алиасы (с проверкой занятости и списком зарезервированных слов)
- TTL (`ttlSeconds` при создании) и ручная деактивация (`isActive`)

### Что реализовано (шаг 2)

- Сервис-слой (`src/services/`) отдельно от контроллеров
- `AppError` + централизованный `error.middleware.ts`: штатные ошибки
  (`AppError`, `ZodError`) превращаются в предсказуемый JSON-ответ,
  неожиданные — логируются со стеком через общий логгер
- `logger.middleware.ts` — логирует каждый запрос после ответа
  (`res.on('finish')`) с уровнем по статус-коду: `>=500` → error,
  `>=400` → warn, иначе → info; структурированный JSON-лог
  (`src/utils/logger.ts`)
- Валидация входных данных (zod-схемы в `src/schemas/`) и env
  (`src/config/env.ts`)
- Rate limiting (`src/middleware/rateLimit.middleware.ts`,
  `express-rate-limit`): глобальный лимит 100 запросов/мин на IP —
  на весь API кроме `/health`; отдельный строгий лимит 10 запросов/15мин
  на `/auth` (сами auth-роуты — отдельным шагом, лимитер подключён заранее)
- `getClientIp` (`src/utils/getClientIp.ts`) — реальный IP с учётом
  `X-Forwarded-For`/`X-Real-Ip` (актуально за прокси/докером),
  нормализация IPv4-mapped IPv6-адресов (`::ffff:x.x.x.x`); при
  localhost/unknown — `null` вместо падения запроса

### Что реализовано (шаг 3)

- JWT в httpOnly-cookie (`auth_token`, `HttpOnly; SameSite=Lax`, TTL из
  `JWT_EXPIRES_IN_SECONDS`)
- `POST /auth/login` — email+пароль → cookie с JWT
- `POST /auth/logout` — очищает cookie
- `GET /auth/me` — защищён `requireAuth` (`src/middleware/auth.middleware.ts`);
  без валидной сессии — 401
- Разделение публичного трафика (`/:code` redirect, `/api/links` создание —
  анонимны и остаются анонимными) и защищённых данных (`/auth/me`
  требует сессию)
- Таблица `users` (email + bcrypt-хэш пароля) через Drizzle ORM
- Регистрация через API не предусмотрена (предусмотрены только
  login/logout/me) — сервис одно-арендаторский: единственный
  администратор создаётся/обновляется скриптом `npm run db:seed`
  из `ADMIN_EMAIL`/`ADMIN_PASSWORD`
- Пароли — bcrypt (`bcryptjs`, 12 раундов); одинаковый текст ошибки для
  "нет такого email" и "неверный пароль", чтобы не давать возможность
  перебором узнавать зарегистрированные email

### Что реализовано (шаг 4; без фронтенда, только API)

- Сбор данных о переходах (`clicks`): дата, IP (через `getClientIp`),
  регион (geo), браузер+версия, ОС+версия, тип устройства, флаг бота
- `ua-parser-js` — браузер/версия/ОС/тип устройства из User-Agent
- Geo — через настраиваемый провайдер в формате ip-api.com
  (`src/services/geo.service.ts`, `GEO_API_BASE_URL`); таймаут и любая
  сетевая ошибка не роняют запись клика, просто geo-поля остаются `null`
- Фильтрация ботов/краулеров через библиотеку `isbot`
  (`src/utils/userAgent.ts`) — боты пишутся в БД (`isBot: true`), но
  исключены из всей агрегированной статистики и из списков кликов
- Запись клика — асинхронно, после отправки редиректа (`void
  clicksService.recordClick(...)` без await в `redirect.controller.ts`),
  чтобы geo-lookup не задерживал ответ пользователю
- Redis-кэш перед БД на redirect-эндпоинте (`src/lib/redis.ts`,
  `REDIS_LINK_CACHE_TTL_SECONDS`); при недоступности Redis — прозрачный
  fallback на БД, сервис не падает; ручная деактивация инвалидирует кэш
  сразу, TTL-истечение проверяется по `expiresAt` даже для закэшированного значения
- Пагинация (`src/utils/pagination.ts`, `?page=&pageSize=`): список кликов
  по ссылке (`GET /api/links/:token/clicks`) и список всех ссылок
  (`GET /api/admin/links`)
- Глобальная статистика сервиса — `GET /api/admin/stats` (требует
  авторизации): totalLinks, totalClicks, clicksByDay (30 дней),
  deviceBreakdown, топ-10 ссылок по кликам
- Статистика по одной ссылке дополнена в `GET /api/links/:token/stats`:
  `stats.totalClicks`, `stats.clicksByDay`, `stats.deviceBreakdown`
- Экспорт в CSV через библиотеку `csv-stringify` (`src/utils/csv.ts`):
  `GET /api/links/:token/clicks/export` (по ссылке) и
  `GET /api/admin/stats/export` (по всему сервису, требует авторизации)
- Визуализация (графики, разбивка по устройствам на дашборде) — это уже
  фронтенд-часть, сознательно не делалась в этом шаге; все данные для неё уже отдаются API выше

### Качество и инфраструктура (в процессе)

- ESLint (flat config, `eslint.config.mjs`): `@typescript-eslint` +
  `eslint-config-prettier`. Type-aware линтинг `src/**` через `tsconfig.json`
  и `tests/**` через отдельный `tsconfig.test.json` (у которого шире `rootDir`
  и не исключена папка `tests/`, в отличие от основного конфига)
- Path alias `@/*` → `src/*` и `@tests/*` → `tests/*` (см. ниже) — работает
  одинаково в dev (`tsx`), тестах (`vitest`, через `resolve.alias`) и
  проде (`tsc` + `tsc-alias` переписывает `@/...` обратно в относительные
  пути в `dist/` при `npm run build`)
- Vitest: юнит-тесты (`tests/unit/`, 40 тестов, без БД — чистые функции:
  SSRF-валидация, генерация кодов, пагинация, CSV, бот-детекция, UA-парсинг,
  `AppError`) и интеграционные тесты (`tests/integration/`, 27 тестов через
  `supertest` против реального Express-приложения + тестовый PostgreSQL/Redis:
  создание/редирект/TTL/деактивация ссылок, auth login/logout/me, клики и
  агрегированная статистика с ботами, admin-эндпоинты и авторизация)
  - `npm test` — всё; `npm run test:unit` / `npm run test:integration` — по отдельности
  - Тестовое окружение — `tests/setupEnv.ts` (дефолты через `??=`, переопределяются
    реальными env в CI); geo-провайдер в тестах указывает на заведомо закрытый
    порт, чтобы не ходить в реальный ip-api.com и не тормозить тесты на таймауте
  - `truncateAll()` между тестами чистит и Postgres (`TRUNCATE ... CASCADE`),
    и Redis (`FLUSHDB`) — без этого закэшированные redirect-записи одного
    теста "протекают" в следующий и ломают детерминированность

**Про path alias `@/`:** переменная `BASE_URL` изначально называлась именно
так и совпала с зарезервированным именем `import.meta.env.BASE_URL` у
Vite/Vitest, которое просачивалось в `process.env` поверх нашего значения —
переименована в `PUBLIC_BASE_URL` во избежание подобных коллизий с тулингом
в будущем.

### Docker

- Многостадийный `Dockerfile` (`deps` → `build` → `prod-deps` → `runner`):
  собирается `dist/` через `npm run build`, в финальный образ (`node:24-alpine`)
  копируются только прод-зависимости и скомпилированный код — никакого `src/`,
  `tests/`, TypeScript-тулинга. `bcryptjs`/`postgres`/`ioredis`/`isbot`/
  `csv-stringify` — чистый JS, нативная сборка (build tools в Alpine) не
  нужна. Контейнер работает от встроенного непривилегированного пользователя
  `node` (готовый юзер из официального образа, свой создавать не нужно),
  есть `HEALTHCHECK` на `/health`
- **Миграции — ручные.** Контейнер их не прогоняет сам при старте (никакого
  entrypoint-скрипта с ретраями): `CMD` — просто `node dist/index.js`.
  Миграции нужно явно прогнать перед первым стартом (и после каждого
  обновления схемы):
  ```bash
  docker compose run --rm backend node dist/db/migrate.js
  ```
- `npm run build` дополнительно копирует `src/db/migrations/*.sql` в
  `dist/db/migrations/` (`copy:migrations` — `tsc` компилирует только `.ts`
  и не трогает `.sql`); `migrate.ts` резолвит папку миграций через
  `path.join(__dirname, "migrations")`, а не хардкодом относительно `cwd`,
  поэтому корректно работает и в dev (`src/db`), и в собранном `dist/db`
- `docker-compose.yml` в корне репозитория: `postgres` + `redis` + `backend` +
  `frontend`, с health-check'ами и `depends_on: condition: service_healthy`.
  Все четыре сервиса доступны с портов хоста — удобно для локальной
  разработки. Пример переменных — в корневом `.env.example`
- `docker-compose.prod.yml` — прод-оверрайд (`postgres`/`redis` скрыты
  полностью, `backend`/`frontend` — только на `127.0.0.1`, единственная
  внешняя точка входа — nginx на хосте). Подробности — в корневом README

```bash
# из корня репозитория
cp .env.example .env
docker compose up --build -d
docker compose run --rm backend node dist/db/migrate.js  # миграции — вручную
docker compose run --rm backend node dist/db/seed.js      # разово — создать администратора
docker compose logs -f backend
```

Собранный `dist/` локально проверен end-to-end (реальный PostgreSQL + Redis,
чистое окружение без унаследованных dev-переменных): миграции применяются,
`/health`/`/api/links` отвечают корректно, боты (через `isbot`) исключаются
из статистики, CSV-экспорт (через `csv-stringify`) собирается верно. Сама
сборка Docker-образа (`docker build`) проверена по шагам вручную (Docker-демон
поднимается в песочнице), но упирается в сетевые ограничения окружения при
пуле базового образа `node:24-alpine` с Docker Hub — в GitHub Actions (полный
доступ в интернет) это ограничение не действует.

### CI/CD

`.github/workflows/ci.yml`, три джобы на каждый push/PR в `main`:
1. `lint-and-typecheck` — `typecheck`, `typecheck:tests`, `lint`
2. `test` — `npm test` с реальными Postgres/Redis как service-контейнерами
3. `build-image` — собирает `Dockerfile` (без пуша) через
   `docker/build-push-action`, чтобы поймать поломки сборки образа; идёт
   после успешных lint/typecheck/test

### Деплой

Готового хостинга/CD-пайплайна с публикацией образа в этом задании нет —
вне рамок тестового задания. Для реального деплоя: собрать образ
(`docker build -t <registry>/snaplink-backend ./backend`), запушить в
любой container registry (GHCR/Docker Hub/etc — можно добавить job в
`ci.yml` на пуш по тегу) и поднять его туда, где есть managed PostgreSQL и
Redis (Railway, Render, Fly.io, VPS с `docker-compose.yml` из корня и т.д.),
прокинув переменные окружения из `.env.example`. Для managed БД без
собственного docker-compose — просто указать `DATABASE_URL`/`REDIS_URL` от
провайдера вместо `postgres`/`redis` из compose-сети.

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
