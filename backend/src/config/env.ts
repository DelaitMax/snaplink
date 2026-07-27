import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required").url("DATABASE_URL must be a valid connection string"),

  // Публичный базовый URL, на котором отдаются короткие ссылки. Используется
  // для формирования shareUrl / statsUrl в ответе API создания ссылки.
  // Названа не просто BASE_URL, т.к. это имя зарезервировано Vite/Vitest
  // (import.meta.env.BASE_URL) и просачивается в process.env при прогоне тестов.
  PUBLIC_BASE_URL: z.string().url().default("http://localhost:3000"),

  // Дефолтный TTL для ссылок, если пользователь не указал свой (в секундах).
  // По умолчанию — не задан (ссылки бессрочны, пока не деактивированы вручную).
  DEFAULT_LINK_TTL_SECONDS: z.coerce.number().int().positive().optional(),

  // Секрет для подписи JWT (httpOnly-cookie сессии). Обязателен, без дефолта —
  // сервис не должен запускаться с угадываемым секретом "из коробки".
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters long"),
  JWT_COOKIE_NAME: z.string().min(1).default("auth_token"),
  // Срок жизни сессии в секундах — используется и для подписи токена, и для maxAge cookie.
  JWT_EXPIRES_IN_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60 * 24 * 7), // 7 дней

  // Используются только скриптом db:seed для создания/обновления единственного
  // администратора сервиса. Регистрация через API не предусмотрена (предусмотрены
  // только login/logout/me) — считаем сервис одно-арендаторским.
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),

  // Redis используется как кэш перед БД для redirect-эндпоинта. Не критичен:
  // при недоступности Redis сервис продолжает работать напрямую через БД.
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  REDIS_LINK_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(60),

  // Geo-провайдер для определения региона по IP (ip-api.com или совместимый
  // по формату ответ { status, countryCode, regionName, city }). Настраиваемый
  // базовый URL — чтобы можно было подставить локальный мок в тестах или
  // сменить провайдера без изменения кода.
  GEO_API_BASE_URL: z.string().url().default("http://ip-api.com/json"),
  GEO_LOOKUP_TIMEOUT_MS: z.coerce.number().int().positive().default(2000),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }

  return parsed.data;
}

export const env = loadEnv();
