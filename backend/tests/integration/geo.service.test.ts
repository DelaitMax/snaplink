import "@tests/setupEnv";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { geoCacheKey, lookupGeo } from "@/services/geo.service";
import { redis } from "@/lib/redis";

const SAMPLE_RESPONSE = {
  status: "success",
  countryCode: "US",
  regionName: "California",
  city: "San Francisco",
};

function mockFetch(body: unknown) {
  const fetchMock = vi
    .fn()
    .mockImplementation(
      async () => new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } }),
    );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("lookupGeo caching", () => {
  const ip = "203.0.113.77";

  beforeEach(async () => {
    await redis.del(geoCacheKey(ip));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches from the provider on a cache miss and stores the result in Redis", async () => {
    const fetchMock = mockFetch(SAMPLE_RESPONSE);

    const result = await lookupGeo(ip);

    expect(result).toEqual({ ok: true, geo: { countryCode: "US", region: "California", city: "San Francisco" } });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const cached = await redis.get(geoCacheKey(ip));
    expect(cached).not.toBeNull();
    if (result.ok) {
      expect(JSON.parse(cached as string)).toEqual(result.geo);
    }
  });

  it("serves a second lookup for the same IP from cache, without hitting the provider again", async () => {
    const fetchMock = mockFetch(SAMPLE_RESPONSE);

    const first = await lookupGeo(ip);
    const second = await lookupGeo(ip);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });

  it("does not cache a not_found lookup", async () => {
    const fetchMock = mockFetch({ status: "fail", message: "invalid query" });

    const result = await lookupGeo(ip);

    expect(result).toEqual({ ok: false, reason: "not_found" });
    expect(await redis.get(geoCacheKey(ip))).toBeNull();

    await lookupGeo(ip);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not cache a provider_error lookup", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => new Response("boom", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await lookupGeo(ip);

    expect(result).toEqual({ ok: false, reason: "provider_error", cause: "HTTP 500" });
    expect(await redis.get(geoCacheKey(ip))).toBeNull();
  });
});
