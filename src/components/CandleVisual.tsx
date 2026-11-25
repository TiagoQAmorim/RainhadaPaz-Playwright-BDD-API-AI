"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";
import { CANDLE_ASSETS } from "@/lib/candle-assets";
import {
  candleBurnStep,
  candleFlameScale,
  candleSpentLayout,
  candleStageImage,
  candleStagePixelHeight,
} from "@/lib/candle-stages";
import { candleRemainingRatio, resolveCandleBurnWindow, DEFAULT_CANDLE_DURATION_HOURS } from "@/lib/candle-burn";
import {
  candleFlameHeadroomPx,
  candleFlamePixelSize,
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
  /** Contribuição paga: auréola dourada sobre a chama. */
  paid?: boolean;
};

function parseDate(v: Date | string | null | undefined): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function readBurn(litMs: number, expMs: number) {
  const lit = litMs ? new Date(litMs) : null;
  const exp = expMs ? new Date(expMs) : null;
  const ratio = candleRemainingRatio(lit, exp);
  const remainingMs = lit && exp ? Math.max(0, exp.getTime() - Date.now()) : 0;
  return { ratio, remainingMs };
}

function useWaxRemaining(litAt: Date | null, expiresAt: Date | null) {
  const litMs = litAt?.getTime() ?? 0;
  const expMs = expiresAt?.getTime() ?? 0;
  const [burn, setBurn] = useState(() => readBurn(litMs, expMs));

  useEffect(() => {
    setBurn(readBurn(litMs, expMs));
    if (!litMs || !expMs) return;
    const id = window.setInterval(() => setBurn(readBurn(litMs, expMs)), 8_000);
    return () => window.clearInterval(id);
  }, [litMs, expMs]);

  return burn;
}

export function CandleVisual({
  size = "md",
  delaySec = 0,
  litAt: litAtProp,
  expiresAt: expiresAtProp,
  durationHours = DEFAULT_CANDLE_DURATION_HOURS,
  priority,
  mural,
  paid,
}: Props) {
  const w = candleVisualPixelWidth(size);
  const burnWindow = resolveCandleBurnWindow(litAtProp, expiresAtProp, durationHours);
  const litAt = burnWindow ? burnWindow.litAt : parseDate(litAtProp);
  const expiresAt = burnWindow ? burnWindow.expiresAt : parseDate(expiresAtProp);
  const wax = useWaxRemaining(litAt, expiresAt);
  const waxRemaining = wax.ratio;
  const isLit = waxRemaining > 0 && !!litAt && !!expiresAt;
  const step = isLit ? candleBurnStep(waxRemaining, wax.remainingMs) : waxRemaining > 0 ? 100 : null;

  if (step === null) {
    const puddle = candleSpentLayout(w);
    const smokeH = Math.round(w * 0.9);
    return (
      <div
        className={cn(
          "candle-photo candle-photo--out relative mx-auto shrink-0",
          mural && "candle-photo--mural",
        )}
        style={{ width: puddle.width, height: puddle.height + smokeH }}
        aria-hidden
      >
        <div className="candle-photo__smoke" style={{ height: smokeH, bottom: puddle.height }}>
          <span />
          <span />
          <span />
        </div>
        <div
          className="candle-photo__wax-slot absolute bottom-0 left-0 right-0"
          style={{ height: puddle.height }}
        >
          <Image
            src={CANDLE_ASSETS.stage0}
            alt=""
            width={puddle.width}
            height={puddle.height}
            unoptimized
            className="pointer-events-none mx-auto block h-full w-full select-none object-contain object-bottom"
          />
        </div>
      </div>
    );
  }

  const waxH = candleStagePixelHeight(step, w);
  const flameScale = isLit ? candleFlameScale(step) : 0;
  const headroom = isLit && flameScale > 0 ? candleFlameHeadroomPx(size, flameScale) : 0;
  const totalH = waxH + headroom;
  const imgSizes = `${w}px`;
  const { flameW, flameH } = candleFlamePixelSize(w, flameScale);

  return (
    <div
      className={cn(
        "candle-photo relative mx-auto shrink-0 transition-[height] duration-700 ease-out",
        isLit && "candle-photo--lit",
        paid && isLit && "candle-photo--paid",
        mural && "candle-photo--mural",
      )}
      style={
        {
          width: w,
          height: totalH,
          ["--candle-delay" as string]: `${delaySec}s`,
          ["--flame-scale" as string]: String(flameScale),
          ["--flame-w" as string]: `${flameW}px`,
          ["--flame-h" as string]: `${flameH}px`,
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
            {paid ? <div className="candle-photo__halo pointer-events-none" aria-hidden /> : null}
            <div className="candle-photo__glow pointer-events-none" aria-hidden />
            <div className="candle-photo__flame-stage pointer-events-none">
              <Image
                src={CANDLE_ASSETS.flameLit}
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
