## frontend

React + Redux Toolkit (RTK Query) + TypeScript + Vite + Tailwind CSS v4.
Не запускается в Docker — собирается локально (`npm run build`) и
выкладывается статикой, см. "Деплой" ниже.

- `src/app/` — Redux store, типизированные хуки (`useAppDispatch`/`useAppSelector`)
- `src/components/` — переиспользуемые UI-компоненты (Button, Input, Card,
  Pagination, BarChart/DonutChart — свои лёгкие графики на SVG/flex-div'ах,
  без recharts, и т.д.)
- `src/features/links/` — RTK Query endpoints: создание ссылки, статистика,
  клики, деактивация, "мои ссылки"
- `src/features/auth/` — RTK Query endpoints login/register/logout/me +
  `ProtectedRoute` (опционально требует роль `admin`)
- `src/features/admin/` — RTK Query endpoints: глобальная статистика, список ссылок
- `src/pages/` — страницы (роуты)
- `src/services/api.ts` — базовый RTK Query API-инстанс
- `src/index.css` — Tailwind CSS v4 (`@import "tailwindcss"`) + design tokens
  через `@theme` (light/dark, см. ниже)
- `src/features/theme/` — Redux slice переключения темы + persist в localStorage
- `src/types/api.ts` — типы, зеркалящие контракты backend API

### Роуты

- `/` — `CreateLinkPage`: форма создания короткой ссылки (URL, кастомный
  алиас, TTL), результат с двумя ссылками (share + stats), QR-код и
  copy-to-clipboard
- `/s/:statsToken` — `LinkStatsPage`: агрегаты (всего переходов, график по
  дням, разбивка по устройствам, донат-чарты по браузерам и ОС),
  пагинированная история переходов, экспорт в CSV, ручная деактивация ссылки
- `/login` — `LoginPage`: вход по email/паролю (httpOnly-cookie сессия backend)
- `/register` — `RegisterPage`: самостоятельная регистрация (всегда роль
  `user`), сразу логинит
- `/my-links` — `MyLinksPage` (защищён `ProtectedRoute`, любая роль): только
  свои ссылки залогиненного пользователя, с переходом на статистику каждой
- `/admin` — `AdminDashboardPage` (защищён `ProtectedRoute requireAdmin` —
  без сессии редирект на `/login`, для роли `user` на `/my-links`):
  глобальная статистика (в т.ч. донат-чарты по браузерам/ОС), топ-ссылки,
  пагинированный список всех ссылок, экспорт в CSV

### Стили: Tailwind CSS v4 (без per-component .css)

Все стили — через Tailwind CSS v4, подключённый через `@tailwindcss/vite`
(`vite.config.ts`) и `@import "tailwindcss"` в единственном `src/index.css`.

- Цветовые токены объявлены в `@theme` (`src/index.css`) как `--color-*`,
  но каждый указывает на обычную CSS-переменную `--app-*`, которая
  переопределяется под `[data-theme="dark"]` — так утилиты (`bg-bg`,
  `text-ink`, `border-border-strong`, ...) сами реагируют на переключение
  темы без варианта `dark:` у каждого класса
- `--font-sans`/`--font-mono` переопределены на Space Grotesk/JetBrains Mono
  прямо поверх дефолтных Tailwind-токенов — значит стандартные `font-sans`/
  `font-mono` уже используют нужные шрифты без кастомных имён утилит
- Иконки — `lucide-react` (`Sun`/`Moon` в `ThemeToggle`, `Loader2` в
  `Spinner`) вместо самодельных inline-SVG
- Динамические значения (ширина/высота QR-кода, высота столбца в
  `BarChart`) остаются как `style={{ ... }}` — Tailwind-классы только для
  статических частей, это нормальная практика, а не смешение подходов

### UI/UX

