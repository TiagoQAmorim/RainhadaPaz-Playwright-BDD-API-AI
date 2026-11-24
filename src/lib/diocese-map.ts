import { getDioceseDirectory, matchParish, parseParishAddress } from "./diocese-directory";

export type DiocesePlace = {
  id: string;
  title: string;
  sector: string;
  lat: number;
  lon: number;
  siteUrl: string;
  phone: string;
  address: string;
};

export const DIOCESE_MAP_ID = "1CidcSigKhAAvxRTygHTYJNn_v3O9-2o";
export const DIOCESE_MAP_VIEW = {
  lat: -23.718374434732585,
  lon: -46.7083962026999,
  zoom: 15,
};

const KML_URL = `https://www.google.com/maps/d/kml?mid=${DIOCESE_MAP_ID}&forcekml=1`;
const TTL_MS = 60 * 60 * 1000;

let cache: { at: number; places: DiocesePlace[] } | null = null;

export function dioceseMapEmbedSrc(lat = DIOCESE_MAP_VIEW.lat, lon = DIOCESE_MAP_VIEW.lon, zoom = DIOCESE_MAP_VIEW.zoom) {
  return `https://www.google.com/maps/d/embed?mid=${DIOCESE_MAP_ID}&ll=${lat},${lon}&z=${zoom}`;
}

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#039;/g, "'")
    .replace(/&nbsp;|\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tagText(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return match ? decodeXml(match[1]) : "";
}

/** Pontos do mapa territorial: paróquias e comunidades, com o setor de cada uma. */
export function parseDioceseKml(xml: string): DiocesePlace[] {
  const places: DiocesePlace[] = [];
  const folders = xml.match(/<Folder>[\s\S]*?<\/Folder>/g) ?? [];
  const blocks = folders.length > 0 ? folders : [xml];

  for (const folder of blocks) {
    const sector = tagText(folder, "name");
    const marks = folder.match(/<Placemark>[\s\S]*?<\/Placemark>/g) ?? [];
    for (const mark of marks) {
      if (!mark.includes("<Point>")) continue;
      const title = tagText(mark, "name");
      const coordinates = tagText(mark, "coordinates").split(",");
      const lon = Number(coordinates[0]);
      const lat = Number(coordinates[1]);
      if (!title || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
      const description = tagText(mark, "description");
      const siteUrl = description.startsWith("http") ? description.split(" ")[0] : "";
      places.push({
        id: `${places.length}-${lat.toFixed(5)}-${lon.toFixed(5)}`,
        title,
        sector: sector && sector !== title ? sector : "",
        lat,
        lon,
        siteUrl,
        phone: "",
        address: "",
      });
    }
  }

  return places;
}

export async function getDiocesePlaces(): Promise<DiocesePlace[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.places;
  const response = await fetch(KML_URL, {
    cache: "no-store",
    headers: { Accept: "application/xml,text/xml" },
  });
  if (!response.ok) throw new Error(`Mapa da diocese respondeu ${response.status}`);
  const places = parseDioceseKml(await response.text());
  if (places.length === 0) throw new Error("Mapa da diocese sem paróquias");
  const directory = await getDioceseDirectory().catch(() => []);
  for (const place of places) {
    const entry = matchParish(place, directory);
    if (entry) {
      place.phone = entry.phone;
      if (!place.siteUrl && entry.url) place.siteUrl = entry.url;
    }
  }
  const addresses = await addressesByUrl([...new Set(places.map((place) => place.siteUrl).filter(Boolean))]);
  for (const place of places) {
    if (place.siteUrl) place.address = addresses.get(place.siteUrl) ?? "";
  }
  cache = { at: Date.now(), places };
  return places;
}

async function addressesByUrl(urls: string[]) {
  const addresses = new Map<string, string>();
  let next = 0;
  async function worker() {
    for (;;) {
      const index = next;
      next += 1;
      if (index >= urls.length) return;
      addresses.set(urls[index], await addressAt(urls[index]));
    }
  }
  await Promise.all(Array.from({ length: Math.min(8, urls.length) }, () => worker()));
  return addresses;
}

async function addressAt(url: string) {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "text/html" },
    });
    if (!response.ok) return "";
    return parseParishAddress(await response.text());
  } catch {
    return "";
  }
}
