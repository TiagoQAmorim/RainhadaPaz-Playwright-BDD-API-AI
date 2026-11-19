import { RAFFLE_PRIZE_PHOTO_SLOTS } from "@/lib/raffle-rules";
import { isLocalSiteImageUrl } from "@/lib/local-image-url";
import { resolveImageFromForm } from "@/lib/uploads";

export function prizePhotoList(
  prizeImageUrls: string | null | undefined,
  prizeImageUrl: string | null | undefined,
): string[] {
  if (prizeImageUrls) {
    try {
      const parsed: unknown = JSON.parse(prizeImageUrls);
      if (Array.isArray(parsed)) {
        const urls = parsed.filter((url): url is string => typeof url === "string" && isLocalSiteImageUrl(url));
        if (urls.length > 0) return urls.slice(0, RAFFLE_PRIZE_PHOTO_SLOTS);
      }
    } catch {
      // Campo antigo ou inválido: usa a foto única.
    }
  }
  if (prizeImageUrl && isLocalSiteImageUrl(prizeImageUrl)) return [prizeImageUrl];
  return [];
}

export function serializePrizePhotos(urls: string[]): string | null {
  const clean = urls.filter((url) => isLocalSiteImageUrl(url)).slice(0, RAFFLE_PRIZE_PHOTO_SLOTS);
  return clean.length > 0 ? JSON.stringify(clean) : null;
}

/** Lê as fotos enviadas no formulário (arquivo novo ou caminho já salvo). */
export async function collectPrizePhotosFromForm(formData: FormData): Promise<string[]> {
  const rawCount = Number(formData.get("prizePhotoCount") ?? 0);
  const slotCount = Math.min(
    RAFFLE_PRIZE_PHOTO_SLOTS,
    Math.max(0, Number.isFinite(rawCount) ? Math.floor(rawCount) : 0),
  );
  const urls: string[] = [];
  for (let i = 0; i < slotCount; i++) {
    const url = await resolveImageFromForm(formData, `prizePhoto_${i}`, `prizePhotoFile_${i}`, null);
    if (url && isLocalSiteImageUrl(url) && !urls.includes(url)) urls.push(url);
  }
  return urls;
}
