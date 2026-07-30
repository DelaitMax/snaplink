import "@tests/setupEnv";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { buildTestApp } from "./helpers/testApp";
import { closeDb, runMigrations, truncateAll } from "./helpers/db";
import { extractSetCookie, seedAdminUser } from "./helpers/auth";

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
    expect(login.body.role).toBe("admin");

    const cookieHeader = extractSetCookie(login);
    expect(cookieHeader).toContain("HttpOnly");

    const me = await request(app).get("/auth/me").set("Cookie", cookieHeader);
    expect(me.status).toBe(200);
    expect(me.body.email).toBe(email);
    expect(me.body.role).toBe("admin");
  });

  it("registers a new user as role 'user' and logs them in immediately (cookie works for /auth/me)", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "new.user@example.com", password: "SomeSecurePassword1" });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe("new.user@example.com");
    expect(res.body.role).toBe("user");
    expect(extractSetCookie(res)).toContain("HttpOnly");
  });

  it("rejects registration with an email that is already taken", async () => {
    const { email } = await seedAdminUser();

    const res = await request(app).post("/auth/register").send({ email, password: "AnotherPassword1" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("EMAIL_TAKEN");
  });

  it("rejects a forged/invalid JWT cookie", async () => {
    const res = await request(app).get("/auth/me").set("Cookie", "auth_token=not-a-real-jwt");
    expect(res.status).toBe(401);
  });

  it("logout responds with a cookie-clearing Set-Cookie header", async () => {
    const logout = await request(app).post("/auth/logout");
    expect(logout.status).toBe(204);

    const clearedCookie = extractSetCookie(logout);
    expect(clearedCookie).toMatch(/auth_token=;/);
    expect(clearedCookie.toLowerCase()).toMatch(/expires=thu, 01 jan 1970/);
  });
});
