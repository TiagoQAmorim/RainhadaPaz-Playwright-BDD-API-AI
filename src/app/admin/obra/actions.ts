"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { redirectWithAdminFlash } from "@/lib/admin-flash";
import { formCheckboxOn } from "@/lib/datetime-local";
import { prisma } from "@/lib/prisma";
import { setObraHeroCtaVisible } from "@/lib/home-hero-ctas";
import { clampProgress, getParishWork } from "@/lib/parish-work";
import { imageUrlFromForm, resolveImageFromForm } from "@/lib/uploads";

function fail(message: string): never {
  redirect(`/admin/obra?erro=${encodeURIComponent(message)}`);
}

function clip(value: FormDataEntryValue | null, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

async function nextSort(kind: "comparison" | "moment" | "photo", raw: string) {
  const typed = Number(raw);
  if (Number.isFinite(typed) && raw.trim() !== "") return Math.round(typed);
  const rows =
    kind === "comparison"
      ? await prisma.workComparison.aggregate({ _max: { sortOrder: true } })
      : kind === "moment"
        ? await prisma.workMoment.aggregate({ _max: { sortOrder: true } })
        : await prisma.workPhoto.aggregate({ _max: { sortOrder: true } });
  return (rows._max.sortOrder ?? 0) + 1;
}

function sortOrKeep(raw: string, current: number) {
  const typed = Number(raw);
  if (Number.isFinite(typed) && raw.trim() !== "") return Math.round(typed);
  return current;
}

function momentStatus(raw: FormDataEntryValue | null) {
  const status = String(raw ?? "doing");
  return status === "planned" || status === "done" ? status : "doing";
}

function uploadErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (/Arquivo|Tipo|JPEG|PNG|WebP|grande/i.test(message)) return message;
  return "Não foi possível salvar a foto. Use JPEG, PNG ou WebP de até 8 MB.";
}

export async function updateWorkProject(formData: FormData) {
  await requireAdmin();
  await getParishWork();
  const title = clip(formData.get("title"), 120);
  if (!title) fail("Escreva o título da página.");
  const progress = clampProgress(Number(formData.get("progressPercent")));
  const showHeroCta = formCheckboxOn(formData, "showHeroCta");
  await prisma.workProject.update({
    where: { id: 1 },
    data: {
      title,
      intro: clip(formData.get("intro"), 2000),
      progressPercent: progress,
      progressLabel: clip(formData.get("progressLabel"), 80),
      published: formCheckboxOn(formData, "published"),
      showHeroCta,
    },
  });
  await setObraHeroCtaVisible(showHeroCta);
  revalidatePath("/obra");
  revalidatePath("/");
  await redirectWithAdminFlash("/admin/obra", "updated");
}

export async function createWorkComparison(formData: FormData) {
  await requireAdmin();
  const title = clip(formData.get("title"), 120);
  if (!title) fail("Dê um nome ao comparativo. Ex.: Fachada, Salão, Telhado.");
  let beforeUrl: string | null = null;
  let afterUrl: string | null = null;
  try {
    beforeUrl = await imageUrlFromForm(formData, "beforeUrl", "beforeFile");
    afterUrl = await imageUrlFromForm(formData, "afterUrl", "afterFile");
  } catch (error) {
    fail(uploadErrorMessage(error));
  }
  if (!beforeUrl || !afterUrl) fail("Envie a foto do antes e a foto do depois.");
  await prisma.workComparison.create({
    data: {
      title,
      beforeUrl,
      afterUrl,
      caption: clip(formData.get("caption"), 300),
      sortOrder: await nextSort("comparison", String(formData.get("sortOrder") ?? "")),
    },
  });
  revalidatePath("/obra");
  await redirectWithAdminFlash("/admin/obra", "created");
}

export async function deleteWorkComparison(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.workComparison.delete({ where: { id } }).catch(() => null);
  revalidatePath("/obra");
  await redirectWithAdminFlash("/admin/obra", "deleted");
}

