import { CandleForm } from "@/components/CandleForm";
import { CandleWall } from "@/components/CandleWall";
import { PageContainer } from "@/components/PageContainer";
import { PhotoHeroBanner } from "@/components/PhotoHeroBanner";
import { SectionHeading } from "@/components/SectionHeading";
import { listActiveCandles } from "@/lib/candles";
import { mercadoPagoEnabled } from "@/lib/mercadopago";
import { CANDLES_BANNER_PATH } from "@/lib/parish-brand";
import { candlePriceCents, candlesFreeMode, getCandleDurationHours, getSiteSettings } from "@/lib/settings";

export const metadata = { title: "Vela virtual" };

export default async function VelasPage() {
  const [candles, settings, durationHours] = await Promise.all([
    listActiveCandles(24),
    getSiteSettings(),
    getCandleDurationHours(),
  ]);
  const freeMode = candlesFreeMode();
  const muralDurationText =
    settings.candleDurationUnit === "days"
      ? `${settings.candleDurationAmount} dia(s)`
      : `${settings.candleDurationAmount} hora(s)`;
  const cents = candlePriceCents();
  const priceLabel = (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const bannerDescription = freeMode
    ? "Modo teste: acenda sua vela de graça com nome, intenção e oração."
    : "Acenda uma luz de fé. Contribuição via PIX ou cartão (Mercado Pago).";

  return (
    <>
      <PhotoHeroBanner
        imageSrc={CANDLES_BANNER_PATH}
        wide
        priority
        minHeightClass="min-h-[140px] sm:min-h-[160px] md:min-h-[180px]"
        contentClassName="py-5 md:py-6"
      >
        <SectionHeading
          inverse
          className="mb-0 max-w-3xl [&_h2]:text-2xl md:[&_h2]:text-3xl"
          eyebrow="Oração"
          title="Vela virtual"
          description={bannerDescription}
        />
      </PhotoHeroBanner>

      <PageContainer wide className="bg-parish-50 py-6 md:py-8">
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <div className="min-w-0 lg:sticky lg:top-24">
          <CandleForm
            priceLabel={priceLabel}
            freeMode={freeMode}
            paymentsConfigured={mercadoPagoEnabled()}
          />
        </div>

        <div
          id="mural"
          className="min-w-0 scroll-mt-28 overflow-visible rounded-xl border border-parish-600/45 bg-gradient-to-b from-parish-800 to-parish-900 p-4 shadow-lg md:p-6"
        >
          <SectionHeading
            inverse
            className="mb-4"
            eyebrow="Comunidade"
            title="Mural de velas"
            description={`Cada vela permanece acesa por ${muralDurationText}. Por padrão, intenção e oração ficam em sigilo; você pode optar por exibi-las no mural ao acender.`}
          />
          <CandleWall candles={candles} embedded muralDark durationHours={durationHours} />
        </div>
      </div>
      </PageContainer>
    </>
  );
}
