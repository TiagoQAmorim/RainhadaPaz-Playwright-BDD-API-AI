import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "candles");
const src = path.join(outDir, "candle-flame.webp");

const meta = await sharp(src).metadata();
const h = meta.height ?? 0;
const w = meta.width ?? 0;

const cropH = Math.min(h, Math.max(120, Math.round(h * 0.32)));
const cropW = Math.min(w, Math.max(80, Math.round(w * 0.72)));
const top = Math.max(0, h - cropH - Math.round(h * 0.02));
const left = Math.round((w - cropW) / 2);

const { data, info } = await sharp(src)
  .extract({ left, top, width: cropW, height: cropH })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
for (let i = 0; i < width * height; i++) {
  const o = i * channels;
  const r = data[o];
  const g = data[o + 1];
  const b = data[o + 2];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const spread = max - min;
  const lum = (r + g + b) / 3;

  const warm = r > 50 && r >= g * 0.7 && r > b * 0.85;
  const blueCore = b > 85 && b > r * 0.82 && g > 55;
  const ember = spread > 22 && lum > 42 && lum < 252 && (warm || blueCore);

  if (ember) continue;

  if (spread < 34 && lum >= 70 && lum <= 240) {
    data[o + 3] = 0;
    continue;
  }
  if (lum < 52) {
    data[o + 3] = 0;
  }
}

const trimmed = await sharp(data, { raw: { width, height, channels } })
  .trim({ threshold: 8 })
  .toBuffer({ resolveWithObject: true });

const tw = trimmed.info.width;
const th = trimmed.info.height;

await sharp(trimmed.data, {
  raw: { width: tw, height: th, channels: trimmed.info.channels },
})
  .webp({ quality: 94, alphaQuality: 100 })
  .toFile(path.join(outDir, "candle-flame-mural.webp"));

console.log("candle-flame-mural", tw, "x", th);
