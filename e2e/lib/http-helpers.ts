import type { APIRequestContext } from "@playwright/test";

/** Resolves the first active raffle slug from /rifas HTML (no Prisma in tests). */
export async function firstActiveRaffleSlug(
  request: APIRequestContext,
  baseURL: string,
): Promise<string | null> {
  const res = await request.get(`${baseURL}/rifas`);
  if (!res.ok()) return null;
  const html = await res.text();
  const m = html.match(/href="\/rifas\/([^"/?#]+)"/);
  return m?.[1] ?? null;
}
