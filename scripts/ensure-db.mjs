/**
 * Railway: db push + seed quando banco vazio antes do Next.
 */
import { spawnSync } from "node:child_process";
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

const isProduction = process.env.NODE_ENV === "production";

async function databaseNeedsSeed(prisma) {
  try {
    const admins = await prisma.admin.count();
    if (isProduction) {
      // Produção: seed só se não existir admin (nunca reimportar conteúdo no deploy).
      return admins === 0;
    }
    const [pages, settings] = await Promise.all([
      prisma.page.count(),
      prisma.siteSettings.findUnique({ where: { id: 1 } }),
    ]);
    const hollow = !settings || !String(settings.aboutHtml ?? "").trim();
    return admins === 0 || pages === 0 || hollow;
  } catch {
    return !isProduction;
  }
}

const prismaCli = path.join(appRoot, "node_modules", "prisma", "build", "index.js");
runNode([prismaCli, "db", "push"], "prisma db push");
runNode(["--import", "tsx", path.join(appRoot, "scripts", "sync-admin-from-env.ts")], "sync admin password");

const prisma = new PrismaClient();
try {
  if (await databaseNeedsSeed(prisma)) {
    console.log("[ensure-db] Banco vazio ou incompleto — seed…");
    runNode(["--import", "tsx", path.join(appRoot, "prisma", "seed.ts")], "prisma seed");
  } else {
    console.log("[ensure-db] Banco já populado — seed ignorado");
  }

  try {
    const stale = async () => {
      const posts = await prisma.post.findMany({ select: { coverImage: true } });
      const notices = await prisma.notice.findMany({ select: { coverImage: true } });
      const bad = (u) => u && /^\/uploads\/\d/.test(u);
      return posts.some((p) => bad(p.coverImage)) || notices.some((n) => bad(n.coverImage));
    };
    const raffles = await prisma.raffle.count();
    const bundleExpected =
      (await import(path.join(appRoot, "src", "data", "site-bundle.json"), { assert: { type: "json" } }))
        .default?.raffles?.length ?? 0;
    const allowBootBundle =
      process.env.FORCE_SITE_BUNDLE_IMPORT === "true" ||
      (!isProduction && bundleExpected > 0 && raffles === 0);
  if (allowBootBundle) {
      console.log("[ensure-db] Importando site-bundle (rifas, velas, posts)…");
      runNode(["--import", "tsx", path.join(appRoot, "prisma", "import-bundle.ts")], "site bundle");
    } else if (!isProduction && (await stale())) {
      console.log(
        "[ensure-db] Capas antigas detectadas — em dev rode npm run db:import-bundle manualmente.",
      );
    }
  } catch (e) {
    console.warn("[ensure-db] site-bundle:", e);
  }
} finally {
  await prisma.$disconnect();
}

console.log("[ensure-db] Subindo Next.js…");
const nextBin = path.join(appRoot, "node_modules", "next", "dist", "bin", "next");
const start = spawnSync(process.execPath, [nextBin, "start", "--hostname", "0.0.0.0"], {
  cwd: appRoot,
  stdio: "inherit",
  env: process.env,
});
process.exit(start.status ?? 1);