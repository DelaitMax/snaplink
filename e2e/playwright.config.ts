import { defineConfig, devices } from "@playwright/test";

const FRONTEND_PORT = 5173;
const BACKEND_PORT = Number(process.env["BACKEND_PORT"] ?? 3000);
const IS_CI = !!process.env["CI"];

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: IS_CI,
  retries: IS_CI ? 2 : 0,
  workers: IS_CI ? 1 : undefined,
  reporter: IS_CI ? [["html", { open: "never" }], ["list"]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${FRONTEND_PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: IS_CI
    ? undefined
    : [
        {
          command: "npm run dev",
          cwd: "../backend",
          url: `http://127.0.0.1:${BACKEND_PORT}/health`,
          reuseExistingServer: true,
          timeout: 30_000,
        },
        {
          command: "npm run dev",
          cwd: "../frontend",
          url: `http://127.0.0.1:${FRONTEND_PORT}`,
          reuseExistingServer: true,
          timeout: 30_000,
          env: { VITE_BACKEND_URL: `http://127.0.0.1:${BACKEND_PORT}` },
        },
      ],
});
