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

const inputs = [
  { src: path.join(assetDir, "wax-unlit.jpg"), base: "wax-unlit" },
  { src: path.join(assetDir, "wax-lit.jpg"), base: "wax-lit" },
  { src: path.join(assetDir, "candle-flame.jpg"), base: "candle-flame" },
];

function alphaForBackground(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const spread = max - min;
  const lum = (r + g + b) / 3;
  if (spread < 22 && lum > 158) {
    if (lum > 246) return 0;
    const t = (lum - 158) / 88;
    return Math.round(255 * Math.min(1, Math.max(0, t)));
  }
  return 255;
}

async function keyToAlpha(src, base) {
  if (!fs.existsSync(src)) {
    console.warn("skip missing", src);
    return;
  }
  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  for (let i = 0; i < width * height; i++) {
    const o = i * channels;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];
    const bg = alphaForBackground(r, g, b);
    if (bg === 0) {
      data[o + 3] = 0;
    } else if (bg < 255) {
      data[o + 3] = Math.min(data[o + 3], bg);
    }
  }

  const pngPath = path.join(outDir, `${base}.png`);
  const webpPath = path.join(outDir, `${base}.webp`);

  await sharp(data, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(pngPath);

  await sharp(data, { raw: { width, height, channels: 4 } })
    .webp({ quality: 92, alphaQuality: 100 })
    .toFile(webpPath);

  console.log("wrote", base);
}

fs.mkdirSync(outDir, { recursive: true });
for (const { src, base } of inputs) {
  await keyToAlpha(src, base);
}
