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

const BURN_STEP_ORDER: CandleBurnStep[] = [5, 20, 40, 60, 80, 100];

function stepFromRatio(remainingRatio: number): CandleBurnStep | null {
  if (remainingRatio <= 0) return null;
  const pct = remainingRatio * 100;
  if (pct > 80) return 100;
  if (pct > 60) return 80;
  if (pct > 40) return 60;
  if (pct > 20) return 40;
  if (pct > 5) return 20;
  return 5;
}

function atLeast(step: CandleBurnStep, min: CandleBurnStep): CandleBurnStep {
  return BURN_STEP_ORDER.indexOf(step) < BURN_STEP_ORDER.indexOf(min) ? min : step;
}

/**
 * Percentual restante → arte da vela. `null` = apagada (0%).
 * Numa vela de vários dias, 2 horas ainda são pouca porcentagem e cairiam no
 * desenho quase derretido. Enquanto faltam horas, a vela continua de pé.
 */
export function candleBurnStep(remainingRatio: number, remainingMs = 0): CandleBurnStep | null {
  const step = stepFromRatio(remainingRatio);
  if (!step) return null;
  const hour = 60 * 60 * 1000;
  if (remainingMs > 2 * hour) return atLeast(step, 40);
  if (remainingMs > 30 * 60 * 1000) return atLeast(step, 20);
  return step;
}

export function candleStageImage(step: CandleBurnStep): string {
  return stageImages[step];
}

/** Cera derretida: mais larga que a vela em pé, para a poça aparecer inteira. */
export function candleSpentLayout(candleWidthPx: number) {
  const width = Math.round(candleWidthPx * 1.85);
  const height = Math.max(30, Math.round(width * 0.4));
  return { width, height };
}

export function candleSpentPixelHeight(widthPx: number) {
  return candleSpentLayout(widthPx).height;
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
