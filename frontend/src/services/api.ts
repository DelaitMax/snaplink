import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

/**
 * baseUrl относительный: в dev Vite-прокси (vite.config.ts) проксирует
 * /api и /auth на backend, в проде тот же путь проксирует reverse proxy
 * перед статикой фронтенда. Так браузер всегда видит API как same-origin —
 * это важно для httpOnly-cookie сессии (см. backend/README.md, раздел
 * "Аккаунты и роли"), и избавляет от необходимости настраивать CORS.
 */
export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: typeof window !== "undefined" ? window.location.origin : "/",
    credentials: "include",
  }),
  tagTypes: ["CurrentUser", "LinkStats", "LinkClicks", "AdminLinks", "AdminStats", "MyLinks"],
  endpoints: () => ({}),
});
