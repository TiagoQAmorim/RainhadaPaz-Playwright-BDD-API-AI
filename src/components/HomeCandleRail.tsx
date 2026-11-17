"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { CandleWall, type CandleItem } from "@/components/CandleWall";
import type { PublicCandle } from "@/lib/candles";

const PAGE = 8;

function toItem(candle: PublicCandle): CandleItem {
  return {
    id: candle.id,
    donorName: candle.donorName,
    intention: candle.intention,
    prayer: candle.prayer,
    intentionPublic: candle.intentionPublic,
    prayerPublic: candle.prayerPublic,
    litAt: new Date(candle.litAt),
    expiresAt: candle.expiresAt ? new Date(candle.expiresAt) : null,
    paid: candle.paid,
  };
}

export function HomeCandleRail({
  initial,
  total,
  durationHours,
}: {
  initial: PublicCandle[];
  total: number;
  durationHours: number;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const [candles, setCandles] = useState(initial);
  const [hasMore, setHasMore] = useState(initial.length < total);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await fetch(`/api/candles/mural?offset=${candles.length}&limit=${PAGE}`);
      if (!res.ok) return;
      const data = (await res.json()) as { candles: PublicCandle[]; hasMore: boolean };
      setCandles((current) => {
        const seen = new Set(current.map((c) => c.id));
        return [...current, ...data.candles.filter((c) => !seen.has(c.id))];
      });
      setHasMore(data.hasMore);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }

  function onScroll() {
    const el = scroller.current;
    if (!el) return;
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 140) {
      void loadMore();
    }
  }

  async function step(dir: -1 | 1) {
    const el = scroller.current;
    if (!el) return;
    const nearEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 24;
    if (dir > 0 && nearEnd) await loadMore();
    const card = el.querySelector("li");
    const delta = (card?.getBoundingClientRect().width ?? 200) + 12;
    el.scrollBy({ left: dir * delta, behavior: "smooth" });
  }

  if (candles.length === 0) {
    return (
      <CandleWall candles={[]} banner compact dense durationHours={durationHours} />
    );
  }

  return (
    <div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Velas anteriores"
          onClick={() => void step(-1)}
          className="shrink-0 rounded-full bg-black/40 px-2.5 py-2 text-lg font-bold leading-none text-white"
        >
          ‹
        </button>
        <div
          ref={scroller}
          onScroll={onScroll}
          className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain scroll-smooth snap-x snap-mandatory pb-1 [scrollbar-width:thin]"
        >
          <CandleWall
            candles={candles.map(toItem)}
            banner
            compact
            dense
            rail
            durationHours={durationHours}
          />
        </div>
        <button
          type="button"
          aria-label="Próximas velas"
          onClick={() => void step(1)}
          className="shrink-0 rounded-full bg-black/40 px-2.5 py-2 text-lg font-bold leading-none text-white"
        >
          ›
        </button>
      </div>
      {loading ? <p className="mt-2 text-center text-xs text-amber-100/70">Carregando mais velas…</p> : null}
      <div className="relative z-[1] mt-3 text-center">
        <Link href="/velas#mural" className="text-sm font-semibold text-gold-400 hover:text-gold-300">
          Ver todas as velas acesas →
        </Link>
      </div>
    </div>
  );
}
