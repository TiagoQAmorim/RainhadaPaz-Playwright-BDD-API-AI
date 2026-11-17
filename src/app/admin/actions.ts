"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { findAdminByEmail } from "@/lib/admin-credentials";
import { hashAdminPassword, requireAdmin } from "@/lib/auth";
import {
  normalizeAdminEmail,
  validateAdminEmail,
  validateAdminName,
  validateNewAdminPassword,
} from "@/lib/admin-users";
import { prisma } from "@/lib/prisma";
import { redirectWithAdminFlash } from "@/lib/admin-flash";
import {
  formCheckboxOn,
  normalizeNoticeExpiresAt,
  parseDatetimeLocalField,
} from "@/lib/datetime-local";
import { imageUrlFromForm, resolveImageFromForm } from "@/lib/uploads";
import { sanitizeAdminHtml } from "@/lib/sanitize-admin-html";
import { ensureSiteSettings } from "@/lib/settings";
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
  const [logoUrl, heroImageUrl, heroImageUrl2, heroImageUrl3, matrizImageUrl, capelaImageUrl] =
    await Promise.all([
    resolveImageFromForm(formData, "logoUrl", "logoUrlFile", current?.logoUrl),
    resolveImageFromForm(formData, "heroImageUrl", "heroImageUrlFile", current?.heroImageUrl),
    resolveImageFromForm(formData, "heroImageUrl2", "heroImageUrl2File", current?.heroImageUrl2),
    resolveImageFromForm(formData, "heroImageUrl3", "heroImageUrl3File", current?.heroImageUrl3),
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
      aboutHtml: sanitizeAdminHtml(String(formData.get("aboutHtml") ?? "")),
      massScheduleHtml: String(formData.get("massScheduleHtml") ?? ""),
      instagramUrl: String(formData.get("instagramUrl") ?? "") || null,
      youtubeUrl: String(formData.get("youtubeUrl") ?? "") || null,
      facebookUrl: String(formData.get("facebookUrl") ?? "") || null,
      logoUrl,
      heroImageUrl,
      heroImageUrl2,
      heroImageUrl3,
      matrizImageUrl,
      capelaImageUrl,
      youtubeChannelUrl: String(formData.get("youtubeChannelUrl") ?? "") || null,
      tercoOnlineSchedule: String(formData.get("tercoOnlineSchedule") ?? "") || null,
      tercoOnlineLink: String(formData.get("tercoOnlineLink") ?? "") || null,
    },
  });
  revalidatePath("/", "layout");
  revalidatePath("/terco-online");
  await redirectWithAdminFlash("/admin/informacoes/geral", "updated");
}

export async function updateMaintenanceSettings(formData: FormData) {
  await requireAdmin();
  const maintenanceEnabled = formCheckboxOn(formData, "maintenanceEnabled");
  const message = String(formData.get("maintenanceMessage") ?? "").trim() || null;
  const showReturnDate = formCheckboxOn(formData, "maintenanceShowReturnDate");
  const maintenanceEndsAt = showReturnDate
    ? parseDatetimeLocalField(String(formData.get("maintenanceEndsAt") ?? ""))
    : null;

  await ensureSiteSettings();
  await prisma.siteSettings.update({
    where: { id: 1 },
    data: {
      maintenanceEnabled,
      maintenanceMessage: message,
      maintenanceEndsAt,
    },
  });
  const { syncMaintenanceCookie } = await import("@/lib/maintenance-sync");
  await syncMaintenanceCookie(maintenanceEnabled);
  revalidatePath("/", "layout");
  await redirectWithAdminFlash("/admin/manutencao", maintenanceEnabled ? "updated" : "updated");
}

function revalidateTercoOnlinePages() {
  revalidatePath("/", "layout");
  revalidatePath("/terco-online");
  revalidatePath("/admin/terco-online");
}

