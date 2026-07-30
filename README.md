# Snaplink

Сервис сокращения ссылок.

**Стек:**
- Frontend: React, Redux, TypeScript
- Backend: Node.js, Express, TypeScript
- ORM / БД: Drizzle ORM + PostgreSQL
- Инфраструктура: Docker (multi-stage), docker-compose, CI/CD

## Структура репозитория

```
.
├── frontend/                # React + Redux Toolkit (RTK Query) + TS + Vite
│   └── src/
│       ├── app/             # store, типизированные хуки
│       ├── components/      # переиспользуемые UI-компоненты (+ *.test.tsx)
│       ├── features/        # links, auth, admin (RTK Query endpoints), theme
│       ├── pages/            # страницы (роуты)
│       ├── services/         # базовый API-клиент, извлечение ошибок
│       ├── styles/           # design tokens (light/dark тема)
│       └── types/
│   # без Dockerfile: собирается локально (npm run build -> dist/),
│   # деплоится вручную/отдельным процессом, отдаёт статику внешний nginx
│   # (см. deploy/nginx.conf.example)
│
├── backend/                 # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── config/          # конфиг, валидация env (zod)
│   │   ├── controllers/     # HTTP-контроллеры
│   │   ├── services/        # бизнес-логика
│   │   ├── middleware/      # error/logger middleware, rate limiting, auth
│   │   ├── db/
│   │   │   ├── schema/      # Drizzle-модели
│   │   │   └── migrations/
│   │   ├── routes/          # публичный redirect vs приватный API
│   │   ├── utils/
│   │   └── types/
│   ├── tests/                # юнит + интеграционные тесты (vitest)
│   └── Dockerfile            # multi-stage: deps -> build -> prod-deps -> runner
│
├── deploy/
│   └── nginx.conf.example   # шаблон конфига для внешнего (не в Docker) nginx —
│                             # статика frontend/dist + прокси /api,/auth,
│                             # коротких ссылок на backend
├── docker-compose.yml        # postgres + redis + backend (dev, все порты открыты)
├── docker-compose.prod.yml   # прод-оверрайд: БД скрыта, backend только на 127.0.0.1
└── .gitlab-ci.yml            # CI/CD (отдельные джобы для backend и frontend)
```

## Быстрый старт (Docker, dev)

Docker поднимает только backend (+ postgres + redis). Frontend собирается
локально и открывается напрямую через Vite dev-сервер или уже собранный
`dist/` — см. `frontend/README.md`.

```bash
cp .env.example .env   # заполнить JWT_SECRET (мин. 32 символа) и остальное
docker compose up --build -d

docker compose run --rm backend node dist/db/migrate.js  # миграции — вручную
docker compose run --rm backend node dist/db/seed.js      # один раз — создать администратора
```

Backend (API + короткие ссылки) — `http://localhost:3000` (порт настраивается
через `APP_PORT` в `.env`). Postgres/Redis тоже доступны с портов хоста
(`POSTGRES_PORT`/`REDIS_PORT`) — удобно для локальной разработки и отладки
через любой DB-клиент.

Frontend:

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173, проксирует /api и /auth на backend
```

Почему у frontend и backend разные origin и как это работает в проде — см.
"Архитектура" в `frontend/README.md`. Подробности по каждой части — в
`backend/README.md` и `frontend/README.md`.

## Продакшн: docker-compose.prod.yml

Dev-конфиг выше открывает backend на `0.0.0.0` — годится для локальной
машины, но не для сервера, смотрящего в интернет. `docker-compose.prod.yml` —
это оверрайд поверх `docker-compose.yml`:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm backend node dist/db/migrate.js
```

Что меняется:
- `postgres`/`redis` — без публикации портов вовсе, недостижимы снаружи
  docker-сети ни при каких обстоятельствах;
- `backend` — публикуется только на `127.0.0.1` (не `0.0.0.0`), то есть
  снаружи хоста недостижим вообще.

Frontend в Docker не участвует: собирается локально (`npm run build` в
`frontend/` → `dist/`) и выкладывается на сервер отдельно, любым удобным
способом (`rsync`/`scp`/CI-артефакт) в путь, который отдаёт nginx.

Единственная точка входа с точки зрения интернета — nginx на этом же
хосте, отдельно от docker-compose: слушает публичные порты (80/443, домены,
TLS), отдаёт статику `frontend/dist` и проксирует `/api/*`, `/auth/*` и
короткие ссылки на `127.0.0.1:$APP_PORT` (backend). Готовый шаблон конфига —
`deploy/nginx.conf.example`.

Команды выше — для ручного/первого деплоя. Дальше backend деплоит CI сама:
джоба `deploy` в `.gitlab-ci.yml` на каждый push в `main` подключается по
SSH к серверу и прогоняет ровно то же самое. Настройка переменных —
в `backend/README.md`, раздел "Деплой".

