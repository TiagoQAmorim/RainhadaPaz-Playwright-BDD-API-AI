/**
 * Une chama amarela + núcleo azul; base arredondada (fade no alpha).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "public", "candles", "candle-flame.webp");
const out = path.join(root, "public", "candles", "candle-flame-composite.webp");

const meta = await sharp(src).metadata();
const w = meta.width ?? 187;
const h = meta.height ?? 782;

const yellowH = Math.round(h * 0.795);
const yellow = await sharp(src)
  .extract({ left: 0, top: 0, width: w, height: yellowH })
  .png()
  .toBuffer();

const blueTop = Math.round(h * 0.808);
const blueH = Math.min(Math.round(h * 0.11), h - blueTop);
const blueW = Math.round(w * 0.52);
const blue = await sharp(src)
  .extract({ left: 0, top: blueTop, width: w, height: blueH })
  .resize(blueW, Math.round(blueH * 0.92))
  .png()
  .toBuffer();

const blueLeft = Math.round((w - blueW) / 2);
const overlap = Math.round(blueH * 0.72);
const canvasH = yellowH + Math.round(blueH * 0.22);

const composed = await sharp({
  create: {
    width: w,
    height: canvasH,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite([
    { input: yellow, top: 0, left: 0 },
    { input: blue, top: yellowH - overlap, left: blueLeft },
  ])
  .trim({ threshold: 8 })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = composed.info;
const data = composed.data;
const featherRows = Math.max(6, Math.round(height * 0.06));

for (let y = height - featherRows; y < height; y++) {
  const t = (y - (height - featherRows)) / featherRows;
  const round = Math.sin((t * Math.PI) / 2);
  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * channels;
    const cx = (x - width / 2) / (width / 2);
    const edge = 1 - Math.min(1, Math.abs(cx) ** 1.6);
    const alphaMul = round * (0.35 + 0.65 * edge);
    data[i + 3] = Math.round(data[i + 3] * alphaMul);
  }
}

const info = await sharp(data, { raw: { width, height, channels } })
  .webp({ quality: 94, alphaQuality: 100 })
  .toFile(out);

console.log("candle-flame-composite.webp", info.width, "x", info.height);
