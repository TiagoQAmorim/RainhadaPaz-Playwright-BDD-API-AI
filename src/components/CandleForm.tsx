"use client";

import { useState } from "react";

type Props = {
  priceLabel: string;
  freeMode: boolean;
  paymentsConfigured: boolean;
};

export function CandleForm({ priceLabel, freeMode, paymentsConfigured }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(body: Record<string, string | boolean | undefined>) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/candles/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const raw = await res.text();
      let data: {
        error?: string;
        checkoutUrl?: string;
        demo?: boolean;
        free?: boolean;
        candleId?: string;
      } = {};
      if (raw.trim()) {
        try {
          data = JSON.parse(raw) as typeof data;
        } catch {
          throw new Error("Resposta inválida do servidor. Reinicie o site (dev) e tente de novo.");
        }
      } else if (!res.ok) {
        throw new Error("Erro no servidor ao acender a vela.");
      }
      if (!res.ok) throw new Error(data.error ?? "Não foi possível acender a vela.");
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      const q = data.candleId ? `?candle=${data.candleId}` : data.free || data.demo ? "?gratis=1" : "";
      window.location.href = `/velas/sucesso${q}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmitFree(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await submit({
      donorName: String(form.get("donorName") ?? ""),
      intention: String(form.get("intention") ?? ""),
      prayer: String(form.get("prayer") ?? "") || undefined,
      intentionPublic: form.get("contentPublic") === "on",
      prayerPublic: form.get("contentPublic") === "on",
      email: String(form.get("email") ?? "") || undefined,
      paymentMethod: "FREE",
    });
  }

  async function onSubmitPaid(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await submit({
      donorName: String(form.get("donorName") ?? ""),
      intention: String(form.get("intention") ?? ""),
      prayer: String(form.get("prayer") ?? "") || undefined,
      intentionPublic: form.get("contentPublic") === "on",
      prayerPublic: form.get("contentPublic") === "on",
      email: String(form.get("email") ?? "") || undefined,
      paymentMethod: String(form.get("paymentMethod") ?? "PIX"),
    });
  }

  const fields = (
    <>
      <div>
        <label className="mb-1 block text-sm font-medium">Seu nome *</label>
        <input
          name="donorName"
          required
          maxLength={80}
          className="w-full rounded-xl border border-parish-200 px-3 py-2 outline-none ring-parish-500 focus:ring-2"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Intenção *</label>
        <input
          name="intention"
          required
          maxLength={120}
          placeholder="Ex.: Pela saúde da minha família"
          className="w-full rounded-xl border border-parish-200 px-3 py-2 outline-none ring-parish-500 focus:ring-2"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Oração (opcional)</label>
        <textarea
          name="prayer"
          rows={3}
          maxLength={500}
          className="w-full rounded-xl border border-parish-200 px-3 py-2 outline-none ring-parish-500 focus:ring-2"
        />
        <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-xl border border-parish-200 bg-parish-50/80 px-3 py-2.5 text-sm">
          <input type="checkbox" name="contentPublic" className="mt-1 shrink-0" />
          <span>
            <strong className="text-parish-900">Tornar intenção e oração públicas</strong> no
            mural. Se desmarcado, aparecem em sigilo (a paróquia continua recebendo tudo por
            e-mail).
          </span>
        </label>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">E-mail (opcional)</label>
        <input
          name="email"
          type="email"
          className="w-full rounded-xl border border-parish-200 px-3 py-2 outline-none ring-parish-500 focus:ring-2"
        />
      </div>
    </>
  );

  if (freeMode) {
    return (
      <form onSubmit={onSubmitFree} className="glass-card space-y-4 p-6 md:p-8">
        <p className="rounded-xl border border-parish-200 bg-parish-50 px-4 py-3 text-sm text-parish-800">
          <strong>Período de testes:</strong> acenda sua vela gratuitamente. A vela aparece no
          mural na hora.
        </p>
        {fields}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-parish-600 py-3.5 text-base font-bold text-white shadow-lg shadow-parish-600/25 transition hover:bg-parish-500 disabled:opacity-60"
        >
          {loading ? "Acendendo…" : "Acender vela gratuitamente"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmitPaid} className="glass-card space-y-4 p-6 md:p-8">
      {!paymentsConfigured ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Configure <code className="text-xs">MERCADOPAGO_ACCESS_TOKEN</code> para PIX e cartão.
        </p>
      ) : null}
      {fields}
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Forma de pagamento</legend>
        <div className="flex flex-wrap gap-3">
          <label className="flex cursor-pointer items-center gap-2 rounded-full border border-parish-200 px-4 py-2 text-sm">
            <input type="radio" name="paymentMethod" value="PIX" defaultChecked />
            PIX
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-full border border-parish-200 px-4 py-2 text-sm">
            <input type="radio" name="paymentMethod" value="CARD" />
            Cartão
          </label>
        </div>
      </fieldset>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-gold-500 py-3 font-semibold text-white transition hover:bg-gold-400 disabled:opacity-60"
      >
        {loading ? "Aguarde…" : `Acender vela — ${priceLabel}`}
      </button>
    </form>
  );
}
