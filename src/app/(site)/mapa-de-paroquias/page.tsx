import { PageContainer } from "@/components/PageContainer";
import { ParishMapExplorer } from "@/components/ParishMapExplorer";
import { DIOCESE_MAP_ID, getDiocesePlaces } from "@/lib/diocese-map";

export const metadata = {
  title: "Mapa de Paróquias da Diocese de Sto. Amaro",
  description:
    "Mapa territorial da Diocese de Santo Amaro, com busca pelo nome da paróquia ou comunidade.",
};

export default async function MapaDeParoquiasPage() {
  const places = await getDiocesePlaces().catch(() => []);
  const source = `https://www.google.com/maps/d/viewer?mid=${DIOCESE_MAP_ID}`;

  return (
    <PageContainer wide className="py-8 md:py-10">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-parish-900 md:text-4xl">
        Mapa de Paróquias da Diocese de Sto. Amaro
      </h1>
      <p className="mt-2 max-w-2xl text-base leading-relaxed text-parish-700">
        Procure pelo nome da paróquia ou da comunidade. Os resultados aparecem na lista abaixo do
        mapa; toque em um nome para abrir o lugar no mapa.
      </p>
      <ParishMapExplorer places={places} />
      <p className="mt-3 text-sm text-parish-600">
        Mapa territorial da{" "}
        <a
          href={source}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-parish-800 underline decoration-parish-300 underline-offset-2 hover:text-parish-950"
        >
          Diocese de Santo Amaro
        </a>
        .
      </p>
    </PageContainer>
  );
}
