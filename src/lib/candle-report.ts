import { resolveCandleBurnWindow } from "@/lib/candle-burn";

export type CandleReportRow = {
  id: string;
  date: Date;
  donorName: string;
  email: string | null;
  intention: string;
  prayer: string | null;
  activeOnMural: boolean;
  status: string;
};

export type CandleReportFilter = "todas" | "ativas" | "inativas" | "periodo";

type CandleLike = {
  id: string;
  donorName: string;
  email: string | null;
  intention: string;
  prayer: string | null;
  status: string;
  litAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
};

export function isCandleActiveOnMural(
  candle: Pick<CandleLike, "status" | "litAt" | "expiresAt">,
  durationHours: number,
  nowMs = Date.now(),
): boolean {
  if (candle.status !== "PAID") return false;
  const window = resolveCandleBurnWindow(candle.litAt, candle.expiresAt, durationHours);
  if (!window) return false;
  return window.expiresAt.getTime() > nowMs;
}

export function candleReportDate(candle: CandleLike): Date {
  return candle.litAt ?? candle.createdAt;
}

export function toCandleReportRows(
  candles: CandleLike[],
  durationHours: number,
): CandleReportRow[] {
  return candles
    .map((c) => ({
      id: c.id,
      date: candleReportDate(c),
      donorName: c.donorName,
      email: c.email,
      intention: c.intention,
      prayer: c.prayer,
      activeOnMural: isCandleActiveOnMural(c, durationHours),
      status: c.status,
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

/** Interpreta YYYY-MM-DD como início/fim do dia (horário local). */
export function parseReportDayStart(isoDate: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function parseReportDayEnd(isoDate: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 23, 59, 59, 999);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function parseCandleReportFilter(raw: string | undefined): CandleReportFilter {
  if (raw === "ativas" || raw === "inativas" || raw === "periodo") return raw;
  return "todas";
}

export function candleReportFilterLabel(
  filtro: CandleReportFilter,
  de?: string,
  ate?: string,
): string {
  switch (filtro) {
    case "ativas":
      return "Somente velas ativas no mural";
    case "inativas":
      return "Somente velas inativas no mural";
    case "periodo":
      if (de && ate) return `Período de ${de.split("-").reverse().join("/")} a ${ate.split("-").reverse().join("/")}`;
      return "Por período (datas não informadas)";
    default:
      return "Todas as velas";
  }
}

export function filterCandleReportRows(
  rows: CandleReportRow[],
  filtro: CandleReportFilter,
  period?: { from: Date; to: Date },
): CandleReportRow[] {
  let out = rows;
  if (filtro === "ativas") {
    out = out.filter((r) => r.activeOnMural);
  } else if (filtro === "inativas") {
    out = out.filter((r) => !r.activeOnMural);
  }
  if (filtro === "periodo" && period) {
    out = out.filter((r) => r.date >= period.from && r.date <= period.to);
  }
  return out;
}