export async function upsertTercoOnlineSlot(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim() || "Terço online";
  const scheduleText = String(formData.get("scheduleText") ?? "").trim();
  const meetingUrl = String(formData.get("meetingUrl") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? "0");
  if (!scheduleText) return;

  const data = {
    title,
    scheduleText,
    meetingUrl,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
  };

  let slotId = id;
  if (id) {
    await prisma.tercoOnlineSlot.update({ where: { id }, data });
  } else {
    const created = await prisma.tercoOnlineSlot.create({ data });
    slotId = created.id;
  }
  revalidateTercoOnlinePages();
  revalidatePath("/admin/terco-online");
  revalidatePath(`/admin/terco-online/${slotId}`);
  await redirectWithAdminFlash(`/admin/terco-online/${slotId}`, id ? "updated" : "created");
}

/** @deprecated use upsertTercoOnlineSlot */
export const createTercoOnlineSlot = upsertTercoOnlineSlot;
/** @deprecated use upsertTercoOnlineSlot */
export const updateTercoOnlineSlot = upsertTercoOnlineSlot;

export async function deleteTercoOnlineSlot(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "").trim() || "/admin/terco-online";
  if (id) await prisma.tercoOnlineSlot.delete({ where: { id } });
  revalidateTercoOnlinePages();
  await redirectWithAdminFlash(returnTo, "deleted");
}

export async function upsertPost(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "");
  const slug = String(formData.get("slug") ?? "") || slugify(title);
  const excerpt = String(formData.get("excerpt") ?? "");
  const body = sanitizeAdminHtml(String(formData.get("body") ?? ""));
  const published = formCheckboxOn(formData, "published");
  const featuredOnHomeCarousel = formCheckboxOn(formData, "featuredOnHomeCarousel");

  if (featuredOnHomeCarousel) {
    const { assertHomeCarouselContentSlot } = await import("@/lib/home-carousel");
    await assertHomeCarouselContentSlot(id ? { postId: id } : undefined);
  }

  const existing = id
    ? await prisma.post.findUnique({
        where: { id },
        select: { coverImage: true, publishedAt: true, slug: true },
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
    slug,
    excerpt,
    body,
    coverImage,
    published,
    publishedAt: published ? (existing?.publishedAt ?? new Date()) : null,
    featuredOnHomeCarousel: published ? featuredOnHomeCarousel : false,
  };

  let postId = id;
  if (id) {
    await prisma.post.update({ where: { id }, data });
  } else {
    const created = await prisma.post.create({ data });
    postId = created.id;
  }

  const { syncPostGalleryFromForm } = await import("@/lib/post-gallery");
  await syncPostGalleryFromForm(postId, formData);
  const { syncPostYoutubeFromForm } = await import("@/lib/post-youtube");
  await syncPostYoutubeFromForm(postId, formData);

  revalidatePath("/noticias");
  revalidatePath(`/noticias/${slug}`);
  if (existing?.slug && existing.slug !== slug) {
    revalidatePath(`/noticias/${existing.slug}`);
  }
  revalidatePath("/");
  revalidatePath("/admin/noticias");
  revalidatePath(`/admin/noticias/${postId}`);
  await redirectWithAdminFlash(`/admin/noticias/${postId}`, id ? "updated" : "created");
}

export async function deletePost(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "").trim() || "/admin/noticias";
  if (id) {
    const post = await prisma.post.findUnique({ where: { id }, select: { slug: true } });
    await prisma.post.delete({ where: { id } });
    if (post?.slug) revalidatePath(`/noticias/${post.slug}`);
  }
  revalidatePath("/noticias");
  revalidatePath("/");
  revalidatePath("/admin/noticias");
  await redirectWithAdminFlash(returnTo, "deleted");
}

