import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildRaffleTicketsPdf } from "@/lib/raffle-ticket-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await ctx.params;
  const order = await prisma.raffleOrder.findUnique({
    where: { id: orderId },
    include: {
      raffle: true,
      lines: { include: { ticket: true } },
    },
  });
  if (!order || order.lines.length === 0) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }
  if (order.raffle.kind !== "NUMBERS") {
    return NextResponse.json({ error: "Este PDF é das rifas de números." }, { status: 400 });
  }

  const bytes = await buildRaffleTicketsPdf({
    parishName: "Paróquia Nossa Senhora Rainha da Paz",
    prizeTitle: order.raffle.prizeTitle,
    ticketPriceCents: order.raffle.ticketPriceCents,
    buyerName: order.buyerName,
    buyerPhone: order.buyerPhone,
    tickets: order.lines
      .map((line) => ({ ticketNumber: line.ticket.ticketNumber }))
      .sort((a, b) => a.ticketNumber - b.ticketNumber),
  });

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="rifa-${order.raffle.slug}.pdf"`,
    },
  });
}
