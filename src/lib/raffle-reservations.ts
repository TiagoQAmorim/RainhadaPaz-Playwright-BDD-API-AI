import { prisma } from "@/lib/prisma";

const EXPIRE_THROTTLE_MS = 45_000;
const lastExpireAt = new Map<string, number>();

export async function expireStaleReservations(
  raffleId?: string,
  opts?: { force?: boolean },
) {
  const key = raffleId ?? "__global__";
  if (!opts?.force) {
    const last = lastExpireAt.get(key) ?? 0;
    if (Date.now() - last < EXPIRE_THROTTLE_MS) return;
  }
  lastExpireAt.set(key, Date.now());

  const now = new Date();
  const stale = await prisma.raffleTicket.findMany({
    where: {
      status: "RESERVED",
      reservationExpiresAt: { lt: now },
      ...(raffleId ? { raffleId } : {}),
    },
    select: { id: true },
  });
  if (stale.length === 0) return;

  const staleIds = stale.map((ticket) => ticket.id);
  const orders = await prisma.raffleOrder.findMany({
    where: {
      status: "PENDING",
      lines: { some: { ticketId: { in: staleIds } } },
    },
    select: { id: true },
  });
  for (const order of orders) {
    await cancelPendingOrder(order.id);
  }
  await prisma.raffleTicket.updateMany({
    where: { id: { in: staleIds }, status: "RESERVED" },
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

  await expireStaleReservations(raffleId, { force: true });
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

/** Libera cotas reservadas por esta sessão e cancela o pedido pendente ligado a elas. */
export async function releaseSessionReservations(params: {
  raffleId: string;
  sessionId: string;
  ticketIds?: string[];
  orderId?: string;
}) {
  const sessionId = params.sessionId.trim();
  if (!sessionId) return { released: 0 };

  if (params.orderId) {
    const order = await prisma.raffleOrder.findFirst({
      where: { id: params.orderId, raffleId: params.raffleId, status: "PENDING" },
      include: { lines: { include: { ticket: true } } },
    });
    if (!order) return { released: 0 };
    const reserved = order.lines.map((line) => line.ticket).filter((ticket) => ticket.status === "RESERVED");
    if (reserved.some((ticket) => ticket.reservedSessionId !== sessionId)) {
      return { released: 0, forbidden: true as const };
    }
    await cancelPendingOrder(order.id);
    return { released: order.lines.length };
  }

  const tickets = await prisma.raffleTicket.findMany({
    where: {
      raffleId: params.raffleId,
      status: "RESERVED",
      reservedSessionId: sessionId,
      ...(params.ticketIds?.length ? { id: { in: params.ticketIds } } : {}),
    },
    select: { id: true },
  });
  if (tickets.length === 0) return { released: 0 };

  const ids = tickets.map((ticket) => ticket.id);
  const orders = await prisma.raffleOrder.findMany({
    where: { status: "PENDING", lines: { some: { ticketId: { in: ids } } } },
    select: { id: true },
  });
  for (const order of orders) {
    await cancelPendingOrder(order.id);
  }
  await releaseTicketsForSession({
    raffleId: params.raffleId,
    ticketIds: ids,
    sessionId,
  });
  return { released: ids.length };
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

/** Cancela o pedido pendente quando o prazo da reserva já passou. */
export async function expireOrderIfDue(orderId: string) {
  const order = await prisma.raffleOrder.findUnique({
    where: { id: orderId },
    include: {
      lines: { include: { ticket: { select: { reservationExpiresAt: true } } } },
    },
  });
  if (!order) return { status: null as string | null, expiresAt: null as string | null };
  const expiresAt = earliestHoldExpiry(order.lines.map((line) => line.ticket.reservationExpiresAt));
  if (order.status !== "PENDING") {
    return { status: order.status, expiresAt };
  }
  if (!expiresAt || new Date(expiresAt).getTime() > Date.now()) {
    return { status: order.status, expiresAt };
  }
  await cancelPendingOrder(orderId);
  return { status: "CANCELLED" as const, expiresAt };
}

function earliestHoldExpiry(dates: Array<Date | null>) {
  const times = dates.filter((date): date is Date => date instanceof Date).map((date) => date.getTime());
  if (times.length === 0) return null;
  return new Date(Math.min(...times)).toISOString();
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

    await tx.raffleOrderTicket.deleteMany({ where: { orderId } });
    await tx.raffleOrder.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });
  });
}