export async function upsertNotice(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "");
  const body = sanitizeAdminHtml(String(formData.get("body") ?? ""));
  const published = formCheckboxOn(formData, "published");
  const featuredOnHomeCarousel = formCheckboxOn(formData, "featuredOnHomeCarousel");
  if (featuredOnHomeCarousel && published) {
    const { assertHomeCarouselContentSlot } = await import("@/lib/home-carousel");
    await assertHomeCarouselContentSlot(id ? { noticeId: id } : undefined);
  }
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
    featuredOnHomeCarousel: published ? featuredOnHomeCarousel : false,
  };

  let noticeId = id;
  if (id) {
    await prisma.notice.update({ where: { id }, data });
    revalidatePath(`/avisos/${id}`);
  } else {
    const created = await prisma.notice.create({ data });
    noticeId = created.id;
    revalidatePath(`/avisos/${created.id}`);
  }
  revalidatePath("/avisos");
  revalidatePath("/admin/avisos");
  revalidatePath(`/admin/avisos/${noticeId}`);
  revalidatePath("/");
  await redirectWithAdminFlash(`/admin/avisos/${noticeId}`, id ? "updated" : "created");
}

export async function deleteNotice(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "").trim() || "/admin/avisos";
  if (id) await prisma.notice.delete({ where: { id } });
  revalidatePath("/avisos");
  revalidatePath("/admin/avisos");
  revalidatePath("/");
  await redirectWithAdminFlash(returnTo, "deleted");
}

export async function upsertMassLocation(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "");
  const address = String(formData.get("address") ?? "");
  const scheduleText = String(formData.get("scheduleText") ?? "");
  const sortOrder = Number(formData.get("sortOrder") ?? "0") || 0;
  const published = formCheckboxOn(formData, "published");

  const data = { name, address, scheduleText, sortOrder, published };

  let locationId = id;
  if (id) {
    await prisma.massLocation.update({ where: { id }, data });
  } else {
    const created = await prisma.massLocation.create({ data });
    locationId = created.id;
  }
  revalidatePath("/horarios");
  revalidatePath("/admin/horarios");
  revalidatePath(`/admin/horarios/${locationId}`);
  revalidatePath("/");
  await redirectWithAdminFlash(`/admin/horarios/${locationId}`, id ? "updated" : "created");
}

export async function deleteMassLocation(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "").trim() || "/admin/horarios";
  if (id) await prisma.massLocation.delete({ where: { id } });
  revalidatePath("/horarios");
  revalidatePath("/admin/horarios");
  await redirectWithAdminFlash(returnTo, "deleted");
}

export async function createPage(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "");
  const slug = String(formData.get("slug") ?? "") || slugify(title);
  const body = sanitizeAdminHtml(String(formData.get("body") ?? ""));
  const featuredImage = await imageUrlFromForm(formData, "featuredImage", "featuredImageFile");
  await prisma.page.create({ data: { title, slug, body, featuredImage } });
  revalidatePath("/sacramentos");
  revalidatePath("/admin/informacoes/paginas");
  await redirectWithAdminFlash("/admin/informacoes/paginas", "created");
}

function revalidateHomeButtons() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/informacoes");
  revalidatePath("/admin/informacoes/banner");
  revalidatePath("/admin/informacoes/atalhos");
}

export async function upsertHomeQuickLink(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const href = String(formData.get("href") ?? "").trim();
  if (!title || !href) return;
  const sortOrder = Number(formData.get("sortOrder") ?? "0") || 0;
  const published = formCheckboxOn(formData, "published");
  const external = formCheckboxOn(formData, "external");
  const existing = id
    ? await prisma.homeQuickLink.findUnique({ where: { id }, select: { imageUrl: true } })
    : null;
  const imageUrl = await resolveImageFromForm(
    formData,
    "imageUrl",
    "imageUrlFile",
    existing?.imageUrl,
  );
  const data = {
    title,
    description,
    href,
    imageUrl: imageUrl || "",
    sortOrder,
    published,
    external,
  };
  let linkId = id;
  if (id) {
    await prisma.homeQuickLink.update({ where: { id }, data });
  } else {
    const created = await prisma.homeQuickLink.create({ data });
    linkId = created.id;
  }
  revalidateHomeButtons();
  revalidatePath(`/admin/informacoes/atalhos/${linkId}`);
  await redirectWithAdminFlash(
    `/admin/informacoes/atalhos/${linkId}`,
    id ? "updated" : "created",
  );
}

