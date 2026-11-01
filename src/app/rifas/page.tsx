import Link from "next/link";
import { PageContainer } from "@/components/PageContainer";
import { RaffleCartelaIllustration } from "@/components/RaffleCartelaIllustration";
import { SectionHeading } from "@/components/SectionHeading";
import { getRaffleStats, listPublicRaffles } from "@/lib/raffles";
import { ticketPriceLabel } from "@/lib/raffle-rules";

export const metadata = { title: "Rifa dos Santos" };

export default async function RifasIndexPage() {
  const raffles = await listPublicRaffles();
  const statsList = await Promise.all(raffles.map((r) => getRaffleStats(r.id)));
  const statsById = Object.fromEntries(raffles.map((r, i) => [r.id, statsList[i]]));

  return (
    <PageContainer wide className="bg-parish-50 py-12 md:py-16">
      <div className="mb-10 flex flex-col items-center gap-6 md:flex-row md:items-start md:gap-10">
        <RaffleCartelaIllustration size={200} priority className="md:-mt-2" />
        <SectionHeading
          className="mb-0 text-center md:text-left"
          eyebrow="Campanha paroquial"
          title="Rifa dos Santos"
          description="Escolha um santo de sua devoção, conheça sua história e contribua com nossa paróquia. Cada cota ajuda a comunidade e homenageia um santo da Igreja."
        />
      </div>
      {raffles.length === 0 ? (
        <p className="rounded-xl border border-dashed border-parish-200 bg-parish-50 p-8 text-center text-parish-700">
          Nenhuma rifa ativa no momento.
        </p>
      ) : (
        <ul className="grid gap-6 md:grid-cols-2">
          {raffles.map((r) => {
            const st = statsById[r.id];
            return (
              <li key={r.id}>
                <Link
                  href={`/rifas/${r.slug}`}
                  className="block rounded-2xl border border-parish-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-parish-900">
                    {r.title}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm text-parish-700">{r.description}</p>
                  <p className="mt-4 text-sm font-semibold text-gold-700">
                    {r.totalTickets} cotas · {ticketPriceLabel(r.ticketPriceCents)} cada
                  </p>
                  {st ? (
                    <div className="mt-4">
                      <p className="text-xs font-medium text-parish-700">
                        {st.sold} vendidas ({st.progressPct.toFixed(1)}%)
                      </p>
                      <div className="relative mt-1.5 h-2 overflow-hidden rounded-full bg-parish-200">
                        <div
                          className="absolute inset-y-0 left-0 bg-amber-400"
                          style={{ width: `${Math.min(100, st.committedPct)}%` }}
                        />
                        <div
                          className="absolute inset-y-0 left-0 bg-parish-600"
                          style={{ width: `${Math.min(100, st.progressPct)}%` }}
                        />
                      </div>
                    </div>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </PageContainer>
  );
}
