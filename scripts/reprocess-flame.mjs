import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "candles");
const assetDir = path.join(
  root,
  "..",
  "..",
  ".cursor",
  "projects",
  "c-Users-Dell-Documents-RainhadaPaz",
  "assets",
);

function alphaKeyFlame(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const spread = max - min;
  const lum = (r + g + b) / 3;

  const warm = r > 55 && r >= g * 0.72 && r > b * 0.9;
  const blueCore = b > 90 && b > r * 0.85 && g > 60;
  const ember = spread > 28 && lum > 45 && lum < 250 && (warm || blueCore);

  if (ember) return 255;

  const checkerGrey =
    spread < 32 && lum >= 75 && lum <= 235 && Math.abs(r - g) < 22 && Math.abs(g - b) < 22;
  if (checkerGrey) return 0;

  if (spread < 60 && lum > 82) return 0;
  if (lum < 50) return 0;
  return 0;
}

const flameFiles = fs.readdirSync(assetDir).filter((f) => /candle-flame/i.test(f) && /\.(jpg|png|webp)$/i.test(f));
let src = flameFiles.map((f) => path.join(assetDir, f)).find((p) => fs.existsSync(p));
if (!src) {
  const fallback = path.join(outDir, "candle-flame.png");
  if (fs.existsSync(fallback)) src = fallback;
}
if (!src) {
  console.error("no candle-flame source");
  process.exit(1);
}

const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;
for (let i = 0; i < width * height; i++) {
  const o = i * channels;
  const a = alphaKeyFlame(data[o], data[o + 1], data[o + 2]);
  data[o + 3] = a;
}

const trimmed = await sharp(data, { raw: { width, height, channels: 4 } })
  .trim({ threshold: 1 })
  .toBuffer({ resolveWithObject: true });

const tw = trimmed.info.width;
const th = trimmed.info.height;
console.log("flame trimmed", tw, "x", th);

await sharp(trimmed.data, {
  raw: { width: tw, height: th, channels: trimmed.info.channels },
})
  .png({ compressionLevel: 9 })
  .toFile(path.join(outDir, "candle-flame.png"));

await sharp(trimmed.data, {
  raw: { width: tw, height: th, channels: trimmed.info.channels },
})
  .webp({ quality: 92, alphaQuality: 100 })
  .toFile(path.join(outDir, "candle-flame.webp"));
