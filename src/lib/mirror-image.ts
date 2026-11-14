import { createHash } from "crypto";
import { access, mkdir, writeFile } from "fs/promises";
import path from "path";
import { isLocalSiteImageUrl, isParishWordPressImageUrl } from "@/lib/local-image-url";

const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function extensionFromUrl(url: string, contentType?: string | null): string {
  try {
    const ext = path.extname(new URL(url).pathname).toLowerCase();
    if (ext && ALLOWED_EXT.has(ext)) return ext === ".jpeg" ? ".jpg" : ext;
  } catch {
    /* ignore */
  }
  if (contentType?.includes("png")) return ".png";
  if (contentType?.includes("webp")) return ".webp";
  if (contentType?.includes("gif")) return ".gif";
  return ".jpg";
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Baixa imagem do site antigo (ou outra URL) para `public/uploads/migrated/`
 * e devolve o caminho público (`/uploads/migrated/...`).
 */
export async function mirrorRemoteImageToUploads(remoteUrl: string): Promise<string | null> {
  const trimmed = remoteUrl.trim();
  if (!trimmed) return null;
  if (isLocalSiteImageUrl(trimmed)) return trimmed;

  const hash = createHash("sha256").update(trimmed).digest("hex").slice(0, 20);
  const dir = path.join(process.cwd(), "public", "uploads", "migrated");
  await mkdir(dir, { recursive: true });

  const existing = await Promise.all(
    [".jpg", ".png", ".webp", ".gif"].map(async (ext) => {
      const file = path.join(dir, `${hash}${ext}`);
      if (await fileExists(file)) return `/uploads/migrated/${hash}${ext}`;
      return null;
    }),
  );
  const hit = existing.find(Boolean);
  if (hit) return hit;

  try {
    const res = await fetch(trimmed, { redirect: "follow" });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type");
    const ext = extensionFromUrl(trimmed, contentType);
    const filename = `${hash}${ext}`;
    const bytes = Buffer.from(await res.arrayBuffer());
    await writeFile(path.join(dir, filename), bytes);
    return `/uploads/migrated/${filename}`;
  } catch {
    return null;
  }
}

const PARISH_WP_URL_RE =
  /https?:\/\/[^"'\s>]*paroquiarainhadapaz\.com\.br\/wp-content\/uploads\/[^"'\s>)]+/gi;

/** Substitui URLs do WordPress antigo no HTML por caminhos locais (download). */
export async function localizeParishImagesInHtml(html: string): Promise<string> {
  const urls = new Set<string>();
  for (const match of html.matchAll(PARISH_WP_URL_RE)) {
    const url = match[0].replace(/&amp;/g, "&");
    if (isParishWordPressImageUrl(url)) urls.add(url);
  }

  let out = html;
  for (const url of urls) {
    const local = await mirrorRemoteImageToUploads(url);
    if (!local) continue;
    const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(escaped, "g"), local);
    const ampEscaped = url.replace(/&/g, "&amp;").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(ampEscaped, "g"), local);
  }
  return out;
}

export async function localizeImageField(value: string | null | undefined): Promise<string | null> {
  const v = String(value ?? "").trim();
  if (!v) return null;
  if (isLocalSiteImageUrl(v)) return v;
  if (v.startsWith("http://") || v.startsWith("https://")) {
    return (await mirrorRemoteImageToUploads(v)) ?? null;
  }
  return null;
}