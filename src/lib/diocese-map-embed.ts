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

export function dioceseMapEmbedSrc(
  lat = DIOCESE_MAP_VIEW.lat,
  lon = DIOCESE_MAP_VIEW.lon,
  zoom = DIOCESE_MAP_VIEW.zoom,
) {
  return `https://www.google.com/maps/d/embed?mid=${DIOCESE_MAP_ID}&ll=${lat},${lon}&z=${zoom}`;
}
