import { notFound } from "next/navigation";
import { RaffleExperience } from "@/components/raffle/RaffleExperience";
import { PageContainer } from "@/components/PageContainer";
import { RaffleCartelaIllustration } from "@/components/RaffleCartelaIllustration";
import { getRaffleBySlug, getRaffleStats } from "@/lib/raffles";
import { formatTicketNumber, ticketPriceLabel } from "@/lib/raffle-rules";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = await getRaffleBySlug(slug);
  return { title: r ? r.title : "Rifa" };
}

export default async function RifaPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const raffle = await getRaffleBySlug(slug);
  if (!raffle || raffle.status !== "ACTIVE") notFound();

  const stats = await getRaffleStats(raffle.id);

  return (
    <PageContainer wide className="bg-parish-50 pb-24 pt-10 md:pt-14">
      <header className="flex max-w-4xl flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        <RaffleCartelaIllustration size={168} priority className="mx-auto sm:mx-0 sm:shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-600">
            Rifa dos Santos — Ajude Nossa Paróquia!
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold text-parish-900 md:text-4xl">
            {raffle.title}
          </h1>
          <p className="mt-4 text-parish-800">
            Participe da nossa Rifa dos Santos! Escolha um santo de sua devoção, conheça um pouco de sua
            história e contribua com nossa paróquia. Cada cota representa uma oportunidade de ajudar nossa
            comunidade.
          </p>
          {raffle.purpose ? (
            <p className="mt-2 text-sm text-parish-600">
              <strong>Objetivo:</strong> {raffle.purpose}
            </p>
          ) : null}
        </div>
      </header>

      {raffle.drawWinningNumber != null ? (
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

      <section className="mt-8 grid gap-6 rounded-2xl border border-parish-200 bg-white p-6 shadow-sm md:grid-cols-2 md:p-8">
        <div>
          <h2 className="text-lg font-semibold text-parish-900">Prêmio</h2>
          <p className="mt-2 font-medium">{raffle.prizeTitle}</p>
          {raffle.prizeDescription ? (
            <p className="mt-2 text-sm text-parish-700">{raffle.prizeDescription}</p>
          ) : null}
        </div>
        <div className="text-sm text-parish-800">
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
      </section>

      <RaffleExperience
        slug={slug}
        ticketPriceCents={raffle.ticketPriceCents}
        initialStats={stats}
      />
    </PageContainer>
  );
}
