import type { Page } from "@playwright/test";
import { ensureAdminSession } from "./admin-session";
import type { E2eCleanupQueue } from "../steps/world";

async function clickDeleteInListItemWithFieldValue(
  page: Page,
  listPath: string,
  inputName: string,
  value: string,
  deleteButtonName: string | RegExp,
): Promise<void> {
  await page.goto(listPath);
  const items = page.locator("li").filter({ has: page.locator(`input[name="${inputName}"]`) });
  const count = await items.count();
  for (let i = 0; i < count; i++) {
    const item = items.nth(i);
    const field = item.locator(`input[name="${inputName}"]`);
    const current = await field.inputValue().catch(() => "");
    if (current !== value) continue;
    page.once("dialog", (dialog) => dialog.accept());
    await item.getByRole("button", { name: deleteButtonName }).click();
    await page.waitForLoadState("domcontentloaded");
    return;
  }
}

async function deleteCandleByDonorName(page: Page, donorName: string): Promise<void> {
  await page.goto("/admin/velas");
  const row = page.locator("tbody tr").filter({ hasText: donorName }).first();
  if (!(await row.isVisible().catch(() => false))) return;
  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "Excluir" }).click();
  await page.waitForLoadState("domcontentloaded");
}

/** Removes records created during the current scenario (admin UI). */
export async function runE2eCleanup(page: Page, queue: E2eCleanupQueue): Promise<void> {
  const hasWork =
    queue.notices.length > 0 ||
    queue.posts.length > 0 ||
    queue.massLocations.length > 0 ||
    queue.candleDonorNames.length > 0;
  if (!hasWork) return;

  await ensureAdminSession(page);

  for (const title of [...queue.notices]) {
    await clickDeleteInListItemWithFieldValue(
      page,
      "/admin/avisos",
      "title",
      title,
      "Excluir",
    );
  }

  for (const title of [...queue.posts]) {
    await clickDeleteInListItemWithFieldValue(
      page,
      "/admin/noticias",
      "title",
      title,
      "Excluir notícia",
    );
  }

  for (const name of [...queue.massLocations]) {
    await clickDeleteInListItemWithFieldValue(
      page,
      "/admin/horarios",
      "name",
      name,
      "Excluir local",
    );
  }

  for (const donorName of [...queue.candleDonorNames]) {
    await deleteCandleByDonorName(page, donorName);
  }
}

export function emptyCleanupQueue(): E2eCleanupQueue {
  return { notices: [], posts: [], massLocations: [], candleDonorNames: [] };
}
