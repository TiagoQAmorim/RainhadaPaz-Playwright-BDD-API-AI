import { POST_GALLERY_SLOTS } from "@/lib/post-media-limits";
import { resolveImageFromForm } from "@/lib/uploads";
import { prisma } from "@/lib/prisma";

export { POST_GALLERY_SLOTS };

export async function syncPostGalleryFromForm(postId: string, formData: FormData) {
  const existing = await prisma.postGalleryImage.findMany({
    where: { postId },
    orderBy: { sortOrder: "asc" },
  });
  const byId = new Map(existing.map((e) => [e.id, e]));

  const rawCount = Number(formData.get("gallerySlotCount") ?? POST_GALLERY_SLOTS);
  const slotCount = Math.min(
    POST_GALLERY_SLOTS,
    Math.max(0, Number.isFinite(rawCount) ? rawCount : POST_GALLERY_SLOTS),
  );

  const rows: { imageUrl: string; caption: string | null; sortOrder: number }[] = [];

  for (let i = 0; i < slotCount; i++) {
    const caption = String(formData.get(`galleryCaption_${i}`) ?? "").trim() || null;
    const id = String(formData.get(`galleryId_${i}`) ?? "").trim();
    const prev = id ? byId.get(id) : undefined;

    const url = await resolveImageFromForm(
      formData,
      `galleryImage_${i}`,
      `galleryImageFile_${i}`,
      prev?.imageUrl ?? null,
    );
    if (!url) continue;
    rows.push({ imageUrl: url, caption, sortOrder: rows.length });
  }

  await prisma.postGalleryImage.deleteMany({ where: { postId } });
  if (rows.length > 0) {
    await prisma.postGalleryImage.createMany({
      data: rows.map((r) => ({ postId, ...r })),
    });
  }
}