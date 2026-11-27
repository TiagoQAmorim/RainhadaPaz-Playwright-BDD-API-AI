"use client";

import { useState } from "react";
import { BeforeAfterCompare } from "@/components/obra/BeforeAfterCompare";

type Item = {
  id: string;
  title: string;
  beforeUrl: string;
  afterUrl: string;
  caption: string;
};

export function BeforeAfterCarousel({ items }: { items: Item[] }) {
  const [index, setIndex] = useState(0);
  const current = items[index] ?? items[0];
  if (!current) return null;
  const many = items.length > 1;

  function step(delta: number) {
    setIndex((value) => (value + delta + items.length) % items.length);
  }

  return (
    <div className="mt-6">
      <BeforeAfterCompare
        key={current.id}
        title={current.title}
        beforeUrl={current.beforeUrl}
        afterUrl={current.afterUrl}
        caption={current.caption}
        wide
      />
      {many ? (
        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            type="button"
            aria-label="Comparativo anterior"
            onClick={() => step(-1)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-parish-800 text-2xl leading-none text-white shadow-md hover:bg-parish-700"
          >
            ‹
          </button>
          <p className="min-w-16 text-center text-sm font-semibold text-parish-700">
            {index + 1} de {items.length}
          </p>
          <button
            type="button"
            aria-label="Próximo comparativo"
            onClick={() => step(1)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-parish-800 text-2xl leading-none text-white shadow-md hover:bg-parish-700"
          >
            ›
          </button>
        </div>
      ) : null}
    </div>
  );
}
