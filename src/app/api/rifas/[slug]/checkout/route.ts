import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { PARISH_PAYMENT_PROVIDER } from "@/lib/parish-pix";
import {
  confirmRaffleOrderPaid,
  reserveTicketsForSession,
} from "@/lib/raffle-reservations";
import { getRaffleBySlug } from "@/lib/raffles";
import { raffleFreeMode } from "@/lib/settings";

const schema = z.object({
  sessionId: z.string().min(8).max(64),
  ticketIds: z.array(z.string().min(1)).min(1).max(50),
  buyerName: z.string().min(3).max(120),
  buyerEmail: z.string().email(),
  buyerPhone: z.string().min(8).max(20),
  buyerCpf: z.string().max(14).optional(),
  idempotencyKey: z.string().max(64).optional(),
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

  const { sessionId, ticketIds, buyerName, buyerEmail, buyerPhone, buyerCpf, idempotencyKey } =
    parsed.data;
  const uniqueIds = [...new Set(ticketIds)];

  if (idempotencyKey) {
    const existing = await prisma.raffleOrder.findUnique({
      where: { idempotencyKey },
    });
    if (existing) {
      return NextResponse.json({
        orderId: existing.id,
        paymentPath: `/rifas/${slug}/pagamento?order=${existing.id}`,
        reused: true,
      });
    }
  }

  try {
    await reserveTicketsForSession({
      raffleId: raffle.id,
      ticketIds: uniqueIds,
      sessionId,
      reservationMinutes: raffle.reservationMinutes,
    });
  } catch {
    return NextResponse.json(
      { error: "Uma ou mais cotas acabaram de ser reservadas. Escolha outras." },
      { status: 409 },
    );
  }

  const totalCents = raffle.ticketPriceCents * uniqueIds.length;

  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      await tx.raffleOrderTicket.deleteMany({
        where: { ticketId: { in: uniqueIds }, order: { status: "CANCELLED" } },
      });
      const created = await tx.raffleOrder.create({
        data: {
          raffleId: raffle.id,
          buyerName: buyerName.trim(),
          buyerEmail: buyerEmail.trim(),
          buyerPhone: buyerPhone.trim(),
          buyerCpf: buyerCpf?.trim() || null,
          totalCents,
          status: "PENDING",
          idempotencyKey: idempotencyKey ?? null,
        },
      });

      await tx.raffleOrderTicket.createMany({
        data: uniqueIds.map((ticketId) => ({
          orderId: created.id,
          ticketId,
        })),
      });

      await tx.rafflePayment.create({
        data: {
          orderId: created.id,
          provider: PARISH_PAYMENT_PROVIDER,
          status: "PENDING",
        },
      });

      return created;
    });
  } catch {
    const { releaseTicketsForSession } = await import("@/lib/raffle-reservations");
    await releaseTicketsForSession({ raffleId: raffle.id, ticketIds: uniqueIds, sessionId });
    return NextResponse.json(
      { error: "Não foi possível concluir a compra. Escolha a cota de novo." },
      { status: 409 },
    );
  }

  const free = raffleFreeMode();

  if (free) {
    await confirmRaffleOrderPaid(order.id);
    return NextResponse.json({ free: true, orderId: order.id });
  }

  return NextResponse.json({
    orderId: order.id,
    paymentPath: `/rifas/${slug}/pagamento?order=${order.id}`,
  });
}