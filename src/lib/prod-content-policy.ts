import { isProdRuntime } from "@/lib/prod-runtime";

/**
 * Importar / restaurar `site-bundle` (rifas, notícias, páginas, velas, etc.).
 * Em produção fica desligado por padrão — deploys só atualizam código.
 * Ligue só conscientemente: ALLOW_SITE_BUNDLE_IMPORT=true nas Variables.
 */
export function allowSiteBundleRestore(): boolean {
  if (!isProdRuntime()) return true;
  return process.env.ALLOW_SITE_BUNDLE_IMPORT === "true";
}