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

function restoreFromLatestBackup(dbPath) {
  if (process.env.AUTO_RESTORE_FROM_BACKUP === "false") return null;
  const backupDir = path.join(path.dirname(dbPath), "backups");
  if (!fs.existsSync(backupDir)) return null;
  const manifests = fs
    .readdirSync(backupDir)
    .filter((f) => f.startsWith("manifest-") && f.endsWith(".json"))
    .sort()
    .reverse();
  for (const mf of manifests) {
    try {
      const manifest = JSON.parse(fs.readFileSync(path.join(backupDir, mf), "utf8"));
      const c = manifest.counts ?? {};
      if ((c.pages ?? 0) === 0 && (c.raffles ?? 0) === 0 && (c.posts ?? 0) === 0) continue;
      const day = mf.slice("manifest-".length, -".json".length);
      const src = path.join(backupDir, `rainhadapaz-${day}.db`);
      if (!fs.existsSync(src)) continue;
      const tmp = `${dbPath}.restore.tmp`;
      fs.copyFileSync(src, tmp);
      fs.renameSync(tmp, dbPath);
      console.log("[ensure-db] SQLite restaurado do backup:", src, c);
      return src;
    } catch {
      /* próximo manifest */
    }
  }
  return null;
}

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
  let prisma = new PrismaClient();
  try {
    const readCounts = async () =>
      Promise.all([prisma.page.count(), prisma.post.count(), prisma.raffle.count()]);

    let [pages, posts, raffles] = await readCounts();
    if (pages === 0 && posts === 0 && raffles === 0 && filePath) {
      const restored = restoreFromLatestBackup(filePath);
      if (restored) {
        await prisma.$disconnect();
        prisma = new PrismaClient();
        [pages, posts, raffles] = await readCounts();
      }
    }
    console.log(`[ensure-db] Contagens: pages=${pages} posts=${posts} raffles=${raffles}`);
    if (pages === 0 && posts === 0 && raffles === 0) {
      console.error(
        "[ensure-db] BANCO VAZIO — deploy não apaga dados; restaure import-bundle ou confira volume /data.",
      );
    } else if (process.env.AUTO_BACKUP_ON_BOOT !== "false") {
      console.log("[ensure-db] Backup pós-boot (com conteúdo)…");
      runNode(["--import", "tsx", path.join(appRoot, "scripts", "post-boot-backup.ts")], "backup");
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