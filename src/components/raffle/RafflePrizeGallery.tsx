"use client";

import { useState } from "react";

type Props = {
  photos: string[];
  title: string;
};

export function RafflePrizeGallery({ photos, title }: Props) {
  const [index, setIndex] = useState(0);
  const count = photos.length;
  if (count === 0) return null;

  const src = photos[index] ?? photos[0]!;
  const prev = () => setIndex((current) => (current - 1 + count) % count);
  const next = () => setIndex((current) => (current + 1) % count);

  return (
    <div>
      <div className="relative">
        <figure className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl">
          <img
            src={src}
            alt={index === 0 ? title : `${title} — foto ${index + 1}`}
            className="absolute inset-0 h-full w-full object-contain"
          />
        </figure>
        {count > 1 ? (
          <>
            <button
              type="button"
              aria-label="Foto anterior"
              onClick={prev}
              className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-2xl font-bold leading-none text-parish-900 shadow-md hover:bg-white"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Próxima foto"
              onClick={next}
              className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-2xl font-bold leading-none text-parish-900 shadow-md hover:bg-white"
            >
              ›
            </button>
          </>
        ) : null}
      </div>
      {count > 1 ? (
        <p className="mt-2 text-center text-xs font-semibold text-parish-600">
          {index + 1} de {count}
        </p>
      ) : null}
    </div>
  );
}
