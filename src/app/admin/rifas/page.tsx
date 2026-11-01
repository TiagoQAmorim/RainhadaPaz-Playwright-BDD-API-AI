import Link from "next/link";
import { redirect } from "next/navigation";
import { setRaffleFeaturedAction, setRaffleStatusAction } from "@/app/admin/raffle-actions";
import { adminBtn, adminCard } from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";
import { getRaffleStats } from "@/lib/raffles";
import { ensureSaintCatalogInDb } from "@/lib/saints-catalog";
import { prisma } from "@/lib/prisma";
import { ticketPriceLabel } from "@/lib/raffle-rules";

export default async function AdminRifasPage() {
  if (!(await getSessionAdmin())) redirect("/admin/login");

  const raffles = await prisma.raffle.findMany({ orderBy: { createdAt: "desc" } });
  const catalogCount = await ensureSaintCatalogInDb();

  const stats = await Promise.all(
    raffles.map(async (r) => ({ id: r.id, ...(await getRaffleStats(r.id)) })),
  );
  const statsById = Object.fromEntries(stats.map((s) => [s.id, s]));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-parish-900">Rifas dos Santos</h1>
          <p className="mt-1 text-sm text-parish-600">
            Catálogo (PDF): {catalogCount} santos. Cotas por rifa: 100 a 800 (de 100 em 100).
          </p>
        </div>
        <Link href="/admin/rifas/nova" className={adminBtn}>
          Nova rifa
        </Link>
      </div>

      {raffles.length === 0 ? (
        <p className={adminCard}>Nenhuma rifa cadastrada.</p>
      ) : (
        <ul className="space-y-4">
          {raffles.map((r) => {
            const st = statsById[r.id];
            return (
              <li key={r.id} className={adminCard}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-parish-900">{r.title}</h2>
                    <p className="text-sm text-parish-600">
                      {r.totalTickets} cotas · {ticketPriceLabel(r.ticketPriceCents)} · Status:{" "}
                      <strong>{r.status}</strong>
                      {r.featuredOnHome ? (
                        <span className="ml-2 rounded-full bg-gold-100 px-2 py-0.5 text-xs font-bold text-gold-800">
                          Destaque na home
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-2 text-sm text-parish-700">
                      Vendidas: {st.sold} · Reservadas: {st.reserved} · Disponíveis: {st.available}{" "}
                      · Arrecadado (pago): {ticketPriceLabel(st.raisedCents)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/rifas/${r.slug}`}
                      className="rounded-lg border border-parish-200 px-3 py-2 text-sm font-medium"
                      target="_blank"
                    >
                      Ver pública
                    </Link>
                    <Link
                      href={`/admin/rifas/${r.id}/editar`}
                      className="rounded-lg border border-parish-200 px-3 py-2 text-sm font-medium"
                    >
                      Editar
                    </Link>
                    <Link href={`/admin/rifas/${r.id}`} className={adminBtn}>
                      Gerenciar
                    </Link>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {r.status === "DRAFT" ? (
                    <form action={setRaffleStatusAction} className="inline">
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value="ACTIVE" />
                      <button type="submit" className={adminBtn}>
                        Publicar rifa
                      </button>
                    </form>
                  ) : null}
                  {r.status === "ACTIVE" ? (
                    <form action={setRaffleFeaturedAction} className="inline">
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="featured" value={r.featuredOnHome ? "0" : "1"} />
                      <button
                        type="submit"
                        className="rounded-lg border border-gold-400 bg-gold-50 px-3 py-2 text-sm font-semibold text-parish-900"
                      >
                        {r.featuredOnHome ? "Remover destaque da home" : "Destacar na home"}
                      </button>
                    </form>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
