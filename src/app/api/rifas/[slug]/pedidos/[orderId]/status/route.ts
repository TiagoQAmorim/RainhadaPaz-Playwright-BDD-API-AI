import { NextResponse } from "next/server";
import { expireOrderIfDue } from "@/lib/raffle-reservations";
import { getRaffleBySlug } from "@/lib/raffles";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string; orderId: string }> },
) {
  const { slug, orderId } = await ctx.params;
  const raffle = await getRaffleBySlug(slug);
  if (!raffle) return NextResponse.json({ error: "Rifa não encontrada." }, { status: 404 });

  const order = await prisma.raffleOrder.findFirst({
    where: { id: orderId, raffleId: raffle.id },
    select: { id: true },
  });
  if (!order) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });

  const due = await expireOrderIfDue(order.id);
  if (!due.status) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });

  return NextResponse.json({ status: due.status, expiresAt: due.expiresAt });
}
