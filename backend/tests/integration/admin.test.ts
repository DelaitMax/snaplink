import "@tests/setupEnv";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { buildTestApp } from "./helpers/testApp";
import { closeDb, runMigrations, truncateAll } from "./helpers/db";
import { extractSetCookie, seedAdminUser } from "./helpers/auth";

describe("Admin API", () => {
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

  it("rejects /api/admin/* without a session", async () => {
    const links = await request(app).get("/api/admin/links");
    expect(links.status).toBe(401);

    const stats = await request(app).get("/api/admin/stats");
    expect(stats.status).toBe(401);
  });

  it("rejects /api/admin/* for an authenticated regular (non-admin) user", async () => {
    const register = await request(app)
      .post("/auth/register")
      .send({ email: "regular.user@example.com", password: "RegularPassword1" });
    const cookie = extractSetCookie(register);

    const links = await request(app).get("/api/admin/links").set("Cookie", cookie);
    expect(links.status).toBe(403);
    expect(links.body.error.code).toBe("ADMIN_REQUIRED");

    const stats = await request(app).get("/api/admin/stats").set("Cookie", cookie);
    expect(stats.status).toBe(403);
  });

  it("lists links with pagination once authenticated", async () => {
    const { email, password } = await seedAdminUser();
    const login = await request(app).post("/auth/login").send({ email, password });
    const cookie = extractSetCookie(login);

    await request(app).post("/api/links").send({ url: "https://example.com/1", alias: "adminlink1" });
    await request(app).post("/api/links").send({ url: "https://example.com/2", alias: "adminlink2" });

    const res = await request(app).get("/api/admin/links?page=1&pageSize=1").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.total).toBe(2);
    expect(res.body.totalPages).toBe(2);
  });

  it("returns global stats shape once authenticated", async () => {
    const { email, password } = await seedAdminUser();
    const login = await request(app).post("/auth/login").send({ email, password });
    const cookie = extractSetCookie(login);

    const res = await request(app).get("/api/admin/stats").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      totalLinks: expect.any(Number),
      totalClicks: expect.any(Number),
      clicksByDay: expect.any(Array),
      deviceBreakdown: expect.any(Array),
      browserBreakdown: expect.any(Array),
      osBreakdown: expect.any(Array),
      topLinks: expect.any(Array),
    });
  });
});
