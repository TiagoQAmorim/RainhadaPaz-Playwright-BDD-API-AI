/**
 * Baixa páginas do site WordPress e grava src/data/wp-pages.json para o seed.
 * Uso: npx tsx scripts/import-wp-content.ts
 */
import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import { sanitizeWpHtml } from "../src/lib/sanitize-wp-html";

const WP = "https://paroquiarainhadapaz.com.br";
const OUT = path.join(process.cwd(), "src", "data", "wp-pages.json");

type WpPage = { slug: string; title: string; body: string; featuredImage?: string };

/** slug no novo site → IDs WordPress (corpo concatenado na ordem). */
const MAP: { slug: string; title?: string; wpIds: number[] }[] = [
  { slug: "batizado", title: "Batismo", wpIds: [173, 755] },
  { slug: "curso-de-batismo", wpIds: [2038] },
  { slug: "casamento", title: "Casamento nesta Igreja", wpIds: [621] },
  { slug: "curso-de-noivos", wpIds: [179] },
  { slug: "transferencia-casamento", title: "Transferência de casamento", wpIds: [740] },
  { slug: "crisma", title: "Crisma", wpIds: [176] },
  { slug: "crisma-jovens", wpIds: [185] },
  { slug: "catequese-infantil", wpIds: [182] },
  { slug: "catequese", wpIds: [206] },
  { slug: "dizimo", title: "Dízimo", wpIds: [1255] },
  { slug: "paroco", title: "Pároco", wpIds: [21] },
  { slug: "padroeira", title: "Padroeira", wpIds: [26] },
  { slug: "matriz-paroquial", wpIds: [18] },
  { slug: "capela-santa-maria", wpIds: [552] },
  { slug: "terco-online", title: "Terço online", wpIds: [3441] },
  { slug: "contato", wpIds: [54] },
  { slug: "diocese", wpIds: [29] },
  { slug: "bispo", wpIds: [32] },
  { slug: "intencoes-de-missa", wpIds: [2283] },
];

const LINK_REPLACEMENTS: [RegExp | string, string][] = [
  [/https?:\/\/(www2?\.)?paroquiarainhadapaz\.com\.br\/dizimo\/?/gi, "/sacramentos/dizimo"],
  [/https?:\/\/(www2?\.)?paroquiarainhadapaz\.com\.br\/casamento-nesta-igreja\/?/gi, "/sacramentos/casamento"],
  [/https?:\/\/(www2?\.)?paroquiarainhadapaz\.com\.br\/curso-de-noivos\/?/gi, "/sacramentos/curso-de-noivos"],
  [/https?:\/\/(www2?\.)?paroquiarainhadapaz\.com\.br\/batismo\/?/gi, "/sacramentos/batizado"],
  [/https?:\/\/(www2?\.)?paroquiarainhadapaz\.com\.br\/catequese-de-adultos\/?/gi, "/sacramentos/crisma"],
  [/https?:\/\/(www2?\.)?paroquiarainhadapaz\.com\.br\/horarios\/?/gi, "/horarios"],
  [/https?:\/\/(www2?\.)?paroquiarainhadapaz\.com\.br\/contato\/?/gi, "/contato"],
  [/https?:\/\/(www2?\.)?paroquiarainhadapaz\.com\.br\/capela-do-colegio-santa-maria\/?/gi, "/horarios"],
  [/https?:\/\/(www2?\.)?paroquiarainhadapaz\.com\.br\/matriz-paroquial\/?/gi, "/institucional"],
  [/https?:\/\/(www2?\.)?paroquiarainhadapaz\.com\.br\/catequese-infantil\/?/gi, "/sacramentos/catequese-infantil"],
  [/https?:\/\/(www2?\.)?paroquiarainhadapaz\.com\.br\/curso-de-batismo\/?/gi, "/sacramentos/curso-de-batismo"],
  [/https?:\/\/(www2?\.)?paroquiarainhadapaz\.com\.br\/batizado-coletivo-ou-individual\/?/gi, "/sacramentos/batizado"],
  [/https?:\/\/(www2?\.)?paroquiarainhadapaz\.com\.br\/catequese\/?/gi, "/sacramentos/catequese"],
];

function cleanHtml(html: string, slug: string): string {
  let out = html;
  for (const [from, to] of LINK_REPLACEMENTS) {
    out = out.replace(from as RegExp, to);
  }
  out = out.replace(/src="\/wp-content\//gi, `src="${WP}/wp-content/`);
  return sanitizeWpHtml(out, { slug });
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json() as Promise<T>;
}

async function featuredImageUrl(page: {
  featured_media?: number;
}): Promise<string | undefined> {
  if (!page.featured_media) return undefined;
  try {
    const media = await fetchJson<{ source_url?: string }>(
      `${WP}/wp-json/wp/v2/media/${page.featured_media}`,
    );
    return media.source_url;
  } catch {
    return undefined;
  }
}

async function fetchWpPage(id: number) {
  return fetchJson<{
    title: { rendered: string };
    content: { rendered: string };
    featured_media?: number;
  }>(`${WP}/wp-json/wp/v2/pages/${id}?context=view`);
}

async function main() {
  const pages: WpPage[] = [];

  for (const entry of MAP) {
    const parts: string[] = [];
    let title = entry.title ?? "";
    let featuredImage: string | undefined;

    for (const id of entry.wpIds) {
      const wp = await fetchWpPage(id);
      if (!title) title = wp.title.rendered.replace(/&#8211;/g, "—").replace(/&amp;/g, "&");
      const img = await featuredImageUrl(wp);
      if (img && !featuredImage) featuredImage = img;
      parts.push(cleanHtml(wp.content.rendered, entry.slug));
    }

    let body = parts.join("\n<hr class=\"my-8 border-parish-200\" />\n");
    if (featuredImage) {
      body = `<figure class="mb-8 overflow-hidden rounded-2xl"><img src="${featuredImage}" alt="" class="w-full h-auto" loading="lazy" /></figure>\n${body}`;
    }

    pages.push({ slug: entry.slug, title, body, featuredImage });
    console.log("OK", entry.slug);
  }

  mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify({ importedAt: new Date().toISOString(), pages }, null, 2), "utf8");
  console.log("Wrote", OUT, `(${pages.length} pages)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
