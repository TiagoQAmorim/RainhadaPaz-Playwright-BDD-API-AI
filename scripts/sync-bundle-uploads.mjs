/**
 * Copia uploads do admin (/uploads/arquivo.ext) para migrated/ e atualiza site-bundle.json.
 * Uso: node scripts/sync-bundle-uploads.mjs
 */
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundlePath = path.join(root, "src", "data", "site-bundle.json");
const uploadRe = /\/uploads\/(?!migrated\/)([A-Za-z0-9._-]+)/g;

let json = readFileSync(bundlePath, "utf8");
const names = new Set();
for (const m of json.matchAll(uploadRe)) names.add(m[1]);

const migratedDir = path.join(root, "public", "uploads", "migrated");
mkdirSync(migratedDir, { recursive: true });

let copied = 0;
for (const filename of names) {
  const src = path.join(root, "public", "uploads", filename);
  if (!existsSync(src)) {
    console.warn(`[sync-uploads] arquivo ausente: public/uploads/${filename}`);
    continue;
  }
  const destName =
    createHash("sha256").update(`admin:${filename}`).digest("hex").slice(0, 20) +
    path.extname(filename).toLowerCase();
  const dest = path.join(migratedDir, destName);
  if (!existsSync(dest)) {
    copyFileSync(src, dest);
    copied++;
  }
  const from = `/uploads/${filename}`;
  const to = `/uploads/migrated/${destName}`;
  json = json.split(from).join(to);
}

writeFileSync(bundlePath, json, "utf8");
console.log(`[sync-uploads] ${names.size} referência(s), ${copied} novo(s) em migrated/`);