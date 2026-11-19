import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import { formatTicketNumber, numberedDrawNote, numberedRaffleSeries } from "@/lib/raffle-rules";

export type RaffleDrawScope = "ALL" | "VIRTUAL" | "SOLD";

export async function drawRaffleWinnerAutomatically(
  raffleId: string,
  scope: RaffleDrawScope = "SOLD",
  soldOnly = false,
) {
  const raffle = await prisma.raffle.findUnique({ where: { id: raffleId } });
  if (!raffle) throw new Error("Rifa não encontrada.");

  const drawnAt = new Date();
  let ticketNumber: number;
  let winnerName: string | null = null;
  let winnerContact: string | null = null;
  let notes: string;
  let storedScope = "SOLD";

  const numbered = raffle.kind === "NUMBERS" && (scope === "ALL" || scope === "VIRTUAL");
  if (numbered) {
    const series = numberedRaffleSeries(raffle.numberStart, raffle.totalTickets);
    const onlySold = soldOnly;
    storedScope = scope === "VIRTUAL" ? (onlySold ? "VIRTUAL_SOLD" : "VIRTUAL") : onlySold ? "ALL_SOLD" : "ALL";

    if (onlySold) {
      const soldTickets = await prisma.raffleTicket.findMany({
        where: {
          raffleId,
          status: "SOLD",
          ...(scope === "VIRTUAL"
            ? { ticketNumber: { gte: series.siteStart, lte: series.last } }
            : {}),
        },
        include: { orderLine: { include: { order: true } } },
      });
      if (soldTickets.length === 0) {
        throw new Error("Não há números vendidos nesse grupo. Confirme os pagamentos ou desmarque a opção.");
      }
      const winningTicket = soldTickets[randomInt(soldTickets.length)];
      const order = winningTicket.orderLine?.order;
      ticketNumber = winningTicket.ticketNumber;
      winnerName = order?.buyerName ?? null;
      winnerContact = order?.buyerPhone || order?.buyerEmail || null;
      notes =
        scope === "VIRTUAL"
          ? `Sorteio do virtual (${formatTicketNumber(series.siteStart)} a ${formatTicketNumber(series.last)}), só vendidos.`
          : `Sorteio da série inteira (${formatTicketNumber(series.first)} a ${formatTicketNumber(series.last)}), só entre compras confirmadas no site.`;
    } else if (scope === "VIRTUAL") {
      ticketNumber = randomInt(series.siteStart, series.last + 1);
      const ticket = await prisma.raffleTicket.findFirst({
        where: { raffleId, ticketNumber },
        include: { orderLine: { include: { order: true } } },
      });
      const soldOnSite = ticket?.status === "SOLD";
      const order = soldOnSite ? ticket?.orderLine?.order : null;
      winnerName = order?.buyerName ?? null;
      winnerContact = order?.buyerPhone || order?.buyerEmail || null;
      const range = `${formatTicketNumber(series.siteStart)} a ${formatTicketNumber(series.last)}`;
      notes = soldOnSite
        ? `Sorteio só do virtual (${range}). Número vendido no site.`
        : `Sorteio só do virtual (${range}). Número do site sem compra confirmada.`;
    } else {
      ticketNumber = randomInt(series.first, series.last + 1);
      const ticket = await prisma.raffleTicket.findFirst({
        where: { raffleId, ticketNumber },
        include: { orderLine: { include: { order: true } } },
      });
      const soldOnSite = ticket?.status === "SOLD";
      const order = soldOnSite ? ticket?.orderLine?.order : null;
      winnerName = order?.buyerName ?? null;
      winnerContact = order?.buyerPhone || order?.buyerEmail || null;
      notes = numberedDrawNote(series, ticketNumber, Boolean(soldOnSite));
    }
  } else {
    const soldTickets = await prisma.raffleTicket.findMany({
      where: { raffleId, status: "SOLD" },
      include: { orderLine: { include: { order: true } } },
    });
    if (soldTickets.length === 0) {
      throw new Error("Não há cotas vendidas. Confirme pagamentos antes de sortear.");
    }
    const winningTicket = soldTickets[randomInt(soldTickets.length)];
    const order = winningTicket.orderLine?.order;
    ticketNumber = winningTicket.ticketNumber;
    winnerName = order?.buyerName ?? null;
    winnerContact = order?.buyerPhone || order?.buyerEmail || null;
    notes = "Sorteio automático entre cotas vendidas.";
    storedScope = "SOLD";
  }

  await prisma.$transaction([
    prisma.raffleDraw.create({
      data: {
        raffleId,
        winningNumber: ticketNumber,
        winnerName,
        winnerContact,
        scope: storedScope,
        notes,
        drawnAt,
      },
    }),
    prisma.raffle.update({
      where: { id: raffleId },
      data: {
        drawWinningNumber: ticketNumber,
        drawWinnerName: winnerName,
        drawWinnerContact: winnerContact,
        drawNotes: notes,
        drawRecordedAt: drawnAt,
      },
    }),
  ]);

  return { ticketNumber, winnerName, winnerContact };
}
