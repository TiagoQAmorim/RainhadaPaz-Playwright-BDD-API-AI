/**
 * Recorta a chama amarela (remove o oval azul solto na base do PNG original).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "public", "candles", "candle-flame.webp");
const out = path.join(root, "public", "candles", "candle-flame-lit.webp");

const meta = await sharp(src).metadata();
const w = meta.width ?? 0;
const h = meta.height ?? 0;
const cropH = Math.max(1, Math.round(h * 0.76));

const info = await sharp(src)
  .extract({ left: 0, top: 0, width: w, height: cropH })
  .trim({ threshold: 8 })
  .webp({ quality: 94, alphaQuality: 100 })
  .toFile(out);

console.log("candle-flame-lit.webp", info.width, "x", info.height);
