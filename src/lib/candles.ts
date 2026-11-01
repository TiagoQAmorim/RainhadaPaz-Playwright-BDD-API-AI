import {
  formatCandleTimeLeftMs,
  resolveCandleBurnWindow,
} from "@/lib/candle-burn";
import { prisma } from "@/lib/prisma";
import { getCandleDurationHours } from "@/lib/settings";
import { sendCandlePrayerToParish } from "@/lib/candle-parish-email";

export {
  CANDLE_BURN_SCALE_MAX,
  CANDLE_BURN_SCALE_MIN,
  candleBurnScale,
  candleRemainingRatio,
  candleWaxHeightRatio,
  resolveCandleBurnWindow,
} from "@/lib/candle-burn";

export async function activateCandle(candleId: string) {
  const hours = await getCandleDurationHours();
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setTime(now.getTime() + hours * 60 * 60 * 1000);

  const existing = await prisma.virtualCandle.findUnique({ where: { id: candleId } });
  if (!existing) throw new Error("Vela não encontrada.");

  const candle = await prisma.virtualCandle.update({
    where: { id: candleId },
    data: {
      status: "PAID",
      litAt: now,
      expiresAt,
    },
  });

  if (!existing.parishNotifiedAt) {
    try {
      await sendCandlePrayerToParish({
        donorName: candle.donorName,
        intention: candle.intention,
        prayer: candle.prayer,
        intentionPublic: candle.intentionPublic,
        prayerPublic: candle.prayerPublic,
        email: candle.email,
      });
      await prisma.virtualCandle.update({
        where: { id: candleId },
        data: { parishNotifiedAt: new Date() },
      });
    } catch (e) {
      console.error("[vela-email]", e);
    }
  }

  return candle;
}

export function formatCandleTimeLeft(
  litAt: Date | null | undefined,
  expiresAt: Date | null | undefined,
  durationHours?: number,
): string | null {
  const hours = durationHours ?? 8;
  const window = resolveCandleBurnWindow(litAt, expiresAt, hours);
  if (!window) return null;
  const ms = window.expiresAt.getTime() - Date.now();
  return formatCandleTimeLeftMs(ms);
}

export async function listActiveCandles(limit = 48) {
  const now = new Date();
  const hours = await getCandleDurationHours();
  const rows = await prisma.virtualCandle.findMany({
    where: {
      status: "PAID",
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { litAt: "desc" },
    take: limit * 2,
  });

  return rows
    .filter((c) => {
      const w = resolveCandleBurnWindow(c.litAt, c.expiresAt, hours);
      return w && w.expiresAt.getTime() > now.getTime();
    })
    .slice(0, limit);
}
