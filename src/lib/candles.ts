import { isCandleOnMural } from "@/lib/candle-burn";
import type { PublicCandle } from "@/lib/candle-public";
import { prisma } from "@/lib/prisma";
import { getCandleAfterglowMs, getCandleDurationHours } from "@/lib/settings";

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

  return candle;
}

export async function listLitCandles(options: { skip?: number; take: number }) {
  const now = new Date();
  const [hours, afterglowMs] = await Promise.all([getCandleDurationHours(), getCandleAfterglowMs()]);
  const smokeSince = new Date(now.getTime() - afterglowMs);
  const rows = await prisma.virtualCandle.findMany({
    where: {
      litAt: { not: null },
      NOT: { status: "EXPIRED" },
      OR: [{ expiresAt: null }, { expiresAt: { gt: smokeSince } }],
    },
    orderBy: { litAt: "desc" },
  });
  const lit = rows.filter((c) => isCandleOnMural(c, hours, now.getTime(), afterglowMs));
  const skip = Math.max(0, options.skip ?? 0);
  return {
    candles: lit.slice(skip, skip + options.take),
    total: lit.length,
    durationHours: hours,
    afterglowMs,
  };
}

export async function listActiveCandles(limit = 48) {
  const { candles } = await listLitCandles({ take: limit });
  return candles;
}

export type { PublicCandle } from "@/lib/candle-public";

export function toPublicCandle(candle: {
  id: string;
  donorName: string;
  intention: string;
  prayer: string | null;
  intentionPublic: boolean;
  prayerPublic: boolean;
  litAt: Date | null;
  expiresAt: Date | null;
  amountCents: number;
  prayerTogetherCount?: number;
}): PublicCandle {
  return {
    id: candle.id,
    donorName: candle.donorName,
    intention: candle.intention,
    prayer: candle.prayer,
    intentionPublic: candle.intentionPublic,
    prayerPublic: candle.prayerPublic,
    litAt: (candle.litAt ?? new Date()).toISOString(),
    expiresAt: candle.expiresAt ? candle.expiresAt.toISOString() : null,
    paid: candle.amountCents > 0,
    prayerTogetherCount: candle.prayerTogetherCount ?? 0,
  };
}
