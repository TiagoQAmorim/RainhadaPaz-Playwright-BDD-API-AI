import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "public", "candles", "candle-flame.png");
const meta = await sharp(src).metadata();
const h = meta.height ?? 0;
const w = meta.width ?? 0;
const cropH = Math.min(h, Math.max(90, Math.round(h * 0.2)));
const cropW = Math.min(w, Math.max(80, Math.round(w * 0.52)));
const top = h - cropH;
const left = Math.round((w - cropW) / 2);

await sharp(src)
  .extract({ left, top, width: cropW, height: cropH })
  .png()
  .toFile(path.join(root, "public", "candles", "candle-flame-tip.png"));

console.log("candle-flame-tip", cropW, "x", cropH);
