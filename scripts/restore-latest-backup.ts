/**
 * CLI para boot: restaura SQLite do último backup de produção em /data/backups.
 * Uso: npx tsx scripts/restore-latest-backup.ts [caminho-do-.db]
 */
import { restoreDatabaseFromLatestBackup, sqlitePathFromDatabaseUrl } from "../src/lib/db-restore-from-backup";

const dbPath = process.argv[2]?.trim() || sqlitePathFromDatabaseUrl();
if (!dbPath) {
  console.error("[restore-latest-backup] DATABASE_URL ou caminho do .db ausente");
  process.exit(1);
}

const src = restoreDatabaseFromLatestBackup(dbPath, {
  respectAutoRestoreDisable: true,
  preferFullest: process.argv.includes("--fullest"),
});
if (src) {
  console.log("[restore-latest-backup] OK:", src);
  process.exit(0);
}
console.log("[restore-latest-backup] Nenhum backup utilizável");
process.exit(2);