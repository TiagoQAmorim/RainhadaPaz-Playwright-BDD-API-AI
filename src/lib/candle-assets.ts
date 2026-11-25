/** Velas por estágio de consumo + chama (public/candles). */
export const CANDLE_ASSETS = {
  stage100: "/candles/vela-100.webp",
  stage80: "/candles/vela-80.webp",
  stage60: "/candles/vela-60.webp",
  stage40: "/candles/vela-40.webp",
  stage20: "/candles/vela-20.webp",
  stage5: "/candles/vela-5.webp",
  /** Cera derretida, sem chama. */
  stage0: "/candles/vela-0.png",
  flame: "/candles/candle-flame.webp",
  /** Chama amarela + núcleo azul integrados (scripts/build-flame-composite.mjs). */
  flameLit: "/candles/candle-flame-composite.webp",
  flameMural: "/candles/candle-flame-mural.webp",
} as const;
