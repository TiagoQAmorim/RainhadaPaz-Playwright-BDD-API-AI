import { NextResponse } from "next/server";
import { z } from "zod";
import { activateCandle } from "@/lib/candles";
import { createCandlePreference, mercadoPagoEnabled } from "@/lib/mercadopago";
import { prisma } from "@/lib/prisma";
import { candlePriceCents, candlesFreeMode } from "@/lib/settings";

const schema = z.object({
  donorName: z.string().min(2).max(80),
  intention: z.string().min(2).max(120),
  prayer: z.string().max(500).optional(),
  intentionPublic: z.boolean().optional(),
  prayerPublic: z.boolean().optional(),
  email: z.string().email().optional(),
  paymentMethod: z.enum(["FREE", "PIX", "CARD"]),
});

const DB_SYNC_HINT =
  "Banco ou cliente Prisma desatualizado. Pare o npm run dev, rode npm run db:refresh-client e reinicie o servidor.";

function isPrismaSchemaDrift(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  const m = e.message;
  return (
    m.includes("intentionPublic") ||
    m.includes("prayerPublic") ||
    m.includes("parishNotifiedAt") ||
    m.includes("Unknown argument") ||
    m.includes("does not exist in the current database")
  );
}

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const free = candlesFreeMode() || parsed.data.paymentMethod === "FREE";
  const amountCents = free ? 0 : candlePriceCents();
  const amount = amountCents / 100;

  const candle = await prisma.virtualCandle.create({
    data: {
      donorName: parsed.data.donorName.trim(),
      intention: parsed.data.intention.trim(),
      prayer: parsed.data.prayer?.trim(),
      intentionPublic: parsed.data.intentionPublic === true,
      prayerPublic: parsed.data.prayerPublic === true,
      email: parsed.data.email?.trim(),
      amountCents,
      paymentMethod: free ? "FREE" : parsed.data.paymentMethod,
      status: "PENDING",
    },
  });

  if (free) {
    await activateCandle(candle.id);
    return NextResponse.json({ free: true, candleId: candle.id });
  }

  if (!mercadoPagoEnabled()) {
    await activateCandle(candle.id);
    await prisma.virtualCandle.update({
      where: { id: candle.id },
      data: { paymentMethod: "DEMO" },
    });
    return NextResponse.json({ demo: true, candleId: candle.id });
  }

  try {
    const preference = await createCandlePreference({
      candleId: candle.id,
      title: `Vela virtual — ${candle.intention}`,
      amount,
      payerEmail: candle.email ?? undefined,
    });

    const preferenceId = preference.id ?? undefined;
    const raw = preference as {
      init_point?: string;
      point_of_interaction?: {
        transaction_data?: { ticket_url?: string };
      };
    };
    const checkoutUrl =
      parsed.data.paymentMethod === "PIX"
        ? raw.point_of_interaction?.transaction_data?.ticket_url ?? raw.init_point
        : raw.init_point;

    await prisma.virtualCandle.update({
      where: { id: candle.id },
      data: { preferenceId },
    });

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: "Checkout indisponível no momento." },
        { status: 502 },
      );
    }

    return NextResponse.json({ checkoutUrl });
  } catch {
    await prisma.virtualCandle.update({
      where: { id: candle.id },
      data: { status: "CANCELLED" },
    });
    return NextResponse.json(
      { error: "Erro ao conectar com o Mercado Pago." },
      { status: 502 },
    );
  }
  } catch (e) {
    console.error("[candles/checkout]", e);
    const msg = isPrismaSchemaDrift(e) ? DB_SYNC_HINT : "Não foi possível acender a vela. Tente novamente.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
