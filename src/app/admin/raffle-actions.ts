"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { redirectWithAdminFlash } from "@/lib/admin-flash";
import { requireAdmin } from "@/lib/auth";
import { assertRaffleTicketQuantity } from "@/lib/raffle-rules";
import { createRaffleWithTickets } from "@/lib/raffles";
import { prisma } from "@/lib/prisma";

export async function createRaffleAction(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const purpose = String(formData.get("purpose") ?? "").trim();
  const prizeTitle = String(formData.get("prizeTitle") ?? "").trim();
  const prizeDescription = String(formData.get("prizeDescription") ?? "").trim();
  const ticketPriceBrl = Number(String(formData.get("ticketPriceBrl") ?? "").replace(",", "."));
  const totalTickets = Number(formData.get("totalTickets") ?? "");
  const status = String(formData.get("status") ?? "DRAFT") as "DRAFT" | "ACTIVE";
  const drawScheduledAtRaw = String(formData.get("drawScheduledAt") ?? "").trim();

  if (!title || !description || !prizeTitle) {
    throw new Error("Preencha título, descrição e prêmio.");
  }
  if (!Number.isFinite(ticketPriceBrl) || ticketPriceBrl <= 0) {
    throw new Error("Valor da cota inválido.");
  }
  try {
    assertRaffleTicketQuantity(totalTickets);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Quantidade de cotas inválida.";
    redirect(`/admin/rifas/nova?erro=${encodeURIComponent(msg)}`);
  }

  let raffle;
  try {
    raffle = await createRaffleWithTickets({
      title,
      description,
      purpose: purpose || undefined,
      prizeTitle,
      prizeDescription: prizeDescription || undefined,
      ticketPriceCents: Math.round(ticketPriceBrl * 100),
      totalTickets,
      status,
      drawScheduledAt: drawScheduledAtRaw ? new Date(drawScheduledAtRaw) : null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Não foi possível criar a rifa.";
    redirect(`/admin/rifas/nova?erro=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/admin/rifas");
  revalidatePath("/rifas");
  await redirectWithAdminFlash(`/admin/rifas/${raffle.id}`, "created");
}

export async function updateRaffleAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const purpose = String(formData.get("purpose") ?? "").trim();
  const prizeTitle = String(formData.get("prizeTitle") ?? "").trim();
  const prizeDescription = String(formData.get("prizeDescription") ?? "").trim();
  const ticketPriceBrl = Number(String(formData.get("ticketPriceBrl") ?? "").replace(",", "."));
  const status = String(formData.get("status") ?? "") as "DRAFT" | "ACTIVE" | "CLOSED" | "CANCELLED";
  const drawScheduledAtRaw = String(formData.get("drawScheduledAt") ?? "").trim();

  if (!id || !title || !description || !prizeTitle) {
    redirect(`/admin/rifas/${id}/editar?erro=${encodeURIComponent("Preencha título, descrição e prêmio.")}`);
  }
  if (!Number.isFinite(ticketPriceBrl) || ticketPriceBrl <= 0) {
    redirect(`/admin/rifas/${id}/editar?erro=${encodeURIComponent("Valor da cota inválido.")}`);
  }

  const existing = await prisma.raffle.findUnique({ where: { id } });
  if (!existing) {
    redirect("/admin/rifas");
  }
  if (existing.drawRecordedAt) {
    redirect(
      `/admin/rifas/${id}/editar?erro=${encodeURIComponent("Rifa encerrada após sorteio — edição bloqueada.")}`,
    );
  }

  await prisma.raffle.update({
    where: { id },
    data: {
      title,
      description,
      purpose: purpose || null,
      prizeTitle,
      prizeDescription: prizeDescription || null,
      ticketPriceCents: Math.round(ticketPriceBrl * 100),
      status: status || existing.status,
      drawScheduledAt: drawScheduledAtRaw ? new Date(drawScheduledAtRaw) : null,
    },
  });

  revalidatePath("/admin/rifas");
  revalidatePath(`/admin/rifas/${id}`);
  revalidatePath("/rifas");
  revalidatePath(`/rifas/${existing.slug}`);
  revalidatePath("/");
  await redirectWithAdminFlash(`/admin/rifas/${id}`, "updated");
}

export async function autoDrawRaffleWinnerAction(formData: FormData) {
  await requireAdmin();
  const raffleId = String(formData.get("raffleId") ?? "");
  if (!raffleId) return;

  const raffle = await prisma.raffle.findUnique({ where: { id: raffleId } });
  try {
    const { drawRaffleWinnerAutomatically } = await import("@/lib/raffle-draw");
    await drawRaffleWinnerAutomatically(raffleId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Não foi possível sortear.";
    redirect(`/admin/rifas/${raffleId}?erro=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/admin/rifas");
  revalidatePath(`/admin/rifas/${raffleId}`);
  revalidatePath("/rifas");
  if (raffle?.slug) revalidatePath(`/rifas/${raffle.slug}`);
  revalidatePath("/");
  await redirectWithAdminFlash(`/admin/rifas/${raffleId}`, "drawn");
}

export async function confirmRaffleOrderManualAction(formData: FormData) {
  await requireAdmin();
  const orderId = String(formData.get("orderId") ?? "");
  const raffleId = String(formData.get("raffleId") ?? "");
  if (!orderId) return;
  const { confirmRaffleOrderPaid } = await import("@/lib/raffle-reservations");
  await confirmRaffleOrderPaid(orderId, "manual-admin");
  revalidatePath("/admin/rifas");
  if (raffleId) revalidatePath(`/admin/rifas/${raffleId}`);
  revalidatePath("/rifas");
  await redirectWithAdminFlash(
    raffleId ? `/admin/rifas/${raffleId}` : "/admin/rifas",
    "updated",
  );
}

export async function cancelRaffleOrderManualAction(formData: FormData) {
  await requireAdmin();
  const orderId = String(formData.get("orderId") ?? "");
  const raffleId = String(formData.get("raffleId") ?? "");
  if (!orderId) return;
  const { cancelPendingOrder } = await import("@/lib/raffle-reservations");
  await cancelPendingOrder(orderId);
  revalidatePath("/admin/rifas");
  if (raffleId) revalidatePath(`/admin/rifas/${raffleId}`);
  revalidatePath("/rifas");
  await redirectWithAdminFlash(
    raffleId ? `/admin/rifas/${raffleId}` : "/admin/rifas",
    "updated",
  );
}

export async function recordRaffleDrawAction(formData: FormData) {
  await requireAdmin();
  const raffleId = String(formData.get("raffleId") ?? "");
  const winningNumber = Number(String(formData.get("winningNumber") ?? "").trim());
  const winnerName = String(formData.get("winnerName") ?? "").trim();
  const winnerContact = String(formData.get("winnerContact") ?? "").trim();
  const drawNotes = String(formData.get("drawNotes") ?? "").trim();

  if (!raffleId || !Number.isInteger(winningNumber) || winningNumber < 1) {
    throw new Error("Informe o número da cota sorteada.");
  }

  const ticket = await prisma.raffleTicket.findFirst({
    where: { raffleId, ticketNumber: winningNumber, status: "SOLD" },
    include: { orderLine: { include: { order: true } } },
  });
  if (!ticket) {
    throw new Error("Não há cota vendida com este número nesta rifa.");
  }

  const order = ticket.orderLine?.order;

  await prisma.raffle.update({
    where: { id: raffleId },
    data: {
      status: "CLOSED",
      drawWinningNumber: winningNumber,
      drawWinnerName: winnerName || order?.buyerName || null,
      drawWinnerContact: winnerContact || order?.buyerEmail || null,
      drawNotes: drawNotes || null,
      drawRecordedAt: new Date(),
    },
  });

  revalidatePath("/admin/rifas");
  revalidatePath(`/admin/rifas/${raffleId}`);
  revalidatePath("/rifas");
  await redirectWithAdminFlash(`/admin/rifas/${raffleId}`, "updated");
}

export async function setRaffleStatusAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !status) return;
  await prisma.raffle.update({ where: { id }, data: { status } });
  revalidatePath("/admin/rifas");
  revalidatePath("/rifas");
  revalidatePath("/");
  await redirectWithAdminFlash(`/admin/rifas/${id}`, "updated");
}

export async function setRaffleFeaturedAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const featured = String(formData.get("featured") ?? "") === "1";
  if (!id) return;

  if (featured) {
    const raffle = await prisma.raffle.findUnique({ where: { id } });
    if (!raffle || raffle.status !== "ACTIVE") {
      throw new Error("Só rifas ativas podem ser destacadas na home.");
    }
    await prisma.$transaction([
      prisma.raffle.updateMany({ data: { featuredOnHome: false } }),
      prisma.raffle.update({ where: { id }, data: { featuredOnHome: true } }),
    ]);
  } else {
    await prisma.raffle.update({ where: { id }, data: { featuredOnHome: false } });
  }

  revalidatePath("/admin/rifas");
  revalidatePath(`/admin/rifas/${id}`);
  revalidatePath("/");
  revalidatePath("/rifas");
  await redirectWithAdminFlash(`/admin/rifas/${id}`, "updated");
}
