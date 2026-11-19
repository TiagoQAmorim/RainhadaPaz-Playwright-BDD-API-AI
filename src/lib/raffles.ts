import { prisma } from "@/lib/prisma";
import {
  assertNumberSeries,
  assertTicketCount,
  assignSaintsToTickets,
  formatTicketNumber,
  RAFFLE_DEFAULT_RESERVATION_MINUTES,
  type RaffleStatus,
} from "@/lib/raffle-rules";
import { ensureSaintCatalogInDb, getSaintCatalog } from "@/lib/saints-catalog";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function allocateUniqueRaffleSlug(
  baseInput: string,
  tx: Tx,
): Promise<string> {
  const base = slugify(baseInput) || "rifa";
  for (let n = 0; n < 500; n++) {
    const slug = n === 0 ? base : `${base}-${n + 1}`;
    const taken = await tx.raffle.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!taken) return slug;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function listPublicRaffles() {
  return prisma.raffle.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
}

export async function getFeaturedHomeRaffle() {
  return prisma.raffle.findFirst({
    where: { status: "ACTIVE", featuredOnHome: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getRaffleBySlug(slug: string) {
  return prisma.raffle.findUnique({ where: { slug } });
}

/** Estatísticas de várias rifas em 2 consultas (lista no admin). */
export async function getRaffleStatsMap(raffleIds: string[]) {
  if (raffleIds.length === 0) return new Map<string, Awaited<ReturnType<typeof getRaffleStats>>>();

  const [groups, raffles, paidByRaffle] = await Promise.all([
    prisma.raffleTicket.groupBy({
      by: ["raffleId", "status"],
      where: { raffleId: { in: raffleIds } },
      _count: { _all: true },
    }),
    prisma.raffle.findMany({
      where: { id: { in: raffleIds } },
      select: { id: true, ticketPriceCents: true },
    }),
    prisma.raffleOrder.groupBy({
      by: ["raffleId"],
      where: { raffleId: { in: raffleIds }, status: "PAID" },
      _sum: { totalCents: true },
    }),
  ]);

  const priceById = Object.fromEntries(raffles.map((r) => [r.id, r.ticketPriceCents]));
  const raisedById = Object.fromEntries(
    paidByRaffle.map((p) => [p.raffleId, p._sum.totalCents ?? 0]),
  );
  const counts = new Map<string, Record<string, number>>();
  for (const g of groups) {
    const row = counts.get(g.raffleId) ?? {};
    row[g.status] = g._count._all;
    counts.set(g.raffleId, row);
  }

  const map = new Map<string, Awaited<ReturnType<typeof getRaffleStats>>>();
  for (const id of raffleIds) {
    const c = counts.get(id) ?? {};
    const sold = c.SOLD ?? 0;
    const reserved = c.RESERVED ?? 0;
    const available = c.AVAILABLE ?? 0;
    const total = sold + reserved + available;
    const soldRatio = total > 0 ? sold / total : 0;
    const committedRatio = total > 0 ? (sold + reserved) / total : 0;
    map.set(id, {
      total,
      sold,
      reserved,
      available,
      ticketPriceCents: priceById[id] ?? 0,
      raisedCents: raisedById[id] ?? 0,
      progressPct: total > 0 ? soldRatio * 100 : 0,
      committedPct: total > 0 ? committedRatio * 100 : 0,
    });
  }
  return map;
}

export async function getRaffleStats(raffleId: string) {
  const [groups, raffle, confirmed] = await Promise.all([
    prisma.raffleTicket.groupBy({
      by: ["status"],
      where: { raffleId },
      _count: { _all: true },
    }),
    prisma.raffle.findUniqueOrThrow({
      where: { id: raffleId },
      select: { ticketPriceCents: true },
    }),
    prisma.raffleOrder.aggregate({
      where: { raffleId, status: "PAID" },
      _sum: { totalCents: true },
    }),
  ]);
  const byStatus = Object.fromEntries(groups.map((g) => [g.status, g._count._all]));
  const sold = byStatus.SOLD ?? 0;
  const reserved = byStatus.RESERVED ?? 0;
  const available = byStatus.AVAILABLE ?? 0;
  const total = sold + reserved + available;
  const soldRatio = total > 0 ? sold / total : 0;
  const committedRatio = total > 0 ? (sold + reserved) / total : 0;

  return {
    total,
    sold,
    reserved,
    available,
    ticketPriceCents: raffle.ticketPriceCents,
    raisedCents: confirmed._sum.totalCents ?? 0,
    /** Percentual exato (evita 0% com poucas vendas em rifas grandes). */
    progressPct: total > 0 ? soldRatio * 100 : 0,
    /** Vendidas + reservadas (feedback visual antes do pagamento). */
    committedPct: total > 0 ? committedRatio * 100 : 0,
  };
}

export type CreateRaffleInput = {
  title: string;
  slug?: string;
  description: string;
  purpose?: string;
  coverImageUrl?: string;
  prizeTitle: string;
  prizeDescription?: string;
  prizeImageUrl?: string;
  prizeImageUrls?: string | null;
  ticketPriceCents: number;
  totalTickets: number;
  status?: RaffleStatus;
  startsAt?: Date | null;
  endsAt?: Date | null;
  drawScheduledAt?: Date | null;
  reservationMinutes?: number;
  kind?: "SAINTS" | "NUMBERS";
  numberStart?: number;
};

/**
 * Cria rifa e N cotas. Usa santos distintos enquanto houver no catálogo;
 * acima disso, repete santos do PDF (cada cota continua com número único).
 */
export async function createRaffleWithTickets(input: CreateRaffleInput) {
  const kind = input.kind === "NUMBERS" ? "NUMBERS" : "SAINTS";
  const numberStart = input.numberStart ?? 1;
  if (kind === "NUMBERS") assertNumberSeries(numberStart, input.totalTickets);
  else assertTicketCount(input.totalTickets);

  if (kind === "NUMBERS") {
    return prisma.$transaction(async (tx) => {
      const slug = await allocateUniqueRaffleSlug(input.slug?.trim() || input.title, tx);
      const raffle = await tx.raffle.create({
        data: {
          slug,
          title: input.title,
          description: input.description,
          purpose: input.purpose ?? null,
          coverImageUrl: input.coverImageUrl ?? null,
          prizeTitle: input.prizeTitle,
          prizeDescription: input.prizeDescription ?? null,
          prizeImageUrl: input.prizeImageUrl ?? null,
          prizeImageUrls: input.prizeImageUrls ?? null,
          ticketPriceCents: input.ticketPriceCents,
          totalTickets: input.totalTickets,
          status: input.status ?? "DRAFT",
          kind: "NUMBERS",
          numberStart,
          startsAt: input.startsAt ?? null,
          endsAt: input.endsAt ?? null,
          drawScheduledAt: input.drawScheduledAt ?? null,
          reservationMinutes: input.reservationMinutes ?? RAFFLE_DEFAULT_RESERVATION_MINUTES,
        },
      });
      const tickets = Array.from({ length: input.totalTickets }, (_, index) => ({
        raffleId: raffle.id,
        ticketNumber: numberStart + index,
        status: "AVAILABLE" as const,
      }));
      const batch = 400;
      for (let i = 0; i < tickets.length; i += batch) {
        await tx.raffleTicket.createMany({ data: tickets.slice(i, i + batch) });
      }
      return raffle;
    });
  }

  await ensureSaintCatalogInDb();

  const slugBase = input.slug?.trim() || input.title;
  const catalog = getSaintCatalog();
  const pool = await prisma.saint.findMany({
    where: {
      OR: catalog.map((c) => ({
        name: c.name,
        feastDay: c.feastDay,
        feastMonth: c.feastMonth,
      })),
    },
    orderBy: [{ feastMonth: "asc" }, { feastDay: "asc" }, { name: "asc" }],
  });
  if (pool.length === 0) {
    throw new Error("Nenhum santo no catálogo. Rode npm run import:saints e npm run db:sync-saints.");
  }
  const saints = assignSaintsToTickets(pool, input.totalTickets);

  return prisma.$transaction(async (tx) => {
    const slug = await allocateUniqueRaffleSlug(slugBase, tx);
    const raffle = await tx.raffle.create({
      data: {
        slug,
        title: input.title,
        description: input.description,
        purpose: input.purpose ?? null,
        coverImageUrl: input.coverImageUrl ?? null,
        prizeTitle: input.prizeTitle,
        prizeDescription: input.prizeDescription ?? null,
        prizeImageUrl: input.prizeImageUrl ?? null,
        prizeImageUrls: input.prizeImageUrls ?? null,
        ticketPriceCents: input.ticketPriceCents,
        totalTickets: input.totalTickets,
        status: input.status ?? "DRAFT",
        startsAt: input.startsAt ?? null,
        endsAt: input.endsAt ?? null,
        drawScheduledAt: input.drawScheduledAt ?? null,
        reservationMinutes: input.reservationMinutes ?? RAFFLE_DEFAULT_RESERVATION_MINUTES,
      },
    });

    await tx.raffleTicket.createMany({
      data: saints.map((saint, index) => ({
        raffleId: raffle.id,
        saintId: saint.id,
        ticketNumber: index + 1,
        status: "AVAILABLE",
      })),
    });

    return raffle;
  });
}

export { formatTicketNumber };

