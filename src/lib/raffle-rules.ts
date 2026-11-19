export const RAFFLE_MAX_TICKETS = 800;
export const RAFFLE_MIN_TICKETS = 100;
/** Rifa de números (0001, 0002…), física e virtual. */
export const RAFFLE_NUMBER_MAX_TICKETS = 2000;
export const RAFFLE_NUMBER_MIN_TICKETS = 1;
/** Último número da série (4 dígitos: 0001–9999). */
export const RAFFLE_NUMBER_MAX_VALUE = 9999;
/** Números por talão impresso. 1495 cai no talão 30. */
export const RAFFLE_BOOKLET_SIZE = 50;
/** Fotos do prêmio no cadastro da rifa. */
export const RAFFLE_PRIZE_PHOTO_SLOTS = 6;

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
export const RAFFLE_DEFAULT_RESERVATION_MINUTES = 5;

export type RaffleStatus = "DRAFT" | "ACTIVE" | "CLOSED" | "CANCELLED";
export type RaffleTicketStatus = "AVAILABLE" | "RESERVED" | "SOLD";

export function assertNumberTicketCount(count: number): void {
  if (!Number.isInteger(count) || count < RAFFLE_NUMBER_MIN_TICKETS || count > RAFFLE_NUMBER_MAX_TICKETS) {
    throw new Error(
      `A rifa de números aceita de ${RAFFLE_NUMBER_MIN_TICKETS} a ${RAFFLE_NUMBER_MAX_TICKETS} cotas.`,
    );
  }
}

export function numberSeriesEnd(start: number, count: number): number {
  return start + count - 1;
}

/** Série inteira da rifa de números: talão impresso (a partir de 0001) e números do site. */
export function numberedRaffleSeries(numberStart: number | null | undefined, totalTickets: number) {
  const siteStart = numberStart && numberStart > 1 ? numberStart : 1;
  return {
    first: 1,
    siteStart,
    last: numberSeriesEnd(siteStart, totalTickets),
  };
}

export function formatDrawDateTime(date: Date): string {
  return date.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function raffleDrawScopeLabel(scope: string): string {
  if (scope === "ALL") return "Série inteira (físico e virtual)";
  if (scope === "ALL_SOLD") return "Série inteira, só vendidos";
  if (scope === "VIRTUAL") return "Apenas virtual";
  if (scope === "VIRTUAL_SOLD" || scope === "SOLD") return "Apenas virtual, só vendidos";
  return "Sorteio";
}

export function numberedDrawNote(
  series: { first: number; siteStart: number; last: number },
  ticketNumber: number,
  soldOnSite: boolean,
): string {
  const range = `${formatTicketNumber(series.first)} a ${formatTicketNumber(series.last)}`;
  if (ticketNumber < series.siteStart) {
    return `Sorteio da série completa (${range}). Número do talão impresso.`;
  }
  if (soldOnSite) {
    return `Sorteio da série completa (${range}). Número vendido no site.`;
  }
  return `Sorteio da série completa (${range}). Número do site sem compra confirmada.`;
}

export function assertNumberSeries(start: number, count: number): void {
  assertNumberTicketCount(count);
  if (!Number.isInteger(start) || start < 1) {
    throw new Error("O primeiro número deve ser 1 ou maior.");
  }
  const end = numberSeriesEnd(start, count);
  if (end > RAFFLE_NUMBER_MAX_VALUE) {
    throw new Error(
      `Essa série iria até ${end}. O último número pode ser no máximo ${RAFFLE_NUMBER_MAX_VALUE}.`,
    );
  }
}

export function raffleBookletNumber(ticketNumber: number): number {
  return Math.max(1, Math.ceil(ticketNumber / RAFFLE_BOOKLET_SIZE));
}

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
