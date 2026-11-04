import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { test } from "./fixtures";

const { Given, When, Then } = createBdd(test);

const adminEmail = () => process.env.ADMIN_EMAIL ?? "admin@paroquiarainhadapaz.com.br";
const adminPassword = () => process.env.ADMIN_PASSWORD ?? "AltereEstaSenha123!";

Given("I am on the admin login page", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page.getByRole("heading", { name: "Entrar no painel" })).toBeVisible();
});

When("I submit invalid admin credentials", async ({ page }) => {
  await page.locator('input[name="email"]').fill("invalido@teste.local");
  await page.locator('input[name="password"]').fill("senha-errada");
  await page.getByRole("button", { name: "Entrar" }).click();
});

When("I submit valid admin credentials", async ({ page }) => {
  await page.locator('input[name="email"]').fill(adminEmail());
  await page.locator('input[name="password"]').fill(adminPassword());
  await page.getByRole("button", { name: "Entrar" }).click();
});

Then("I should see a login failure message", async ({ page }) => {
  await expect(page.getByText(/E-mail ou senha incorretos|Falha no login/i)).toBeVisible({
    timeout: 15_000,
  });
});

Then("I should be on the admin dashboard", async ({ page }) => {
  await page.waitForURL(/\/admin\/?$/, { timeout: 20_000 });
  await expect(page.getByText("Painel paroquial")).toBeVisible();
});

Given("I am logged in as administrator", async ({ page }) => {
  await page.goto("/admin/login");
  await page.locator('input[name="email"]').fill(adminEmail());
  await page.locator('input[name="password"]').fill(adminPassword());
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/admin\/?$/, { timeout: 20_000 });
});

When("I log out from the admin panel", async ({ page }) => {
  await page.getByRole("button", { name: "Sair" }).click();
  await page.waitForURL(/\/admin\/login/, { timeout: 15_000 });
});

Then("I should see the admin login screen", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Entrar no painel" })).toBeVisible();
});
