import { describe, expect, it } from "vitest";
import { buildPaginatedResult, parsePagination } from "@/utils/pagination";

describe("parsePagination", () => {
  it("defaults to page=1, pageSize=20 when not provided", () => {
    const result = parsePagination({});
    expect(result).toEqual({ page: 1, pageSize: 20, limit: 20, offset: 0 });
  });

  it("coerces string query params to numbers and computes offset", () => {
    const result = parsePagination({ page: "3", pageSize: "10" });
    expect(result).toEqual({ page: 3, pageSize: 10, limit: 10, offset: 20 });
  });

  it("rejects pageSize above the 100 cap", () => {
    expect(() => parsePagination({ pageSize: "1000" })).toThrow();
  });

  it("rejects non-positive page", () => {
    expect(() => parsePagination({ page: "0" })).toThrow();
    expect(() => parsePagination({ page: "-1" })).toThrow();
  });
});

describe("buildPaginatedResult", () => {
  it("computes totalPages, rounding up", () => {
    const result = buildPaginatedResult([1, 2, 3], 25, 1, 10);
    expect(result.totalPages).toBe(3);
  });

  it("returns at least 1 page even when total is 0", () => {
    const result = buildPaginatedResult([], 0, 1, 10);
    expect(result.totalPages).toBe(1);
  });
});
