"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  title: string;
  beforeUrl: string;
  afterUrl: string;
  caption?: string;
  wide?: boolean;
};

function localUpload(src: string) {
  return src.startsWith("/uploads/");
}

export function BeforeAfterCompare({ title, beforeUrl, afterUrl, caption, wide }: Props) {
  const [pos, setPos] = useState(52);

  return (
    <figure className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-parish-200/80">
      <div className={wide ? "relative aspect-[16/9] select-none bg-parish-900" : "relative aspect-[4/3] select-none bg-parish-900"}>
        <Image
          src={afterUrl}
          alt={`Depois — ${title}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          unoptimized={localUpload(afterUrl)}
        />
        <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${pos}%` }}>
          <div className="relative h-full" style={{ width: `${10000 / pos}%` }}>
            <Image
              src={beforeUrl}
              alt={`Antes — ${title}`}
              fill
              className="object-cover object-left"
              sizes="(max-width: 768px) 100vw, 50vw"
              unoptimized={localUpload(beforeUrl)}
            />
          </div>
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 z-10"
          style={{ left: `${pos}%` }}
          aria-hidden
        >
          <div className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.25)]" />
          <div className="absolute top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-sm font-bold text-parish-800 shadow-lg">
            ↔
          </div>
        </div>
        <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-parish-950/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white">
          Antes
        </span>
        <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-gold-500 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-parish-950">
          Depois
        </span>
        <label className="absolute inset-0 z-20 cursor-ew-resize">
          <span className="sr-only">Arraste para comparar antes e depois: {title}</span>
          <input
            type="range"
            min={4}
            max={96}
            value={pos}
            onChange={(event) => setPos(Number(event.target.value))}
            className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
          />
        </label>
      </div>
      <figcaption className="px-5 py-4">
        <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-parish-900">
          {title}
        </p>
        {caption ? <p className="mt-1 text-sm leading-relaxed text-parish-600">{caption}</p> : null}
        <p className="mt-2 text-xs text-parish-500">Arraste a barra para ver o antes e o depois.</p>
      </figcaption>
    </figure>
  );
}