export async function updateWorkComparison(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const current = id ? await prisma.workComparison.findUnique({ where: { id } }) : null;
  if (!current) fail("Comparativo não encontrado.");
  const title = clip(formData.get("title"), 120);
  if (!title) fail("Dê um nome ao comparativo. Ex.: Fachada, Salão, Telhado.");
  let beforeUrl: string | null = null;
  let afterUrl: string | null = null;
  try {
    beforeUrl = await resolveImageFromForm(formData, "beforeUrl", "beforeFile", current.beforeUrl);
    afterUrl = await resolveImageFromForm(formData, "afterUrl", "afterFile", current.afterUrl);
  } catch (error) {
    fail(uploadErrorMessage(error));
  }
  if (!beforeUrl || !afterUrl) fail("Mantenha ou envie a foto do antes e a foto do depois.");
  await prisma.workComparison.update({
    where: { id: current.id },
    data: {
      title,
      beforeUrl,
      afterUrl,
      caption: clip(formData.get("caption"), 300),
      sortOrder: sortOrKeep(String(formData.get("sortOrder") ?? ""), current.sortOrder),
    },
  });
  revalidatePath("/obra");
  await redirectWithAdminFlash("/admin/obra", "updated");
}

export async function createWorkMoment(formData: FormData) {
  await requireAdmin();
  const title = clip(formData.get("title"), 120);
  if (!title) fail("Escreva o nome da etapa.");
  const safeStatus = momentStatus(formData.get("status"));
  let imageUrl: string | null = null;
  try {
    imageUrl = await imageUrlFromForm(formData, "imageUrl", "imageFile");
  } catch (error) {
    fail(uploadErrorMessage(error));
  }
  await prisma.workMoment.create({
    data: {
      title,
      body: clip(formData.get("body"), 2000),
      happenedOn: clip(formData.get("happenedOn"), 40),
      status: safeStatus,
      imageUrl,
      sortOrder: await nextSort("moment", String(formData.get("sortOrder") ?? "")),
    },
  });
  revalidatePath("/obra");
  await redirectWithAdminFlash("/admin/obra", "created");
}

export async function deleteWorkMoment(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.workMoment.delete({ where: { id } }).catch(() => null);
  revalidatePath("/obra");
  await redirectWithAdminFlash("/admin/obra", "deleted");
}

export async function updateWorkMoment(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const current = id ? await prisma.workMoment.findUnique({ where: { id } }) : null;
  if (!current) fail("Etapa não encontrada.");
  const title = clip(formData.get("title"), 120);
  if (!title) fail("Escreva o nome da etapa.");
  let imageUrl: string | null = current.imageUrl;
  try {
    imageUrl = await resolveImageFromForm(formData, "imageUrl", "imageFile", current.imageUrl);
  } catch (error) {
    fail(uploadErrorMessage(error));
  }
  await prisma.workMoment.update({
    where: { id: current.id },
    data: {
      title,
      body: clip(formData.get("body"), 2000),
      happenedOn: clip(formData.get("happenedOn"), 40),
      status: momentStatus(formData.get("status")),
      imageUrl,
      sortOrder: sortOrKeep(String(formData.get("sortOrder") ?? ""), current.sortOrder),
    },
  });
  revalidatePath("/obra");
  await redirectWithAdminFlash("/admin/obra", "updated");
}

export async function createWorkPhoto(formData: FormData) {
  await requireAdmin();
  let imageUrl: string | null = null;
  try {
    imageUrl = await imageUrlFromForm(formData, "imageUrl", "imageFile");
  } catch (error) {
    fail(uploadErrorMessage(error));
  }
  if (!imageUrl) fail("Envie a foto da obra.");
  await prisma.workPhoto.create({
    data: {
      imageUrl,
      caption: clip(formData.get("caption"), 300),
      sortOrder: await nextSort("photo", String(formData.get("sortOrder") ?? "")),
    },
  });
  revalidatePath("/obra");
  await redirectWithAdminFlash("/admin/obra", "created");
}

export async function deleteWorkPhoto(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.workPhoto.delete({ where: { id } }).catch(() => null);
  revalidatePath("/obra");
  await redirectWithAdminFlash("/admin/obra", "deleted");
}

export async function updateWorkPhoto(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const current = id ? await prisma.workPhoto.findUnique({ where: { id } }) : null;
  if (!current) fail("Foto não encontrada.");
  let imageUrl: string | null = null;
  try {
    imageUrl = await resolveImageFromForm(formData, "imageUrl", "imageFile", current.imageUrl);
  } catch (error) {
    fail(uploadErrorMessage(error));
  }
  if (!imageUrl) fail("Mantenha ou envie a foto da obra.");
  await prisma.workPhoto.update({
    where: { id: current.id },
    data: {
      imageUrl,
      caption: clip(formData.get("caption"), 300),
      sortOrder: sortOrKeep(String(formData.get("sortOrder") ?? ""), current.sortOrder),
    },
  });
  revalidatePath("/obra");
  await redirectWithAdminFlash("/admin/obra", "updated");
}
