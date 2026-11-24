import { PageContainer } from "@/components/PageContainer";

export default function MapaLoading() {
  return (
    <PageContainer wide className="py-8 md:py-10">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-parish-900 md:text-4xl">
        Mapa de Paróquias da Diocese de Sto. Amaro
      </h1>
      <p className="mt-2 text-base text-parish-700">Carregando mapa…</p>
      <div className="mt-6 h-[22rem] animate-pulse rounded-2xl border border-parish-200 bg-parish-100 md:h-[28rem]" />
    </PageContainer>
  );
}
