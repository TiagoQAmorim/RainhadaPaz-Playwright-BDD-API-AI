import { prisma } from "@/lib/prisma";

export async function expireStaleReservations(raffleId?: string) {
  const now = new Date();
  await prisma.raffleTicket.updateMany({
    where: {
      status: "RESERVED",
      reservationExpiresAt: { lt: now },
      ...(raffleId ? { raffleId } : {}),
    },
    data: {
      status: "AVAILABLE",
      reservationExpiresAt: null,
      reservedSessionId: null,
    },
  });
}

/** Marca cotas como RESERVADAS para a sessão (transação por cota). */
export async function reserveTicketsForSession(params: {
  raffleId: string;
  ticketIds: string[];
  sessionId: string;
  reservationMinutes: number;
}) {
  const { raffleId, ticketIds, sessionId, reservationMinutes } = params;
  if (ticketIds.length === 0) throw new Error("Nenhuma cota selecionada.");

  await expireStaleReservations(raffleId);
  const expiresAt = new Date(Date.now() + reservationMinutes * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    for (const ticketId of ticketIds) {
      const own = await tx.raffleTicket.updateMany({
        where: {
          id: ticketId,
          raffleId,
          status: "RESERVED",
          reservedSessionId: sessionId,
        },
        data: { reservationExpiresAt: expiresAt },
      });
      if (own.count > 0) continue;

      const claimed = await tx.raffleTicket.updateMany({
        where: { id: ticketId, raffleId, status: "AVAILABLE" },
        data: {
          status: "RESERVED",
          reservationExpiresAt: expiresAt,
          reservedSessionId: sessionId,
        },
      });
      if (claimed.count === 0) {
        throw new Error("CONFLICT");
      }
    }
  });

  return expiresAt;
}

export async function releaseTicketsForSession(params: {
  raffleId: string;
  ticketIds: string[];
  sessionId: string;
}) {
  await prisma.raffleTicket.updateMany({
    where: {
      raffleId: params.raffleId,
      id: { in: params.ticketIds },
      status: "RESERVED",
      reservedSessionId: params.sessionId,
    },
    data: {
      status: "AVAILABLE",
      reservationExpiresAt: null,
      reservedSessionId: null,
    },
  });
}

/** Confirma pagamento e marca cotas como VENDIDAS (idempotente). */
export async function confirmRaffleOrderPaid(orderId: string, externalPaymentId?: string) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.raffleOrder.findUnique({
      where: { id: orderId },
      include: { lines: { include: { ticket: true } } },
    });
    if (!order) return;
    if (order.status === "PAID") return;

    for (const line of order.lines) {
      if (line.ticket.status === "SOLD") continue;
      const updated = await tx.raffleTicket.updateMany({
        where: {
          id: line.ticketId,
          status: { in: ["RESERVED", "AVAILABLE"] },
        },
        data: {
          status: "SOLD",
          soldAt: new Date(),
          reservationExpiresAt: null,
          reservedSessionId: null,
        },
      });
      if (updated.count === 0) {
        throw new Error(`Cota ${line.ticketId} indisponível para confirmação.`);
      }
    }

    await tx.raffleOrder.update({
      where: { id: orderId },
      data: { status: "PAID" },
    });

    if (externalPaymentId) {
      await tx.rafflePayment.updateMany({
        where: { orderId },
        data: {
          status: "APPROVED",
          confirmedAt: new Date(),
          externalPaymentId,
        },
      });
    }
  });
}

export async function cancelPendingOrder(orderId: string) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.raffleOrder.findUnique({
      where: { id: orderId },
      include: { lines: true },
    });
    if (!order || order.status !== "PENDING") return;

    for (const line of order.lines) {
      await tx.raffleTicket.updateMany({
        where: {
          id: line.ticketId,
          status: "RESERVED",
        },
        data: {
          status: "AVAILABLE",
          reservationExpiresAt: null,
          reservedSessionId: null,
        },
      });
    }

    await tx.raffleOrder.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });
  });
}
