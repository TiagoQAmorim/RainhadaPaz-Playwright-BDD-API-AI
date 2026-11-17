import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  autoDrawRaffleWinnerAction,
  cancelRaffleOrderManualAction,
  confirmRaffleOrderManualAction,
  deleteRaffleAction,
  setRaffleFeaturedAction,
} from "@/app/admin/raffle-actions";
import { AdminConfirmDeleteForm } from "@/components/admin/AdminConfirmDeleteForm";
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
  const [raffle, stats, sampleTickets, pendingOrders] = await Promise.all([
    prisma.raffle.findUnique({ where: { id } }),
    getRaffleStats(id),
    prisma.raffleTicket.findMany({
      where: { raffleId: id },
      select: {
        id: true,
        ticketNumber: true,
        status: true,
        saint: { select: { name: true } },
      },
      orderBy: { ticketNumber: "asc" },
      take: 20,
    }),
    prisma.raffleOrder.findMany({
      where: { raffleId: id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);
  if (!raffle) notFound();

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
        <div className="mt-4 space-y-2">
          <p className="text-sm font-semibold text-parish-900">Relatórios (CSV para Excel e XML)</p>
          <ul className="flex flex-col gap-1 text-sm">
            <li>
              <a
                href={`/api/admin/rifas/${id}/export?parte=completo`}
                className="font-semibold text-parish-700 underline"
              >
                Relatório completo (CSV)
              </a>
              {" · "}
              <a
                href={`/api/admin/rifas/${id}/export?parte=completo&formato=xml`}
                className="font-semibold text-parish-700 underline"
              >
                XML
              </a>
              <span className="text-parish-600">
                {" "}
                — pedidos, compras, disponíveis e todas as cotas
              </span>
            </li>
            <li>
              <a href={`/api/admin/rifas/${id}/export?parte=compras`} className="text-parish-700 underline">
                Só compras (CSV)
              </a>
              {" · "}
              <a
                href={`/api/admin/rifas/${id}/export?parte=compras&formato=xml`}
                className="text-parish-700 underline"
              >
                XML
              </a>
            </li>
            <li>
              <a href={`/api/admin/rifas/${id}/export?parte=disponiveis`} className="text-parish-700 underline">
                Só não comprados (CSV)
              </a>
              {" · "}
              <a
                href={`/api/admin/rifas/${id}/export?parte=disponiveis&formato=xml`}
                className="text-parish-700 underline"
              >
                XML
              </a>
            </li>
          </ul>
        </div>
      </div>

      <PendingOrders raffleId={id} orders={pendingOrders} />

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

      <section className={`${adminCard} border-red-100`}>
        <h2 className="font-semibold text-red-900">Excluir rifa</h2>
        <p className="mt-2 text-sm text-parish-700">
          Remove a rifa, todas as cotas e o histórico de pedidos.{" "}
          {stats.sold > 0 || stats.reserved > 0 ? (
            <strong className="text-red-800">
              Há {stats.sold} vendida(s) e {stats.reserved} reservada(s) — só exclua se tiver certeza.
            </strong>
          ) : (
            "Nenhuma cota vendida no momento."
          )}
        </p>
        <AdminConfirmDeleteForm
          className="mt-4"
          action={deleteRaffleAction}
          confirmMessage={
            stats.sold > 0 || stats.reserved > 0
              ? `ATENÇÃO: ${stats.sold} cota(s) vendida(s), ${stats.reserved} reservada(s). Excluir apaga tudo irreversivelmente.`
              : "Excluir esta rifa e todas as cotas?"
          }
          confirmPhrase="EXCLUIR"
        >
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="returnTo" value={`/admin/rifas/${id}`} />
          <button
            type="submit"
            className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-100"
          >
            Excluir rifa permanentemente
          </button>
        </AdminConfirmDeleteForm>
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

function PendingOrders({
  raffleId,
  orders,
}: {
  raffleId: string;
  orders: Awaited<ReturnType<typeof prisma.raffleOrder.findMany>>;
}) {
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
