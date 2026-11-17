import fs from "node:fs";
import path from "node:path";

type ManifestCounts = {
  pages?: number;
  posts?: number;
  raffles?: number;
};

function backupDirForDb(dbPath: string): string {
  const custom = process.env.BACKUP_DIR?.trim();
  if (custom) return custom.replace(/\\/g, "/");
  return path.join(path.dirname(dbPath), "backups").replace(/\\/g, "/");
}

function manifestHasContent(counts: ManifestCounts): boolean {
  return (counts.pages ?? 0) > 0 || (counts.raffles ?? 0) > 0 || (counts.posts ?? 0) > 0;
}

/** Copia o .db do backup mais recente com conteúdo (manifest). */
export function restoreDatabaseFromLatestBackup(dbPath: string): string | null {
  if (process.env.AUTO_RESTORE_FROM_BACKUP === "false") return null;

  const backupDir = backupDirForDb(dbPath);
  if (!fs.existsSync(backupDir)) return null;

  const manifests = fs
    .readdirSync(backupDir)
    .filter((f) => f.startsWith("manifest-") && f.endsWith(".json"))
    .sort()
    .reverse();

  for (const mf of manifests) {
    try {
      const manifest = JSON.parse(fs.readFileSync(path.join(backupDir, mf), "utf8")) as {
        counts?: ManifestCounts;
      };
      if (!manifest.counts || !manifestHasContent(manifest.counts)) continue;

      const day = mf.slice("manifest-".length, -".json".length);
      const src = path.join(backupDir, `rainhadapaz-${day}.db`);
      if (!fs.existsSync(src)) continue;

      const tmp = `${dbPath}.restore.tmp`;
      fs.copyFileSync(src, tmp);
      fs.renameSync(tmp, dbPath);
      return src;
    } catch {
      continue;
    }
  }
  return null;
}