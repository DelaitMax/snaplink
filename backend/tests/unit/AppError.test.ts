import { describe, expect, it } from "vitest";
import { AppError } from "@/utils/AppError";

describe("AppError", () => {
  it("sets statusCode and message via constructor", () => {
    const err = new AppError("boom", 418, "TEAPOT");
    expect(err.statusCode).toBe(418);
    expect(err.message).toBe("boom");
    expect(err.code).toBe("TEAPOT");
    expect(err).toBeInstanceOf(Error);
  });

  it.each([
    ["badRequest", 400],
    ["unauthorized", 401],
    ["notFound", 404],
    ["conflict", 409],
    ["gone", 410],
  ] as const)("%s() builds an AppError with status %i", (method, status) => {
    const err = AppError[method]("message");
    expect(err.statusCode).toBe(status);
    expect(err).toBeInstanceOf(AppError);
  });
});
