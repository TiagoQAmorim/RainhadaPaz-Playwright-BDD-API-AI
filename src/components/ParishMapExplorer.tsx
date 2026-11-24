"use client";

import { useMemo, useState } from "react";
import { dioceseMapEmbedSrc, type DiocesePlace } from "@/lib/diocese-map";

type Props = { places: DiocesePlace[] };

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function matches(place: DiocesePlace, query: string) {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return false;
  const text = fold(place.title);
  return words.every((word) => text.includes(word));
}

function telHref(part: string) {
  const digits = part.replace(/\D/g, "");
  if (digits.length < 10) return "";
  return `tel:+${digits.startsWith("55") ? digits : `55${digits}`}`;
}

function PhoneLine({ phone }: { phone: string }) {
  const parts = phone
    .split("/")
    .map((part) => part.replace(/fax\s*:/i, "").trim())
    .filter(Boolean);
  if (parts.length === 0) return null;
  return (
    <span className="mt-0.5 block text-sm text-parish-800">
      Telefone:{" "}
      {parts.map((part, index) => {
        const href = telHref(part);
        return (
          <span key={`${part}-${index}`}>
            {index > 0 ? " / " : null}
            {href ? (
              <a href={href} className="font-semibold underline decoration-parish-300 underline-offset-2">
                {part}
              </a>
            ) : (
              part
            )}
          </span>
        );
      })}
    </span>
  );
}

function routeLinks(lat: number, lon: number) {
  const point = `${lat},${lon}`;
  const google = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(point)}`;
  const waze = `https://www.waze.com/ul?ll=${encodeURIComponent(point)}&navigate=yes`;
  return (
    <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
      <a
        href={google}
        target="_blank"
        rel="noreferrer"
        className="text-sm font-semibold text-parish-700 underline decoration-parish-300 underline-offset-2"
      >
        Google Maps
      </a>
      <a
        href={waze}
        target="_blank"
        rel="noreferrer"
        className="text-sm font-semibold text-parish-700 underline decoration-parish-300 underline-offset-2"
      >
        Waze
      </a>
    </span>
  );
}

export function ParishMapExplorer({ places }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<{ lat: number; lon: number; zoom: number } | null>(null);

  const query = draft.trim();
  const results = useMemo(
    () => (query ? places.filter((place) => matches(place, query)) : []),
    [places, query],
  );
  const mapSrc = view
    ? dioceseMapEmbedSrc(view.lat, view.lon, view.zoom)
    : dioceseMapEmbedSrc();

  function showOnMap(place: DiocesePlace) {
    setSelectedId(place.id);
    setView({ lat: place.lat, lon: place.lon, zoom: 16 });
  }

  const list =
    query.length > 0 ? (
      <section
        aria-label="Resultados da busca"
        className={expanded ? "max-h-[38%] overflow-y-auto border-t border-parish-200 bg-white" : "mt-4"}
      >
        <h2 className="px-1 text-sm font-semibold text-parish-800">
          {results.length === 1 ? "1 resultado encontrado" : `${results.length} resultados encontrados`}
        </h2>
        {results.length === 0 ? (
          <p className="mt-2 text-sm text-parish-600">Nenhuma paróquia ou comunidade com esse nome.</p>
        ) : (
          <ul className="mt-2 divide-y divide-parish-100 overflow-hidden rounded-2xl border border-parish-200 bg-white">
            {results.map((place) => {
              const active = selectedId === place.id;
              return (
                <li key={place.id} className={active ? "bg-parish-100 px-4 py-3" : "px-4 py-3"}>
                  <button type="button" onClick={() => showOnMap(place)} className="w-full text-left">
                    <span className="block font-semibold text-parish-900">{place.title}</span>
                    {place.address ? (
                      <span className="mt-0.5 block text-sm text-parish-800">{place.address}</span>
                    ) : null}
                    {place.sector ? (
                      <span className="mt-0.5 block text-sm text-parish-600">{place.sector}</span>
                    ) : null}
                  </button>
                  {place.phone ? <PhoneLine phone={place.phone} /> : null}
                  {routeLinks(place.lat, place.lon)}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    ) : null;

  return (
    <div className={expanded ? "fixed inset-0 z-[80] flex flex-col bg-parish-50" : "mt-6"}>
      <div className={expanded ? "bg-[#1f4b3a] px-3 py-2" : "mb-3"}>
        {expanded ? (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-base font-semibold text-white"
          >
            ← Voltar
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="rounded-xl border border-parish-200 bg-white px-4 py-2 text-sm font-semibold text-parish-800 hover:bg-parish-50"
          >
            Ampliar mapa
          </button>
        )}
      </div>
      <label className={expanded ? "block border-b border-parish-200 bg-white px-3 py-2" : "mb-3 block"}>
        <span className="sr-only">Buscar paróquia</span>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Buscar paróquia pelo nome, mesmo que seja longo"
          className="w-full rounded-xl border border-parish-200 bg-white px-3 py-2 text-base text-parish-900 outline-none focus:ring-2 focus:ring-parish-500"
        />
      </label>
      <div
        className={
          expanded
            ? "min-h-0 flex-1 overflow-hidden bg-parish-50"
            : "h-[22rem] overflow-hidden rounded-2xl border border-parish-200 bg-parish-50 md:h-[28rem]"
        }
      >
        <iframe
          title="Mapa de Paróquias da Diocese de Sto. Amaro"
          src={mapSrc}
          className="h-[calc(100%+6rem)] w-full -translate-y-24 border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      {list}
    </div>
  );
}
