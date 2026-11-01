import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_BYTES = 5 * 1024 * 1024;

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
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Arquivo muito grande. Máximo 5 MB.");
  }

  const ext = extensionForMime(file.type);
  const filename = `${Date.now()}-${randomBytes(8).toString("hex")}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });

  const bytes = Buffer.from(await file.arrayBuffer());
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
  return value || null;
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
  if (value) return value;
  return existingUrl ?? null;
}
