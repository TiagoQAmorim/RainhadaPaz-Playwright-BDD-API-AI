"use client";

import { useState } from "react";
import { AdminImageField } from "@/components/admin/AdminImageField";
import { adminBtn } from "@/components/admin/AdminFormStyles";
import { RAFFLE_PRIZE_PHOTO_SLOTS } from "@/lib/raffle-rules";

type Row = { imageUrl: string | null };

function emptyRow(): Row {
  return { imageUrl: null };
}

export function RafflePrizePhotoFields({ images }: { images: string[] }) {
  const [rows, setRows] = useState<Row[]>(() =>
    images.length > 0 ? images.map((imageUrl) => ({ imageUrl })) : [emptyRow()],
  );

  const addRow = () => {
    if (rows.length >= RAFFLE_PRIZE_PHOTO_SLOTS) return;
    setRows((current) => [...current, emptyRow()]);
  };

  const removeRow = (index: number) => {
    setRows((current) => {
      const next = current.filter((_, i) => i !== index);
      return next.length > 0 ? next : [emptyRow()];
    });
  };

  return (
    <fieldset className="space-y-3 rounded-xl border border-parish-200 bg-parish-50/50 p-4">
      <legend className="px-1 text-sm font-semibold text-parish-900">Fotos do prêmio</legend>
      <p className="text-xs text-parish-600">
        Até {RAFFLE_PRIZE_PHOTO_SLOTS} fotos. A primeira aparece em destaque. Use &quot;Adicionar foto&quot; para incluir mais.
      </p>
      <input type="hidden" name="prizePhotoCount" value={rows.length} readOnly />
      {rows.map((row, i) => (
        <div key={`${row.imageUrl ?? "nova"}-${i}`} className="rounded-lg border border-parish-100 bg-white p-3">
          <AdminImageField
            label={i === 0 ? "Foto principal" : `Foto ${i + 1}`}
            name={`prizePhoto_${i}`}
            fileFieldName={`prizePhotoFile_${i}`}
            defaultValue={row.imageUrl}
          />
          {rows.length > 1 || row.imageUrl ? (
            <button
              type="button"
              className="mt-2 text-xs font-semibold text-red-700 hover:underline"
              onClick={() => removeRow(i)}
            >
              Remover esta foto
            </button>
          ) : null}
        </div>
      ))}
      {rows.length < RAFFLE_PRIZE_PHOTO_SLOTS ? (
        <button type="button" onClick={addRow} className={adminBtn}>
          + Adicionar foto
        </button>
      ) : null}
    </fieldset>
  );
}
