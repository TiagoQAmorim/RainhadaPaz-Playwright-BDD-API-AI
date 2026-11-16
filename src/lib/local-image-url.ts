import { PARISH_LOGO_PATH } from "@/lib/parish-brand";

/** Caminhos servidos pelo próprio site (`/uploads`, `/images`, etc.). */
export function isLocalSiteImageUrl(url: string): boolean {
  const v = url.trim();
  if (!v) return false;
  if (v.startsWith("//")) return false;
  if (v.startsWith("/")) return true;
  if (v.startsWith("http://") || v.startsWith("https://")) return false;
  return false;
}

const PARISH_WP_HOST = /paroquiarainhadapaz\.com\.br/i;

export function isParishWordPressImageUrl(url: string): boolean {
  return PARISH_WP_HOST.test(url) && /\/wp-content\/uploads\//i.test(url);
}

/** Ao gravar no admin: só caminho local ou upload; URLs externas são ignoradas. */
export function coerceStoredImageUrl(
  value: string | null | undefined,
  existingUrl?: string | null,
): string | null {
  const v = String(value ?? "").trim();
  if (v && isLocalSiteImageUrl(v)) return v;
  if (existingUrl && isLocalSiteImageUrl(existingUrl)) return existingUrl;
  return null;
}

/** Fallback quando não há imagem configurada. */
export const IMAGE_PLACEHOLDER = PARISH_LOGO_PATH;

/** Capa RSS Vatican News (URL remota permitida no Next/Image). */
export function resolveVaticanNewsImageSrc(imageUrl: string | null | undefined): string | null {
  const v = String(imageUrl ?? "").trim();
  if (!v) return null;
  if (isLocalSiteImageUrl(v)) return v;
  try {
    const host = new URL(v).hostname.toLowerCase();
    if (host === "vaticannews.va" || host.endsWith(".vaticannews.va")) return v;
  } catch {
    return null;
  }
  return null;
}

export function resolveImageSrc(
  url: string | null | undefined,
  fallback: string = IMAGE_PLACEHOLDER,
): string {
  const v = String(url ?? "").trim();
  if (v && isLocalSiteImageUrl(v)) return v;
  if (v && !isLocalSiteImageUrl(v)) return fallback;
  return fallback;
}