import Link from "next/link";
import { CandleForm } from "@/components/CandleForm";
import { CandleWall } from "@/components/CandleWall";
import { PageContainer } from "@/components/PageContainer";
import { PhotoHeroBanner } from "@/components/PhotoHeroBanner";
import { SectionHeading } from "@/components/SectionHeading";
import { listLitCandles } from "@/lib/candles";
import { CANDLES_BANNER_PATH } from "@/lib/parish-brand";
import { formatCandlePrice, getCandleCommerceConfig } from "@/lib/candle-commerce";
import { getCandleDurationHours, getSiteSettings } from "@/lib/settings";

export const metadata = {
  title: "Velas virtuais",
  description:
    "Acenda uma vela virtual católica online: uma vela de oração no mural da Paróquia Rainha da Paz.",
};

const PAGE_SIZE = 12;

type Props = { searchParams: Promise<{ pagina?: string }> };

export default async function VelasPage({ searchParams }: Props) {
  const { pagina } = await searchParams;
  const requested = Math.max(1, Number(pagina) || 1);
  const [firstPage, settings, durationHours, commerce] = await Promise.all([
    listLitCandles({ skip: (requested - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    getSiteSettings(),
    getCandleDurationHours(),
    getCandleCommerceConfig(),
  ]);
  const totalPages = Math.max(1, Math.ceil(firstPage.total / PAGE_SIZE));
  const page = Math.min(totalPages, requested);
  const mural =
    page === requested
      ? firstPage
      : await listLitCandles({ skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE });
  const candles = mural.candles;
  const rangeFrom = candles.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeTo = rangeFrom + candles.length - 1;
  const muralDurationText =
    settings.candleDurationUnit === "days"
      ? `${settings.candleDurationAmount} dia(s)`
      : `${settings.candleDurationAmount} hora(s)`;

  const bannerDescription = commerce.forceFree
    ? "Modo teste: acenda sua vela de graça com nome, intenção e oração."
    : commerce.accessMode === "free"
      ? "Acenda uma luz de fé — contribuição gratuita neste período."
      : commerce.accessMode === "free_donation"
        ? "Acenda gratuitamente ou oferte o valor que desejar, se quiser contribuir."
        : `Acenda uma luz de fé. Contribuição ${formatCandlePrice(commerce.priceCents)} (PIX ou cartão).`;

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
          title="Velas virtuais"
          description={bannerDescription}
        />
      </PhotoHeroBanner>

      <PageContainer wide className="bg-parish-50 py-6 md:py-8">
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <div className="min-w-0 lg:sticky lg:top-24">
          <CandleForm commerce={commerce} />
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
          <CandleWall
            candles={candles.map((c) => ({
              id: c.id,
              donorName: c.donorName,
              intention: c.intention,
              prayer: c.prayer,
              intentionPublic: c.intentionPublic,
              prayerPublic: c.prayerPublic,
              litAt: c.litAt,
              expiresAt: c.expiresAt,
              paid: c.amountCents > 0,
              prayerTogetherCount: c.prayerTogetherCount,
            }))}
            embedded
            muralDark
            durationHours={durationHours}
          />
          {mural.total > 0 && candles.length > 0 ? (
            <p className="mt-4 text-center text-sm text-amber-100/75">
              {rangeFrom === rangeTo ? rangeFrom : `${rangeFrom}–${rangeTo}`} de {mural.total}
            </p>
          ) : null}
          {totalPages > 1 ? (
            <nav className="mt-6 flex flex-wrap items-center justify-center gap-2" aria-label="Páginas do mural">
              {page > 1 ? (
                <Link
                  href={`/velas?pagina=${page - 1}#mural`}
                  className="rounded-full border border-white/25 px-3 py-1.5 text-sm font-semibold text-amber-50 hover:bg-white/10"
                >
                  Anterior
                </Link>
              ) : null}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
                .map((n, index, list) => {
                  const prev = list[index - 1];
                  return (
                    <span key={n} className="flex items-center gap-2">
                      {prev != null && n - prev > 1 ? <span className="text-amber-100/50">…</span> : null}
                      <Link
                        href={`/velas?pagina=${n}#mural`}
                        aria-current={n === page ? "page" : undefined}
                        className={
                          n === page
                            ? "rounded-full bg-gold-500 px-3 py-1.5 text-sm font-bold text-parish-950"
                            : "rounded-full px-3 py-1.5 text-sm font-semibold text-amber-50 hover:bg-white/10"
                        }
                      >
                        {n}
                      </Link>
                    </span>
                  );
                })}
              {page < totalPages ? (
                <Link
                  href={`/velas?pagina=${page + 1}#mural`}
                  className="rounded-full border border-white/25 px-3 py-1.5 text-sm font-semibold text-amber-50 hover:bg-white/10"
                >
                  Próxima
                </Link>
              ) : null}
            </nav>
          ) : null}
        </div>
      </div>
      </PageContainer>
    </>
  );
}
