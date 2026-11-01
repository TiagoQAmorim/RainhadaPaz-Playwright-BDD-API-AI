"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ticketPriceLabel } from "@/lib/raffle-rules";

type TicketRow = {
  id: string;
  ticketNumber: number;
  ticketLabel: string;
  status: string;
  saint: {
    name: string;
    celebration: string;
    description: string;
  };
};

type CartItem = TicketRow;

function getSessionId() {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem("raffle_session_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("raffle_session_id", id);
  }
  return id;
}

const MONTHS = [
  { v: "", l: "Todos os meses" },
  { v: "1", l: "Janeiro" },
  { v: "2", l: "Fevereiro" },
  { v: "3", l: "Março" },
  { v: "4", l: "Abril" },
  { v: "5", l: "Maio" },
  { v: "6", l: "Junho" },
  { v: "7", l: "Julho" },
  { v: "8", l: "Agosto" },
  { v: "9", l: "Setembro" },
  { v: "10", l: "Outubro" },
  { v: "11", l: "Novembro" },
  { v: "12", l: "Dezembro" },
];

export function RaffleExperience({
  slug,
  ticketPriceCents,
  initialStats,
}: {
  slug: string;
  ticketPriceCents: number;
  initialStats: {
    sold: number;
    total: number;
    progressPct: number;
    committedPct?: number;
    reserved?: number;
    available: number;
  };
}) {
  const [stats, setStats] = useState(initialStats);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("number");
  const [month, setMonth] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [modalTicket, setModalTicket] = useState<TicketRow | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [buyer, setBuyer] = useState({ name: "", email: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cartTotal = cart.length * ticketPriceCents;

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      sort,
    });
    if (q.trim()) params.set("q", q.trim());
    if (statusFilter) params.set("status", statusFilter);
    if (month) params.set("month", month);

    const res = await fetch(`/api/rifas/${slug}/tickets?${params}`, { cache: "no-store" });
    const data = await res.json();
    if (res.ok) {
      setTickets(data.tickets);
      setTotalPages(data.totalPages);
    }
    setLoading(false);
  }, [slug, page, q, statusFilter, sort, month]);

  const fetchStats = useCallback(async () => {
    const res = await fetch(`/api/rifas/${slug}/stats`, { cache: "no-store" });
    if (res.ok) setStats(await res.json());
  }, [slug]);

  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, [fetchTickets, fetchStats]);

  useEffect(() => {
    const id = window.setInterval(() => {
      fetchStats();
      fetchTickets();
    }, 12_000);
    return () => window.clearInterval(id);
  }, [fetchStats, fetchTickets]);

  useEffect(() => {
    const onFocus = () => {
      fetchStats();
      fetchTickets();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchStats, fetchTickets]);

  const cartIds = useMemo(() => new Set(cart.map((c) => c.id)), [cart]);

  function addToCart(t: TicketRow) {
    if (t.status !== "AVAILABLE") return;
    if (cartIds.has(t.id)) return;
    setCart((prev) => [...prev, t]);
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/rifas/${slug}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: getSessionId(),
          ticketIds: cart.map((c) => c.id),
          buyerName: buyer.name,
          buyerEmail: buyer.email,
          buyerPhone: buyer.phone,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível concluir.");
        await fetchTickets();
        return;
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      window.location.href = `/rifas/${slug}/sucesso?order=${data.orderId}`;
    } finally {
      setSubmitting(false);
    }
  }

  function openTicket(t: TicketRow) {
    setModalTicket(t);
  }

  const filterInputClass =
    "rounded-lg border-2 border-parish-300 bg-white px-3 py-2 text-sm font-medium text-parish-900 shadow-sm";

  function ticketCardClass(status: string, inCart: boolean) {
    const base =
      "flex min-h-[9.5rem] flex-col rounded-xl border-2 p-3 text-left shadow-md transition-all duration-200";
    if (status === "SOLD") {
      return `${base} cursor-default border-parish-300 bg-parish-200/90`;
    }
    if (status === "RESERVED") {
      return `${base} cursor-default border-amber-500 bg-amber-100`;
    }
    const selected = inCart
      ? "border-gold-500 bg-gold-300/20 ring-2 ring-gold-500 ring-offset-2 ring-offset-parish-100"
      : "border-parish-500 bg-white";
    return `${base} cursor-pointer ${selected} hover:-translate-y-1 hover:border-parish-600 hover:bg-parish-50 hover:shadow-xl hover:ring-2 hover:ring-parish-400/50 active:translate-y-0`;
  }

  function saintNameClass(status: string) {
    if (status === "SOLD") {
      return "mt-1 line-clamp-2 min-h-[2.5rem] flex-1 text-sm font-semibold leading-snug text-parish-600 line-through decoration-parish-400 decoration-2";
    }
    if (status === "RESERVED") {
      return "mt-1 line-clamp-2 min-h-[2.5rem] flex-1 text-sm font-bold leading-snug text-amber-950";
    }
    return "mt-1 line-clamp-2 min-h-[2.5rem] flex-1 text-sm font-bold leading-snug text-parish-900";
  }

  return (
    <div className="mt-12 space-y-8">
      <div className="rounded-xl border-2 border-parish-200 bg-white p-4 text-sm font-medium text-parish-900 shadow-sm">
        <strong>{stats.sold}</strong> de <strong>{stats.total}</strong> cotas vendidas —{" "}
        <strong>{stats.progressPct.toFixed(1)}%</strong>
        {(stats.reserved ?? 0) > 0 ? (
          <>
            {" "}
            · <strong>{stats.reserved}</strong> reservadas
          </>
        ) : null}{" "}
        · {stats.available} disponíveis
        <div className="relative mt-2 h-3 overflow-hidden rounded-full bg-parish-200">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-amber-400 transition-all duration-500"
            style={{ width: `${Math.min(100, stats.committedPct ?? stats.progressPct)}%` }}
          />
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-parish-600 transition-all duration-500"
            style={{ width: `${Math.min(100, stats.progressPct)}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-parish-600">
          Azul: vendidas · Âmbar: reservadas (aguardando pagamento)
        </p>
      </div>

      <div className="flex flex-wrap gap-3 text-xs font-semibold text-parish-800">
        <span className="inline-flex items-center gap-2 rounded-full border-2 border-parish-500 bg-white px-3 py-1">
          <span className="h-3 w-3 rounded-sm border-2 border-parish-500 bg-white" />
          Disponível
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border-2 border-parish-300 bg-parish-200 px-3 py-1">
          <span className="h-3 w-3 rounded-sm bg-parish-400" />
          Vendida
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border-2 border-amber-600 bg-amber-200 px-3 py-1">
          <span className="h-3 w-3 rounded-sm bg-amber-500" />
          Reservada
        </span>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex-1">
          <label className="text-sm font-semibold text-parish-900">Procure seu santo de devoção…</label>
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Nome, número da cota ou mês"
            className={`mt-1 w-full ${filterInputClass}`}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className={filterInputClass}
          >
            <option value="">Todos</option>
            <option value="AVAILABLE">Disponíveis</option>
            <option value="RESERVED">Reservados</option>
            <option value="SOLD">Vendidos</option>
          </select>
          <select
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              setPage(1);
            }}
            className={filterInputClass}
          >
            {MONTHS.map((m) => (
              <option key={m.v || "all"} value={m.v}>
                {m.l}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className={filterInputClass}
          >
            <option value="number">Nº da cota</option>
            <option value="name">Nome do santo</option>
            <option value="feast">Data de celebração</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-sm font-medium text-parish-700">Carregando cotas…</p>
      ) : (
        <div className="rounded-2xl border-2 border-parish-200 bg-parish-100/90 p-4 shadow-inner md:p-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {tickets.map((t) => (
              <article
                key={t.id}
                role="button"
                tabIndex={0}
                onClick={() => openTicket(t)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openTicket(t);
                  }
                }}
                className={ticketCardClass(t.status, cartIds.has(t.id))}
              >
                <p
                  className={`text-[11px] font-bold uppercase tracking-wide ${
                    t.status === "SOLD"
                      ? "text-parish-700"
                      : t.status === "RESERVED"
                        ? "text-amber-950"
                        : "text-parish-700"
                  }`}
                >
                  Cota #{t.ticketLabel}
                </p>
                <h3 className={saintNameClass(t.status)}>{t.saint.name}</h3>
                <p
                  className={`mt-1 text-xs font-medium ${
                    t.status === "SOLD" ? "text-parish-600" : "text-parish-800"
                  }`}
                >
                  📅 {t.saint.celebration}
                </p>
                <p
                  className={`mt-2 text-sm font-bold ${
                    t.status === "SOLD" ? "text-parish-600" : "text-parish-900"
                  }`}
                >
                  {ticketPriceLabel(ticketPriceCents)}
                </p>
                {t.status === "SOLD" ? (
                  <p className="mt-2 rounded-md bg-parish-500 px-2 py-1 text-center text-[10px] font-bold uppercase tracking-wider text-white">
                    Vendida
                  </p>
                ) : t.status === "RESERVED" ? (
                  <p className="mt-2 text-xs font-bold text-amber-950">Aguardando pagamento</p>
                ) : (
                  <p className="mt-auto pt-2 text-xs font-bold text-parish-700">
                    {cartIds.has(t.id) ? "No carrinho — clique para ver" : "Clique para escolher"}
                  </p>
                )}
              </article>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
          className="rounded-lg border border-parish-200 px-3 py-1.5 text-sm disabled:opacity-40"
        >
          Anterior
        </button>
        <span className="text-sm text-parish-600">
          Página {page} de {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="rounded-lg border border-parish-200 px-3 py-1.5 text-sm disabled:opacity-40"
        >
          Próxima
        </button>
      </div>

      {cart.length > 0 ? (
        <aside className="sticky bottom-4 z-20 rounded-2xl border border-gold-400/40 bg-white p-5 shadow-xl">
          <h2 className="font-semibold text-parish-900">Meus santos escolhidos</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {cart.map((c) => (
              <li key={c.id} className="flex justify-between gap-2">
                <span className="line-clamp-1">
                  {c.saint.name} — {ticketPriceLabel(ticketPriceCents)}
                </span>
                <button
                  type="button"
                  onClick={() => removeFromCart(c.id)}
                  className="shrink-0 text-xs font-semibold text-red-700"
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 font-bold">Total: {ticketPriceLabel(cartTotal)}</p>
          {!checkoutOpen ? (
            <button
              type="button"
              onClick={() => setCheckoutOpen(true)}
              className="mt-4 w-full rounded-full bg-gold-500 py-3 text-sm font-bold text-parish-950"
            >
              Continuar para pagamento
            </button>
          ) : (
            <form onSubmit={handleCheckout} className="mt-4 space-y-2">
              <input
                required
                placeholder="Nome completo"
                value={buyer.name}
                onChange={(e) => setBuyer({ ...buyer, name: e.target.value })}
                className="w-full rounded-lg border border-parish-200 px-3 py-2 text-sm"
              />
              <input
                required
                type="email"
                placeholder="E-mail"
                value={buyer.email}
                onChange={(e) => setBuyer({ ...buyer, email: e.target.value })}
                className="w-full rounded-lg border border-parish-200 px-3 py-2 text-sm"
              />
              <input
                required
                placeholder="Telefone / WhatsApp"
                value={buyer.phone}
                onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })}
                className="w-full rounded-lg border border-parish-200 px-3 py-2 text-sm"
              />
              {error ? <p className="text-sm text-red-700">{error}</p> : null}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-parish-600 py-3 text-sm font-bold text-white hover:bg-parish-500 disabled:opacity-60"
              >
                {submitting ? "Processando…" : "Confirmar e pagar"}
              </button>
            </form>
          )}
        </aside>
      ) : null}

      {modalTicket ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-parish-600/35 p-4 sm:items-center"
          role="dialog"
          aria-modal
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-parish-900">
              {modalTicket.saint.name}
            </h2>
            <p className="mt-2 text-sm font-medium text-gold-700">
              📅 Dia de celebração: {modalTicket.saint.celebration}
            </p>
            <h3 className="mt-4 text-sm font-semibold">Quem foi {modalTicket.saint.name.split(" ")[0]}?</h3>
            <p className="mt-2 text-sm leading-relaxed text-parish-700">
              {modalTicket.saint.description}
            </p>
            <p className="mt-4 text-sm">
              <strong>Cota:</strong> #{modalTicket.ticketLabel} ·{" "}
              <strong>Valor:</strong> {ticketPriceLabel(ticketPriceCents)}
            </p>
            {modalTicket.status === "SOLD" ? (
              <p className="mt-4 rounded-lg bg-parish-100 p-3 text-sm text-parish-700">
                Esta cota já foi adquirida.
              </p>
            ) : modalTicket.status === "RESERVED" ? (
              <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                Cota reservada — aguardando pagamento de outro participante.
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={modalTicket.status !== "AVAILABLE"}
                onClick={() => {
                  addToCart(modalTicket);
                  setModalTicket(null);
                  setCheckoutOpen(false);
                }}
                className="rounded-full bg-parish-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-parish-500 disabled:cursor-not-allowed disabled:bg-parish-200"
              >
                {cartIds.has(modalTicket.id) ? "Já no carrinho" : "Adicionar e continuar compra"}
              </button>
              <button
                type="button"
                onClick={() => setModalTicket(null)}
                className="rounded-full border border-parish-300 px-6 py-2.5 text-sm font-semibold"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
