import { NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/auth";
import {
  candleRowsToXls,
  candleRowsToXml,
  filterCandleReportRows,
  parseCandlePaymentFilter,
  parseCandleReportFilter,
  parseReportDayEnd,
  parseReportDayStart,
  toCandleReportRows,
} from "@/lib/candle-report";
import { prisma } from "@/lib/prisma";
import { getCandleDurationHours } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const admin = await getSessionAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const url = new URL(req.url);
  const filtro = parseCandleReportFilter(url.searchParams.get("filtro") ?? undefined);
  const pagamento = parseCandlePaymentFilter(url.searchParams.get("pagamento") ?? undefined);
  const deRaw = url.searchParams.get("de")?.trim() ?? "";
  const ateRaw = url.searchParams.get("ate")?.trim() ?? "";
  const formato = url.searchParams.get("formato") === "xml" ? "xml" : "xls";

  const durationHours = await getCandleDurationHours();
  const candles = await prisma.virtualCandle.findMany({ orderBy: { createdAt: "desc" } });
  const allRows = toCandleReportRows(candles, durationHours);

  let period: { from: Date; to: Date } | undefined;
  if (filtro === "periodo") {
    const from = parseReportDayStart(deRaw);
    const to = parseReportDayEnd(ateRaw);
    if (from && to && from.getTime() <= to.getTime()) period = { from, to };
  }

  const rows =
    filtro === "periodo" && !period
      ? []
      : filterCandleReportRows(allRows, filtro, period, pagamento);

  const day = new Date().toISOString().slice(0, 10);
  if (formato === "xml") {
    return new NextResponse(candleRowsToXml(rows), {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Content-Disposition": `attachment; filename="velas-${day}.xml"`,
      },
    });
  }

  return new NextResponse(candleRowsToXls(rows), {
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": `attachment; filename="velas-${day}.xls"`,
    },
  });
}
