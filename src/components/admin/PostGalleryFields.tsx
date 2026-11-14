"use client";

import { useState } from "react";
import { AdminImageField } from "@/components/admin/AdminImageField";
import { adminBtn, adminInput } from "@/components/admin/AdminFormStyles";
import { POST_GALLERY_SLOTS } from "@/lib/post-media-limits";

export type PostGalleryRow = {
  id?: string;
  imageUrl: string | null;
  caption: string | null;
};

type Props = {
  images: PostGalleryRow[];
};

function emptyRow(): PostGalleryRow {
  return { imageUrl: null, caption: null };
}

export function PostGalleryFields({ images }: Props) {
  const [rows, setRows] = useState<PostGalleryRow[]>(() =>
    images.length > 0 ? images : [emptyRow()],
  );

  const addRow = () => {
    if (rows.length >= POST_GALLERY_SLOTS) return;
    setRows((r) => [...r, emptyRow()]);
  };

  const removeRow = (index: number) => {
    setRows((r) => {
      const next = r.filter((_, i) => i !== index);
      return next.length > 0 ? next : [emptyRow()];
    });
  };

  return (
    <fieldset className="space-y-3 rounded-xl border border-parish-200 bg-parish-50/50 p-4">
      <legend className="px-1 text-sm font-semibold text-parish-900">
        Carrossel de imagens na notícia
      </legend>
      <p className="text-xs text-parish-600">
        Fotos extras no artigo (até {POST_GALLERY_SLOTS}), cada uma com legenda opcional. Use
        &quot;Adicionar foto&quot; para incluir mais imagens.
      </p>
      <input type="hidden" name="gallerySlotCount" value={rows.length} readOnly />

      {rows.map((row, i) => (
        <div key={`${row.id ?? "new"}-${i}`} className="rounded-lg border border-parish-100 bg-white p-3">
          {row.id ? <input type="hidden" name={`galleryId_${i}`} value={row.id} readOnly /> : null}
          <AdminImageField
            label={`Foto ${i + 1}`}
            name={`galleryImage_${i}`}
            fileFieldName={`galleryImageFile_${i}`}
            defaultValue={row.imageUrl}
          />
          <label className="mt-2 block text-xs font-medium text-parish-700">Legenda</label>
          <input
            name={`galleryCaption_${i}`}
            defaultValue={row.caption ?? ""}
            className={adminInput}
            placeholder="Descrição desta imagem"
          />
          {rows.length > 1 || row.imageUrl ? (
            <button
              type="button"
              className="mt-2 text-xs font-semibold text-red-700 hover:underline"
              onClick={() => removeRow(i)}
            >
              Remover este bloco de foto
            </button>
          ) : null}
        </div>
      ))}

      {rows.length < POST_GALLERY_SLOTS ? (
        <button type="button" onClick={addRow} className={adminBtn}>
          + Adicionar foto ao carrossel
        </button>
      ) : null}
    </fieldset>
  );
}