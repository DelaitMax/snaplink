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
│   ├── Dockerfile            # build (vite build) -> nginx:alpine
│   └── nginx.conf            # отдача SPA + прокси /api, /auth -> backend
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
├── docker-compose.yml        # postgres + redis + backend + frontend (dev, все порты открыты)
├── docker-compose.prod.yml   # прод-оверрайд: БД скрыта, точка входа только на 127.0.0.1
├── .github/workflows/        # CI/CD (отдельные джобы для backend и frontend)
```

## Быстрый старт (Docker, dev)

```bash
cp .env.example .env   # заполнить JWT_SECRET (мин. 32 символа) и остальное
docker compose up --build -d

docker compose run --rm backend node dist/db/migrate.js  # миграции — вручную
docker compose run --rm backend node dist/db/seed.js      # один раз — создать администратора
```

Веб-приложение — `http://localhost:8080` (порт настраивается через `WEB_PORT`
в `.env`), backend (API + короткие ссылки) — `http://localhost:3000`
(`APP_PORT`). Почему это два разных адреса — см. "Архитектура: frontend и
backend на разных origin" в `frontend/README.md`. Postgres/Redis тоже
доступны с портов хоста (`POSTGRES_PORT`/`REDIS_PORT`) — удобно для
локальной разработки и отладки через любой DB-клиент. Подробности по
каждой части — в `backend/README.md` и `frontend/README.md`.

## Продакшн: docker-compose.prod.yml

Dev-конфиг выше открывает всё на `0.0.0.0` — годится для локальной машины,
но не для сервера, смотрящего в интернет. `docker-compose.prod.yml` — это
оверрайд поверх `docker-compose.yml`:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm backend node dist/db/migrate.js
```

Что меняется:
- `postgres`/`redis` — без публикации портов вовсе, недостижимы снаружи
  docker-сети ни при каких обстоятельствах;
- `backend`/`frontend` — публикуются только на `127.0.0.1` (не `0.0.0.0`),
  то есть снаружи хоста недостижимы вообще.

Единственная точка входа с точки зрения интернета — reverse proxy
(nginx/Caddy/etc.), который ставится на этом же хосте отдельно от
docker-compose: он слушает публичные порты (80/443, домены, TLS) и сам
решает, куда проксировать трафик дальше — на `127.0.0.1:$WEB_PORT`
(frontend, SPA + `/api`/`/auth`) или на `127.0.0.1:$APP_PORT` (backend,
короткие ссылки на своём origin — см. "Архитектура" в `frontend/README.md`).

