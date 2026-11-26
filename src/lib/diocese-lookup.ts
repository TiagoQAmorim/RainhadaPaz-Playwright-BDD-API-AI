import { foldParishName } from "./diocese-directory";
import { geocodeAddress } from "./diocese-geocode";
import type { DiocesePlace } from "./diocese-map-embed";
import { getDiocesePlaces, getDioceseTerritories } from "./diocese-map";
import { ringContains, territoryAt, type DioceseTerritory } from "./diocese-territory";

export type ParishAddressLookup = {
  addressLabel: string;
  lat: number;
  lon: number;
  place: DiocesePlace | null;
};

function sameName(left: string, right: string) {
  const a = foldParishName(left);
  const b = foldParishName(right);
  return Boolean(a && b && a === b);
}

function distance(lon: number, lat: number, place: DiocesePlace) {
  const dx = place.lon - lon;
  const dy = place.lat - lat;
  return dx * dx + dy * dy;
}

/** Igreja do território: a que está dentro do contorno, ou a mais próxima com o mesmo nome. */
export function placeForTerritory(
  places: DiocesePlace[],
  territory: DioceseTerritory,
  lon: number,
  lat: number,
) {
  const named = places.filter(
    (place) =>
      sameName(place.title, territory.title) &&
      (!territory.sector || !place.sector || place.sector === territory.sector),
  );
  const pool = named.length > 0 ? named : [];
  const inside = pool.find((place) => ringContains(territory.ring, place.lon, place.lat));
  if (inside) return inside;
  return pool.sort((a, b) => distance(lon, lat, a) - distance(lon, lat, b))[0] ?? null;
}

export async function lookupParishByAddress(query: string): Promise<ParishAddressLookup | null> {
  const point = await geocodeAddress(query);
  if (!point) return null;
  const [{ places }, territories] = await Promise.all([getDiocesePlaces(), getDioceseTerritories()]);
  const territory = territoryAt(territories, point.lon, point.lat);
  const matched = territory ? placeForTerritory(places, territory, point.lon, point.lat) : null;
  const place =
    matched ??
    (territory
      ? {
          id: territory.id,
          title: territory.title,
          sector: territory.sector,
          lat: point.lat,
          lon: point.lon,
          siteUrl: "",
          phone: "",
          address: "",
        }
      : null);
  return {
    addressLabel: point.label,
    lat: point.lat,
    lon: point.lon,
    place,
  };
}
