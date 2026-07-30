import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "@/schemas/auth.schema";

describe("auth.schema", () => {
  describe("registerSchema", () => {
    it("accepts a valid email/password pair", () => {
      const result = registerSchema.safeParse({ email: "user@example.com", password: "ValidPassword1" });
      expect(result.success).toBe(true);
    });

    it("rejects an invalid email", () => {
      const result = registerSchema.safeParse({ email: "not-an-email", password: "ValidPassword1" });
      expect(result.success).toBe(false);
    });

    it("rejects a password shorter than 8 characters", () => {
      const result = registerSchema.safeParse({ email: "user@example.com", password: "short" });
      expect(result.success).toBe(false);
    });

    it("rejects a password longer than 128 characters", () => {
      const result = registerSchema.safeParse({ email: "user@example.com", password: "a".repeat(129) });
      expect(result.success).toBe(false);
    });
  });

  describe("loginSchema", () => {
    it("shares the same validation rules as registerSchema", () => {
      const invalid = { email: "user@example.com", password: "short" };
      expect(loginSchema.safeParse(invalid).success).toBe(false);
      expect(registerSchema.safeParse(invalid).success).toBe(false);
    });
  });
});
