import wpPages from "@/data/wp-pages.json";
import { sanitizeWpHtml } from "@/lib/sanitize-wp-html";

export type WpImportedPage = {
  slug: string;
  title: string;
  body: string;
  featuredImage?: string;
};

export function getWpImportedPages(): WpImportedPage[] {
  return (wpPages.pages as WpImportedPage[]).map((p) => ({
    ...p,
    body: sanitizeWpHtml(p.body, { slug: p.slug }),
  }));
}

export function getWpImportedPage(slug: string): WpImportedPage | undefined {
  const page = (wpPages.pages as WpImportedPage[]).find((p) => p.slug === slug);
  if (!page) return undefined;
  return { ...page, body: sanitizeWpHtml(page.body, { slug: page.slug }) };
}

/** Páginas exibidas no índice /sacramentos */
export const SACRAMENT_INDEX_SLUGS = [
  "catequese",
  "batizado",
  "curso-de-batismo",
  "casamento",
  "curso-de-noivos",
  "transferencia-casamento",
  "crisma",
  "crisma-jovens",
  "catequese-infantil",
  "dizimo",
  "intencoes-de-missa",
] as const;
