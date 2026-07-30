import { describe, expect, it } from "vitest";
import { getApiErrorMessage } from "./apiError";

describe("getApiErrorMessage", () => {
  it("returns the fallback when error is undefined", () => {
    expect(getApiErrorMessage(undefined, "fallback")).toBe("fallback");
  });

  it("extracts the message from a structured API error body", () => {
    const error = {
      status: 400 as const,
      data: { error: { message: "Invalid email or password" } },
    };
    expect(getApiErrorMessage(error)).toBe("Invalid email or password");
  });

  it("returns a network-specific message for FETCH_ERROR", () => {
    const error = { status: "FETCH_ERROR" as const, error: "TypeError: Failed to fetch" };
    expect(getApiErrorMessage(error)).toMatch(/связаться с сервером/);
  });

  it("falls back for a non-API-shaped error response", () => {
    const error = { status: 500 as const, data: "Internal Server Error" };
    expect(getApiErrorMessage(error, "fallback")).toBe("fallback");
  });

  it("uses the message from a SerializedError", () => {
    const error = { name: "Error", message: "Something broke" };
    expect(getApiErrorMessage(error)).toBe("Something broke");
  });
});
