import { resolveCandleBurnWindow } from "@/lib/candle-burn";
import { prisma } from "@/lib/prisma";

export type CandleReportRow = {
  id: string;
  date: Date;
  donorName: string;
  email: string | null;
  phone: string | null;
  intention: string;
  prayer: string | null;
  activeOnMural: boolean;
  status: string;
  amountCents: number;
};

export type CandleReportFilter = "todas" | "ativas" | "inativas" | "periodo";
export type CandlePaymentFilter = "todos" | "pagos" | "nao-pagos";

type CandleLike = {
  id: string;
  donorName: string;
  email: string | null;
  phone: string | null;
  intention: string;
  prayer: string | null;
  status: string;
  amountCents: number;
  litAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
};

/** Velas visíveis no mural agora (não confundir com total PAID no histórico). */
export async function countCandlesActiveOnMural(): Promise<number> {
  const { getCandleDurationHours } = await import("@/lib/settings");
  const durationHours = await getCandleDurationHours();
  const candles = await prisma.virtualCandle.findMany({
    where: { status: "PAID" },
    select: { status: true, litAt: true, expiresAt: true },
  });
  return candles.filter((c) => isCandleActiveOnMural(c, durationHours)).length;
}

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
      phone: c.phone,
      intention: c.intention,
      prayer: c.prayer,
      activeOnMural: isCandleActiveOnMural(c, durationHours),
      status: c.status,
      amountCents: c.amountCents,
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

export function parseCandlePaymentFilter(raw: string | undefined): CandlePaymentFilter {
  if (raw === "pagos" || raw === "nao-pagos") return raw;
  return "todos";
}

export function candleIsPaid(status: string): boolean {
  return status === "PAID";
}

export function candlePaymentLabel(status: string): "Pago" | "Não pago" {
  return candleIsPaid(status) ? "Pago" : "Não pago";
}

export function candleReportFilterLabel(
  filtro: CandleReportFilter,
  de?: string,
  ate?: string,
  pagamento: CandlePaymentFilter = "todos",
): string {
  const base = (() => {
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
  })();
  if (pagamento === "pagos") return `${base} · somente pagas`;
  if (pagamento === "nao-pagos") return `${base} · somente não pagas`;
  return base;
}

export function filterCandleReportRows(
  rows: CandleReportRow[],
  filtro: CandleReportFilter,
  period?: { from: Date; to: Date },
  pagamento: CandlePaymentFilter = "todos",
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
  if (pagamento === "pagos") {
    out = out.filter((r) => candleIsPaid(r.status));
  } else if (pagamento === "nao-pagos") {
    out = out.filter((r) => !candleIsPaid(r.status));
  }
  return out;
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatCandleReportDate(d: Date): string {
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function formatCandleAmount(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const CANDLE_EXPORT_HEADERS = [
  "Data",
  "Nome",
  "E-mail",
  "Telefone",
  "Intenção",
  "Oração",
  "Ativa no mural",
  "Pagamento",
  "Valor (R$)",
] as const;

function candleExportCells(row: CandleReportRow): string[] {
  return [
    formatCandleReportDate(row.date),
    row.donorName,
    row.email ?? "",
    row.phone ?? "",
    row.intention,
    row.prayer ?? "",
    row.activeOnMural ? "Sim" : "Não",
    candlePaymentLabel(row.status),
    formatCandleAmount(row.amountCents),
  ];
}

/** Planilha Excel 2003 (XML) — abre no Excel como .xls, sem biblioteca extra. */
export function candleRowsToXls(rows: CandleReportRow[]): string {
  const header = CANDLE_EXPORT_HEADERS.map(
    (h) => `<Cell><Data ss:Type="String">${xmlEscape(h)}</Data></Cell>`,
  ).join("");
  const body = rows
    .map((row) => {
      const cells = candleExportCells(row)
        .map((value) => `<Cell><Data ss:Type="String">${xmlEscape(value)}</Data></Cell>`)
        .join("");
      return `<Row>${cells}</Row>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Velas"><Table>
<Row>${header}</Row>
${body}
</Table></Worksheet></Workbook>`;
}

export function candleRowsToXml(rows: CandleReportRow[]): string {
  const items = rows
    .map((row) => {
      const cells = candleExportCells(row);
      const tags = [
        "data",
        "nome",
        "email",
        "telefone",
        "intencao",
        "oracao",
        "ativa",
        "pagamento",
        "valor",
      ];
      const inner = tags.map((tag, i) => `<${tag}>${xmlEscape(cells[i] ?? "")}</${tag}>`).join("");
      return `<vela id="${xmlEscape(row.id)}">${inner}</vela>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<velas>${items}</velas>\n`;
}
