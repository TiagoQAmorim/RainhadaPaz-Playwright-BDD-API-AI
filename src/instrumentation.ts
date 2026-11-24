export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const production =
    process.env.NODE_ENV === "production" || process.env.RAILWAY_ENVIRONMENT != null;
  if (!production) return;
  const { startCandleMailLoop } = await import("@/lib/candle-mail-run");
  startCandleMailLoop();
}
