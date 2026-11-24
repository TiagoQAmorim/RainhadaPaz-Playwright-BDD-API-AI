export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { startCandleMailLoop } = await import("@/lib/candle-mail-run");
  startCandleMailLoop();
}
