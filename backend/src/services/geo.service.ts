import { env } from "@/config/env";
import { logger } from "@/utils/logger";

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

export async function lookupGeo(ip: string): Promise<GeoInfo | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.GEO_LOOKUP_TIMEOUT_MS);

  try {
    const url = `${env.GEO_API_BASE_URL.replace(/\/+$/, "")}/${encodeURIComponent(ip)}?fields=status,message,countryCode,regionName,city`;
    const res = await fetch(url, { signal: controller.signal });

    if (!res.ok) {
      logger.warn("Geo lookup returned non-OK status", { status: res.status });
      return null;
    }

    const data = (await res.json()) as IpApiResponse;

    if (data.status !== "success") {
      logger.warn("Geo lookup failed", { message: data.message ?? "unknown" });
      return null;
    }

    return {
      countryCode: data.countryCode ?? null,
      region: data.regionName ?? null,
      city: data.city ?? null,
    };
  } catch (err) {
    logger.warn("Geo lookup errored", { error: err instanceof Error ? err.message : String(err) });
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
