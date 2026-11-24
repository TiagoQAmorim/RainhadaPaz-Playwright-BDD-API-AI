import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { getDioceseDirectory, matchParish, parseParishAddress } from "./diocese-directory";
import { DIOCESE_MAP_ID, type DiocesePlace } from "./diocese-map-embed";

export { DIOCESE_MAP_ID, DIOCESE_MAP_VIEW, dioceseMapEmbedSrc, type DiocesePlace } from "./diocese-map-embed";

const KML_URL = `https://www.google.com/maps/d/kml?mid=${DIOCESE_MAP_ID}&forcekml=1`;
const TTL_MS = 60 * 60 * 1000;

type PlaceCache = { at: number; places: DiocesePlace[]; complete: boolean };

let cache: PlaceCache | null = null;
let quickTask: Promise<DiocesePlace[]> | null = null;
let addressTask: Promise<void> | null = null;

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

function cachePath() {
  const databaseUrl = process.env.DATABASE_URL ?? "";
  if (databaseUrl.startsWith("file:/data/")) return "/data/diocese-places.json";
  return path.join(os.tmpdir(), "rainhadapaz-diocese-places.json");
}

async function readDisk() {
  try {
    const parsed = JSON.parse(await readFile(cachePath(), "utf8")) as PlaceCache;
    if (!parsed || !Array.isArray(parsed.places) || parsed.places.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function writeDisk(value: PlaceCache) {
  try {
    const file = cachePath();
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, JSON.stringify(value));
  } catch {
    // A lista continua na memória mesmo se o disco não aceitar o cache.
  }
}

async function fetchQuick(publish = true) {
  const [response, directory] = await Promise.all([
    fetch(KML_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
      headers: { Accept: "application/xml,text/xml" },
    }),
    getDioceseDirectory().catch(() => []),
  ]);
  if (!response.ok) throw new Error(`Mapa da diocese respondeu ${response.status}`);
  const places = parseDioceseKml(await response.text());
  if (places.length === 0) throw new Error("Mapa da diocese sem paróquias");
  for (const place of places) {
    const entry = matchParish(place, directory);
    if (entry) {
      place.phone = entry.phone;
      if (!place.siteUrl && entry.url) place.siteUrl = entry.url;
    }
  }
  const next = { at: Date.now(), places, complete: false };
  if (publish) {
    cache = next;
    await writeDisk(next);
  }
  return places;
}

function remember(value: PlaceCache) {
  cache = value;
  return value;
}

function fillAddresses() {
  if (addressTask || !cache || cache.complete) return;
  const places = cache.places;
  addressTask = addressesByUrl([...new Set(places.map((place) => place.siteUrl).filter(Boolean))])
    .then(async (addresses) => {
      const next = {
        at: Date.now(),
        complete: true,
        places: places.map((place) => ({
          ...place,
          address: place.siteUrl ? addresses.get(place.siteUrl) ?? "" : "",
        })),
      };
      remember(next);
      await writeDisk(next);
    })
    .finally(() => {
      addressTask = null;
    });
}

/** Nomes e telefones na hora; endereços entram em seguida e ficam em cache. */
export async function getDiocesePlaces(): Promise<{ places: DiocesePlace[]; complete: boolean }> {
  const stored = cache ?? (await readDisk());
  if (stored?.places.length) {
    remember(stored);
    const fresh = stored.complete && Date.now() - stored.at < TTL_MS;
    if (!stored.complete) fillAddresses();
    else if (!fresh && !quickTask && !addressTask) {
      quickTask = fetchQuick(false)
        .then(async (places) => {
          const addresses = await addressesByUrl([
            ...new Set(places.map((place) => place.siteUrl).filter(Boolean)),
          ]);
          const next = {
            at: Date.now(),
            complete: true,
            places: places.map((place) => ({
              ...place,
              address: place.siteUrl ? addresses.get(place.siteUrl) ?? "" : "",
            })),
          };
          remember(next);
          await writeDisk(next);
          return next.places;
        })
        .catch(() => stored.places)
        .finally(() => {
          quickTask = null;
        });
    }
    return { places: stored.places, complete: stored.complete };
  }

  if (!quickTask) {
    quickTask = fetchQuick().finally(() => {
      quickTask = null;
    });
  }
  const places = await quickTask;
  fillAddresses();
  return { places, complete: false };
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
  await Promise.all(Array.from({ length: Math.min(12, urls.length) }, () => worker()));
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
