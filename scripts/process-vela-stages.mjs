import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetDir = path.join(
  root,
  "..",
  "..",
  ".cursor",
  "projects",
  "c-Users-Dell-Documents-RainhadaPaz",
  "assets",
);
const outDir = path.join(root, "public", "candles");

const stages = [
  { pct: 100, pattern: "Vela100" },
  { pct: 80, pattern: "Vela80" },
  { pct: 60, pattern: "Vela60" },
  { pct: 40, pattern: "Vela40" },
  { pct: 20, pattern: "Vela20" },
  { pct: 5, pattern: "Vela5" },
];

function findAsset(pattern) {
  const files = fs.readdirSync(assetDir);
  const hit = files.find((f) => f.includes(pattern) && f.endsWith(".png"));
  if (!hit) throw new Error(`missing ${pattern}`);
  return path.join(assetDir, hit);
}

function alphaKey(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const spread = max - min;
  const lum = (r + g + b) / 3;
  if (max <= 58 && lum <= 55) return 0;
  if (lum <= 52 && spread <= 48) return 0;
  if (lum <= 68 && spread <= 12) return 0;
  if (spread < 22 && lum > 158) {
    if (lum > 246) return 0;
    const t = (lum - 158) / 88;
    return Math.round(255 * Math.min(1, Math.max(0, t)));
  }
  return 255;
}

async function processStage(src, pct) {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  for (let i = 0; i < width * height; i++) {
    const o = i * channels;
    const a = alphaKey(data[o], data[o + 1], data[o + 2]);
    if (a === 0) data[o + 3] = 0;
    else if (a < 255) data[o + 3] = Math.min(data[o + 3], a);
  }

  const trimmed = await sharp(data, { raw: { width, height, channels: 4 } })
    .trim({ threshold: 10 })
    .toBuffer({ resolveWithObject: true });

  const tw = trimmed.info.width;
  const th = trimmed.info.height;
  const base = `vela-${pct}`;
  const webpPath = path.join(outDir, `${base}.webp`);
  const pngPath = path.join(outDir, `${base}.png`);

  await sharp(trimmed.data, {
    raw: { width: tw, height: th, channels: trimmed.info.channels },
  })
    .webp({ quality: 92, alphaQuality: 100 })
    .toFile(webpPath);

  await sharp(trimmed.data, {
    raw: { width: tw, height: th, channels: trimmed.info.channels },
  })
    .png({ compressionLevel: 9 })
    .toFile(pngPath);

  return { pct, width: tw, height: th, heightRatio: th / tw };
}

async function processNamed(src, base) {
  if (!fs.existsSync(src)) {
    console.warn("skip missing", src);
    return null;
  }
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  for (let i = 0; i < width * height; i++) {
    const o = i * channels;
    const a = alphaKey(data[o], data[o + 1], data[o + 2]);
    if (a === 0) data[o + 3] = 0;
    else if (a < 255) data[o + 3] = Math.min(data[o + 3], a);
  }
  const trimmed = await sharp(data, { raw: { width, height, channels: 4 } })
    .trim({ threshold: 12 })
    .toBuffer({ resolveWithObject: true });
  const tw = trimmed.info.width;
  const th = trimmed.info.height;
  await sharp(trimmed.data, {
    raw: { width: tw, height: th, channels: trimmed.info.channels },
  })
    .webp({ quality: 92, alphaQuality: 100 })
    .toFile(path.join(outDir, `${base}.webp`));
  await sharp(trimmed.data, {
    raw: { width: tw, height: th, channels: trimmed.info.channels },
  })
    .png({ compressionLevel: 9 })
    .toFile(path.join(outDir, `${base}.png`));
  console.log("wrote", base, tw, th);
  return { tw, th };
}

fs.mkdirSync(outDir, { recursive: true });
const meta = [];
for (const { pct, pattern } of stages) {
  const src = findAsset(pattern);
  const m = await processStage(src, pct);
  meta.push(m);
  console.log("wrote", pct, m);
}

const metaPath = path.join(root, "src", "lib", "candle-stage-meta.json");
fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
console.log("meta ->", metaPath);
