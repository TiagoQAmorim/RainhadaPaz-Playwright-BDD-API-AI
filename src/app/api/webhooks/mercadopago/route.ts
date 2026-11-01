import { NextResponse } from "next/server";
import { activateCandle } from "@/lib/candles";
import { getPayment } from "@/lib/mercadopago";
import { confirmRaffleOrderPaid } from "@/lib/raffle-reservations";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const paymentId =
    body?.data?.id ??
    body?.id ??
    new URL(req.url).searchParams.get("data.id") ??
    new URL(req.url).searchParams.get("id");

  if (!paymentId) {
    return NextResponse.json({ ok: true });
  }

  try {
    const payment = await getPayment(String(paymentId));
    const status = payment.status;
    const ref = payment.external_reference;

    if (!ref || typeof ref !== "string") {
      return NextResponse.json({ ok: true });
    }

    const raffleOrder = await prisma.raffleOrder.findUnique({ where: { id: ref } });
    if (raffleOrder) {
      if (status === "approved") {
        await confirmRaffleOrderPaid(ref, String(paymentId));
      } else if (status === "cancelled" || status === "rejected") {
        await prisma.raffleOrder.updateMany({
          where: { id: ref, status: "PENDING" },
          data: { status: "CANCELLED" },
        });
      }
      return NextResponse.json({ ok: true });
    }

    const candleId = ref;

    if (status === "approved") {
      await activateCandle(candleId);
      await prisma.virtualCandle.update({
        where: { id: candleId },
        data: { mercadoPagoId: String(paymentId) },
      });
    } else if (status === "cancelled" || status === "rejected") {
      await prisma.virtualCandle.update({
        where: { id: candleId },
        data: { status: "CANCELLED", mercadoPagoId: String(paymentId) },
      });
    }
  } catch {
    // Mercado Pago reenvia webhooks; evitar 500 desnecessário
  }

  return NextResponse.json({ ok: true });
}
