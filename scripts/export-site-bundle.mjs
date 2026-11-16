/**
 * Exporta conteúdo do dev.db para src/data/site-bundle.json (deploy / seed).
 * Uso: node scripts/export-site-bundle.mjs
 */
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = path.join(root, "prisma", "dev.db").replace(/\\/g, "/");

const prisma = new PrismaClient({
  datasources: { db: { url: `file:${dbPath}` } },
});

const raffleTickets = await prisma.raffleTicket.findMany();
const saintIds = [...new Set(raffleTickets.map((t) => t.saintId))];

const bundle = {
  exportedAt: new Date().toISOString(),
  siteSettings: await prisma.siteSettings.findUnique({ where: { id: 1 } }),
  pages: await prisma.page.findMany(),
  posts: await prisma.post.findMany({
    include: { galleryImages: true, youtubeVideos: true },
  }),
  notices: await prisma.notice.findMany(),
  massLocations: await prisma.massLocation.findMany(),
  tercoOnlineSlots: await prisma.tercoOnlineSlot.findMany(),
  homeQuickLinks: await prisma.homeQuickLink.findMany(),
  homeHeroCtas: await prisma.homeHeroCta.findMany(),
  virtualCandles: await prisma.virtualCandle.findMany(),
  raffles: await prisma.raffle.findMany(),
  raffleTickets,
  saints:
    saintIds.length > 0
      ? await prisma.saint.findMany({ where: { id: { in: saintIds } }, orderBy: { id: "asc" } })
      : [],
};

await prisma.$disconnect();

const out = path.join(root, "src", "data", "site-bundle.json");
writeFileSync(out, JSON.stringify(bundle, null, 2), "utf8");
console.log(`[export] ${out} (${(JSON.stringify(bundle).length / 1024).toFixed(1)} KB)`);
console.log(
  `[export] posts=${bundle.posts.length} pages=${bundle.pages.length} notices=${bundle.notices.length} candles=${bundle.virtualCandles.length} raffles=${bundle.raffles.length} tickets=${bundle.raffleTickets.length} saints=${bundle.saints.length}`,
);

const sync = spawnSync(process.execPath, [path.join(root, "scripts", "sync-bundle-uploads.mjs")], {
  cwd: root,
  stdio: "inherit",
});
if (sync.status !== 0) process.exit(sync.status ?? 1);