import { NextResponse } from "next/server";
import { formatTicketNumber } from "@/lib/raffle-rules";
import { getRaffleBySlug } from "@/lib/raffles";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string; ticketId: string }> },
) {
  const { slug, ticketId } = await ctx.params;
  const raffle = await getRaffleBySlug(slug);
  if (!raffle || raffle.status !== "ACTIVE") {
    return NextResponse.json({ error: "Rifa não encontrada." }, { status: 404 });
  }

  const t = await prisma.raffleTicket.findFirst({
    where: { id: ticketId, raffleId: raffle.id },
    include: { saint: true },
  });
  if (!t) {
    return NextResponse.json({ error: "Cota não encontrada." }, { status: 404 });
  }

  return NextResponse.json({
    id: t.id,
    ticketNumber: t.ticketNumber,
    ticketLabel: formatTicketNumber(t.ticketNumber),
    status: t.status,
    saint: {
      name: t.saint.name,
      celebration: t.saint.celebration,
      description: t.saint.description,
    },
  });
}
