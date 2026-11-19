import { NextResponse } from "next/server";
import { z } from "zod";
import { releaseSessionReservations } from "@/lib/raffle-reservations";
import { getRaffleBySlug } from "@/lib/raffles";

const schema = z.object({
  sessionId: z.string().min(8).max(64),
  ticketIds: z.array(z.string().min(1)).max(50).optional(),
  orderId: z.string().min(1).optional(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const raffle = await getRaffleBySlug(slug);
  if (!raffle || raffle.status !== "ACTIVE") {
    return NextResponse.json({ error: "Rifa indisponível." }, { status: 404 });
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const result = await releaseSessionReservations({
    raffleId: raffle.id,
    sessionId: parsed.data.sessionId,
    ticketIds: parsed.data.ticketIds,
    orderId: parsed.data.orderId,
  });
  if ("forbidden" in result && result.forbidden) {
    return NextResponse.json({ error: "Essa reserva é de outro participante." }, { status: 403 });
  }
  return NextResponse.json({ released: result.released });
}
