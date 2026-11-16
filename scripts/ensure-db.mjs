/**
 * Boot: prisma db push + sync admin. Produção nunca roda seed nem site-bundle.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const appRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function runNode(args, label) {
  console.log(`[ensure-db] ${label}…`);
  const r = spawnSync(process.execPath, args, {
    cwd: appRoot,
    stdio: "inherit",
    env: process.env,
  });
  if (r.status !== 0) {
    console.error(`[ensure-db] ${label} falhou (code ${r.status ?? 1})`);
    process.exit(r.status ?? 1);
  }
}

function isProdRuntime() {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.RAILWAY_ENVIRONMENT != null ||
    process.env.RAILWAY_SERVICE_ID != null ||
    process.env.RAILWAY_PROJECT_ID != null
  );
}

async function databaseNeedsSeed(prisma) {
  if (isProdRuntime()) return false;
  try {
    const admins = await prisma.admin.count();
    const [pages, settings] = await Promise.all([
      prisma.page.count(),
      prisma.siteSettings.findUnique({ where: { id: 1 } }),
    ]);
    const hollow = !settings || !String(settings.aboutHtml ?? "").trim();
    return admins === 0 || pages === 0 || hollow;
  } catch {
    return false;
  }
}

if (isProdRuntime()) {
  const dbUrl = (process.env.DATABASE_URL ?? "").replace(/\\/g, "/");
  if (!dbUrl.startsWith("file:/data/")) {
    console.error(
      "[ensure-db] ALERTA: DATABASE_URL deve ser file:/data/rainhadapaz.db. Atual:",
      dbUrl || "(vazio)",
      "— sem volume, cada deploy usa banco vazio.",
    );
  } else if (!fs.existsSync("/data")) {
    console.error("[ensure-db] ALERTA: /data não existe — monte volume Railway em /data.");
  }
}

const prismaCli = path.join(appRoot, "node_modules", "prisma", "build", "index.js");
runNode([prismaCli, "db", "push"], "prisma db push");
runNode(["--import", "tsx", path.join(appRoot, "scripts", "sync-admin-from-env.ts")], "sync admin password");

async function prodDbHealthCheck() {
  const dbUrl = process.env.DATABASE_URL ?? "";
  console.log(`[ensure-db] DATABASE_URL=${dbUrl.replace(/\\/g, "/")}`);
  if (!dbUrl.includes("/data/")) {
    console.error(
      "[ensure-db] ALERTA CRÍTICO: produção deve usar file:/data/rainhadapaz.db com volume Railway em /data. Sem isso cada deploy cria banco vazio.",
    );
  }
  const filePath = dbUrl.startsWith("file:") ? dbUrl.slice(5) : "";
  if (filePath) {
    try {
      const st = fs.statSync(filePath);
      console.log(`[ensure-db] SQLite: ${filePath} (${(st.size / 1024).toFixed(1)} KB)`);
    } catch {
      console.error(`[ensure-db] SQLite não encontrado em ${filePath} — db push criou arquivo novo/vazio.`);
    }
  }
  const prisma = new PrismaClient();
  try {
    const [pages, posts, raffles] = await Promise.all([
      prisma.page.count(),
      prisma.post.count(),
      prisma.raffle.count(),
    ]);
    console.log(`[ensure-db] Contagens: pages=${pages} posts=${posts} raffles=${raffles}`);
    if (pages === 0 && posts === 0 && raffles === 0) {
      console.error(
        "[ensure-db] BANCO VAZIO no volume — o deploy NÃO importou conteúdo (proposital). Verifique volume /data ou restaure com ALLOW_SITE_BUNDLE_IMPORT=true + import-bundle.",
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

if (isProdRuntime()) {
  console.log(
    "[ensure-db] Produção: conteúdo preservado (rifas, notícias, páginas, velas, etc. não são reimportados).",
  );
  await prodDbHealthCheck();
} else {
  const prisma = new PrismaClient();
  try {
    if (await databaseNeedsSeed(prisma)) {
      console.log("[ensure-db] Dev: banco vazio — seed…");
      runNode(["--import", "tsx", path.join(appRoot, "prisma", "seed.ts")], "prisma seed");
    } else {
      console.log("[ensure-db] Dev: seed ignorado (banco já populado)");
    }

    try {
      const raffles = await prisma.raffle.count();
      const bundleExpected =
        (await import(path.join(appRoot, "src", "data", "site-bundle.json"), { assert: { type: "json" } }))
          .default?.raffles?.length ?? 0;
      const allowBootBundle =
        process.env.FORCE_SITE_BUNDLE_IMPORT === "true" || (bundleExpected > 0 && raffles === 0);
      if (allowBootBundle) {
        console.log("[ensure-db] Dev: importando site-bundle…");
        runNode(["--import", "tsx", path.join(appRoot, "prisma", "import-bundle.ts")], "site bundle");
      }
    } catch (e) {
      console.warn("[ensure-db] site-bundle:", e);
    }
  } finally {
    await prisma.$disconnect();
  }
}

console.log("[ensure-db] Subindo Next.js…");
const nextBin = path.join(appRoot, "node_modules", "next", "dist", "bin", "next");
const start = spawnSync(process.execPath, [nextBin, "start", "--hostname", "0.0.0.0"], {
  cwd: appRoot,
  stdio: "inherit",
  env: process.env,
});
process.exit(start.status ?? 1);