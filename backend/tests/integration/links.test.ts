import "@tests/setupEnv";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { links } from "@/db/schema";
import { redirectCacheKey } from "@/services/links.service";
import { cacheDel, redis } from "@/lib/redis";
import { buildTestApp } from "./helpers/testApp";
import { closeDb, runMigrations, truncateAll } from "./helpers/db";
import { extractSetCookie } from "./helpers/auth";

describe("Links API", () => {
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

  it("creates a link and returns shareUrl + statsUrl", async () => {
    const res = await request(app).post("/api/links").send({ url: "https://example.com/some/page" });

    expect(res.status).toBe(201);
    expect(res.body.shortCode).toMatch(/^[a-zA-Z0-9]{7}$/);
    expect(res.body.shareUrl).toContain(res.body.shortCode);
    expect(res.body.statsUrl).toContain("/api/links/");
    expect(res.body.originalUrl).toBe("https://example.com/some/page");
  });

  it("creates a link with a custom alias", async () => {
    const res = await request(app).post("/api/links").send({ url: "https://example.com", alias: "my-alias" });
    expect(res.status).toBe(201);
    expect(res.body.shortCode).toBe("my-alias");
  });

  it("rejects a taken alias with 409", async () => {
    await request(app).post("/api/links").send({ url: "https://example.com", alias: "dup" });
    const res = await request(app).post("/api/links").send({ url: "https://example.com/other", alias: "dup" });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("ALIAS_TAKEN");
  });

  it("rejects a reserved alias", async () => {
    const res = await request(app).post("/api/links").send({ url: "https://example.com", alias: "api" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("RESERVED_ALIAS");
  });

  it("rejects a missing url with a validation error", async () => {
    const res = await request(app).post("/api/links").send({});
    expect(res.status).toBe(400);
  });

  it.each(["http://localhost:9999/secret", "http://127.0.0.1/admin", "http://192.168.1.1/", "http://169.254.169.254/latest/meta-data", "ftp://example.com/file"])(
    "rejects unsafe URL %s (SSRF protection)",
    async (unsafeUrl) => {
      const res = await request(app).post("/api/links").send({ url: unsafeUrl });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_URL");
    },
  );

  it("redirects to the original URL for a valid short code", async () => {
    const create = await request(app).post("/api/links").send({ url: "https://example.com/target", alias: "redir1" });
    const res = await request(app).get(`/${create.body.shortCode}`);
    expect(res.status).toBe(302);
    expect(res.headers["location"]).toBe("https://example.com/target");
  });

  it("returns 404 for an unknown short code", async () => {
    const res = await request(app).get("/does-not-exist-xyz");
    expect(res.status).toBe(404);
  });

  it("expires a link once its TTL has passed", async () => {
    const create = await request(app)
      .post("/api/links")
      .send({ url: "https://example.com/ttl", alias: "ttllink", ttlSeconds: 3600 });
    expect(create.status).toBe(201);

    const immediate = await request(app).get("/ttllink");
    expect(immediate.status).toBe(302);

    await db.update(links).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(links.shortCode, "ttllink"));
    await cacheDel(redirectCacheKey("ttllink"));

    const expired = await request(app).get("/ttllink");
    expect(expired.status).toBe(410);
  });

  it("does not cache a link that is already expired by the time it's read from the DB", async () => {
    const create = await request(app)
      .post("/api/links")
      .send({ url: "https://example.com/stale", alias: "stalelink", ttlSeconds: 3600 });
    expect(create.status).toBe(201);

    await db.update(links).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(links.shortCode, "stalelink"));
    await cacheDel(redirectCacheKey("stalelink"));

    const res = await request(app).get("/stalelink");
    expect(res.status).toBe(410);

    const cached = await redis.get(redirectCacheKey("stalelink"));
    expect(cached).toBeNull();
  });

  it("caps the Redis cache TTL to the link's remaining lifetime, not the default cache TTL", async () => {
    const create = await request(app)
      .post("/api/links")
      .send({ url: "https://example.com/short-ttl", alias: "shortttl", ttlSeconds: 5 });
    expect(create.status).toBe(201);

    const res = await request(app).get("/shortttl");
    expect(res.status).toBe(302);

    const ttl = await redis.ttl(redirectCacheKey("shortttl"));
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(5);
  });

  it("deactivates a link via its statsToken, making the redirect return 410", async () => {
    const create = await request(app).post("/api/links").send({ url: "https://example.com/deact", alias: "deactme" });
    const statsToken = create.body.statsUrl.split("/").slice(-2)[0];

    const deactivate = await request(app).post(`/api/links/${statsToken}/deactivate`);
    expect(deactivate.status).toBe(200);
    expect(deactivate.body.isActive).toBe(false);

    const res = await request(app).get("/deactme");
    expect(res.status).toBe(410);
  });

  it("requires auth for GET /api/links/mine", async () => {
    const res = await request(app).get("/api/links/mine");
    expect(res.status).toBe(401);
  });

  it("GET /api/links/mine returns only the current user's own links — anonymous links never appear there", async () => {
    await request(app).post("/api/links").send({ url: "https://example.com/anon", alias: "anon-link" });

    const registerA = await request(app)
      .post("/auth/register")
      .send({ email: "owner.a@example.com", password: "OwnerAPassword1" });
    const cookieA = extractSetCookie(registerA);

    const registerB = await request(app)
      .post("/auth/register")
      .send({ email: "owner.b@example.com", password: "OwnerBPassword1" });
    const cookieB = extractSetCookie(registerB);

    const createByA = await request(app)
      .post("/api/links")
      .set("Cookie", cookieA)
      .send({ url: "https://example.com/owned-by-a", alias: "owned-by-a" });
    expect(createByA.status).toBe(201);

    const mineA = await request(app).get("/api/links/mine").set("Cookie", cookieA);
    expect(mineA.status).toBe(200);
    expect(mineA.body.items).toHaveLength(1);
    expect(mineA.body.items[0].shortCode).toBe("owned-by-a");
    expect(mineA.body.items[0].statsToken).toBeTruthy();

    const mineB = await request(app).get("/api/links/mine").set("Cookie", cookieB);
    expect(mineB.status).toBe(200);
    expect(mineB.body.items).toHaveLength(0);
  });
});
