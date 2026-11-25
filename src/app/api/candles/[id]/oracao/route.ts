import { Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isCandleOnMural } from "@/lib/candle-burn";
import { prisma } from "@/lib/prisma";
import { getCandleDurationHours } from "@/lib/settings";

export const dynamic = "force-dynamic";

const VISITOR_COOKIE = "rp_oracao";
const VISITOR_MAX_AGE = 60 * 60 * 24 * 400;

function isVisitorId(value: string | undefined): value is string {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value));
}

async function visitorId(): Promise<string> {
  const jar = await cookies();
  const current = jar.get(VISITOR_COOKIE)?.value;
  if (isVisitorId(current)) return current;
  const created = crypto.randomUUID();
  jar.set(VISITOR_COOKIE, created, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: VISITOR_MAX_AGE,
  });
  return created;
}

/** Uma oração por vela para o mesmo navegador. Outro aparelho conta de novo. */
export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id || id.length > 64) {
    return NextResponse.json({ error: "Vela inválida" }, { status: 400 });
  }

  const candle = await prisma.virtualCandle.findUnique({
    where: { id },
    select: { litAt: true, expiresAt: true, status: true },
  });
  const hours = await getCandleDurationHours();
  if (!candle || !isCandleOnMural(candle, hours)) {
    return NextResponse.json({ error: "Esta vela não está no mural" }, { status: 404 });
  }

  const visitor = await visitorId();
  const already = await prisma.candlePrayerMark.findUnique({
    where: { candleId_visitorId: { candleId: id, visitorId: visitor } },
    select: { candleId: true },
  });
  if (already) {
    const current = await prisma.virtualCandle.findUnique({
      where: { id },
      select: { prayerTogetherCount: true },
    });
    return NextResponse.json({ count: current?.prayerTogetherCount ?? 0, already: true });
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.candlePrayerMark.create({ data: { candleId: id, visitorId: visitor } });
      return tx.virtualCandle.update({
        where: { id },
        data: { prayerTogetherCount: { increment: 1 } },
        select: { prayerTogetherCount: true },
      });
    });
    return NextResponse.json({ count: updated.prayerTogetherCount, already: false });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const current = await prisma.virtualCandle.findUnique({
        where: { id },
        select: { prayerTogetherCount: true },
      });
      return NextResponse.json({ count: current?.prayerTogetherCount ?? 0, already: true });
    }
    throw error;
  }
}
