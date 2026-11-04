import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { test } from "./fixtures";
import { e2eWorld } from "./world";

const { Given, When, Then } = createBdd(test);

Given("I am on the home page", async ({ page }) => {
  await page.goto("/");
});

Given("I open the page {string}", async ({ page }, path: string) => {
  await page.goto(path);
});

When("I navigate to {string}", async ({ page }, path: string) => {
  await page.goto(path);
});

Then("I should see the text {string} on the page", async ({ page }, text: string) => {
  await expect(page.getByText(text, { exact: false }).first()).toBeVisible({ timeout: 20_000 });
});

Then("I should see the {string} link in the menu", async ({ page }, label: string) => {
  await expect(page.getByRole("link", { name: label }).first()).toBeVisible();
});

Then("I should see the virtual candle intention field", async ({ page }) => {
  await expect(page.locator('input[name="intention"]')).toBeVisible({ timeout: 20_000 });
});

When("I open the first active raffle if any", async ({ page }) => {
  const link = page.locator('a[href^="/rifas/"]').first();
  if (await link.isVisible().catch(() => false)) {
    await link.click();
    await page.waitForLoadState("domcontentloaded");
  }
});

Then("I should see bulk name purchase or empty raffles list", async ({ page }) => {
  const bulk = page.getByText("Comprar vários nomes de uma vez");
  const empty = page.getByText("Nenhuma rifa ativa no momento");
  await expect(bulk.or(empty)).toBeVisible({ timeout: 20_000 });
});

Then("the notice should appear on the public listing", async ({ page }) => {
  await page.goto("/avisos");
  await expect(
    page.getByRole("link", { name: e2eWorld.lastNoticeTitle, exact: true }).first(),
  ).toBeVisible({ timeout: 20_000 });
});
