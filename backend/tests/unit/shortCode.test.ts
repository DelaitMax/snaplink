import { describe, expect, it } from "vitest";
import { createShortCode, createStatsToken, isReservedAlias, isValidAlias } from "@/utils/shortCode";

describe("shortCode", () => {
  it("generates codes of expected length and alphabet", () => {
    const code = createShortCode();
    expect(code).toHaveLength(7);
    expect(code).toMatch(/^[a-zA-Z0-9]+$/);
  });

  it("generates statsTokens longer than shortCodes (not guessable from it)", () => {
    const token = createStatsToken();
    expect(token.length).toBeGreaterThan(createShortCode().length);
  });

  it("generates different values on each call", () => {
    const a = createShortCode();
    const b = createShortCode();
    expect(a).not.toBe(b);
  });

  describe("isValidAlias", () => {
    it("accepts alphanumeric + _ - within 3-32 chars", () => {
      expect(isValidAlias("my-link_1")).toBe(true);
      expect(isValidAlias("abc")).toBe(true);
      expect(isValidAlias("a".repeat(32))).toBe(true);
    });

    it("rejects too short/long or invalid characters", () => {
      expect(isValidAlias("ab")).toBe(false);
      expect(isValidAlias("a".repeat(33))).toBe(false);
      expect(isValidAlias("has space")).toBe(false);
      expect(isValidAlias("has/slash")).toBe(false);
    });
  });

  describe("isReservedAlias", () => {
    it("flags reserved words case-insensitively", () => {
      expect(isReservedAlias("api")).toBe(true);
      expect(isReservedAlias("API")).toBe(true);
      expect(isReservedAlias("health")).toBe(true);
    });

    it("does not flag arbitrary aliases", () => {
      expect(isReservedAlias("my-product-launch")).toBe(false);
    });
  });
});
