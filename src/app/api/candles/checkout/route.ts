import { NextResponse } from "next/server";
import { z } from "zod";
import { activateCandle } from "@/lib/candles";
import {
  donationAmountBrlToCents,
  getCandleCommerceConfig,
  validateVoluntaryDonationCents,
} from "@/lib/candle-commerce";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  donorName: z.string().min(2).max(80),
  intention: z.string().min(2).max(120),
  prayer: z.string().max(500).optional(),
  intentionPublic: z.boolean().optional(),
  prayerPublic: z.boolean().optional(),
  email: z.string().email().optional(),
  paymentMethod: z.enum(["FREE", "PIX", "SICREDI"]).optional(),
  /** Só no modo gratuito com oferta opcional — valor escolhido pelo fiél (reais). */
  donationAmountBrl: z.number().positive().max(5000).optional(),
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
    m.includes("candleAccessMode") ||
    m.includes("candlePriceCents") ||
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

    const commerce = await getCandleCommerceConfig();
    const method = parsed.data.paymentMethod ?? "PIX";

    let free = false;
    let amountCents = commerce.priceCents;
    let paymentMethod: "FREE" | "PIX" | "SICREDI" = "PIX";

    if (commerce.forceFree) {
      free = true;
      amountCents = 0;
      paymentMethod = "FREE";
    } else if (method === "FREE") {
      if (commerce.accessMode === "free" || commerce.accessMode === "free_donation") {
        free = true;
        amountCents = 0;
        paymentMethod = "FREE";
      } else {
        return NextResponse.json({ error: "Pagamento obrigatório para acender a vela." }, { status: 400 });
      }
    } else if (method === "PIX") {
      if (!commerce.allowPix) {
        return NextResponse.json({ error: "PIX não está disponível no momento." }, { status: 400 });
      }
      paymentMethod = "PIX";
      if (commerce.accessMode === "free_donation") {
        const brl = parsed.data.donationAmountBrl;
        if (brl == null) {
          return NextResponse.json({ error: "Informe o valor da sua oferta." }, { status: 400 });
        }
        amountCents = donationAmountBrlToCents(brl);
        const donationErr = validateVoluntaryDonationCents(amountCents);
        if (donationErr) {
          return NextResponse.json({ error: donationErr }, { status: 400 });
        }
      } else {
        amountCents = commerce.priceCents;
      }
    } else if (method === "SICREDI") {
      if (!commerce.allowSicredi) {
        return NextResponse.json({ error: "Cartão Sicredi não está disponível." }, { status: 400 });
      }
      if (!commerce.sicrediLive) {
        return NextResponse.json(
          { error: "Cartão Sicredi ainda não está ativo. Use PIX ou aguarde." },
          { status: 503 },
        );
      }
      paymentMethod = "SICREDI";
      if (commerce.accessMode === "free_donation") {
        const brl = parsed.data.donationAmountBrl;
        if (brl == null) {
          return NextResponse.json({ error: "Informe o valor da sua oferta." }, { status: 400 });
        }
        amountCents = donationAmountBrlToCents(brl);
        const donationErr = validateVoluntaryDonationCents(amountCents);
        if (donationErr) {
          return NextResponse.json({ error: donationErr }, { status: 400 });
        }
      } else {
        amountCents = commerce.priceCents;
      }
    } else {
      return NextResponse.json({ error: "Forma de pagamento inválida." }, { status: 400 });
    }

    if (commerce.accessMode === "paid" && free) {
      return NextResponse.json({ error: "Velas pagas exigem PIX ou Sicredi." }, { status: 400 });
    }

    if (
      commerce.accessMode === "free_donation" &&
      !free &&
      parsed.data.donationAmountBrl == null
    ) {
      return NextResponse.json({ error: "Informe o valor da sua oferta." }, { status: 400 });
    }

    if (commerce.accessMode === "paid" && parsed.data.donationAmountBrl != null) {
      amountCents = commerce.priceCents;
    }

    const candle = await prisma.virtualCandle.create({
      data: {
        donorName: parsed.data.donorName.trim(),
        intention: parsed.data.intention.trim(),
        prayer: parsed.data.prayer?.trim(),
        intentionPublic: parsed.data.intentionPublic === true,
        prayerPublic: parsed.data.prayerPublic === true,
        email: parsed.data.email?.trim(),
        amountCents,
        paymentMethod,
        status: "PENDING",
      },
    });

    if (free) {
      await activateCandle(candle.id);
      return NextResponse.json({ free: true, candleId: candle.id });
    }

    return NextResponse.json({
      candleId: candle.id,
      paymentPath: `/velas/pagamento?candle=${candle.id}`,
    });
  } catch (e) {
    console.error("[candles/checkout]", e);
    const msg = isPrismaSchemaDrift(e) ? DB_SYNC_HINT : "Não foi possível registrar a vela. Tente novamente.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}