export async function deleteHomeQuickLink(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "").trim() || "/admin/informacoes/atalhos";
  if (id) await prisma.homeQuickLink.delete({ where: { id } });
  revalidateHomeButtons();
  await redirectWithAdminFlash(returnTo, "deleted");
}

export async function upsertHomeHeroCta(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const href = String(formData.get("href") ?? "").trim();
  if (!label || !href) return;
  const sortOrder = Number(formData.get("sortOrder") ?? "0") || 0;
  const rawVariant = String(formData.get("variant") ?? "primary");
  const variant = rawVariant === "secondary" ? "secondary" : "primary";
  const data = { label, href, variant, sortOrder };
  let ctaId = id;
  if (id) {
    await prisma.homeHeroCta.update({ where: { id }, data });
  } else {
    const created = await prisma.homeHeroCta.create({ data });
    ctaId = created.id;
  }
  revalidateHomeButtons();
  revalidatePath(`/admin/informacoes/banner/${ctaId}`);
  await redirectWithAdminFlash(
    `/admin/informacoes/banner/${ctaId}`,
    id ? "updated" : "created",
  );
}

export async function deleteHomeHeroCta(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "").trim() || "/admin/informacoes/banner";
  if (id) await prisma.homeHeroCta.delete({ where: { id } });
  revalidateHomeButtons();
  await redirectWithAdminFlash(returnTo, "deleted");
}

export async function updatePage(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "");
  const slug = String(formData.get("slug") ?? "") || slugify(title);
  const body = sanitizeAdminHtml(String(formData.get("body") ?? ""));
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
  revalidatePath("/admin/informacoes/paginas");
  revalidatePath(`/admin/informacoes/paginas/${id}`);
  revalidatePath("/admin/terco-online/conteudo");
  const returnTo = String(formData.get("returnTo") ?? "").trim();
  await redirectWithAdminFlash(
    returnTo || `/admin/informacoes/paginas/${id}`,
    "updated",
  );
}

export async function deletePage(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.page.delete({ where: { id } });
  revalidatePath("/sacramentos");
  revalidatePath("/admin/informacoes/paginas");
  const returnTo = String(formData.get("returnTo") ?? "").trim();
  await redirectWithAdminFlash(returnTo || "/admin/informacoes/paginas", "deleted");
}

function normalizeOptionalEmail(raw: FormDataEntryValue | null): string | null {
  const v = String(raw ?? "").trim();
  if (!v) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
    throw new Error("Informe um e-mail válido para receber as velas.");
  }
  return v;
}

function redirectCandleSettingsError(message: string): never {
  redirect(`/admin/velas?erro=${encodeURIComponent(message)}`);
}

