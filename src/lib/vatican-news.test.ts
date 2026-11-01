import { describe, expect, it } from "vitest";
import { parseVaticanNewsRss, parseVaticanPublishedAt } from "./vatican-news";

const sample = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <item>
      <title><![CDATA[Título de teste]]></title>
      <description><![CDATA[<p>Resumo da notícia.</p><p><a href="https://example.com">Leia tudo</a></p>]]></description>
      <link>https://www.vaticannews.va/pt/test.html</link>
      <pubDate>Sat, 31 Oct 2026 17:30:00 +0100</pubDate>
      <media:content url="https://www.vaticannews.va/content/dam/image.jpg" width="750" height="422" medium="image"/>
    </item>
  </channel>
</rss>`;

describe("parseVaticanPublishedAt", () => {
  it("aceita string ISO vinda do cache", () => {
    const iso = "2026-10-31T16:30:00.000Z";
    expect(parseVaticanPublishedAt(iso).toISOString()).toBe(iso);
  });
});

describe("parseVaticanNewsRss", () => {
  it("extrai título, link, resumo e imagem", () => {
    const items = parseVaticanNewsRss(sample, 5);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("Título de teste");
    expect(items[0].link).toContain("vaticannews.va");
    expect(items[0].excerpt).toContain("Resumo");
    expect(items[0].imageUrl).toContain("image.jpg");
  });
});
