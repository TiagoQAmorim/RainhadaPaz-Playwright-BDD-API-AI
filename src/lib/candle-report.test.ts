import { describe, expect, it } from "vitest";
import {
  filterCandleReportRows,
  type CandleReportRow,
  parseReportDayEnd,
  parseReportDayStart,
} from "./candle-report";

const row = (partial: Partial<CandleReportRow> & { id: string }): CandleReportRow => ({
  date: new Date("2026-10-15T12:00:00"),
  donorName: "Ana",
  email: null,
  intention: "Intenção",
  prayer: null,
  activeOnMural: true,
  status: "PAID",
  ...partial,
});

describe("filterCandleReportRows", () => {
  const rows = [
    row({ id: "1", activeOnMural: true, date: new Date("2026-10-20") }),
    row({ id: "2", activeOnMural: false, date: new Date("2026-10-10") }),
  ];

  it("filtra ativas", () => {
    expect(filterCandleReportRows(rows, "ativas").map((r) => r.id)).toEqual(["1"]);
  });

  it("filtra inativas", () => {
    expect(filterCandleReportRows(rows, "inativas").map((r) => r.id)).toEqual(["2"]);
  });

  it("filtra por período", () => {
    const from = parseReportDayStart("2026-10-01")!;
    const to = parseReportDayEnd("2026-10-15")!;
    expect(filterCandleReportRows(rows, "periodo", { from, to }).map((r) => r.id)).toEqual(["2"]);
  });
});
