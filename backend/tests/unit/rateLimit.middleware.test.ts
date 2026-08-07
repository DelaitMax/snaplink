import { describe, expect, it } from "vitest";
import type { Request } from "express";
import { ipKeyGenerator } from "@/middleware/rateLimit.middleware";

function makeReq(overrides: {
  headers?: Record<string, string>;
  remoteAddress?: string | undefined;
}): Parameters<typeof ipKeyGenerator>[0] {
  return {
    headers: overrides.headers ?? {},
    socket: { remoteAddress: overrides.remoteAddress },
  } as unknown as Request;
}

describe("ipKeyGenerator", () => {
  it("uses the resolved client IP when available", () => {
    const req = makeReq({ headers: { "x-forwarded-for": "203.0.113.5" }, remoteAddress: "10.0.0.1" });
    expect(ipKeyGenerator(req)).toBe("203.0.113.5");
  });

  it("falls back to the raw socket address when getClientIp finds nothing usable", () => {
    const req = makeReq({ remoteAddress: "127.0.0.1" });
    expect(ipKeyGenerator(req)).toBe("127.0.0.1");
  });

  it("falls back to 'unknown' only when there is truly no address at all", () => {
    const req = makeReq({ remoteAddress: undefined });
    expect(ipKeyGenerator(req)).toBe("unknown");
  });

  it("does not collapse two different clients with unusable headers into the same key", () => {
    const reqA = makeReq({ remoteAddress: "127.0.0.1" });
    const reqB = makeReq({ remoteAddress: "::1" });
    expect(ipKeyGenerator(reqA)).not.toBe(ipKeyGenerator(reqB));
  });
});
