import type { PrismaClient } from "@prisma/client";
import { isProdRuntime } from "@/lib/prod-runtime";

/**
 * Importar site-bundle em produção: só com ALLOW_SITE_BUNDLE_IMPORT=true.
 * Restauração normal usa backup do volume (/data/backups), não o Git.
 */
export async function allowSiteBundleRestore(_prisma: PrismaClient): Promise<boolean> {
  if (!isProdRuntime()) return true;
  return process.env.ALLOW_SITE_BUNDLE_IMPORT === "true";
}

/**
 * Restaurar cópia de produção (/data/backups) no lugar do SQLite atual.
 * - Banco vazio ou parcialmente vazio: permitido.
 * - Com conteúdo cheio: só com ALLOW_FORCE_PROD_BACKUP_RESTORE=true (sobrescreve o .db).
 */
export async function allowProdBackupRestore(prisma: PrismaClient): Promise<boolean> {
  if (!isProdRuntime()) return true;
  if (process.env.ALLOW_FORCE_PROD_BACKUP_RESTORE === "true") return true;

  const [pages, posts, raffles, locations] = await Promise.all([
    prisma.page.count(),
    prisma.post.count(),
    prisma.raffle.count(),
    prisma.massLocation.count(),
  ]);
  const empty = pages === 0 && posts === 0 && raffles === 0;
  const partial = posts === 0 || pages === 0 || locations === 0;
  return empty || partial;
}

export async function databaseLooksEmpty(prisma: PrismaClient): Promise<boolean> {
  const [pages, posts, raffles] = await Promise.all([
    prisma.page.count(),
    prisma.post.count(),
    prisma.raffle.count(),
  ]);
  return pages === 0 && posts === 0 && raffles === 0;
}