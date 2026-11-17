import { NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/auth";
import {
  buildRaffleReportCsv,
  buildRaffleReportXml,
  type RaffleReportPart,
} from "@/lib/raffle-report";

function parseReportPart(raw: string | null): RaffleReportPart {
  if (raw === "compras" || raw === "cotas" || raw === "disponiveis" || raw === "completo") {
    return raw;
  }
  return "completo";
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getSessionAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const part = parseReportPart(new URL(req.url).searchParams.get("parte"));

  const formato = new URL(req.url).searchParams.get("formato");
  if (formato === "xml") {
    const { filename, body } = await buildRaffleReportXml(id, part);
    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  const { filename, body } = await buildRaffleReportCsv(id, part);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}