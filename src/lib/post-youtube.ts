import { POST_YOUTUBE_SLOTS } from "@/lib/post-media-limits";
import { parseYoutubeVideoId } from "@/lib/youtube";
import { prisma } from "@/lib/prisma";

export { POST_YOUTUBE_SLOTS };

export async function syncPostYoutubeFromForm(postId: string, formData: FormData) {
  const rawCount = Number(formData.get("youtubeSlotCount") ?? POST_YOUTUBE_SLOTS);
  const slotCount = Math.min(
    POST_YOUTUBE_SLOTS,
    Math.max(0, Number.isFinite(rawCount) ? rawCount : POST_YOUTUBE_SLOTS),
  );

  const rows: { youtubeVideoId: string; title: string | null; sortOrder: number }[] = [];

  for (let i = 0; i < slotCount; i++) {
    const title = String(formData.get(`youtubeTitle_${i}`) ?? "").trim() || null;
    const urlInput = String(formData.get(`youtubeUrl_${i}`) ?? "").trim();
    const videoId = parseYoutubeVideoId(urlInput);
    if (!videoId) continue;
    rows.push({ youtubeVideoId: videoId, title, sortOrder: rows.length });
  }

  await prisma.postYoutubeVideo.deleteMany({ where: { postId } });
  if (rows.length > 0) {
    await prisma.postYoutubeVideo.createMany({
      data: rows.map((r) => ({ postId, ...r })),
    });
  }
}