"use client";

import { useState } from "react";
import { adminBtn, adminInput } from "@/components/admin/AdminFormStyles";
import { POST_YOUTUBE_SLOTS } from "@/lib/post-media-limits";
import { youtubeWatchUrl } from "@/lib/youtube";

export type PostYoutubeRow = {
  id?: string;
  youtubeVideoId: string | null;
  title: string | null;
};

type Props = {
  videos: PostYoutubeRow[];
};

function emptyRow(): PostYoutubeRow {
  return { youtubeVideoId: null, title: null };
}

export function PostYoutubeFields({ videos }: Props) {
  const [rows, setRows] = useState<PostYoutubeRow[]>(() =>
    videos.length > 0 ? videos : [emptyRow()],
  );

  const addRow = () => {
    if (rows.length >= POST_YOUTUBE_SLOTS) return;
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
      <legend className="px-1 text-sm font-semibold text-parish-900">Vídeos do YouTube</legend>
      <p className="text-xs text-parish-600">
        Cole o link do vídeo (watch, youtu.be ou Shorts). Até {POST_YOUTUBE_SLOTS} vídeos por
        notícia, com título opcional.
      </p>
      <input type="hidden" name="youtubeSlotCount" value={rows.length} readOnly />

      {rows.map((row, i) => (
        <div
          key={`${row.id ?? "new"}-${i}`}
          className="rounded-lg border border-parish-100 bg-white p-3"
        >
          {row.id ? <input type="hidden" name={`youtubeId_${i}`} value={row.id} readOnly /> : null}
          <label className="block text-xs font-medium text-parish-700">Link do YouTube</label>
          <input
            name={`youtubeUrl_${i}`}
            type="url"
            className={adminInput}
            placeholder="https://www.youtube.com/watch?v=…"
            defaultValue={row.youtubeVideoId ? youtubeWatchUrl(row.youtubeVideoId) : ""}
          />
          <label className="mt-2 block text-xs font-medium text-parish-700">
            Título do vídeo (opcional)
          </label>
          <input
            name={`youtubeTitle_${i}`}
            defaultValue={row.title ?? ""}
            className={adminInput}
            placeholder="Ex.: Homilia de domingo"
          />
          {rows.length > 1 || row.youtubeVideoId ? (
            <button
              type="button"
              className="mt-2 text-xs font-semibold text-red-700 hover:underline"
              onClick={() => removeRow(i)}
            >
              Remover este vídeo
            </button>
          ) : null}
        </div>
      ))}

      {rows.length < POST_YOUTUBE_SLOTS ? (
        <button type="button" onClick={addRow} className={adminBtn}>
          + Adicionar vídeo do YouTube
        </button>
      ) : null}
    </fieldset>
  );
}