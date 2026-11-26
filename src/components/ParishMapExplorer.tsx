"use client";

import { useState, type FormEvent } from "react";
import { dioceseMapEmbedSrc, type DiocesePlace } from "@/lib/diocese-map-embed";

type LookupResult = {
  addressLabel: string;
  lat: number;
  lon: number;
  place: DiocesePlace | null;
};

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

export function ParishMapExplorer() {
  const [mapReady, setMapReady] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<{ lat: number; lon: number; zoom: number } | null>(null);
  const [searching, setSearching] = useState(false);
  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const mapSrc = view
    ? dioceseMapEmbedSrc(view.lat, view.lon, view.zoom)
    : dioceseMapEmbedSrc();

  function showOnMap(place: DiocesePlace) {
    setSelectedId(place.id);
    setView({ lat: place.lat, lon: place.lon, zoom: 16 });
  }

  async function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = draft.trim();
    if (query.length < 3) {
      setLookup(null);
      setLookupError("Informe o endereço ou o CEP.");
      return;
    }
    setSearching(true);
    setLookupError(null);
    try {
      const response = await fetch(`/api/diocese-map/lookup?q=${encodeURIComponent(query)}`);
      const data = (await response.json()) as LookupResult & { error?: string };
      if (!response.ok) {
        setLookup(null);
        setLookupError(data.error ?? "Não foi possível buscar esse endereço.");
        return;
      }
      setLookup(data);
      setView({ lat: data.lat, lon: data.lon, zoom: 15 });
      setSelectedId(data.place?.id ?? null);
    } catch {
      setLookup(null);
      setLookupError("Não foi possível buscar esse endereço.");
    } finally {
      setSearching(false);
    }
  }

  const place = lookup?.place ?? null;
  const list = lookup || lookupError ? (
    <section
      aria-label="Paróquia do endereço"
      className={expanded ? "max-h-[38%] overflow-y-auto border-t border-parish-200 bg-white" : "mt-4"}
    >
      {lookupError ? <p className="px-1 text-sm text-parish-700">{lookupError}</p> : null}
      {lookup ? (
        <>
          <h2 className="px-1 text-sm font-semibold text-parish-800">
            {place ? "Paróquia deste endereço" : "Endereço fora da diocese"}
          </h2>
          <p className="mt-1 px-1 text-sm text-parish-600">{lookup.addressLabel}</p>
          {place ? (
            <div className={selectedId === place.id ? "mt-2 rounded-2xl border border-parish-200 bg-parish-100 px-4 py-3" : "mt-2 rounded-2xl border border-parish-200 bg-white px-4 py-3"}>
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
            </div>
          ) : (
            <p className="mt-2 text-sm text-parish-600">
              Esse endereço não fica no território de uma paróquia da Diocese de Santo Amaro.
            </p>
          )}
        </>
      ) : null}
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
      <form
        onSubmit={onSearch}
        className={
          expanded
            ? "flex flex-col gap-2 border-b border-parish-200 bg-white px-3 py-2 sm:flex-row"
            : "mb-3 flex flex-col gap-2 sm:flex-row"
        }
      >
        <label className="min-w-0 flex-1">
          <span className="sr-only">Endereço ou CEP</span>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Endereço ou CEP. Ex.: Rua das Flores, 100, Santo Amaro"
            enterKeyHint="search"
            className="w-full rounded-xl border border-parish-200 bg-white px-3 py-2 text-base text-parish-900 outline-none focus:ring-2 focus:ring-parish-500"
          />
        </label>
        <button
          type="submit"
          disabled={searching}
          className="rounded-xl bg-parish-600 px-4 py-2 text-sm font-semibold text-white hover:bg-parish-500 disabled:opacity-60"
        >
          {searching ? "Buscando…" : "Buscar paróquia"}
        </button>
      </form>
      <div
        className={
          expanded
            ? "relative min-h-0 flex-1 overflow-hidden bg-parish-50"
            : "relative h-[22rem] overflow-hidden rounded-2xl border border-parish-200 bg-parish-50 md:h-[28rem]"
        }
      >
        {mapReady ? null : (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-parish-50">
            <div className="flex flex-col items-center gap-3 text-parish-800">
              <span
                className="h-9 w-9 animate-spin rounded-full border-2 border-parish-200 border-t-parish-700"
                aria-hidden
              />
              <span className="text-sm font-semibold">Carregando mapa…</span>
            </div>
          </div>
        )}
        <iframe
          key={mapSrc}
          title="Mapa de Paróquias da Diocese de Sto. Amaro"
          src={mapSrc}
          className="h-[calc(100%+6rem)] w-full -translate-y-24 border-0"
          loading="eager"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          onLoad={() => setMapReady(true)}
        />
      </div>
      {list}
    </div>
  );
}
