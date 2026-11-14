import stageMeta from "./candle-stage-meta.json";
import { candleFlameScale, candleStagePixelHeight, type CandleBurnStep } from "./candle-stages";

/** Proporção de `candle-flame-lit.webp` (gerado por scripts/build-flame-lit.mjs). */
export const CANDLE_FLAME_LIT_ASPECT = 641 / 187;

/** Largura da vela: xs = banner home; sm/md/lg = demais telas. */
const widths = { xs: 44, sm: 56, md: 72, lg: 96 } as const;

/** Tamanho da chama em px (mesma lógica no componente e no headroom). */
export function candleFlamePixelSize(candleWidthPx: number, flameScale: number) {
  const flameW = Math.max(11, Math.round(candleWidthPx * 0.24 * flameScale));
  const flameH = Math.max(
    14,
    Math.round(flameW * CANDLE_FLAME_LIT_ASPECT * 0.76),
  );
  return { flameW, flameH };
}

export type CandleVisualSize = keyof typeof widths;

export function candleVisualPixelWidth(size: CandleVisualSize = "md") {
  return widths[size];
}

export function candleVisualPixelHeight(size: CandleVisualSize = "md") {
  const w = widths[size];
  const ratio =
    (stageMeta as { pct: number; heightRatio: number }[]).find((m) => m.pct === 100)
      ?.heightRatio ?? 1.35;
  return Math.round(w * ratio);
}

/** Espaço acima da cera (chama + halo). Mesma fórmula no componente. */
export function candleFlameHeadroomPx(
  size: CandleVisualSize = "md",
  flameScale = candleFlameScale(100),
) {
  const w = widths[size];
  const { flameH } = candleFlamePixelSize(w, flameScale);
  const extra = size === "xs" ? 6 : 4;
  return flameH + extra;
}

export function candleLitStackHeight(
  size: CandleVisualSize,
  step: CandleBurnStep | 100 = 100,
  flameScale = candleFlameScale(step === 100 ? 100 : step),
) {
  const w = widths[size];
  const waxH = candleStagePixelHeight(step, w);
  return waxH + candleFlameHeadroomPx(size, flameScale);
}

export function candleVisualSlotHeight(size: CandleVisualSize = "md") {
  return candleLitStackHeight(size, 100, candleFlameScale(100)) + 2;
}
