import { expireStaleReservations } from "@/lib/raffle-reservations";
import { formatTicketNumber } from "@/lib/raffle-rules";
import { prisma } from "@/lib/prisma";

export function parseNameLines(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of text.split(/[\n,;]+/)) {
    const t = line.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

export type BulkResolvedTicket = {
  id: string;
  ticketNumber: number;
  ticketLabel: string;
  status: string;
  saint: {
    name: string;
    celebration: string;
    description: string;
  };
};

export async function resolveAvailableTicketsByNames(
  raffleId: string,
  names: string[],
  maxPerRequest = 30,
): Promise<{ tickets: BulkResolvedTicket[]; notFound: string[] }> {
  await expireStaleReservations(raffleId);

  const limited = names.slice(0, maxPerRequest);
  const tickets: BulkResolvedTicket[] = [];
  const notFound: string[] = [];
  const usedTicketIds = new Set<string>();

  for (const name of limited) {
    const row = await prisma.raffleTicket.findFirst({
      where: {
        raffleId,
        status: "AVAILABLE",
        id: usedTicketIds.size ? { notIn: [...usedTicketIds] } : undefined,
        saint: { name: { contains: name } },
      },
      include: { saint: true },
      orderBy: { ticketNumber: "asc" },
    });

    if (!row) {
      notFound.push(name);
      continue;
    }

    usedTicketIds.add(row.id);
    tickets.push({
      id: row.id,
      ticketNumber: row.ticketNumber,
      ticketLabel: formatTicketNumber(row.ticketNumber),
      status: row.status,
      saint: {
        name: row.saint.name,
        celebration: row.saint.celebration,
        description: row.saint.description,
      },
    });
  }

  return { tickets, notFound };
}
