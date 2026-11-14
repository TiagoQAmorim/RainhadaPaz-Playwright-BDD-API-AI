import type { Page } from "@playwright/test";

export function adminCredentials() {
  return {
    email: process.env.ADMIN_EMAIL ?? "admin@paroquiarainhadapaz.com.br",
    password: process.env.ADMIN_PASSWORD ?? "AltereEstaSenha123!",
  };
}

export async function ensureAdminSession(page: Page): Promise<void> {
  if (page.url().includes("/admin") && !page.url().includes("/admin/login")) {
    const logout = page.getByRole("button", { name: "Sair" });
    if (await logout.isVisible().catch(() => false)) return;
  }
  const { email, password } = adminCredentials();
  await page.goto("/admin/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/admin(\/|$)/, { timeout: 20_000 });
}
