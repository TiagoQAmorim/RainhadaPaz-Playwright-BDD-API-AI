import { prisma } from "@/lib/prisma";
import {
  assertTicketCount,
  assignSaintsToTickets,
  formatTicketNumber,
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

export async function getRaffleStats(raffleId: string) {
  const [total, sold, reserved, available] = await Promise.all([
    prisma.raffleTicket.count({ where: { raffleId } }),
    prisma.raffleTicket.count({ where: { raffleId, status: "SOLD" } }),
    prisma.raffleTicket.count({ where: { raffleId, status: "RESERVED" } }),
    prisma.raffleTicket.count({ where: { raffleId, status: "AVAILABLE" } }),
  ]);
  const raffle = await prisma.raffle.findUniqueOrThrow({ where: { id: raffleId } });
  const confirmed = await prisma.raffleOrder.aggregate({
    where: { raffleId, status: "PAID" },
    _sum: { totalCents: true },
  });
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
  ticketPriceCents: number;
  totalTickets: number;
  status?: RaffleStatus;
  startsAt?: Date | null;
  endsAt?: Date | null;
  drawScheduledAt?: Date | null;
  reservationMinutes?: number;
};

/**
 * Cria rifa e N cotas. Usa santos distintos enquanto houver no catálogo;
 * acima disso, repete santos do PDF (cada cota continua com número único).
 */
export async function createRaffleWithTickets(input: CreateRaffleInput) {
  assertTicketCount(input.totalTickets);

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
        ticketPriceCents: input.ticketPriceCents,
        totalTickets: input.totalTickets,
        status: input.status ?? "DRAFT",
        startsAt: input.startsAt ?? null,
        endsAt: input.endsAt ?? null,
        drawScheduledAt: input.drawScheduledAt ?? null,
        reservationMinutes: input.reservationMinutes ?? 15,
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

