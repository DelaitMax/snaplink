import { env } from "@/config/env";
import { logger } from "@/utils/logger";
import { cacheGet, cacheSet } from "@/lib/redis";

export interface GeoInfo {
  countryCode: string | null;
  region: string | null;
  city: string | null;
}

interface IpApiResponse {
  status: "success" | "fail";
  countryCode?: string;
  regionName?: string;
  city?: string;
  message?: string;
}

export type GeoLookupResult =
  | { ok: true; geo: GeoInfo }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "provider_error"; cause?: unknown };

export function geoCacheKey(ip: string): string {
  return `geo:ip:${ip}`;
}

export async function lookupGeo(ip: string): Promise<GeoLookupResult> {
  const cacheKey = geoCacheKey(ip);
  const cached = await cacheGet(cacheKey);
  if (cached !== null) {
    try {
      return { ok: true, geo: JSON.parse(cached) as GeoInfo };
    } catch {
      // ignore
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.GEO_LOOKUP_TIMEOUT_MS);

  try {
    const fields = "status,message,countryCode,regionName,city";
    const url = `${env.GEO_API_BASE_URL.replace(/\/+$/, "")}/${encodeURIComponent(ip)}?fields=${fields}`;
    const res = await fetch(url, { signal: controller.signal });

    if (!res.ok) {
      logger.warn("Geo lookup returned non-OK status", { status: res.status });
      return { ok: false, reason: "provider_error", cause: `HTTP ${res.status}` };
    }

    const data = (await res.json()) as IpApiResponse;

    if (data.status !== "success") {
      return { ok: false, reason: "not_found" };
    }

    const geo: GeoInfo = {
      countryCode: data.countryCode ?? null,
      region: data.regionName ?? null,
      city: data.city ?? null,
    };

    await cacheSet(cacheKey, JSON.stringify(geo), env.GEO_CACHE_TTL_SECONDS);

    return { ok: true, geo };
  } catch (err) {
    logger.warn("Geo lookup errored", { error: err instanceof Error ? err.message : String(err) });
    return { ok: false, reason: "provider_error", cause: err };
  } finally {
    clearTimeout(timeout);
  }
}
