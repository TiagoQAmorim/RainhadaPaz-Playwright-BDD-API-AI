"use client";

import Image from "next/image";
import { useState } from "react";
import { adminInput } from "@/components/admin/AdminFormStyles";
import { isLocalSiteImageUrl } from "@/lib/local-image-url";

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
          const f = e.target.files?.[0];
          if (f) {
            setCleared(true);
            setPreview(URL.createObjectURL(f));
          }
        }}
      />
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
        Envie um arquivo (JPEG, PNG, WebP ou GIF, até 5 MB). As imagens ficam em{" "}
        <code className="text-[11px]">/public/uploads</code> neste servidor.
      </p>
    </div>
  );
}