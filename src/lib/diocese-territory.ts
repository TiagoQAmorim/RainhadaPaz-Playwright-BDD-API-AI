export type DioceseTerritory = {
  id: string;
  title: string;
  sector: string;
  ring: Array<[number, number]>;
};

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

function parseRing(text: string) {
  const ring: Array<[number, number]> = [];
  for (const part of text.trim().split(/\s+/)) {
    const [lon, lat] = part.split(",").map(Number);
    if (Number.isFinite(lon) && Number.isFinite(lat)) ring.push([lon, lat]);
  }
  return ring;
}

/** Contorno de outra diocese, não uma paróquia de Santo Amaro. */
function isOutsideBoundary(title: string) {
  return /^(diocese de|arquidiocese\b)/i.test(title.trim());
}

/** Territórios desenhados no mapa. Cada polígono é a área de uma paróquia, santuário ou catedral. */
export function parseDioceseTerritories(xml: string): DioceseTerritory[] {
  const territories: DioceseTerritory[] = [];
  const folders = xml.match(/<Folder>[\s\S]*?<\/Folder>/g) ?? [];
  const blocks = folders.length > 0 ? folders : [xml];

  for (const folder of blocks) {
    const sector = tagText(folder, "name");
    const marks = folder.match(/<Placemark>[\s\S]*?<\/Placemark>/g) ?? [];
    for (const mark of marks) {
      if (!mark.includes("<Polygon>")) continue;
      const title = tagText(mark, "name");
      const coordinates = mark.match(/<coordinates>([\s\S]*?)<\/coordinates>/);
      const ring = coordinates ? parseRing(coordinates[1]) : [];
      if (!title || isOutsideBoundary(title) || ring.length < 3) continue;
      territories.push({
        id: `${territories.length}-${title}`,
        title,
        sector: sector && sector !== title ? sector : "",
        ring,
      });
    }
  }

  return territories;
}

/** O ponto está dentro do contorno. */
export function ringContains(ring: Array<[number, number]>, lon: number, lat: number) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const crosses = yi > lat !== yj > lat;
    if (!crosses) continue;
    const x = ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (lon < x) inside = !inside;
  }
  return inside;
}

function ringArea(ring: Array<[number, number]>) {
  let sum = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    sum += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  }
  return Math.abs(sum) / 2;
}

/** O território menor, quando um endereço cai em mais de um contorno. */
export function territoryAt(territories: DioceseTerritory[], lon: number, lat: number) {
  let best: DioceseTerritory | null = null;
  let bestArea = Infinity;
  for (const territory of territories) {
    if (!ringContains(territory.ring, lon, lat)) continue;
    const area = ringArea(territory.ring);
    if (area < bestArea) {
      best = territory;
      bestArea = area;
    }
  }
  return best;
}
