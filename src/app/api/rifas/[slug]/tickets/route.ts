import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { formatTicketNumber } from "@/lib/raffle-rules";
import { expireStaleReservations } from "@/lib/raffle-reservations";
import { getRaffleBySlug } from "@/lib/raffles";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 48;

export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const raffle = await getRaffleBySlug(slug);
  if (!raffle || raffle.status !== "ACTIVE") {
    return NextResponse.json({ error: "Rifa não encontrada." }, { status: 404 });
  }

  await expireStaleReservations(raffle.id);

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const status = url.searchParams.get("status")?.toUpperCase();
  const q = url.searchParams.get("q")?.trim() ?? "";
  const sort = url.searchParams.get("sort") ?? "number";
  const month = Number(url.searchParams.get("month") ?? "");

  const where: Prisma.RaffleTicketWhereInput = { raffleId: raffle.id };
  if (status && ["AVAILABLE", "RESERVED", "SOLD"].includes(status)) {
    where.status = status;
  }

  if (q) {
    const num = Number(q.replace(/\D/g, ""));
    const or: Prisma.RaffleTicketWhereInput[] = [
      { saint: { name: { contains: q } } },
    ];
    if (Number.isFinite(num) && num > 0) or.push({ ticketNumber: num });
    where.OR = or;
  }

  if (month >= 1 && month <= 12) {
    where.saint = { feastMonth: month };
  }

  const orderBy: Prisma.RaffleTicketOrderByWithRelationInput[] =
    sort === "name"
      ? [{ saint: { name: "asc" } }]
      : sort === "feast"
        ? [{ saint: { feastMonth: "asc" } }, { saint: { feastDay: "asc" } }]
        : [{ ticketNumber: "asc" }];

  const [total, tickets] = await Promise.all([
    prisma.raffleTicket.count({ where }),
    prisma.raffleTicket.findMany({
      where,
      include: { saint: true },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  return NextResponse.json({
    page,
    pageSize: PAGE_SIZE,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    ticketPriceCents: raffle.ticketPriceCents,
    tickets: tickets.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      ticketLabel: formatTicketNumber(t.ticketNumber),
      status: t.status,
      reservationExpiresAt: t.reservationExpiresAt?.toISOString() ?? null,
      saint: {
        name: t.saint.name,
        celebration: t.saint.celebration,
        description: t.saint.description,
        feastDay: t.saint.feastDay,
        feastMonth: t.saint.feastMonth,
      },
    })),
  });
}
