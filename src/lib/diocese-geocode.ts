const DIOCESE_VIEWBOX = "-46.82,-23.59,-46.60,-24.02";

export type GeocodedAddress = {
  lat: number;
  lon: number;
  label: string;
};

/** CEP quando o texto não traz rua, só os 8 dígitos. */
export function cepDigits(value: string) {
  const withoutWord = value.trim().replace(/\bcep\b/gi, " ");
  if (/[a-záàâãéêíóôõúç]/i.test(withoutWord)) return null;
  const digits = withoutWord.replace(/\D/g, "");
  return digits.length === 8 ? digits : null;
}

function finitePoint(lat: unknown, lon: unknown) {
  const latitude = Number(lat);
  const longitude = Number(lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { lat: latitude, lon: longitude };
}

async function nominatim(query: string): Promise<GeocodedAddress | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "br");
  url.searchParams.set("limit", "5");
  url.searchParams.set("viewbox", DIOCESE_VIEWBOX);
  url.searchParams.set("q", query);
  const response = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    headers: {
      Accept: "application/json",
      "User-Agent": "ParoquiaRainhaDaPaz/1.0 (https://paroquiarainhadapaz.com.br)",
    },
  });
  if (!response.ok) return null;
  const rows = (await response.json()) as Array<{ lat?: string; lon?: string; display_name?: string }>;
  const inside = rows.find((row) => {
    const point = finitePoint(row.lat, row.lon);
    return point && point.lon >= -46.82 && point.lon <= -46.6 && point.lat >= -24.02 && point.lat <= -23.59;
  });
  const chosen = inside ?? rows[0];
  const point = chosen ? finitePoint(chosen.lat, chosen.lon) : null;
  if (!point) return null;
  return { ...point, label: chosen?.display_name?.trim() || query };
}

function formatCep(cep: string) {
  return `${cep.slice(0, 5)}-${cep.slice(5)}`;
}

/** O ponto do CEP no OpenStreetMap. As coordenadas do BrasilAPI repetem um centro genérico. */
async function nominatimCep(cep: string): Promise<GeocodedAddress | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("postalcode", cep);
  url.searchParams.set("country", "Brazil");
  url.searchParams.set("limit", "1");
  const response = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    headers: {
      Accept: "application/json",
      "User-Agent": "ParoquiaRainhaDaPaz/1.0 (https://paroquiarainhadapaz.com.br)",
    },
  });
  if (!response.ok) return null;
  const rows = (await response.json()) as Array<{ lat?: string; lon?: string; display_name?: string }>;
  const point = rows[0] ? finitePoint(rows[0].lat, rows[0].lon) : null;
  if (!point) return null;
  return { ...point, label: rows[0]?.display_name?.trim() || formatCep(cep) };
}

type CepStreet = { label: string; streetQuery: string };

async function awesomeCep(cep: string): Promise<GeocodedAddress | null> {
  const response = await fetch(`https://cep.awesomeapi.com.br/json/${cep}`, {
    signal: AbortSignal.timeout(8000),
    headers: { Accept: "application/json" },
  });
  if (!response.ok) return null;
  const data = (await response.json()) as {
    address?: string;
    district?: string;
    city?: string;
    state?: string;
    lat?: string;
    lng?: string;
    status?: number;
  };
  if (data.status && data.status !== 200) return null;
  const point = finitePoint(data.lat, data.lng);
  if (!point) return null;
  const label = [data.address, data.district, data.city && data.state ? `${data.city} - ${data.state}` : data.city, formatCep(cep)]
    .filter(Boolean)
    .join(", ");
  return { ...point, label: label || formatCep(cep) };
}

async function cepStreet(cep: string): Promise<CepStreet | null> {
  const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`, {
    signal: AbortSignal.timeout(8000),
    headers: { Accept: "application/json" },
  });
  if (!response.ok) return null;
  const data = (await response.json()) as {
    street?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
  };
  const city = data.city && data.state ? `${data.city} - ${data.state}` : data.city ?? "";
  const streetQuery = [data.street, data.neighborhood, city].filter(Boolean).join(", ");
  if (!streetQuery) return null;
  return {
    streetQuery,
    label: [streetQuery, formatCep(cep)].filter(Boolean).join(", "),
  };
}

async function fromCep(cep: string): Promise<GeocodedAddress | null> {
  const located = await awesomeCep(cep).catch(() => null);
  if (located) return located;

  const [postal, street] = await Promise.all([
    nominatimCep(cep).catch(() => null),
    cepStreet(cep).catch(() => null),
  ]);
  if (postal) return { ...postal, label: street?.label || postal.label };

  if (street) {
    const byStreet = await nominatim(street.streetQuery).catch(() => null);
    if (byStreet) return { ...byStreet, label: street.label };
  }
  return nominatim(formatCep(cep));
}

/** Endereço ou CEP → ponto no mapa. */
export async function geocodeAddress(query: string): Promise<GeocodedAddress | null> {
  const text = query.trim().slice(0, 160);
  if (text.length < 3) return null;
  const cep = cepDigits(text);
  try {
    if (cep) return await fromCep(cep);
    const scoped = /s[aã]o paulo|santo amaro/i.test(text) ? text : `${text}, São Paulo, SP, Brasil`;
    return await nominatim(scoped);
  } catch {
    return null;
  }
}
