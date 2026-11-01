"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirectWithAdminFlash } from "@/lib/admin-flash";
import {
  formCheckboxOn,
  normalizeNoticeExpiresAt,
  parseDatetimeLocalField,
} from "@/lib/datetime-local";
import { imageUrlFromForm, resolveImageFromForm } from "@/lib/uploads";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseOptionalDate(value: string): Date | null {
  const v = value.trim();
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function updateSiteSettings(formData: FormData) {
  await requireAdmin();
  const current = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  const [logoUrl, heroImageUrl, matrizImageUrl, capelaImageUrl] = await Promise.all([
    resolveImageFromForm(formData, "logoUrl", "logoUrlFile", current?.logoUrl),
    resolveImageFromForm(formData, "heroImageUrl", "heroImageUrlFile", current?.heroImageUrl),
    resolveImageFromForm(formData, "matrizImageUrl", "matrizImageUrlFile", current?.matrizImageUrl),
    resolveImageFromForm(formData, "capelaImageUrl", "capelaImageUrlFile", current?.capelaImageUrl),
  ]);
  await prisma.siteSettings.update({
    where: { id: 1 },
    data: {
      parishName: String(formData.get("parishName") ?? ""),
      diocese: String(formData.get("diocese") ?? ""),
      address: String(formData.get("address") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? "") || null,
      heroTitle: String(formData.get("heroTitle") ?? ""),
      heroSubtitle: String(formData.get("heroSubtitle") ?? ""),
      aboutHtml: String(formData.get("aboutHtml") ?? ""),
      massScheduleHtml: String(formData.get("massScheduleHtml") ?? ""),
      instagramUrl: String(formData.get("instagramUrl") ?? "") || null,
      youtubeUrl: String(formData.get("youtubeUrl") ?? "") || null,
      facebookUrl: String(formData.get("facebookUrl") ?? "") || null,
      logoUrl,
      heroImageUrl,
      matrizImageUrl,
      capelaImageUrl,
      youtubeChannelUrl: String(formData.get("youtubeChannelUrl") ?? "") || null,
      tercoOnlineSchedule: String(formData.get("tercoOnlineSchedule") ?? "") || null,
      tercoOnlineLink: String(formData.get("tercoOnlineLink") ?? "") || null,
    },
  });
  revalidatePath("/", "layout");
  revalidatePath("/terco-online");
  await redirectWithAdminFlash("/admin/informacoes", "updated");
}

function revalidateTercoOnlinePages() {
  revalidatePath("/", "layout");
  revalidatePath("/terco-online");
  revalidatePath("/admin/terco-online");
}

export async function createTercoOnlineSlot(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim() || "Terço online";
  const scheduleText = String(formData.get("scheduleText") ?? "").trim();
  const meetingUrl = String(formData.get("meetingUrl") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? "0");
  if (!scheduleText) return;
  await prisma.tercoOnlineSlot.create({
    data: {
      title,
      scheduleText,
      meetingUrl,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    },
  });
  revalidateTercoOnlinePages();
  await redirectWithAdminFlash("/admin/terco-online", "created");
}

export async function updateTercoOnlineSlot(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const title = String(formData.get("title") ?? "").trim() || "Terço online";
  const scheduleText = String(formData.get("scheduleText") ?? "").trim();
  const meetingUrl = String(formData.get("meetingUrl") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? "0");
  if (!scheduleText) return;
  await prisma.tercoOnlineSlot.update({
    where: { id },
    data: {
      title,
      scheduleText,
      meetingUrl,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    },
  });
  revalidateTercoOnlinePages();
  await redirectWithAdminFlash("/admin/terco-online", "updated");
}

export async function deleteTercoOnlineSlot(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.tercoOnlineSlot.delete({ where: { id } });
  revalidateTercoOnlinePages();
  await redirectWithAdminFlash("/admin/terco-online", "deleted");
}

export async function upsertPost(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "");
  const slug = String(formData.get("slug") ?? "") || slugify(title);
  const excerpt = String(formData.get("excerpt") ?? "");
  const body = String(formData.get("body") ?? "");
  const published = formData.get("published") === "on";
  const existing = id
    ? await prisma.post.findUnique({ where: { id }, select: { coverImage: true } })
    : null;
  const coverImage = await resolveImageFromForm(
    formData,
    "coverImage",
    "coverImageFile",
    existing?.coverImage,
  );

  const data = {
    title,
    slug,
    excerpt,
    body,
    coverImage,
    published,
    publishedAt: published ? new Date() : null,
  };

  if (id) {
    await prisma.post.update({ where: { id }, data });
  } else {
    await prisma.post.create({ data });
  }
  revalidatePath("/noticias");
  revalidatePath("/");
  revalidatePath("/admin/noticias");
  await redirectWithAdminFlash("/admin/noticias", id ? "updated" : "created");
}

export async function deletePost(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.post.delete({ where: { id } });
  revalidatePath("/noticias");
  revalidatePath("/");
  revalidatePath("/admin/noticias");
  await redirectWithAdminFlash("/admin/noticias", "deleted");
}

export async function upsertNotice(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "");
  const body = String(formData.get("body") ?? "");
  const published = formCheckboxOn(formData, "published");
  const expiresAt = normalizeNoticeExpiresAt(
    parseDatetimeLocalField(String(formData.get("expiresAt") ?? "")),
  );
  const existing = id
    ? await prisma.notice.findUnique({
        where: { id },
        select: { coverImage: true, publishedAt: true },
      })
    : null;
  const coverImage = await resolveImageFromForm(
    formData,
    "coverImage",
    "coverImageFile",
    existing?.coverImage,
  );

  const data = {
    title,
    body,
    coverImage,
    published,
    publishedAt: published ? (existing?.publishedAt ?? new Date()) : null,
    expiresAt,
  };

  if (id) {
    await prisma.notice.update({ where: { id }, data });
    revalidatePath(`/avisos/${id}`);
  } else {
    const created = await prisma.notice.create({ data });
    revalidatePath(`/avisos/${created.id}`);
  }
  revalidatePath("/avisos");
  revalidatePath("/admin/avisos");
  revalidatePath("/");
  await redirectWithAdminFlash("/admin/avisos", id ? "updated" : "created");
}

