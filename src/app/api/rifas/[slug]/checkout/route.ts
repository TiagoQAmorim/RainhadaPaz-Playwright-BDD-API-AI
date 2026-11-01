import { NextResponse } from "next/server";
import { z } from "zod";
import { createRaffleOrderPreference, mercadoPagoEnabled } from "@/lib/mercadopago";
import { prisma } from "@/lib/prisma";
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
      return NextResponse.json({ orderId: existing.id, reused: true });
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

  const order = await prisma.$transaction(async (tx) => {
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
        status: "PENDING",
      },
    });

    return created;
  });

  const free = raffleFreeMode();

  if (free) {
    await confirmRaffleOrderPaid(order.id);
    return NextResponse.json({ free: true, orderId: order.id });
  }

  if (!mercadoPagoEnabled()) {
    await confirmRaffleOrderPaid(order.id);
    await prisma.rafflePayment.updateMany({
      where: { orderId: order.id },
      data: { status: "DEMO" },
    });
    return NextResponse.json({ demo: true, orderId: order.id });
  }

  try {
    const preference = await createRaffleOrderPreference({
      orderId: order.id,
      title: `${raffle.title} — ${uniqueIds.length} cota(s)`,
      amount: totalCents / 100,
      quantity: uniqueIds.length,
      payerEmail: buyerEmail,
      successPath: `/rifas/${slug}/sucesso?order=${order.id}`,
    });

    const preferenceId = preference.id ?? undefined;
    const raw = preference as { init_point?: string };
    const checkoutUrl = raw.init_point;

    await prisma.rafflePayment.updateMany({
      where: { orderId: order.id },
      data: { externalPreferenceId: preferenceId ?? null },
    });

    if (!checkoutUrl) {
      await prisma.raffleOrder.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
      });
      return NextResponse.json({ error: "Checkout indisponível." }, { status: 502 });
    }

    return NextResponse.json({ checkoutUrl, orderId: order.id });
  } catch {
    await prisma.raffleOrder.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });
    return NextResponse.json({ error: "Erro ao conectar com pagamento." }, { status: 502 });
  }
}