export async function updateCandleSettings(formData: FormData) {
  await requireAdmin();
  try {
    const amount = Number(String(formData.get("candleDurationAmount") ?? "").trim());
    const unit = String(formData.get("candleDurationUnit") ?? "hours");
    let candlesNotifyEmail: string | null;
    try {
      candlesNotifyEmail = normalizeOptionalEmail(formData.get("candlesNotifyEmail"));
    } catch (e) {
      redirectCandleSettingsError(
        e instanceof Error ? e.message : "E-mail de notificação inválido.",
      );
    }
    const accessMode = String(formData.get("candleAccessMode") ?? "paid");
    const priceRaw = String(formData.get("candlePriceBrl") ?? "").trim().replace(",", ".");
    const priceBrl = priceRaw ? Number(priceRaw) : NaN;
    const candlePaymentPix = formData.get("candlePaymentPix") === "on";
    const candlePaymentSicredi = formData.get("candlePaymentSicredi") === "on";
    if (!Number.isFinite(amount) || amount <= 0) {
      redirectCandleSettingsError("Informe um tempo válido para a vela.");
    }
    if (unit !== "hours" && unit !== "days") {
      redirectCandleSettingsError("Unidade inválida.");
    }
    if (accessMode !== "free" && accessMode !== "free_donation" && accessMode !== "paid") {
      redirectCandleSettingsError("Modo de vela inválido.");
    }
    let candlePriceCents = Math.round(priceBrl * 100);
    if (accessMode === "paid") {
      if (!Number.isFinite(priceBrl) || priceBrl <= 0) {
        redirectCandleSettingsError("Informe o valor da vela paga (em reais).");
      }
      candlePriceCents = Math.round(priceBrl * 100);
    } else if (!Number.isFinite(priceBrl) || priceBrl <= 0) {
      const existing = await prisma.siteSettings.findUnique({ where: { id: 1 } });
      candlePriceCents = existing?.candlePriceCents ?? 1000;
    }
    if (accessMode === "paid" && !candlePaymentPix && !candlePaymentSicredi) {
      redirectCandleSettingsError("Velas pagas precisam de ao menos um meio: PIX ou cartão.");
    }
    if (accessMode === "free_donation" && !candlePaymentPix && !candlePaymentSicredi) {
      redirectCandleSettingsError(
        "Com oferta opcional, marque PIX e/ou cartão para quem quiser contribuir.",
      );
    }

    const candleData = {
      candleDurationAmount: Math.round(amount),
      candleDurationUnit: unit,
      candlesNotifyEmail,
      candleAccessMode: accessMode,
      candlePriceCents,
      candlePaymentPix,
      candlePaymentSicredi,
    };

    await prisma.siteSettings.upsert({
      where: { id: 1 },
      update: candleData,
      create: {
        id: 1,
        parishName: "Paróquia Nossa Senhora Rainha da Paz",
        diocese: "Diocese de Santo Amaro",
        address: "São Paulo — SP",
        phone: "",
        heroTitle: "Unidos pela fé, guiados por Maria.",
        heroSubtitle: "Uma comunidade que acolhe e vive o amor de Cristo.",
        aboutHtml: "",
        massScheduleHtml: "",
        ...candleData,
      },
    });
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    const msg = e instanceof Error ? e.message : "Não foi possível salvar as configurações.";
    redirectCandleSettingsError(msg);
  }
  revalidatePath("/velas");
  revalidatePath("/");
  revalidatePath("/admin/velas");
  await redirectWithAdminFlash("/admin/velas", "updated");
}

export async function deleteCandle(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Vela inválida.");
  const candle = await prisma.virtualCandle.findUnique({ where: { id } });
  if (!candle) {
    await redirectWithAdminFlash("/admin/velas", "deleted");
    return;
  }
  const hasPayment =
    candle.status === "PAID" ||
    candle.status === "PENDING" ||
    candle.amountCents > 0;
  if (hasPayment && formData.get("dangerConfirm") !== "EXCLUIR") {
    throw new Error(
      "Esta vela tem registro de pagamento ou pedido. Confirme a exclusão digitando EXCLUIR.",
    );
  }
  await prisma.virtualCandle.delete({ where: { id } });
  revalidatePath("/velas");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/velas");
  await redirectWithAdminFlash("/admin/velas", "deleted");
}

export async function confirmCandlePixPayment(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Vela inválida.");
  const { activateCandle } = await import("@/lib/candles");
  await activateCandle(id);
  revalidatePath("/velas");
  revalidatePath("/");
  revalidatePath("/admin/velas");
  await redirectWithAdminFlash("/admin/velas", "updated");
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

function redirectAdminUsersError(message: string): never {
  redirect(`/admin/usuarios?error=${encodeURIComponent(message)}`);
}

export async function createAdminUser(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

  const nameErr = validateAdminName(name);
  if (nameErr) redirectAdminUsersError(nameErr);
  const emailErr = validateAdminEmail(email);
  if (emailErr) redirectAdminUsersError(emailErr);
  const passErr = validateNewAdminPassword(password, passwordConfirm);
  if (passErr) redirectAdminUsersError(passErr);

  const normalizedEmail = normalizeAdminEmail(email);
  const existing = await findAdminByEmail(prisma, normalizedEmail);
  if (existing) redirectAdminUsersError("Já existe um administrador com este e-mail.");

  try {
    const passwordHash = await hashAdminPassword(password);
    await prisma.admin.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
      },
    });
  } catch (e) {
    const code = e && typeof e === "object" && "code" in e ? String((e as { code: string }).code) : "";
    if (code === "P2002") {
      redirectAdminUsersError("Já existe um administrador com este e-mail.");
    }
    console.error("[createAdminUser]", e);
    redirectAdminUsersError("Não foi possível criar o administrador. Tente novamente.");
  }

  revalidatePath("/admin/usuarios");
  await redirectWithAdminFlash("/admin/usuarios", "created");
}

