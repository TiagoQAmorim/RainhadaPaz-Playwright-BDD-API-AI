export const RAFFLE_MAX_TICKETS = 800;
export const RAFFLE_MIN_TICKETS = 100;

/** Opções de cotas no admin (100, 200, … 800). */
export const RAFFLE_TICKET_QUANTITY_OPTIONS = Array.from(
  { length: RAFFLE_MAX_TICKETS / 100 },
  (_, i) => (i + 1) * 100,
);

export function assertRaffleTicketQuantity(count: number): void {
  if (!RAFFLE_TICKET_QUANTITY_OPTIONS.includes(count)) {
    throw new Error(
      `Escolha a quantidade de cotas entre: ${RAFFLE_TICKET_QUANTITY_OPTIONS.join(", ")}.`,
    );
  }
}
export const RAFFLE_DEFAULT_RESERVATION_MINUTES = 15;

export type RaffleStatus = "DRAFT" | "ACTIVE" | "CLOSED" | "CANCELLED";
export type RaffleTicketStatus = "AVAILABLE" | "RESERVED" | "SOLD";

export function assertTicketCount(count: number): void {
  if (!Number.isInteger(count)) {
    throw new Error("A quantidade de cotas deve ser um número inteiro.");
  }
  assertRaffleTicketQuantity(count);
  if (count < RAFFLE_MIN_TICKETS || count > RAFFLE_MAX_TICKETS) {
    throw new Error(
      `A quantidade de cotas deve estar entre ${RAFFLE_MIN_TICKETS} e ${RAFFLE_MAX_TICKETS}.`,
    );
  }
}

export function formatTicketNumber(n: number): string {
  const width = n > 999 ? 4 : 4;
  return String(n).padStart(width, "0");
}

export function ticketPriceLabel(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Distribui santos entre cotas; repete de forma embaralhada se cotas > catálogo. */
export function assignSaintsToTickets<T>(pool: T[], ticketCount: number): T[] {
  if (pool.length === 0 || ticketCount < 1) return [];
  const base = shuffle(pool);
  const out: T[] = [];
  for (let i = 0; i < ticketCount; i++) {
    out.push(base[i % base.length]);
  }
  return shuffle(out);
}
