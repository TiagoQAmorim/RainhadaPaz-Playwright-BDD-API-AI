import type { SiteSettings } from "@prisma/client";
import { parseNotifyEmails } from "@/lib/candle-notify-emails";
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
  aboutBannerUrl: null,
  showMatrizMap: false,
  showCapelaMap: false,
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
  searchTitle: null,
  searchDescription: null,
  searchImageUrl: null,
  youtubeChannelUrl: null,
  tercoOnlineSchedule: null,
  tercoOnlineLink: null,
  candleDurationAmount: 8,
  candleDurationUnit: "hours",
  candlesNotifyEmail: null,
  candleExpiryEmailEnabled: true,
  candleWeekEmailEnabled: true,
  candleAccessMode: "paid",
  candlePriceCents: 1000,
  candlePaymentPix: true,
  candlePaymentSicredi: false,
  maintenanceEnabled: false,
  maintenanceMessage: null,
  maintenanceEndsAt: null,
  candleWeekReportKey: null,
  candleLitEmailSubject: null,
  candleLitEmailBody: null,
  candleExpiryEmailSubject: null,
  candleExpiryEmailBody: null,
  candleWeekEmailSubject: null,
  candleWeekEmailIntro: null,
  candleWeekEmailItem: null,
  candleExpiryNoticeMinutes: 60,
  candleAfterglowAmount: 2,
  candleAfterglowUnit: "days",
};

/** Cria a linha id=1 se o banco estiver vazio. Sem isso, o admin não consegue gravar manutenção. */
export async function ensureSiteSettings() {
  const existing = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  return prisma.siteSettings.create({
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

export async function getSiteSettings() {
  let settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  if (!settings) {
    if (process.env.NODE_ENV === "production") {
      return { ...DEFAULT_SITE_SETTINGS };
    }
    settings = await ensureSiteSettings();
  }
  if (!settings.logoUrl) {
    settings = await prisma.siteSettings.update({
      where: { id: 1 },
      data: { logoUrl: PARISH_LOGO_PATH },
    });
  }
  return settings;
}

/** Texto da home no Google quando o admin ainda não escreveu um próprio. */
export function defaultSearchDescription(settings: Pick<SiteSettings, "heroSubtitle">) {
  const phrase = settings.heroSubtitle?.trim();
  const place =
    "Igreja católica na Zona Sul de São Paulo, com a Capela Colégio Santa Maria. Versículo do dia, terço online e velas virtuais.";
  return phrase ? `${phrase} ${place}` : place;
}

/** Título, texto e foto pedidos ao Google e ao WhatsApp. */
export function searchAppearance(settings: SiteSettings) {
  const title = settings.searchTitle?.trim() || settings.parishName;
  const description = settings.searchDescription?.trim() || defaultSearchDescription(settings);
  const image =
    settings.searchImageUrl?.trim() ||
    settings.heroImageUrl?.trim() ||
    settings.logoUrl?.trim() ||
    PARISH_LOGO_PATH;
  return { title, description, image };
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

/** E-mails que recebem a lista semanal de velas e orações. */
export async function getCandlesNotifyEmails(): Promise<string[]> {
  const settings = await getSiteSettings();
  const dedicated = parseNotifyEmails(settings.candlesNotifyEmail);
  if (dedicated.length) return dedicated;
  return parseNotifyEmails(settings.email);
}

const MAX_AFTERGLOW_DAYS = 365;

/** Prazo em que a vela apagada continua no mural. Zero some na hora. */
export function candleAfterglowMsFrom(
  amount: number | null | undefined,
  unit: string | null | undefined,
): number {
  const raw = Number(amount);
  const n = Number.isFinite(raw) ? Math.round(raw) : 2;
  const hours =
    unit === "hours"
      ? Math.min(MAX_AFTERGLOW_DAYS * 24, Math.max(0, n))
      : Math.min(MAX_AFTERGLOW_DAYS, Math.max(0, n)) * 24;
  return hours * 60 * 60 * 1000;
}

export async function getCandleAfterglowMs(): Promise<number> {
  const settings = await getSiteSettings();
  return candleAfterglowMsFrom(settings.candleAfterglowAmount, settings.candleAfterglowUnit);
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
