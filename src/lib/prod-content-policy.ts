import type { PrismaClient } from "@prisma/client";
import { isProdRuntime } from "@/lib/prod-runtime";

/**
 * Importar site-bundle em produção:
 * - Com dados cadastrados: só com ALLOW_SITE_BUNDLE_IMPORT=true (deploy não toca).
 * - Banco catastroficamente vazio (volume perdido): permite restaurar sem flag.
 */
export async function allowSiteBundleRestore(prisma: PrismaClient): Promise<boolean> {
  if (!isProdRuntime()) return true;
  if (process.env.ALLOW_SITE_BUNDLE_IMPORT === "true") return true;

  const [pages, posts, raffles] = await Promise.all([
    prisma.page.count(),
    prisma.post.count(),
    prisma.raffle.count(),
  ]);
  return pages === 0 && posts === 0 && raffles === 0;
}