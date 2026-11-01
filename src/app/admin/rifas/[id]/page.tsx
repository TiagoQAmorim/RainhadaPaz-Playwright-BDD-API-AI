import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  autoDrawRaffleWinnerAction,
  cancelRaffleOrderManualAction,
  confirmRaffleOrderManualAction,
  setRaffleFeaturedAction,
} from "@/app/admin/raffle-actions";
import { adminBtn, adminCard } from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";
import { getRaffleStats } from "@/lib/raffles";
import { formatTicketNumber, ticketPriceLabel } from "@/lib/raffle-rules";
import { prisma } from "@/lib/prisma";

export default async function AdminRifaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  if (!(await getSessionAdmin())) redirect("/admin/login");
  const { id } = await params;
  const { erro } = await searchParams;
  const raffle = await prisma.raffle.findUnique({ where: { id } });
  if (!raffle) notFound();

  const stats = await getRaffleStats(id);
  const sampleTickets = await prisma.raffleTicket.findMany({
    where: { raffleId: id },
    include: { saint: true },
    orderBy: { ticketNumber: "asc" },
    take: 20,
  });

  return (
    <div className="space-y-8">
      <Link href="/admin/rifas" className="text-sm text-parish-600">
        ← Rifas
      </Link>
      {erro ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{erro}</p>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-xl font-semibold text-parish-900">{raffle.title}</h1>
        <div className="flex flex-wrap gap-2">
          {!raffle.drawRecordedAt ? (
            <Link href={`/admin/rifas/${id}/editar`} className={adminBtn}>
              Editar rifa
            </Link>
          ) : null}
          {raffle.status === "ACTIVE" ? (
            <form action={setRaffleFeaturedAction}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="featured" value={raffle.featuredOnHome ? "0" : "1"} />
              <button type="submit" className={adminBtn}>
                {raffle.featuredOnHome ? "Remover destaque na home" : "Destacar no banner da home"}
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total", stats.total],
          ["Vendidas", stats.sold],
          ["Reservadas", stats.reserved],
          ["Disponíveis", stats.available],
        ].map(([label, val]) => (
          <div key={label} className={adminCard}>
            <p className="text-2xl font-semibold">{val}</p>
            <p className="text-sm text-parish-600">{label}</p>
          </div>
        ))}
      </div>

      <div className={adminCard}>
        <p className="text-sm text-parish-700">
          Valor/cota: {ticketPriceLabel(stats.ticketPriceCents)} · Arrecadado (confirmado):{" "}
          {ticketPriceLabel(stats.raisedCents)} · Progresso: {stats.progressPct.toFixed(1)}%
        </p>
        <a
          href={`/api/admin/rifas/${id}/export`}
          className="mt-3 inline-block text-sm font-semibold text-parish-700 underline"
        >
          Exportar CSV
        </a>
      </div>

      <PendingOrders raffleId={id} />

      <section className={adminCard}>
        <h2 className="font-semibold">Sorteio do prêmio</h2>
        {raffle.drawRecordedAt ? (
          <div className="mt-3 space-y-1 text-sm text-parish-700">
            <p>
              <strong>Ganhador(a):</strong> {raffle.drawWinnerName ?? "—"}
            </p>
            <p>
              <strong>Contato:</strong> {raffle.drawWinnerContact ?? "—"}
            </p>
            <p>
              <strong>Cota sorteada:</strong> #{formatTicketNumber(raffle.drawWinningNumber ?? 0)}
            </p>
            {raffle.drawNotes ? <p className="text-parish-600">{raffle.drawNotes}</p> : null}
          </div>
        ) : (
          <div className="mt-4 max-w-lg">
            <p className="text-sm text-parish-600">
              Cotas vendidas elegíveis: <strong>{stats.sold}</strong>. O sistema escolhe uma cota
              vendida ao acaso e preenche o nome e contato do comprador.
            </p>
            <form action={autoDrawRaffleWinnerAction} className="mt-4">
              <input type="hidden" name="raffleId" value={id} />
              <button
                type="submit"
                className="rounded-full bg-gold-500 px-6 py-3 text-sm font-bold text-parish-950 hover:bg-gold-400"
              >
                Sortear ganhador automaticamente
              </button>
            </form>
          </div>
        )}
      </section>

      <section className={adminCard}>
        <h2 className="font-semibold">Amostra de cotas (20 primeiras)</h2>
        <ul className="mt-4 divide-y divide-parish-100 text-sm">
          {sampleTickets.map((t) => (
            <li key={t.id} className="flex flex-wrap justify-between gap-2 py-2">
              <span>
                #{formatTicketNumber(t.ticketNumber)} — {t.saint.name}
              </span>
              <span className="text-parish-600">{t.status}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

async function PendingOrders({ raffleId }: { raffleId: string }) {
  const orders = await prisma.raffleOrder.findMany({
    where: { raffleId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  if (orders.length === 0) return null;
  return (
    <section className={adminCard}>
      <h2 className="font-semibold">Pedidos pendentes</h2>
      <ul className="mt-4 space-y-3 text-sm">
        {orders.map((o) => (
          <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-parish-100 pb-2">
            <span>
              {o.buyerName} — {ticketPriceLabel(o.totalCents)} — {o.buyerEmail}
            </span>
            <div className="flex flex-wrap gap-2">
              <form action={confirmRaffleOrderManualAction}>
                <input type="hidden" name="orderId" value={o.id} />
                <input type="hidden" name="raffleId" value={raffleId} />
                <button type="submit" className={adminBtn}>
                  Confirmar pagamento
                </button>
              </form>
              <form action={cancelRaffleOrderManualAction}>
                <input type="hidden" name="orderId" value={o.id} />
                <input type="hidden" name="raffleId" value={raffleId} />
                <button
                  type="submit"
                  className="rounded-lg border border-parish-300 px-3 py-2 text-sm font-semibold text-parish-800"
                >
                  Cancelar reserva
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
