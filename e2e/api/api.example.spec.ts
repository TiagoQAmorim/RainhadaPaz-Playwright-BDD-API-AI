/**
 * Example API tests with Playwright (no browser).
 * Copy this file for new endpoints: use `request` + expect(status/json).
 *
 * Run only these: npm run test:e2e:api
 */
import { test, expect } from "@playwright/test";
import { firstActiveRaffleSlug } from "../lib/http-helpers";

const adminEmail = process.env.ADMIN_EMAIL ?? "";
const adminPassword = process.env.ADMIN_PASSWORD ?? "";

test.describe("API examples @api", () => {
  test("POST /api/admin/login rejects wrong password", async ({ request, baseURL }) => {
    const res = await request.post(`${baseURL}/api/admin/login`, {
      data: { email: adminEmail || "missing@e2e.local", password: "invalid-password" },
    });
    expect(res.status()).toBe(401);
    await expect(res.json()).resolves.toMatchObject({
      error: expect.stringMatching(/incorretos/i),
    });
  });

  test("POST /api/admin/login accepts credentials from .env", async ({ request, baseURL }) => {
    test.skip(!adminEmail || !adminPassword, "Set ADMIN_EMAIL and ADMIN_PASSWORD in .env");

    const res = await request.post(`${baseURL}/api/admin/login`, {
      data: { email: adminEmail, password: adminPassword },
    });
    expect(res.status()).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  test("GET /api/rifas/{slug}/stats returns 404 for unknown slug", async ({ request, baseURL }) => {
    const res = await request.get(`${baseURL}/api/rifas/nonexistent-e2e-slug/stats`);
    expect(res.status()).toBe(404);
  });

  test("POST bulk-resolve validates empty body", async ({ request, baseURL }) => {
    const slug = (await firstActiveRaffleSlug(request, baseURL!)) ?? "placeholder-no-active-raffle";
    const res = await request.post(`${baseURL}/api/rifas/${slug}/tickets/bulk-resolve`, {
      data: {},
    });
    if (slug === "placeholder-no-active-raffle") {
      expect([400, 404]).toContain(res.status());
      return;
    }
    expect(res.status()).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      error: expect.stringMatching(/nome/i),
    });
  });
});