- **Тёмная/светлая тема**: `src/features/theme/themeSlice.ts` (Redux) — по
  умолчанию берётся системная `prefers-color-scheme`, дальше переключается
  кнопкой в шапке (`ThemeToggle`) и сохраняется в `localStorage`. Инлайн-скрипт
  в `index.html` выставляет `data-theme` до маунта React, чтобы не было
  мигания темы при загрузке
- **QR-код для шаринга** (`src/components/QrCode.tsx`, пакет `qrcode`): на
  главной странице рядом с результатом создания ссылки и в шапке страницы
  статистики
- **Responsive**: адаптивные брейкпоинты на всех страницах и в `Layout`
  (шапка, карточки, таблицы со скроллом по горизонтали на мобильных,
  `clamp()` для заголовков) — через Tailwind `max-[Npx]:*`-варианты

### Тесты и CI

- Vitest + Testing Library + jsdom: юнит-тесты чистой логики
  (`extractStatsToken`, `getApiErrorMessage`, `themeSlice`) и
  компонентные/интеграционные тесты с реальным Redux store и мокнутым
  `fetch` (`Button`, `CopyButton`, `Pagination`, `BarChart`, `DonutChart`,
  `ThemeToggle`, `ProtectedRoute`, `CreateLinkPage` — заполнение формы →
  отправка → результат → сброс, отображение ошибок)
- `.gitlab-ci.yml` (в корне репозитория): `lint-and-typecheck-frontend`
  (`typecheck` + `lint` + `vite build` как дополнительная проверка) и
  `test-frontend`. Без сборки Docker-образа и без деплоя из CI — фронтенд
  собирается локально, см. "Деплой" ниже

### Архитектура: frontend и backend на разных origin

Backend отдаёт публичные короткие ссылки как `GET /:code` (буквально любой
однословный путь в корне) — поэтому frontend **не может** делить один origin
с backend "как есть": простой путь вроде `/login` на backend-origin выглядел
бы как попытка редиректа по несуществующему короткому коду.

Вместо этого: frontend и backend — два разных origin (как у большинства
реальных сервисов сокращения ссылок: домен для самих коротких ссылок
отдельно от домена веб-приложения). Браузер должен видеть API как
same-origin (иначе не будет работать httpOnly-cookie сессия без лишней
возни с CORS/`SameSite=None`) — это достигается прокси:

- **dev**: Vite проксирует `/api` и `/auth` на backend (см. `vite.config.ts`,
  `VITE_BACKEND_URL`, по умолчанию `http://localhost:3000`)
- **прод**: внешний nginx перед статикой frontend'а так же прокидывает
  `/api/*` и `/auth/*` на backend — см. `deploy/nginx.conf.example` в корне
  репозитория

### Деплой

Frontend в Docker не собирается и не разворачивается. Процесс:

```bash
npm run build   # tsc -b && vite build -> dist/
```

Дальше `dist/` выкладывается на сервер любым удобным способом (`rsync`,
`scp`, CI-артефакт) в путь, который отдаёт статикой внешний nginx — см.
`deploy/nginx.conf.example` в корне репозитория (там же — проксирование
`/api/*`/`/auth/*` на backend, чтобы сохранить same-origin для cookie-сессии).
CI (`.gitlab-ci.yml`) фронтенд не деплоит — только прогоняет lint/typecheck/test.

### Локальный запуск (dev, hot-reload)

```bash
npm install
npm run dev          # http://localhost:5173, ожидает backend на :3000
npm run build         # tsc -b && vite build -> dist/
npm run typecheck
npm run lint
npm test              # vitest run
```

### Известное расхождение в npm audit

`react-router-dom` в последней версии имеет одну high-severity запись в
`npm audit` — CSRF-обход, специфичный для **RSC-режима** (React Server
Components + actions). Это приложение — чистый client-side рендеринг без
RSC и без loaders/actions, так что уязвимость к нам не применима. Осознанно
не понижал версию: более старые версии несут набор других, реально
применимых к нам уязвимостей (open redirect → XSS, DoS через route
matching), пофикшенных как раз в последних релизах.
