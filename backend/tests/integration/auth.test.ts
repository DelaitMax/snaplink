import "@tests/setupEnv";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { buildTestApp } from "./helpers/testApp";
import { closeDb, runMigrations, truncateAll } from "./helpers/db";
import { seedAdminUser } from "./helpers/auth";

describe("Auth API", () => {
  const app = buildTestApp();

  beforeAll(async () => {
    await runMigrations();
  });

  afterEach(async () => {
    await truncateAll();
  });

  afterAll(async () => {
    await closeDb();
  });

  it("returns 401 from /auth/me without a session", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects login with a non-existent email", async () => {
    const res = await request(app).post("/auth/login").send({ email: "nobody@example.com", password: "whatever123" });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("rejects login with a wrong password, using the same error as unknown email", async () => {
    const { email } = await seedAdminUser();
    const res = await request(app).post("/auth/login").send({ email, password: "totally-wrong-password" });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("logs in, sets an httpOnly cookie, and allows /auth/me", async () => {
    const { email, password } = await seedAdminUser();

    const login = await request(app).post("/auth/login").send({ email, password });
    expect(login.status).toBe(200);
    expect(login.body.email).toBe(email);

    const setCookie = login.headers["set-cookie"];
    expect(setCookie).toBeDefined();
    const cookieHeader = Array.isArray(setCookie) ? setCookie[0] : setCookie;
    expect(cookieHeader).toContain("HttpOnly");

    const me = await request(app).get("/auth/me").set("Cookie", cookieHeader);
    expect(me.status).toBe(200);
    expect(me.body.email).toBe(email);
  });

  it("rejects a forged/invalid JWT cookie", async () => {
    const res = await request(app).get("/auth/me").set("Cookie", "auth_token=not-a-real-jwt");
    expect(res.status).toBe(401);
  });

  it("logout responds with a cookie-clearing Set-Cookie header", async () => {
    // JWT — stateless: logout не инвалидирует сам токен на сервере (нет
    // blacklist), а лишь просит браузер удалить cookie (Max-Age=0/Expires в
    // прошлом). Реальный браузер после этого просто перестанет отправлять
    // cookie — это и проверяем, а не повторную отправку уже отброшенной cookie.
    const { email, password } = await seedAdminUser();
    const login = await request(app).post("/auth/login").send({ email, password });
    const loginCookie = login.headers["set-cookie"][0];

    const logout = await request(app).post("/auth/logout").set("Cookie", loginCookie);
    expect(logout.status).toBe(204);

    const clearedCookie = logout.headers["set-cookie"][0];
    expect(clearedCookie).toMatch(/auth_token=;/);
    expect(clearedCookie.toLowerCase()).toMatch(/expires=thu, 01 jan 1970/);
  });
});
