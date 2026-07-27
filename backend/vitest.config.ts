import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@tests": path.resolve(__dirname, "tests"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    hookTimeout: 20_000,
    testTimeout: 20_000,
    passWithNoTests: false,
  },
});
