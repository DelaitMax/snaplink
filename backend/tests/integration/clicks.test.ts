import "@tests/setupEnv";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { buildTestApp } from "./helpers/testApp";
import { closeDb, runMigrations, truncateAll } from "./helpers/db";
import { waitUntil } from "./helpers/waitUntil";

const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const GOOGLEBOT_UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

describe("Clicks / stats API", () => {
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

  async function createLink(alias: string) {
    const res = await request(app).post("/api/links").send({ url: "https://example.com/x", alias });
    return {
      shortCode: res.body.shortCode as string,
      statsToken: (res.body.statsUrl as string).split("/").slice(-2)[0],
    };
  }

  it("records a click and reflects it in aggregated stats, excluding bots", async () => {
    const { shortCode, statsToken } = await createLink("clicklink");

    await request(app).get(`/${shortCode}`).set("User-Agent", CHROME_UA);
    await request(app).get(`/${shortCode}`).set("User-Agent", GOOGLEBOT_UA);

    await waitUntil(async () => {
      const stats = await request(app).get(`/api/links/${statsToken}/stats`);
      return stats.body.stats.totalClicks === 1;
    });

    const stats = await request(app).get(`/api/links/${statsToken}/stats`);
    expect(stats.body.stats.totalClicks).toBe(1);
    expect(stats.body.stats.deviceBreakdown).toEqual([{ deviceType: "desktop", count: 1 }]);
    expect(stats.body.stats.browserBreakdown).toEqual([{ browser: "Chrome", count: 1 }]);
    expect(stats.body.stats.osBreakdown).toEqual([{ os: "Windows", count: 1 }]);
  });

  it("paginates the click list for a link", async () => {
    const { shortCode, statsToken } = await createLink("paginated");

    for (let i = 0; i < 3; i++) {
      await request(app).get(`/${shortCode}`).set("User-Agent", CHROME_UA);
    }

    await waitUntil(async () => {
      const res = await request(app).get(`/api/links/${statsToken}/clicks`);
      return res.body.total === 3;
    });

    const page1 = await request(app).get(`/api/links/${statsToken}/clicks?page=1&pageSize=2`);
    expect(page1.body.items).toHaveLength(2);
    expect(page1.body.total).toBe(3);
    expect(page1.body.totalPages).toBe(2);

    const page2 = await request(app).get(`/api/links/${statsToken}/clicks?page=2&pageSize=2`);
    expect(page2.body.items).toHaveLength(1);
  });

  it("exports clicks for a link as CSV", async () => {
    const { shortCode, statsToken } = await createLink("csvlink");
    await request(app).get(`/${shortCode}`).set("User-Agent", CHROME_UA);

    await waitUntil(async () => {
      const res = await request(app).get(`/api/links/${statsToken}/clicks`);
      return res.body.total === 1;
    });

    const csv = await request(app).get(`/api/links/${statsToken}/clicks/export`);
    expect(csv.status).toBe(200);
    expect(csv.headers["content-type"]).toContain("text/csv");
    expect(csv.text.split("\n")[0]).toBe("clickedAt,country,region,city,browser,browserVersion,os,osVersion,deviceType");
    expect(csv.text).toContain("Chrome");
  });
});
