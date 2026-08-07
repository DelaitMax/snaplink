import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required").url("DATABASE_URL must be a valid connection string"),

  PUBLIC_BASE_URL: z.string().url("PUBLIC_BASE_URL must be a valid URL"),

  DEFAULT_LINK_TTL_SECONDS: z.coerce.number().int().positive().optional(),

  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters long"),
  JWT_COOKIE_NAME: z.string().min(1).default("auth_token"),
  JWT_EXPIRES_IN_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60 * 24 * 7),

  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),

  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),

  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  REDIS_LINK_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(60),

  GEO_API_BASE_URL: z.string().url().default("http://ip-api.com/json"),
  GEO_LOOKUP_TIMEOUT_MS: z.coerce.number().int().positive().default(2000),
  GEO_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(21_600),
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
