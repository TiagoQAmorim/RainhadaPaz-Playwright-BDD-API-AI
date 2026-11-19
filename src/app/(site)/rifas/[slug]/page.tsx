import { notFound } from "next/navigation";
import { RaffleExperience } from "@/components/raffle/RaffleExperience";
import { ContentCoverImage } from "@/components/ContentCoverImage";
import { PageContainer } from "@/components/PageContainer";
import { RaffleCartelaIllustration } from "@/components/RaffleCartelaIllustration";
import { isLocalSiteImageUrl } from "@/lib/local-image-url";
import { getRaffleBySlug, getRaffleStats } from "@/lib/raffles";
import { formatDrawDateTime, formatTicketNumber, numberedRaffleSeries, raffleDrawScopeLabel, ticketPriceLabel } from "@/lib/raffle-rules";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = await getRaffleBySlug(slug);
  return { title: r ? r.title : "Rifa" };
}

export default async function RifaPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const raffle = await getRaffleBySlug(slug);
  if (!raffle || (raffle.status !== "ACTIVE" && raffle.status !== "CLOSED")) notFound();

  const [stats, draws] = await Promise.all([
    getRaffleStats(raffle.id),
    prisma.raffleDraw.findMany({
      where: { raffleId: raffle.id },
      orderBy: { drawnAt: "asc" },
    }),
  ]);
  const series = raffle.kind === "NUMBERS" ? numberedRaffleSeries(raffle.numberStart, raffle.totalTickets) : null;

  return (
    <PageContainer wide className="bg-parish-50 pb-24 pt-10 md:pt-14">
      <header className="flex max-w-4xl flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        <RaffleCartelaIllustration size={168} priority className="mx-auto sm:mx-0 sm:shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-600">
            {raffle.kind === "NUMBERS"
              ? "Rifa beneficente — física e virtual"
              : "Rifa dos Santos — Ajude Nossa Paróquia!"}
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold text-parish-900 md:text-4xl">
            {raffle.title}
          </h1>
          <p className="mt-4 break-words text-parish-800">
            {series
              ? `O site vende de ${formatTicketNumber(series.siteStart)} a ${formatTicketNumber(series.last)}. O sorteio vale de ${formatTicketNumber(series.first)} a ${formatTicketNumber(series.last)}, talão impresso e site. Ao comprar, baixe o PDF do canhoto de cada cota.`
              : "Participe da nossa Rifa dos Santos! Escolha um santo de sua devoção, conheça um pouco de sua história e contribua com nossa paróquia. Cada cota representa uma oportunidade de ajudar nossa comunidade."}
          </p>
          {raffle.purpose ? (
            <p className="mt-2 text-sm text-parish-600">
              <strong>Objetivo:</strong> {raffle.purpose}
            </p>
          ) : null}
        </div>
      </header>

      {draws.length > 0 ? (
        <div className="mt-8 rounded-2xl border border-gold-300 bg-gold-50 px-6 py-5 text-parish-900">
          <p className="text-xs font-bold uppercase tracking-widest text-gold-700">Sorteios</p>
          <ol className="mt-3 space-y-3">
            {draws.map((draw, index) => (
              <li key={draw.id}>
                <p className="font-semibold">
                  {index + 1}º · #{formatTicketNumber(draw.winningNumber)} · {formatDrawDateTime(draw.drawnAt)}
                </p>
                <p className="text-sm text-parish-800">
                  {raffleDrawScopeLabel(draw.scope)}
                  {draw.winnerName ? ` · ${draw.winnerName}` : ""}
                  {draw.winnerContact ? ` · ${draw.winnerContact}` : ""}
                </p>
              </li>
            ))}
          </ol>
        </div>
      ) : raffle.drawWinningNumber != null ? (
        <div className="mt-8 rounded-2xl border border-gold-300 bg-gold-50 px-6 py-5 text-parish-900">
          <p className="text-xs font-bold uppercase tracking-widest text-gold-700">Sorteio realizado</p>
          <p className="mt-2 text-lg font-semibold">
            Cota vencedora #{formatTicketNumber(raffle.drawWinningNumber)}
          </p>
          {raffle.drawWinnerName ? (
            <p className="mt-1 text-sm text-parish-800">
              Ganhador(a): {raffle.drawWinnerName}
              {raffle.drawWinnerContact ? ` · ${raffle.drawWinnerContact}` : ""}
            </p>
          ) : null}
        </div>
      ) : null}

      <section className="mt-8 min-w-0 overflow-hidden rounded-2xl border border-parish-200 bg-white p-6 shadow-sm md:p-8">
        <div className="grid min-w-0 gap-6 md:grid-cols-2">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-parish-900">Prêmio</h2>
          {raffle.prizeImageUrl && isLocalSiteImageUrl(raffle.prizeImageUrl) ? (
            <ContentCoverImage
              src={raffle.prizeImageUrl}
              alt={raffle.prizeTitle}
              className="mb-4 max-w-md"
            />
          ) : (
            <div className="mb-4 flex justify-center sm:justify-start">
              <RaffleCartelaIllustration size={140} className="opacity-95" />
            </div>
          )}
          <p className="mt-2 break-words font-medium">{raffle.prizeTitle}</p>
        </div>
        <div className="min-w-0 text-sm text-parish-800">
          <p>
            <strong>Cota:</strong> {ticketPriceLabel(raffle.ticketPriceCents)}
          </p>
          {raffle.drawScheduledAt ? (
            <p className="mt-2">
              <strong>Sorteio previsto:</strong>{" "}
              {raffle.drawScheduledAt.toLocaleString("pt-BR", {
                dateStyle: "long",
                timeStyle: "short",
              })}
            </p>
          ) : null}
          <p className="mt-2">
            <strong>{stats.total}</strong> cotas no total
          </p>
        </div>
        </div>
        {raffle.prizeDescription ? (
          <p className="mt-4 break-words text-sm leading-relaxed text-parish-700">{raffle.prizeDescription}</p>
        ) : null}
      </section>

      {raffle.status === "ACTIVE" ? (
        <RaffleExperience
          slug={slug}
          ticketPriceCents={raffle.ticketPriceCents}
          kind={raffle.kind === "NUMBERS" ? "NUMBERS" : "SAINTS"}
          initialStats={stats}
        />
      ) : null}
    </PageContainer>
  );
}
