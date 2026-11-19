"use client";

import Image from "next/image";
import { useState } from "react";
import { adminInput, adminTextarea } from "@/components/admin/AdminFormStyles";

type Props = {
  defaultTitle: string;
  defaultDescription: string;
  fallbackTitle: string;
  fallbackDescription: string;
  imageUrl: string;
  siteHost: string;
};

export function SearchResultFields({
  defaultTitle,
  defaultDescription,
  fallbackTitle,
  fallbackDescription,
  imageUrl,
  siteHost,
}: Props) {
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription);
  const shownTitle = title.trim() || fallbackTitle;
  const shownDescription = description.trim() || fallbackDescription;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-parish-100 bg-parish-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-parish-500">Prévia</p>
        <div className="mt-3 flex gap-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-parish-800">{siteHost}</p>
            <p className="mt-0.5 text-lg font-medium leading-snug text-[#1a0dab]">{shownTitle}</p>
            <p className="mt-1 text-sm leading-relaxed text-parish-700">{shownDescription}</p>
          </div>
          {imageUrl ? (
            <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg sm:h-20 sm:w-28">
              <Image src={imageUrl} alt="" fill className="object-cover" sizes="112px" unoptimized />
            </span>
          ) : null}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="searchTitle">
          Título do resultado
        </label>
        <input
          id="searchTitle"
          name="searchTitle"
          value={title}
          maxLength={120}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={fallbackTitle}
          className={adminInput}
        />
        <p className="mt-1 text-xs text-parish-500">
          {title.trim().length} caracteres. O Google costuma mostrar cerca de 60.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="searchDescription">
          Texto do resultado
        </label>
        <textarea
          id="searchDescription"
          name="searchDescription"
          value={description}
          maxLength={320}
          rows={4}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={fallbackDescription}
          className={adminTextarea}
        />
        <p className="mt-1 text-xs text-parish-500">
          {description.trim().length} caracteres. O Google costuma mostrar cerca de 160.
        </p>
      </div>
    </div>
  );
}
