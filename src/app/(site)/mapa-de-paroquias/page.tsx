import { PageContainer } from "@/components/PageContainer";

export const metadata = {
  title: "Mapa de Paróquias",
  description:
    "Mapa de paróquias da Arquidiocese de São Paulo, com busca pelo nome da paróquia.",
};

export default function MapaDeParoquiasPage() {
  return (
    <PageContainer wide className="py-8 md:py-10">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-parish-900 md:text-4xl">
        Mapa de Paróquias
      </h1>
      <p className="mt-2 max-w-2xl text-base leading-relaxed text-parish-700">
        Procure pelo nome da paróquia, ou use a localização para encontrar a igreja mais próxima.
      </p>
      <iframe
        title="Mapa de paróquias da Arquidiocese de São Paulo"
        src="/mapa-arquisp"
        className="mt-6 h-[calc(100dvh-11rem)] min-h-[32rem] w-full rounded-2xl border border-parish-200 bg-parish-50"
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
        allow="geolocation"
        referrerPolicy="no-referrer"
      />
      <p className="mt-3 text-sm text-parish-600">
        Mapa publicado pela{" "}
        <a
          href="https://arquisp.org.br/mapa/"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-parish-800 underline decoration-parish-300 underline-offset-2 hover:text-parish-950"
        >
          Arquidiocese de São Paulo
        </a>
        .
      </p>
    </PageContainer>
  );
}
