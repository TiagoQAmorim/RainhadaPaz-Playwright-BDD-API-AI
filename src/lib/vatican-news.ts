import { unstable_cache } from "next/cache";

export const VATICAN_NEWS_RSS_URL = "https://www.vaticannews.va/pt.rss.xml";
export const VATICAN_NEWS_HOME_URL = "https://www.vaticannews.va/pt.html";

export type VaticanNewsItem = {
  title: string;
  link: string;
  excerpt: string;
  publishedAt: Date;
  imageUrl?: string;
};

/** `unstable_cache` serializa datas como string — normaliza antes de exibir. */
export function parseVaticanPublishedAt(value: Date | string): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function normalizeVaticanNewsItems(items: VaticanNewsItem[]): VaticanNewsItem[] {
  return items.map((item) => ({
    ...item,
    publishedAt: parseVaticanPublishedAt(item.publishedAt as Date | string),
  }));
}

function cdataValue(block: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, "i");
  const cdata = block.match(re);
  if (cdata?.[1]) return cdata[1].trim();
  const plain = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i").exec(block);
  return plain?.[1]?.trim().replace(/<!\[CDATA\[|\]\]>/g, "") ?? "";
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Parser RSS usado em testes e no fetch. */
export function parseVaticanNewsRss(xml: string, limit = 12): VaticanNewsItem[] {
  const items: VaticanNewsItem[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;
  while ((match = itemRe.exec(xml)) !== null && items.length < limit) {
    const block = match[1];
    const title = stripHtml(cdataValue(block, "title"));
    const link =
      cdataValue(block, "link") ||
      (block.match(/<link>([^<]+)<\/link>/i)?.[1]?.trim() ?? "");
    if (!title || !link) continue;

    const description = cdataValue(block, "description");
    const excerpt = stripHtml(description).replace(/Leia tudo.*$/i, "").trim();

    const pubRaw = block.match(/<pubDate>([^<]+)<\/pubDate>/i)?.[1]?.trim();
    const publishedAt = pubRaw ? new Date(pubRaw) : new Date();
    const published = Number.isNaN(publishedAt.getTime()) ? new Date() : publishedAt;

    const imageUrl =
      block.match(/<media:content[^>]+url="([^"]+)"/i)?.[1] ??
      block.match(/url="(https:\/\/www\.vaticannews\.va[^"]+\.(?:jpe?g|png|webp))"/i)?.[1];

    items.push({
      title,
      link,
      excerpt: excerpt.slice(0, 280),
      publishedAt: published,
      imageUrl,
    });
  }
  return items;
}

async function fetchVaticanNewsUncached(limit: number): Promise<VaticanNewsItem[]> {
  try {
    const res = await fetch(VATICAN_NEWS_RSS_URL, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/rss+xml, application/xml, text/xml" },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseVaticanNewsRss(xml, limit);
  } catch {
    return [];
  }
}

const cachedVaticanNews = unstable_cache(
  (limit: number) => fetchVaticanNewsUncached(limit),
  ["vatican-news-rss-pt"],
  { revalidate: 3600 },
);

export async function listVaticanNews(limit = 6): Promise<VaticanNewsItem[]> {
  const items = await cachedVaticanNews(limit);
  return normalizeVaticanNewsItems(items as VaticanNewsItem[]);
}
