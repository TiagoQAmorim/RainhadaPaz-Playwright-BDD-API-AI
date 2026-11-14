/**
 * Railway: db push + seed (se sem admin) antes do Next.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const appRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function runNodeArgs(args, label) {
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

function runNpmScript(script, label) {
  console.log(`[ensure-db] ${label}…`);
  const r = spawnSync("npm", ["run", script], {
    cwd: appRoot,
    stdio: "inherit",
    env: process.env,
    shell: true,
  });
  if (r.status !== 0) {
    console.error(`[ensure-db] ${label} falhou (code ${r.status ?? 1})`);
    process.exit(r.status ?? 1);
  }
}

const prismaCli = path.join(appRoot, "node_modules", "prisma", "build", "index.js");
runNodeArgs([prismaCli, "db", "push"], "prisma db push");

let needSeed = true;
const prisma = new PrismaClient();
try {
  const admins = await prisma.admin.count();
  needSeed = admins === 0;
  if (needSeed) {
    console.log("[ensure-db] Nenhum admin — rodando seed…");
    runNodeArgs(["--import", "tsx", path.join(appRoot, "prisma", "seed.ts")], "prisma seed");
  } else {
    console.log("[ensure-db] Admin já existe — seed ignorado");
  }
} catch (e) {
  console.warn("[ensure-db] Erro ao ler admins, tentando seed:", e);
  if (needSeed) {
    runNodeArgs(["--import", "tsx", path.join(appRoot, "prisma", "seed.ts")], "prisma seed");
  }
} finally {
  await prisma.$disconnect();
}

runNpmScript("start:next", "next start");