export async function deleteNotice(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.notice.delete({ where: { id } });
  revalidatePath("/avisos");
  revalidatePath("/admin/avisos");
  revalidatePath("/");
  await redirectWithAdminFlash("/admin/avisos", "deleted");
}

export async function upsertMassLocation(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "");
  const address = String(formData.get("address") ?? "");
  const scheduleText = String(formData.get("scheduleText") ?? "");
  const sortOrder = Number(formData.get("sortOrder") ?? "0") || 0;
  const published = formData.get("published") === "on";

  const data = { name, address, scheduleText, sortOrder, published };

  if (id) {
    await prisma.massLocation.update({ where: { id }, data });
  } else {
    await prisma.massLocation.create({ data });
  }
  revalidatePath("/horarios");
  revalidatePath("/admin/horarios");
  revalidatePath("/");
  await redirectWithAdminFlash("/admin/horarios", id ? "updated" : "created");
}

export async function deleteMassLocation(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.massLocation.delete({ where: { id } });
  revalidatePath("/horarios");
  revalidatePath("/admin/horarios");
  await redirectWithAdminFlash("/admin/horarios", "deleted");
}

export async function createPage(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "");
  const slug = String(formData.get("slug") ?? "") || slugify(title);
  const body = String(formData.get("body") ?? "");
  const featuredImage = await imageUrlFromForm(formData, "featuredImage", "featuredImageFile");
  await prisma.page.create({ data: { title, slug, body, featuredImage } });
  revalidatePath("/sacramentos");
  revalidatePath("/admin/informacoes");
  await redirectWithAdminFlash("/admin/informacoes", "created");
}

export async function updatePage(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "");
  const slug = String(formData.get("slug") ?? "") || slugify(title);
  const body = String(formData.get("body") ?? "");
  const existing = id
    ? await prisma.page.findUnique({ where: { id }, select: { featuredImage: true } })
    : null;
  const featuredImage = await resolveImageFromForm(
    formData,
    "featuredImage",
    "featuredImageFile",
    existing?.featuredImage,
  );
  if (id) {
    await prisma.page.update({ where: { id }, data: { title, slug, body, featuredImage } });
  }
  revalidatePath("/sacramentos");
  revalidatePath(`/sacramentos/${slug}`);
  revalidatePath("/institucional");
  revalidatePath("/terco-online");
  revalidatePath("/padroeira");
  revalidatePath("/paroco");
  revalidatePath("/admin/informacoes");
  await redirectWithAdminFlash("/admin/informacoes", "updated");
}

export async function deletePage(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.page.delete({ where: { id } });
  revalidatePath("/sacramentos");
  revalidatePath("/admin/informacoes");
  await redirectWithAdminFlash("/admin/informacoes", "deleted");
}

function normalizeOptionalEmail(raw: FormDataEntryValue | null): string | null {
  const v = String(raw ?? "").trim();
  if (!v) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
    throw new Error("Informe um e-mail válido para receber as velas.");
  }
  return v;
}

export async function updateCandleSettings(formData: FormData) {
  await requireAdmin();
  const amount = Number(String(formData.get("candleDurationAmount") ?? "").trim());
  const unit = String(formData.get("candleDurationUnit") ?? "hours");
  const candlesNotifyEmail = normalizeOptionalEmail(formData.get("candlesNotifyEmail"));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Informe um tempo válido para a vela.");
  }
  if (unit !== "hours" && unit !== "days") {
    throw new Error("Unidade inválida.");
  }
  await prisma.siteSettings.update({
    where: { id: 1 },
    data: {
      candleDurationAmount: Math.round(amount),
      candleDurationUnit: unit,
      candlesNotifyEmail,
    },
  });
  revalidatePath("/velas");
  revalidatePath("/");
  revalidatePath("/admin/velas");
  await redirectWithAdminFlash("/admin/velas", "updated");
}

export async function deleteCandle(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.virtualCandle.delete({ where: { id } });
  revalidatePath("/velas");
  revalidatePath("/");
  revalidatePath("/admin/velas");
  await redirectWithAdminFlash("/admin/velas", "deleted");
}

export async function extinguishCandle(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.virtualCandle.update({
      where: { id },
      data: { status: "EXPIRED", expiresAt: new Date() },
    });
  }
  revalidatePath("/velas");
  revalidatePath("/");
  revalidatePath("/admin/velas");
  await redirectWithAdminFlash("/admin/velas", "updated");
}

export async function upsertEvent(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "");
  const description = String(formData.get("description") ?? "");
  const location = String(formData.get("location") ?? "") || null;
  const startsAt = new Date(String(formData.get("startsAt") ?? ""));
  const published = formData.get("published") === "on";

  if (id) {
    await prisma.event.update({
      where: { id },
      data: { title, description, location, startsAt, published },
    });
  } else {
    await prisma.event.create({
      data: { title, description, location, startsAt, published },
    });
  }
  revalidatePath("/");
  await redirectWithAdminFlash("/admin", id ? "updated" : "created");
}

export async function deleteEvent(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.event.delete({ where: { id } });
  revalidatePath("/");
  await redirectWithAdminFlash("/admin", "deleted");
}
