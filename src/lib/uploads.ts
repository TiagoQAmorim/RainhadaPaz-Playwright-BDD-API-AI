import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { coerceStoredImageUrl } from "@/lib/local-image-url";
import { imageMimeFromBytes } from "@/lib/image-mime";
import { persistentUploadRoot } from "@/lib/upload-storage";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_BYTES = 8 * 1024 * 1024;

function extensionForMime(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    default:
      return ".bin";
  }
}

export async function saveAdminImageUpload(file: File): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new Error("Arquivo muito grande. Máximo 8 MB.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const declared = file.type === "image/jpg" ? "image/jpeg" : file.type;
  const mime = imageMimeFromBytes(bytes) ?? declared;
  if (!ALLOWED_TYPES.has(mime)) {
    throw new Error("Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF.");
  }

  const ext = extensionForMime(mime);
  const filename = `${Date.now()}-${randomBytes(8).toString("hex")}${ext}`;
  const dir = persistentUploadRoot();
  await mkdir(dir, { recursive: true });

  await writeFile(path.join(dir, filename), bytes);

  return `/uploads/${filename}`;
}

export async function imageUrlFromForm(
  formData: FormData,
  urlField: string,
  fileField: string,
): Promise<string | null> {
  const file = formData.get(fileField);
  if (file instanceof File && file.size > 0) {
    return saveAdminImageUpload(file);
  }
  const value = String(formData.get(urlField) ?? "").trim();
  return coerceStoredImageUrl(value) ?? null;
}

/** Upload, URL do formulário ou mantém a imagem já salva. */
export async function resolveImageFromForm(
  formData: FormData,
  urlField: string,
  fileField: string,
  existingUrl?: string | null,
): Promise<string | null> {
  const file = formData.get(fileField);
  if (file instanceof File && file.size > 0) {
    return saveAdminImageUpload(file);
  }
  const value = String(formData.get(urlField) ?? "").trim();
  return coerceStoredImageUrl(value, existingUrl);
}
