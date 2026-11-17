import fs from "node:fs";
import path from "node:path";
import type { PrismaClient } from "@prisma/client";

function sqlitePathFromEnv(): string {
  const url = (process.env.DATABASE_URL ?? "").trim();
  if (!url.startsWith("file:")) {
    throw new Error("DATABASE_URL deve ser file:... para backup SQLite");
  }
  return url.slice(5).replace(/\\/g, "/");
}

function backupDirectory(dbPath: string): string {
  const custom = process.env.BACKUP_DIR?.trim();
  if (custom) return custom.replace(/\\/g, "/");
  return path.join(path.dirname(dbPath), "backups").replace(/\\/g, "/");
}

function retentionDays(): number {
  const n = Number(process.env.BACKUP_RETENTION_DAYS ?? "14");
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 14;
}

/** Remove rainhadapaz-YYYY-MM-DD.db mais antigos que a retenção. */
function pruneOldBackups(backupDir: string, keepDays: number): number {
  const files = fs.readdirSync(backupDir).filter((f) => /^rainhadapaz-\d{4}-\d{2}-\d{2}\.db$/i.test(f));
  const cutoff = Date.now() - keepDays * 24 * 60 * 60 * 1000;
  let removed = 0;
  for (const name of files) {
    const full = path.join(backupDir, name);
    const m = name.match(/rainhadapaz-(\d{4}-\d{2}-\d{2})\.db/);
    const day = m?.[1] ? new Date(`${m[1]}T12:00:00Z`).getTime() : fs.statSync(full).mtimeMs;
    if (day < cutoff) {
      fs.unlinkSync(full);
      removed++;
    }
  }
  return removed;
}

export type BackupResult = {
  backupDir: string;
  backupFile: string;
  bytes: number;
  manifestFile: string;
  pruned: number;
  counts: {
    pages: number;
    posts: number;
    notices: number;
    raffles: number;
    raffleTickets: number;
    candles: number;
  };
};

/** Cópia atômica do .db + manifest JSON (mesmo volume /data). */
export async function runDatabaseBackup(prisma: PrismaClient): Promise<BackupResult> {
  const dbPath = sqlitePathFromEnv();
  if (!fs.existsSync(dbPath)) {
    throw new Error(`Arquivo do banco não encontrado: ${dbPath}`);
  }

  await prisma.$executeRawUnsafe("PRAGMA wal_checkpoint(FULL)");

  const backupDir = backupDirectory(dbPath);
  fs.mkdirSync(backupDir, { recursive: true });

  const day = new Date().toISOString().slice(0, 10);
  const backupFile = path.join(backupDir, `rainhadapaz-${day}.db`);
  const tmp = `${backupFile}.tmp`;
  fs.copyFileSync(dbPath, tmp);
  fs.renameSync(tmp, backupFile);

  const [pages, posts, notices, raffles, raffleTickets, candles] = await Promise.all([
    prisma.page.count(),
    prisma.post.count(),
    prisma.notice.count(),
    prisma.raffle.count(),
    prisma.raffleTicket.count(),
    prisma.virtualCandle.count(),
  ]);

  const manifest = {
    createdAt: new Date().toISOString(),
    sourceDb: dbPath,
    backupFile,
    counts: { pages, posts, notices, raffles, raffleTickets, candles },
  };
  const manifestFile = path.join(backupDir, `manifest-${day}.json`);
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2), "utf8");

  const pruned = pruneOldBackups(backupDir, retentionDays());
  const bytes = fs.statSync(backupFile).size;

  return {
    backupDir,
    backupFile,
    bytes,
    manifestFile,
    pruned,
    counts: manifest.counts,
  };
}