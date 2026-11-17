import fs from "node:fs";
import path from "node:path";

type ManifestCounts = {
  pages?: number;
  posts?: number;
  raffles?: number;
};

export type ProductionBackupCandidate = {
  day: string;
  dbFile: string;
  manifestFile: string;
  counts: ManifestCounts;
};

export function sqlitePathFromDatabaseUrl(): string | null {
  const url = (process.env.DATABASE_URL ?? "").trim();
  if (!url.startsWith("file:")) return null;
  return url.slice(5).replace(/\\/g, "/");
}

export function backupDirForDb(dbPath: string): string {
  const custom = process.env.BACKUP_DIR?.trim();
  if (custom) return custom.replace(/\\/g, "/");
  return path.join(path.dirname(dbPath), "backups").replace(/\\/g, "/");
}

function manifestHasContent(counts: ManifestCounts): boolean {
  return (counts.pages ?? 0) > 0 || (counts.raffles ?? 0) > 0 || (counts.posts ?? 0) > 0;
}

/** Lista backups com manifest e .db presentes (mais recente primeiro). */
export function listProductionBackups(dbPath: string): ProductionBackupCandidate[] {
  const backupDir = backupDirForDb(dbPath);
  if (!fs.existsSync(backupDir)) return [];

  const manifests = fs
    .readdirSync(backupDir)
    .filter((f) => f.startsWith("manifest-") && f.endsWith(".json"))
    .sort()
    .reverse();

  const out: ProductionBackupCandidate[] = [];
  for (const mf of manifests) {
    try {
      const manifest = JSON.parse(fs.readFileSync(path.join(backupDir, mf), "utf8")) as {
        counts?: ManifestCounts;
      };
      if (!manifest.counts || !manifestHasContent(manifest.counts)) continue;

      const day = mf.slice("manifest-".length, -".json".length);
      const dbFile = path.join(backupDir, `rainhadapaz-${day}.db`);
      if (!fs.existsSync(dbFile)) continue;

      out.push({
        day,
        dbFile,
        manifestFile: path.join(backupDir, mf),
        counts: manifest.counts,
      });
    } catch {
      continue;
    }
  }
  return out;
}

export function hasUsableProductionBackup(dbPath: string): boolean {
  return listProductionBackups(dbPath).length > 0;
}

export type RestoreFromBackupOptions = {
  /** Boot automático: respeita AUTO_RESTORE_FROM_BACKUP=false */
  respectAutoRestoreDisable?: boolean;
  /** Restaurar um dia específico (YYYY-MM-DD); padrão = mais recente com conteúdo */
  day?: string;
};

/** Copia o .db do backup de produção (manifest em /data/backups). */
export function restoreDatabaseFromLatestBackup(
  dbPath: string,
  options: RestoreFromBackupOptions = {},
): string | null {
  if (options.respectAutoRestoreDisable && process.env.AUTO_RESTORE_FROM_BACKUP === "false") {
    return null;
  }

  const candidates = listProductionBackups(dbPath);
  if (candidates.length === 0) return null;

  const pick = options.day
    ? candidates.find((c) => c.day === options.day) ?? null
    : candidates[0];
  if (!pick) return null;

  try {
    removeSqliteSidecars(dbPath);
    const tmp = `${dbPath}.restore.tmp`;
    fs.copyFileSync(pick.dbFile, tmp);
    fs.renameSync(tmp, dbPath);
    removeSqliteSidecars(dbPath);
    return pick.dbFile;
  } catch {
    return null;
  }
}

/** O diário do banco vazio, se ficar ao lado do .db, reaplica o wipe por cima do backup. */
function removeSqliteSidecars(dbPath: string) {
  for (const ext of ["-wal", "-shm"]) {
    const sidecar = `${dbPath}${ext}`;
    try {
      if (fs.existsSync(sidecar)) fs.unlinkSync(sidecar);
    } catch {
      /* o próximo open recria se ainda houver conexão */
    }
  }
}