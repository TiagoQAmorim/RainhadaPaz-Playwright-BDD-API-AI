import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { formatTicketNumber } from "@/lib/raffle-rules";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id } = await ctx.params;

  const tickets = await prisma.raffleTicket.findMany({
    where: { raffleId: id },
    include: {
      saint: true,
      orderLine: { include: { order: true } },
    },
    orderBy: { ticketNumber: "asc" },
  });

  const header = [
    "numero",
    "status",
    "santo",
    "celebracao",
    "comprador",
    "email",
    "telefone",
    "pedido",
  ].join(";");

  const rows = tickets.map((t) => {
    const o = t.orderLine?.order;
    return [
      formatTicketNumber(t.ticketNumber),
      t.status,
      t.saint.name,
      t.saint.celebration,
      o?.buyerName ?? "",
      o?.buyerEmail ?? "",
      o?.buyerPhone ?? "",
      o?.id ?? "",
    ]
      .map((c) => `"${String(c).replace(/"/g, '""')}"`)
      .join(";");
  });

  const csv = [header, ...rows].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rifa-${id}.csv"`,
    },
  });
}
