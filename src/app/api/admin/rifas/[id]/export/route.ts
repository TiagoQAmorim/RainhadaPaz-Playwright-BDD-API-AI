import { NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/auth";
import {
  buildRaffleReportCsv,
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

  const { filename, body } = await buildRaffleReportCsv(id, part);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}