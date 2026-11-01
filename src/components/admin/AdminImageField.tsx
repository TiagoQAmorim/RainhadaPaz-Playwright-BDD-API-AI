"use client";

import Image from "next/image";
import { useState } from "react";
import { adminInput } from "@/components/admin/AdminFormStyles";

type Props = {
  label: string;
  /** Campo oculto com a URL atual (mantida se não enviar novo arquivo). */
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
  const [preview, setPreview] = useState<string | null>(defaultValue ?? null);

  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input
        type="text"
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder="URL ou caminho (ex.: /uploads/… ou https://…)"
        className={adminInput}
        autoComplete="off"
      />
      {preview ? (
        <div className="relative mb-3 h-36 w-full max-w-sm overflow-hidden rounded-xl border border-parish-200 bg-parish-50">
          <Image
            src={preview}
            alt=""
            fill
            className="object-contain p-2"
            sizes="384px"
            unoptimized={preview.startsWith("blob:")}
          />
        </div>
      ) : null}
      <input
        type="file"
        name={fileFieldName}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className={adminInput}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setPreview(URL.createObjectURL(f));
        }}
      />
      <p className="mt-1 text-xs text-parish-500">
        Envie um arquivo (JPEG, PNG, WebP ou GIF, até 5 MB) ou informe a URL acima.
      </p>
    </div>
  );
}
