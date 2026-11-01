import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";

export async function drawRaffleWinnerAutomatically(raffleId: string) {
  const raffle = await prisma.raffle.findUnique({ where: { id: raffleId } });
  if (!raffle) throw new Error("Rifa não encontrada.");
  if (raffle.drawRecordedAt) throw new Error("Esta rifa já teve sorteio registrado.");

  const soldTickets = await prisma.raffleTicket.findMany({
    where: { raffleId, status: "SOLD" },
    include: { orderLine: { include: { order: true } } },
  });

  if (soldTickets.length === 0) {
    throw new Error("Não há cotas vendidas. Confirme pagamentos antes de sortear.");
  }

  const winningTicket = soldTickets[randomInt(soldTickets.length)];
  const order = winningTicket.orderLine?.order;

  await prisma.raffle.update({
    where: { id: raffleId },
    data: {
      status: "CLOSED",
      drawWinningNumber: winningTicket.ticketNumber,
      drawWinnerName: order?.buyerName ?? null,
      drawWinnerContact: order?.buyerPhone || order?.buyerEmail || null,
      drawNotes: "Sorteio automático entre cotas vendidas.",
      drawRecordedAt: new Date(),
    },
  });

  return {
    ticketNumber: winningTicket.ticketNumber,
    winnerName: order?.buyerName ?? null,
    winnerContact: order?.buyerPhone || order?.buyerEmail || null,
  };
}
