"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";
import { CANDLE_ASSETS } from "@/lib/candle-assets";
import {
  candleBurnStep,
  candleFlameScale,
  candleStageImage,
  candleStagePixelHeight,
} from "@/lib/candle-stages";
import { candleRemainingRatio, resolveCandleBurnWindow, DEFAULT_CANDLE_DURATION_HOURS } from "@/lib/candle-burn";
import {
  candleFlameHeadroomPx,
  candleVisualPixelWidth,
  type CandleVisualSize,
} from "@/lib/candle-visual-size";
import { cn } from "@/lib/cn";

type Props = {
  size?: CandleVisualSize;
  delaySec?: number;
  litAt?: Date | string | null;
  expiresAt?: Date | string | null;
  durationHours?: number;
  priority?: boolean;
  /** Mural /velas — estilos isolados (não altera a home). */
  mural?: boolean;
};

function parseDate(v: Date | string | null | undefined): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function useWaxRemaining(litAt: Date | null, expiresAt: Date | null) {
  const litMs = litAt?.getTime() ?? 0;
  const expMs = expiresAt?.getTime() ?? 0;
  const [remaining, setRemaining] = useState(() =>
    candleRemainingRatio(litAt, expiresAt),
  );

  useEffect(() => {
    const lit = litMs ? new Date(litMs) : null;
    const exp = expMs ? new Date(expMs) : null;
    setRemaining(candleRemainingRatio(lit, exp));
    if (!lit || !exp) return;
    const id = window.setInterval(() => {
      setRemaining(candleRemainingRatio(lit, exp));
    }, 8_000);
    return () => window.clearInterval(id);
  }, [litMs, expMs]);

  return remaining;
}

export function CandleVisual({
  size = "md",
  delaySec = 0,
  litAt: litAtProp,
  expiresAt: expiresAtProp,
  durationHours = DEFAULT_CANDLE_DURATION_HOURS,
  priority,
  mural,
}: Props) {
  const w = candleVisualPixelWidth(size);
  const burnWindow = resolveCandleBurnWindow(litAtProp, expiresAtProp, durationHours);
  const litAt = burnWindow ? burnWindow.litAt : parseDate(litAtProp);
  const expiresAt = burnWindow ? burnWindow.expiresAt : parseDate(expiresAtProp);
  const waxRemaining = useWaxRemaining(litAt, expiresAt);
  const isLit = waxRemaining > 0 && !!litAt && !!expiresAt;
  const step = isLit ? candleBurnStep(waxRemaining) : waxRemaining > 0 ? 100 : null;

  if (step === null) {
    return (
      <div
        className="candle-photo candle-photo--extinguished mx-auto shrink-0"
        style={{ width: w, height: 0 }}
        aria-hidden
      />
    );
  }

  const waxH = candleStagePixelHeight(step, w);
  const flameScale = isLit ? candleFlameScale(step) : 0;
  const headroom = isLit && flameScale > 0 ? candleFlameHeadroomPx(size, flameScale) : 0;
  const totalH = waxH + headroom;
  const imgSizes = `${w}px`;
  const flameW = Math.max(18, Math.round(w * 0.5 * flameScale));
  const flameH = Math.max(24, Math.round(w * 0.68 * flameScale));

  return (
    <div
      className={cn(
        "candle-photo relative mx-auto shrink-0 transition-[height] duration-700 ease-out",
        isLit && "candle-photo--lit",
        mural && "candle-photo--mural",
      )}
      style={
        {
          width: w,
          height: totalH,
          ["--candle-delay" as string]: `${delaySec}s`,
          ["--flame-scale" as string]: String(flameScale),
        } as CSSProperties
      }
      aria-hidden
    >
      <div
        className="candle-photo__wax-slot absolute bottom-0 left-0 right-0 overflow-visible"
        style={{ height: waxH }}
      >
        <Image
          key={step}
          src={isLit ? candleStageImage(step) : CANDLE_ASSETS.stage100}
          alt=""
          width={w}
          height={waxH}
          sizes={imgSizes}
          priority={priority}
          className="candle-photo__wax pointer-events-none mx-auto block h-full w-full select-none object-contain object-bottom"
        />

        {isLit && flameScale > 0 ? (
          <>
            <div className="candle-photo__glow pointer-events-none" aria-hidden />
            <div className="candle-photo__flame-stage pointer-events-none">
              <Image
                src={CANDLE_ASSETS.flame}
                alt=""
                width={flameW}
                height={flameH}
                sizes={imgSizes}
                unoptimized={mural}
                className="candle-photo__flame pointer-events-none mx-auto block h-full w-full select-none bg-transparent object-contain object-bottom"
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
