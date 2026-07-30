import { describe, expect, it } from "vitest";
import { extractStatsToken } from "./extractStatsToken";

describe("extractStatsToken", () => {
  it("extracts the token from a well-formed statsUrl", () => {
    const url = "http://localhost:3000/api/links/abcDEF123456/stats";
    expect(extractStatsToken(url)).toBe("abcDEF123456");
  });

  it("works regardless of the base URL", () => {
    const url = "https://short.example.com/api/links/xyz789/stats";
    expect(extractStatsToken(url)).toBe("xyz789");
  });

  it("returns an empty string for a malformed URL", () => {
    expect(extractStatsToken("not-a-valid-stats-url")).toBe("");
  });
});
