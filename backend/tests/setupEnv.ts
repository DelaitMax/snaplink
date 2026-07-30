process.env["NODE_ENV"] ??= "test";
process.env["PORT"] ??= "3999";
process.env["DATABASE_URL"] ??= "postgres://postgres:postgres@localhost:5432/snaplink_test";
process.env["PUBLIC_BASE_URL"] ??= "http://localhost:3999";

process.env["JWT_SECRET"] ??= "test-only-secret-not-for-production-use-1234567890";
process.env["JWT_COOKIE_NAME"] ??= "auth_token";
process.env["JWT_EXPIRES_IN_SECONDS"] ??= "3600";

process.env["ADMIN_EMAIL"] ??= "admin@example.com";
process.env["ADMIN_PASSWORD"] ??= "TestPassword123";

process.env["REDIS_URL"] ??= "redis://localhost:6379";
process.env["REDIS_LINK_CACHE_TTL_SECONDS"] ??= "60";

process.env["GEO_API_BASE_URL"] ??= "http://127.0.0.1:19999/json";
process.env["GEO_LOOKUP_TIMEOUT_MS"] ??= "300";
