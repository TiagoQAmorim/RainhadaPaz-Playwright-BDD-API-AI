import { spawnSync } from "node:child_process";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import siteBundle from "@/data/site-bundle.json";

export async function databaseNeedsSeed(prisma: PrismaClient): Promise<boolean> {
  try {
    const [admins, pages, settings] = await Promise.all([
      prisma.admin.count(),
      prisma.page.count(),
      prisma.siteSettings.findUnique({ where: { id: 1 } }),
    ]);
    const hollowSettings = !settings || !String(settings.aboutHtml ?? "").trim();
    return admins === 0 || pages === 0 || hollowSettings;
  } catch {
    return true;
  }
}

export function runPrismaSeedFromDisk(): void {
  const root = process.cwd();
  const seedFile = path.join(root, "prisma", "seed.ts");
  const r = spawnSync(process.execPath, ["--import", "tsx", seedFile], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  if (r.status !== 0) {
    throw new Error(`prisma seed falhou (code ${r.status ?? 1})`);
  }
}

/** Site no repo inclui bundle local; produção sem rifa = import pendente. */
export async function databaseNeedsBundleImport(prisma: PrismaClient): Promise<boolean> {
  const expected = siteBundle.raffles?.length ?? 0;
  if (expected === 0) return false;
  try {
    const raffles = await prisma.raffle.count();
    return raffles === 0;
  } catch {
    return true;
  }
}

export function runSiteBundleImport(): void {
  const root = process.cwd();
  const importFile = path.join(root, "prisma", "import-bundle.ts");
  const r = spawnSync(process.execPath, ["--import", "tsx", importFile], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  if (r.status !== 0) {
    throw new Error(`import bundle falhou (code ${r.status ?? 1})`);
  }
}

export function runPrismaDbPush(): void {
  const root = process.cwd();
  const prismaCli = path.join(root, "node_modules", "prisma", "build", "index.js");
  const r = spawnSync(process.execPath, [prismaCli, "db", "push"], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  if (r.status !== 0) {
    throw new Error(`prisma db push falhou (code ${r.status ?? 1})`);
  }
}