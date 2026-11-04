import { defineConfig, devices } from "@playwright/test";
import { defineBddProject } from "playwright-bdd";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, ".env") });

const e2eRoot = path.join(__dirname, "e2e");
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 90_000,
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      ...defineBddProject({
        name: "portal",
        featuresRoot: e2eRoot,
        features: [
          path.join(e2eRoot, "features/portal.feature"),
          path.join(e2eRoot, "features/api.feature"),
        ],
        steps: path.join(e2eRoot, "steps/**/*.ts"),
      }),
      use: { ...devices["Desktop Chrome"] },
    },
    {
      ...defineBddProject({
        name: "ai",
        featuresRoot: e2eRoot,
        features: path.join(e2eRoot, "features/ai.feature"),
        steps: [
          path.join(e2eRoot, "steps/fixtures.ts"),
          path.join(e2eRoot, "steps/ai.steps.ts"),
          path.join(e2eRoot, "steps/ai-contract.steps.ts"),
        ],
      }),
      timeout: 120_000,
      retries: 2,
      use: { ...devices["Desktop Chrome"], baseURL },
    },
    {
      name: "api",
      testDir: path.join(__dirname, "e2e/api"),
      testMatch: "**/*.spec.ts",
      use: { baseURL },
    },
  ],
});
