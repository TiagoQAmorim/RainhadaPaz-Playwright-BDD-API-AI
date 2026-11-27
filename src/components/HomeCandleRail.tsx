"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CandleWall, type CandleItem } from "@/components/CandleWall";
import type { PublicCandle } from "@/lib/candle-public";

const PAGE = 8;
const SPEED_PX_PER_MS = 0.028;

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
    prayerTogetherCount: candle.prayerTogetherCount,
  };
}

export function HomeCandleRail({
  initial,
  total,
  durationHours,
  afterglowMs,
  nowMs,
}: {
  initial: PublicCandle[];
  total: number;
  durationHours: number;
  afterglowMs: number;
  nowMs: number;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const xRef = useRef(0);
  const paused = useRef(false);
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, offset: 0 });
  const dragged = useRef(false);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(initial.length < total);
  const fitsRef = useRef(true);
  const [candles, setCandles] = useState(initial);
  const [hasMore, setHasMore] = useState(initial.length < total);
  const [fits, setFits] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  function apply() {
    if (track.current) {
      track.current.style.transform = `translate3d(${xRef.current}px,0,0)`;
    }
  }

  function contentWidth() {
    const first = track.current?.firstElementChild as HTMLElement | null;
    return first?.offsetWidth ?? 0;
  }

  function viewWidth() {
    return viewport.current?.clientWidth ?? 0;
  }

  /** Uma fileira que cabe inteira fica parada no centro. */
  function contentFits() {
    const view = viewWidth();
    const width = contentWidth();
    if (view <= 0 || width <= 0) return true;
    return width <= view;
  }

  function syncFits() {
    const next = contentFits();
    if (next) xRef.current = 0;
    if (fitsRef.current !== next) {
      fitsRef.current = next;
      setFits(next);
    }
    return next;
  }

  function wrap() {
    if (contentFits()) {
      xRef.current = 0;
      return;
    }
    const width = contentWidth();
    if (width <= 0) return;
    const gap = (track.current?.children.length ?? 0) > 1 ? 12 : 0;
    const span = width + gap;
    if (hasMoreRef.current) {
      const max = Math.max(0, width - viewWidth());
      if (xRef.current < -max) xRef.current = -max;
      if (xRef.current > 0) xRef.current = 0;
      return;
    }
    if (xRef.current <= -span) xRef.current += span;
    if (xRef.current > 0) xRef.current -= span;
  }

  async function loadMore() {
    if (loadingRef.current || !hasMoreRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await fetch(`/api/candles/mural?offset=${candles.length}&limit=${PAGE}`);
      if (!res.ok) return;
      const data = (await res.json()) as { candles: PublicCandle[]; hasMore: boolean };
      setCandles((current) => {
        const seen = new Set(current.map((c) => c.id));
        const extra = data.candles.filter((c) => !seen.has(c.id));
        return extra.length ? [...current, ...extra] : current;
      });
      hasMoreRef.current = data.hasMore;
      setHasMore(data.hasMore);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(32, now - last);
      last = now;
      const still = syncFits();
      if (!still && !media.matches && !paused.current && !dragging.current && candles.length > 1) {
        xRef.current -= SPEED_PX_PER_MS * dt;
        wrap();
        apply();
        const view = viewWidth();
        const width = contentWidth();
        if (hasMoreRef.current && width > 0 && -xRef.current + view > width - 280) {
          void loadMore();
        }
      } else {
        apply();
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // loadMore fecha sobre o tamanho atual da lista de propósito
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles.length]);

  useEffect(() => {
    const node = viewport.current;
    if (!node) return;
    const observer = new ResizeObserver(() => {
      syncFits();
      apply();
    });
    observer.observe(node);
    return () => observer.disconnect();
    // syncFits lê o DOM atual
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles.length]);

  function nudge(dir: -1 | 1) {
    if (fitsRef.current) return;
    const card = track.current?.querySelector("li");
    const delta = (card?.getBoundingClientRect().width ?? 200) + 12;
    xRef.current += dir * delta;
    if (dir < 0 && hasMoreRef.current) void loadMore();
    wrap();
    apply();
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const target = e.target instanceof Element ? e.target : null;
    if (target?.closest("button, a")) {
      paused.current = true;
      const resume = () => {
        paused.current = false;
        window.removeEventListener("pointerup", resume);
        window.removeEventListener("pointercancel", resume);
      };
      window.addEventListener("pointerup", resume);
      window.addEventListener("pointercancel", resume);
      return;
    }
    if (fitsRef.current) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragging.current = true;
    dragged.current = false;
    paused.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, offset: xRef.current };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (!dragged.current && Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
    if (!dragged.current && Math.abs(dy) > Math.abs(dx)) {
      dragging.current = false;
      paused.current = false;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      return;
    }
    dragged.current = true;
    xRef.current = dragStart.current.offset + dx;
    wrap();
    apply();
    const view = viewWidth();
    const width = contentWidth();
    if (hasMoreRef.current && width > 0 && -xRef.current + view > width - 280) {
      void loadMore();
    }
  }

  function onPointerUp() {
    dragging.current = false;
    paused.current = false;
  }

  function onClickCapture(e: React.MouseEvent) {
    if (!dragged.current) return;
    e.preventDefault();
    e.stopPropagation();
    dragged.current = false;
  }

  if (candles.length === 0) {
    return (
      <CandleWall
        candles={[]}
        banner
        compact
        dense
        durationHours={durationHours}
        afterglowMs={afterglowMs}
        nowMs={nowMs}
      />
    );
  }

  const items = candles.map(toItem);
  const loop = !fits && !hasMore && items.length > 1;

  return (
    <div>
      <div className="relative">
        {fits ? null : (
          <button
            type="button"
            aria-label="Velas anteriores"
            onClick={() => nudge(1)}
            className="absolute top-1/2 left-1 z-10 -translate-y-1/2 rounded-full bg-black/50 px-2.5 py-2 text-lg font-bold leading-none text-white"
          >
            ‹
          </button>
        )}
        <div
          ref={viewport}
          className={
            fits
              ? "overflow-hidden"
              : "cursor-grab touch-pan-y overflow-hidden select-none active:cursor-grabbing"
          }
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClickCapture={onClickCapture}
        >
          <div
            ref={track}
            className={
              fits
                ? "mx-auto flex w-max justify-center"
                : "flex w-max gap-3 will-change-transform"
            }
          >
            <div className="w-max shrink-0">
              <CandleWall
                candles={items}
                banner
                compact
                dense
                rail
                durationHours={durationHours}
                afterglowMs={afterglowMs}
                nowMs={nowMs}
              />
            </div>
            {loop ? (
              <div className="w-max shrink-0" aria-hidden>
                <CandleWall
                  candles={items}
                  banner
                  compact
                  dense
                  rail
                  durationHours={durationHours}
                  afterglowMs={afterglowMs}
                  nowMs={nowMs}
                />
              </div>
            ) : null}
          </div>
        </div>
        {fits ? null : (
          <button
            type="button"
            aria-label="Próximas velas"
            onClick={() => nudge(-1)}
            className="absolute top-1/2 right-1 z-10 -translate-y-1/2 rounded-full bg-black/50 px-2.5 py-2 text-lg font-bold leading-none text-white"
          >
            ›
          </button>
        )}
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
