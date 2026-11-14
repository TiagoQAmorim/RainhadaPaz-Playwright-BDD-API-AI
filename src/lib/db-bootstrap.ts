import { spawnSync } from "node:child_process";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

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