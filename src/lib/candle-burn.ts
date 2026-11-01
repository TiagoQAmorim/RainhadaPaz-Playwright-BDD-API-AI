export const CANDLE_BURN_SCALE_MIN = 0.52;
export const CANDLE_BURN_SCALE_MAX = 1.15;
export const DEFAULT_CANDLE_DURATION_HOURS = 8;

export function candleDurationMs(hours = DEFAULT_CANDLE_DURATION_HOURS): number {
  const h = Number.isFinite(hours) && hours > 0 ? hours : DEFAULT_CANDLE_DURATION_HOURS;
  return h * 60 * 60 * 1000;
}

function toDate(v: Date | string | null | undefined): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Normaliza início/fim da vela (máx. `durationHours` após acender). Corrige expiresAt errado no banco. */
export function resolveCandleBurnWindow(
  litAt: Date | string | null | undefined,
  expiresAt: Date | string | null | undefined,
  durationHours = DEFAULT_CANDLE_DURATION_HOURS,
): { litAt: Date; expiresAt: Date } | null {
  const durationMs = candleDurationMs(durationHours);
  const lit = toDate(litAt);
  const exp = toDate(expiresAt);
  const now = Date.now();

  if (lit) {
    const configuredEnd = lit.getTime() + durationMs;
    let endMs = configuredEnd;
    if (exp && exp.getTime() > lit.getTime()) {
      endMs = Math.min(exp.getTime(), configuredEnd);
    }
    return { litAt: lit, expiresAt: new Date(endMs) };
  }

  if (exp) {
    let endMs = exp.getTime();
    const remaining = endMs - now;
    if (remaining > durationMs) {
      endMs = now + durationMs;
    }
    const startMs = endMs - durationMs;
    return { litAt: new Date(startMs), expiresAt: new Date(endMs) };
  }

  return null;
}

/** 1 = recém acesa, 0 = tempo esgotado */
export function candleRemainingRatio(
  litAt: Date | null,
  expiresAt: Date | null,
  nowMs = Date.now(),
): number {
  if (!litAt || !expiresAt) return 1;
  const start = litAt.getTime();
  const end = expiresAt.getTime();
  if (end <= start) return 0;
  const remaining = Math.max(0, end - nowMs);
  const total = end - start;
  return Math.min(1, remaining / total);
}

/** @deprecated Velas usam artes discretas (`candleBurnStep`). */
export function candleWaxHeightRatio(remainingRatio: number): number {
  const clamped = Math.min(1, Math.max(0, remainingRatio));
  return 0.4 + clamped * 0.6;
}

export { candleBurnStep, candleFlameScale, candleStageImage } from "./candle-stages";

/** @deprecated Só para compatibilidade; a animação usa `candleRemainingRatio`. */
export function candleBurnScale(
  litAt: Date | null,
  expiresAt: Date | null,
  nowMs = Date.now(),
): number {
  const ratio = candleRemainingRatio(litAt, expiresAt, nowMs);
  return CANDLE_BURN_SCALE_MIN + ratio * (CANDLE_BURN_SCALE_MAX - CANDLE_BURN_SCALE_MIN);
}

export function formatCandleTimeLeftMs(ms: number): string | null {
  if (ms <= 0) return null;
  const totalMin = Math.ceil(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}min restantes`;
  return `${m} min restantes`;
}
