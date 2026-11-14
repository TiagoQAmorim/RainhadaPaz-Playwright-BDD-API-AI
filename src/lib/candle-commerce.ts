import { isSicrediCardEnabled } from "@/lib/sicredi-payments";
import { candlesFreeMode, getSiteSettings } from "@/lib/settings";

export type CandleAccessMode = "free" | "free_donation" | "paid";

export type CandleCommerceConfig = {
  accessMode: CandleAccessMode;
  priceCents: number;
  allowPix: boolean;
  allowSicredi: boolean;
  /** Credenciais Sicredi no servidor — checkout com cartão só quando true. */
  sicrediLive: boolean;
  /** CANDLE_FREE_MODE=true (E2E / dev). */
  forceFree: boolean;
};

function envDefaultPriceCents(): number {
  const brl = Number(process.env.CANDLE_PRICE_BRL ?? "10");
  return Math.round((Number.isFinite(brl) ? brl : 10) * 100);
}

function parseAccessMode(raw: string | undefined | null): CandleAccessMode {
  if (raw === "free" || raw === "free_donation" || raw === "paid") return raw;
  return "paid";
}

export async function getCandleCommerceConfig(): Promise<CandleCommerceConfig> {
  const settings = await getSiteSettings();
  const forceFree = candlesFreeMode();
  const priceFromDb = settings.candlePriceCents;
  const priceCents =
    Number.isFinite(priceFromDb) && priceFromDb > 0 ? priceFromDb : envDefaultPriceCents();

  return {
    accessMode: parseAccessMode(settings.candleAccessMode),
    priceCents,
    allowPix: settings.candlePaymentPix !== false,
    allowSicredi: settings.candlePaymentSicredi === true,
    sicrediLive: isSicrediCardEnabled(),
    forceFree,
  };
}

export function candleAccessModeLabel(mode: CandleAccessMode): string {
  switch (mode) {
    case "free":
      return "Gratuita";
    case "free_donation":
      return "Gratuita com oferta opcional";
    case "paid":
      return "Paga";
  }
}

export function formatCandlePrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Oferta voluntária (modo gratuito com doação). */
export const CANDLE_DONATION_MIN_CENTS = 100;
export const CANDLE_DONATION_MAX_CENTS = 500_000;

export function donationAmountBrlToCents(amountBrl: number): number {
  return Math.round(amountBrl * 100);
}

export function validateVoluntaryDonationCents(cents: number): string | null {
  if (!Number.isFinite(cents)) return "Informe um valor de oferta.";
  if (cents < CANDLE_DONATION_MIN_CENTS) {
    return `Oferta mínima: ${formatCandlePrice(CANDLE_DONATION_MIN_CENTS)}.`;
  }
  if (cents > CANDLE_DONATION_MAX_CENTS) {
    return `Oferta máxima: ${formatCandlePrice(CANDLE_DONATION_MAX_CENTS)}.`;
  }
  return null;
}