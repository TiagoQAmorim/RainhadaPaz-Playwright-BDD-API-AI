import { createBdd } from "playwright-bdd";
import { test } from "./fixtures";
import { runE2eCleanup } from "../lib/e2e-cleanup";
import { e2eWorld, resetE2eWorld } from "./world";

const { After } = createBdd(test);

After(async ({ page }) => {
  try {
    await runE2eCleanup(page, e2eWorld.cleanup);
  } finally {
    resetE2eWorld();
  }
});
