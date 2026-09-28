import { loadEnvConfig } from "@next/env";
import { defineConfig, devices } from "@playwright/test";

// Load .env.local the same way `npm run dev` does, so tests hit the same Neon DB.
loadEnvConfig(process.cwd());

// Same port as `npm run dev`: Next allows only one dev server per project, so reuse it if running.
const PORT = 3000;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  // `next dev` compiles a route on first visit, which can outlast the default 5s.
  expect: { timeout: 15_000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
