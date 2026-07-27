import "@tests/setupEnv";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { buildTestApp } from "./helpers/testApp";
import { closeDb, runMigrations, truncateAll } from "./helpers/db";

describe("GET /health", () => {
  const app = buildTestApp();

  beforeAll(async () => {
    await runMigrations();
    await truncateAll();
  });

  afterAll(async () => {
    await closeDb();
  });

  it("returns 200 with status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "ok" });
    expect(typeof res.body.timestamp).toBe("string");
  });
});
