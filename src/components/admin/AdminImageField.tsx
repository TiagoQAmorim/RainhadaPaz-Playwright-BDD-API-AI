"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { adminInput } from "@/components/admin/AdminFormStyles";
import { isLocalSiteImageUrl } from "@/lib/local-image-url";

const MAX_EDGE = 1920;

async function fileReadyToUpload(file: File): Promise<{ file: File } | { error: string }> {
  const type = file.type.toLowerCase();
  if (type === "image/heic" || type === "image/heif" || /\.hei[cf]$/i.test(file.name)) {
    return {
      error: "Fotos HEIC do celular não são aceitas. Salve como JPEG e envie de novo.",
    };
  }
  if (type === "image/gif") {
    if (file.size > 8 * 1024 * 1024) return { error: "O GIF passou de 8 MB." };
    return { file };
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    if (file.size > 5 * 1024 * 1024) {
      return { error: "A foto é grande demais. Envie um JPEG ou PNG de até 5 MB." };
    }
    if (type === "image/jpeg" || type === "image/jpg" || type === "image/png" || type === "image/webp" || type === "") {
      return { file };
    }
    return { error: "Use JPEG, PNG ou WebP." };
  }

  const edge = Math.max(bitmap.width, bitmap.height);
  if (edge <= MAX_EDGE && file.size <= 4_500_000) {
    bitmap.close();
    return { file };
  }

  const scale = Math.min(1, MAX_EDGE / edge);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return { file };
  }
  const mime = type === "image/png" ? "image/png" : type === "image/webp" ? "image/webp" : "image/jpeg";
  if (mime === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  let outMime = mime;
  let blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mime, mime === "image/png" ? undefined : 0.85);
  });
  if (!blob || blob.size > 4_500_000) {
    outMime = "image/jpeg";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.8);
    });
  }
  bitmap.close();
  if (!blob) return { file };
  const ext = outMime === "image/png" ? "png" : outMime === "image/webp" ? "webp" : "jpg";
  const name = file.name.replace(/\.[^.]+$/, "") || "foto";
  return { file: new File([blob], `${name}.${ext}`, { type: outMime }) };
}

type Props = {
  label: string;
  /** Campo oculto com o caminho atual (mantido se não enviar novo arquivo). */
  name: string;
  /** Nome do input file enviado ao servidor. */
  fileFieldName: string;
  defaultValue?: string | null;
};

export function AdminImageField({
  label,
  name,
  fileFieldName,
  defaultValue,
}: Props) {
  const initial =
    defaultValue && isLocalSiteImageUrl(defaultValue) ? defaultValue : "";
  const [preview, setPreview] = useState<string | null>(initial || null);
  const [cleared, setCleared] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const preparing = useRef(false);

  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input type="hidden" name={name} value={cleared ? "" : initial} readOnly />
      {preview ? (
        <div className="relative mb-3 h-36 w-full max-w-sm overflow-hidden rounded-xl border border-parish-200 bg-parish-50">
          <Image
            src={preview}
            alt=""
            fill
            className="object-contain p-2"
            sizes="384px"
            unoptimized={preview.startsWith("blob:") || preview.startsWith("/uploads/")}
          />
        </div>
      ) : (
        <p className="mb-2 text-xs text-parish-500">Nenhuma imagem enviada ainda.</p>
      )}
      <input
        type="file"
        name={fileFieldName}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className={adminInput}
        onChange={(e) => {
          const input = e.target;
          const picked = input.files?.[0];
          if (!picked || preparing.current) return;
          void (async () => {
            const prepared = await fileReadyToUpload(picked);
            if ("error" in prepared) {
              input.value = "";
              setError(prepared.error);
              return;
            }
            setError(null);
            if (prepared.file !== picked) {
              preparing.current = true;
              const data = new DataTransfer();
              data.items.add(prepared.file);
              input.files = data.files;
              preparing.current = false;
            }
            setPreview(URL.createObjectURL(prepared.file));
          })();
        }}
      />
      {error ? <p className="mt-2 text-xs font-medium text-red-700">{error}</p> : null}
      {preview && !preview.startsWith("blob:") ? (
        <button
          type="button"
          className="mt-2 text-xs font-semibold text-red-700 hover:underline"
          onClick={() => {
            setCleared(true);
            setPreview(null);
          }}
        >
          Remover imagem atual
        </button>
      ) : null}
      <p className="mt-1 text-xs text-parish-500">
        JPEG, PNG, WebP ou GIF. Fotos grandes são reduzidas antes de salvar.
      </p>
    </div>
  );
}