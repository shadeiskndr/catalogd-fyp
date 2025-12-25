import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env["PLAYWRIGHT_BASE_URL"] ?? "http://localhost:3000";
const isCI = Boolean(process.env["CI"]);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  ...(isCI ? { workers: 1 } : {}),
  reporter: isCI ? "github" : "list",
  expect: { timeout: 20_000 },
  timeout: 60_000,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: "e2e/.auth/user.json" },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "bun run dev",
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
});