export async function deleteAdminUser(formData: FormData) {
  const current = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  if (id === current.id) {
    redirectAdminUsersError("Você não pode excluir o próprio usuário.");
  }

  const total = await prisma.admin.count();
  if (total <= 1) {
    redirectAdminUsersError("Não é possível excluir o único administrador do sistema.");
  }

  const target = await prisma.admin.findUnique({ where: { id } });
  if (!target) return;

  await prisma.admin.delete({ where: { id } });
  revalidatePath("/admin/usuarios");
  await redirectWithAdminFlash("/admin/usuarios", "deleted");
}

/** Copia o banco atual para /data/backups. Não altera o site. */
export async function backupProductionDatabase() {
  await requireAdmin();
  try {
    const { runDatabaseBackup } = await import("@/lib/db-backup");
    await runDatabaseBackup(prisma);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Falha ao gravar o backup.";
    redirect(`/admin?erro=${encodeURIComponent(message)}`);
  }
  revalidatePath("/admin");
  await redirectWithAdminFlash("/admin", "backed");
}

/**
 * Única forma de trazer a cópia do Git: o admin clica, e só com o banco vazio.
 * O boot não chama isto.
 */
export async function importGitSnapshotIfEmpty() {
  await requireAdmin();
  const { databaseLooksEmpty } = await import("@/lib/prod-content-policy");
  if (!(await databaseLooksEmpty(prisma))) {
    redirect(
      `/admin?erro=${encodeURIComponent(
        "O banco já tem páginas, notícias ou rifas. A cópia do Git não foi aplicada.",
      )}`,
    );
  }

  const { importSiteBundle } = await import("@/lib/import-site-bundle");
  await importSiteBundle(prisma);

  try {
    const { runDatabaseBackup } = await import("@/lib/db-backup");
    await runDatabaseBackup(prisma);
  } catch (e) {
    console.error("[admin] backup depois da cópia do Git falhou", e);
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin");
  await redirectWithAdminFlash("/admin", "restored");
}

/** Repõe o SQLite a partir do último backup de produção (/data/backups). */
export async function restoreFromProductionBackup() {
  await requireAdmin();
  const { restoreDatabaseFromLatestBackup, sqlitePathFromDatabaseUrl, hasUsableProductionBackup } =
    await import("@/lib/db-restore-from-backup");
  const { allowProdBackupRestore } = await import("@/lib/prod-content-policy");

  const dbPath = sqlitePathFromDatabaseUrl();
  if (!dbPath || !hasUsableProductionBackup(dbPath)) {
    redirect(
      `/admin?erro=${encodeURIComponent(
        "Nenhum backup de produção em /data/backups. Aguarde o backup diário ou chame POST /api/setup/backup.",
      )}`,
    );
  }

  if (!(await allowProdBackupRestore(prisma))) {
    redirect(
      `/admin?erro=${encodeURIComponent(
        "Restauração bloqueada: o banco já tem conteúdo. Para sobrescrever, defina ALLOW_FORCE_PROD_BACKUP_RESTORE=true no Railway.",
      )}`,
    );
  }

  const restoredFrom = restoreDatabaseFromLatestBackup(dbPath);
  if (!restoredFrom) {
    redirect(`/admin?erro=${encodeURIComponent("Falha ao copiar o arquivo de backup.")}`);
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin");
  await redirectWithAdminFlash("/admin", "restored");
}
