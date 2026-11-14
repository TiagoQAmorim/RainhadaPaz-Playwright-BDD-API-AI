import type { SiteSettings } from "@prisma/client";
import { PARISH_LOGO_PATH } from "@/lib/parish-brand";
import { prisma } from "@/lib/prisma";

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: 1,
  parishName: "Paróquia Nossa Senhora Rainha da Paz",
  diocese: "Diocese de Santo Amaro",
  address: "São Paulo — SP",
  phone: "",
  email: null,
  whatsapp: null,
  heroTitle: "Unidos pela fé, guiados por Maria.",
  heroSubtitle: "Uma comunidade que acolhe, celebra e vive o amor de Cristo.",
  aboutHtml: "",
  massScheduleHtml: "",
  pixKey: null,
  instagramUrl: null,
  youtubeUrl: null,
  facebookUrl: null,
  logoUrl: PARISH_LOGO_PATH,
  heroImageUrl: null,
  heroImageUrl2: null,
  heroImageUrl3: null,
  matrizImageUrl: null,
  capelaImageUrl: null,
  youtubeChannelUrl: null,
  tercoOnlineSchedule: null,
  tercoOnlineLink: null,
  candleDurationAmount: 8,
  candleDurationUnit: "hours",
  candlesNotifyEmail: null,
  candleAccessMode: "paid",
  candlePriceCents: 1000,
  candlePaymentPix: true,
  candlePaymentSicredi: false,
  maintenanceEnabled: false,
  maintenanceMessage: null,
  maintenanceEndsAt: null,
};

export async function getSiteSettings() {
  let settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  if (!settings) {
    if (process.env.NODE_ENV === "production") {
      return { ...DEFAULT_SITE_SETTINGS };
    }
    settings = await prisma.siteSettings.create({
      data: {
        parishName: DEFAULT_SITE_SETTINGS.parishName,
        diocese: DEFAULT_SITE_SETTINGS.diocese,
        address: DEFAULT_SITE_SETTINGS.address,
        phone: DEFAULT_SITE_SETTINGS.phone,
        heroTitle: DEFAULT_SITE_SETTINGS.heroTitle,
        heroSubtitle: DEFAULT_SITE_SETTINGS.heroSubtitle,
        aboutHtml: DEFAULT_SITE_SETTINGS.aboutHtml,
        massScheduleHtml: DEFAULT_SITE_SETTINGS.massScheduleHtml,
        logoUrl: PARISH_LOGO_PATH,
      },
    });
  }
  if (!settings.logoUrl) {
    settings = await prisma.siteSettings.update({
      where: { id: 1 },
      data: { logoUrl: PARISH_LOGO_PATH },
    });
  }
  return settings;
}

/** @deprecated Use getCandleCommerceConfig().priceCents no servidor. */
export function candlePriceCents(): number {
  const brl = Number(process.env.CANDLE_PRICE_BRL ?? "10");
  return Math.round(brl * 100);
}

function envCandleDurationHours(): number {
  const h = Number(process.env.CANDLE_DURATION_HOURS ?? "8");
  return Number.isFinite(h) && h > 0 ? h : 8;
}

/** E-mail que recebe intenções e orações ao acender vela (admin → Velas). */
export async function getCandlesNotifyEmail(): Promise<string | null> {
  const settings = await getSiteSettings();
  const dedicated = settings.candlesNotifyEmail?.trim();
  if (dedicated) return dedicated;
  const general = settings.email?.trim();
  return general || null;
}

/** Duração da vela no mural (horas), a partir do admin ou .env. */
export async function getCandleDurationHours(): Promise<number> {
  const settings = await getSiteSettings();
  const amount = settings.candleDurationAmount ?? envCandleDurationHours();
  const unit = settings.candleDurationUnit ?? "hours";
  if (!Number.isFinite(amount) || amount <= 0) return envCandleDurationHours();
  return unit === "days" ? amount * 24 : amount;
}

/** @deprecated Prefira getCandleDurationHours() no servidor. */
export function candleDurationHours(): number {
  return envCandleDurationHours();
}

/** Só true com CANDLE_FREE_MODE=true (testes locais / E2E). Produção: omita ou false. */
export function candlesFreeMode(): boolean {
  const v = process.env.CANDLE_FREE_MODE?.trim().toLowerCase();
  return v === "true" || v === "1";
}

/** Só true com RAFFLE_FREE_MODE=true (testes locais / E2E). Produção: omita ou false. */
export function raffleFreeMode(): boolean {
  const v = process.env.RAFFLE_FREE_MODE?.trim().toLowerCase();
  return v === "true" || v === "1";
}
