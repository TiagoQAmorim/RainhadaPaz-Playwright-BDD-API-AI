/**
 * Cartão online via Sicredi (cooperativa libera credenciais no gerente de Cash).
 * PIX da rifa já usa a conta Sicredi em `parish-payments.ts`. Velas e dízimo continuam no Itaú.
 *
 * Quando `isSicrediCardEnabled()`, plugar checkout (link ou API) e webhook em
 * `/api/webhooks/sicredi` — ver `docs/pagamentos-sicredi.md`.
 */
export const SICREDI_PAYMENT_PROVIDER = "sicredi" as const;

export type ParishCardProvider = typeof SICREDI_PAYMENT_PROVIDER;

export function isSicrediCardEnabled(): boolean {
  return Boolean(
    process.env.SICREDI_ENABLED === "true" &&
      process.env.SICREDI_CLIENT_ID?.trim() &&
      process.env.SICREDI_CLIENT_SECRET?.trim(),
  );
}

/** URL pública do webhook (informar ao Sicredi na homologação). */
export function sicrediWebhookUrl(publicSiteUrl: string): string {
  const base = publicSiteUrl.replace(/\/$/, "");
  return `${base}/api/webhooks/sicredi`;
}