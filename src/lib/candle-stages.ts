import stageMeta from "./candle-stage-meta.json";
import { CANDLE_ASSETS } from "./candle-assets";

export const CANDLE_BURN_STEPS = [100, 80, 60, 40, 20, 5] as const;
export type CandleBurnStep = (typeof CANDLE_BURN_STEPS)[number];

const stageImages: Record<CandleBurnStep, string> = {
  100: CANDLE_ASSETS.stage100,
  80: CANDLE_ASSETS.stage80,
  60: CANDLE_ASSETS.stage60,
  40: CANDLE_ASSETS.stage40,
  20: CANDLE_ASSETS.stage20,
  5: CANDLE_ASSETS.stage5,
};

type StageMeta = { pct: number; heightRatio: number };

const heightRatioByStep = new Map<number, number>(
  (stageMeta as StageMeta[]).map((m) => [m.pct, m.heightRatio]),
);

/** Percentual restante → arte da vela (100 … 5). `null` = apagada (0%). */
export function candleBurnStep(remainingRatio: number): CandleBurnStep | null {
  if (remainingRatio <= 0) return null;
  const pct = remainingRatio * 100;
  if (pct > 80) return 100;
  if (pct > 60) return 80;
  if (pct > 40) return 60;
  if (pct > 20) return 40;
  if (pct > 5) return 20;
  return 5;
}

export function candleStageImage(step: CandleBurnStep): string {
  return stageImages[step];
}

/** Altura visual da vela em px (base fixa na largura). */
export function candleStagePixelHeight(step: CandleBurnStep, widthPx: number): number {
  const ratio = heightRatioByStep.get(step) ?? 1.35;
  return Math.round(widthPx * ratio);
}

/** Escala da chama (maior que a cera em % para ficar visível no pavio). */
export function candleFlameScale(step: CandleBurnStep): number {
  const t = step / 100;
  return Math.max(0.62, t * 1.28);
}
