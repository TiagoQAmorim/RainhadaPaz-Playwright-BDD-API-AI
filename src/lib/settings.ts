import { PARISH_LOGO_PATH } from "@/lib/parish-brand";
import { prisma } from "@/lib/prisma";

export async function getSiteSettings() {
  let settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  if (!settings) {
    settings = await prisma.siteSettings.create({
      data: {
        parishName: "Paróquia Nossa Senhora Rainha da Paz",
        diocese: "Diocese de Santo Amaro",
        address: "São Paulo — SP",
        phone: "",
        heroTitle: "Unidos pela fé, guiados por Maria.",
        heroSubtitle:
          "Uma comunidade que acolhe, celebra e vive o amor de Cristo.",
        aboutHtml: "",
        massScheduleHtml: "",
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

/** Enquanto true, velas acendem sem pagamento (testes). Defina CANDLE_FREE_MODE=false para cobrar. */
export function candlesFreeMode(): boolean {
  const v = process.env.CANDLE_FREE_MODE?.trim().toLowerCase();
  if (v === "false" || v === "0") return false;
  return true;
}

/** Modo teste: confirma cotas sem PIX. Defina RAFFLE_FREE_MODE=false em produção. */
export function raffleFreeMode(): boolean {
  const v = process.env.RAFFLE_FREE_MODE?.trim().toLowerCase();
  if (v === "false" || v === "0") return false;
  return true;
}
