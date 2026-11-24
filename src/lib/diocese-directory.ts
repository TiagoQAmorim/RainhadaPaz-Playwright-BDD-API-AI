export type DirectoryParish = {
  sector: string;
  title: string;
  phone: string;
  url: string;
};

const DIRECTORY_URL = "https://diocesedesantoamaro.org.br/paroquias-da-diocese-de-santo-amaro/";

function decodeHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#039;/g, "'")
    .replace(/&nbsp;|\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Nome comparável: sem acento, sem "Paróquia"/"Santuário" e com abreviações por extenso. */
export function foldParishName(value: string) {
  return value
    .replace(/\([^)]*\)/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\bn\.\s*sra\.?/g, "nossa senhora")
    .replace(/\bsta\./g, "santa")
    .replace(/\bsto\./g, "santo")
    .replace(/\bbeato\b/g, "sao")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(paroquia|santuario|catedral|comunidade|setor|de|da|do|das|dos|e)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parishUrl(href: string) {
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  if (href.startsWith("/")) return `https://diocesedesantoamaro.org.br${href}`;
  return "";
}

function parishesIn(html: string, sector: string): DirectoryParish[] {
  if (!sector) return [];
  const parishes: DirectoryParish[] = [];
  const items = html.split(/<h2 class="post-title">/i).slice(1);
  for (const item of items) {
    const anchor = item.match(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
    const title = decodeHtml(anchor?.[2] || "");
    const phone = decodeHtml((item.match(/Telefone:\s*([^<]+)/i) || [])[1] || "");
    if (!title || !phone) continue;
    parishes.push({ sector, title, phone, url: parishUrl(anchor?.[1] || "") });
  }
  return parishes;
}

/** Rua, número e CEP publicados na página da paróquia. */
export function parseParishAddress(html: string) {
  const block = html.match(/Endere[cç]o<\/h3>\s*<h2>([\s\S]*?)<\/h2>/i);
  if (!block) return "";
  const text = block[1]
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#039;/g, "'")
    .replace(/&nbsp;|\u00a0/g, " ");
  return text
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join(" — ");
}

/** Paróquias publicadas pela diocese, com o telefone de cada setor. */
export function parseDioceseDirectory(html: string): DirectoryParish[] {
  const parts = html.split(/<h1>\s*\|\s*Setor\s+/i);
  if (parts.length > 1) {
    return parts.slice(1).flatMap((part) => {
      const sectorEnd = part.indexOf("</h1>");
      if (sectorEnd < 0) return [];
      return parishesIn(part.slice(sectorEnd), decodeHtml(part.slice(0, sectorEnd)));
    });
  }
  const sector = decodeHtml((html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || "")
    .split("|")[0]
    .replace(/^Setor\s+/i, "");
  return parishesIn(html, sector);
}

function tokens(value: string) {
  return foldParishName(value).split(" ").filter(Boolean);
}

function sameTokens(left: string[], right: string[]) {
  return left.length === right.length && left.every((token, index) => token === right[index]);
}

function covers(longer: string[], shorter: string[]) {
  let index = 0;
  for (const token of longer) {
    if (token === shorter[index]) index += 1;
    if (index === shorter.length) return true;
  }
  return false;
}

function sameSector(entrySector: string, placeSector: string) {
  const place = foldParishName(placeSector);
  const entry = foldParishName(entrySector);
  return Boolean(place && entry && place.includes(entry));
}

export function matchParish(
  place: { title: string; sector: string },
  directory: DirectoryParish[],
) {
  const placeTokens = tokens(place.title);
  const named = directory.filter((entry) => sameTokens(tokens(entry.title), placeTokens));
  const namedHere = named.filter((entry) => sameSector(entry.sector, place.sector));
  if (namedHere.length === 1) return namedHere[0];
  if (named.length === 1) return named[0];

  const loose = directory.filter((entry) => {
    if (!sameSector(entry.sector, place.sector)) return false;
    const entryTokens = tokens(entry.title);
    const withoutTitle =
      entryTokens[0] === "nossa" &&
      entryTokens[1] === "senhora" &&
      placeTokens.length >= 2 &&
      sameTokens(entryTokens.slice(2), placeTokens);
    const extra = entryTokens.length - placeTokens.length;
    return withoutTitle || (extra > 0 && extra <= 2 && placeTokens.length >= 3 && covers(entryTokens, placeTokens));
  });
  return loose.length === 1 ? loose[0] : null;
}

export function phoneForPlace(
  place: { title: string; sector: string },
  directory: DirectoryParish[],
) {
  return matchParish(place, directory)?.phone ?? "";
}

export async function getDioceseDirectory(): Promise<DirectoryParish[]> {
  const response = await fetch(DIRECTORY_URL, {
    cache: "no-store",
    headers: { Accept: "text/html" },
  });
  if (!response.ok) return [];
  const html = await response.text();
  const links = [
    ...new Set(
      html.match(/https:\/\/diocesedesantoamaro\.org\.br\/paroquias-da-diocese-de-santo-amaro\/setor-[a-z0-9-]+\/?/gi) ??
        [],
    ),
  ];
  if (links.length === 0) return parseDioceseDirectory(html);
  const pages = await Promise.all(
    links.map(async (link) => {
      try {
        const page = await fetch(link.endsWith("/") ? link : `${link}/`, {
          cache: "no-store",
          headers: { Accept: "text/html" },
        });
        return page.ok ? parseDioceseDirectory(await page.text()) : [];
      } catch {
        return [];
      }
    }),
  );
  const parishes = pages.flat();
  return parishes.length > 0 ? parishes : parseDioceseDirectory(html);
}
