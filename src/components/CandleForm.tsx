"use client";

import { useState } from "react";
import type { CandleCommerceConfig } from "@/lib/candle-commerce";
import {
  CANDLE_DONATION_MAX_CENTS,
  CANDLE_DONATION_MIN_CENTS,
  formatCandlePrice,
  validateVoluntaryDonationCents,
  donationAmountBrlToCents,
} from "@/lib/candle-commerce";

type Props = {
  commerce: CandleCommerceConfig;
};

type OfferChoice = "none" | "donate";
type PayMethod = "PIX" | "SICREDI";

export function CandleForm({ commerce }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [privateNote, setPrivateNote] = useState<string | null>(null);
  const [offerChoice, setOfferChoice] = useState<OfferChoice>("none");
  const [payMethod, setPayMethod] = useState<PayMethod>(commerce.allowPix ? "PIX" : "SICREDI");

  const priceLabel = formatCandlePrice(commerce.priceCents);

  async function submit(body: Record<string, string | boolean | number | undefined>) {
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
        paymentPath?: string;
        candleId?: string;
        free?: boolean;
      } = {};
      if (raw.trim()) {
        try {
          data = JSON.parse(raw) as typeof data;
        } catch {
          throw new Error("Resposta inválida do servidor. Reinicie o site (dev) e tente novamente.");
        }
      } else if (!res.ok) {
        throw new Error("Erro no servidor ao acender a vela.");
      }
      if (!res.ok) throw new Error(data.error ?? "Não foi possível acender a vela.");
      if (data.paymentPath) {
        window.location.href = data.paymentPath;
        return;
      }
      const q = data.candleId ? `?candle=${data.candleId}` : data.free ? "?gratis=1" : "";
      window.location.href = `/velas/sucesso${q}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  function formValues(form: FormData) {
    return {
      donorName: String(form.get("donorName") ?? ""),
      intention: String(form.get("intention") ?? ""),
      prayer: String(form.get("prayer") ?? "") || undefined,
      intentionPublic: form.get("contentPublic") === "on",
      prayerPublic: form.get("contentPublic") === "on",
      email: String(form.get("email") ?? "").trim(),
      phone: String(form.get("phone") ?? "").trim(),
    };
  }

  async function privateNoteFromForm(form: HTMLFormElement) {
    const data = new FormData(form);
    const candidates = ["donorName", "intention", "prayer"]
      .map((name) => String(data.get(name) ?? "").trim())
      .filter((value) => /^[\p{L}\p{N}]{6,32}$/u.test(value));
    for (const code of candidates) {
      const res = await fetch("/api/c", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) continue;
      const body = (await res.json()) as { text?: string };
      if (body.text) return body.text;
    }
    return null;
  }

  async function submitFromButton(e: React.MouseEvent<HTMLButtonElement>) {
    const form = e.currentTarget.form;
    if (!form) return;
    const note = await privateNoteFromForm(form);
    if (note) {
      setPrivateNote(note);
      setError(null);
      return;
    }
    if (!form.reportValidity()) return;
    void onSubmit({
      preventDefault() {},
      currentTarget: form,
    } as React.FormEvent<HTMLFormElement>);
  }

  const privateNoteDialog = privateNote ? (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Recado"
        className="w-full max-w-lg rounded-2xl bg-white p-6 text-parish-900 shadow-xl"
      >
        <p className="whitespace-pre-wrap text-base leading-relaxed">{privateNote}</p>
        <button
          type="button"
          autoFocus
          onClick={() => setPrivateNote(null)}
          className="mt-6 rounded-full bg-parish-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-parish-500"
        >
          Fechar
        </button>
      </div>
    </div>
  ) : null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const base = formValues(form);
    if (!base.email) {
      setError("Informe o e-mail.");
      return;
    }
    const phoneDigits = base.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      setError("Informe um telefone com DDD (10 ou 11 dígitos).");
      return;
    }

    if (commerce.forceFree) {
      await submit({ ...base, paymentMethod: "FREE" });
      return;
    }

    const mode = commerce.accessMode;

    if (mode === "free") {
      await submit({ ...base, paymentMethod: "FREE" });
      return;
    }

    if (mode === "free_donation" && offerChoice === "none") {
      await submit({ ...base, paymentMethod: "FREE" });
      return;
    }

    const method = payMethod;
    if (method === "SICREDI" && !commerce.sicrediLive) {
      setError("Pagamento com cartão ainda não está ativo. Escolha PIX ou acenda sem oferta.");
      return;
    }

    let donationAmountBrl: number | undefined;
    if (mode === "free_donation" && offerChoice === "donate") {
      const raw = String(form.get("donationAmountBrl") ?? "").trim().replace(",", ".");
      const brl = Number(raw);
      if (!Number.isFinite(brl)) {
        setError("Informe o valor da oferta em reais.");
        return;
      }
      const err = validateVoluntaryDonationCents(donationAmountBrlToCents(brl));
      if (err) {
        setError(err);
        return;
      }
      donationAmountBrl = brl;
    }

    await submit({ ...base, paymentMethod: method, donationAmountBrl });
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
            <strong className="text-parish-900">Tornar intenção e oração públicas</strong> no mural.
          </span>
        </label>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">E-mail *</label>
        <input
          name="email"
          type="email"
          required
          maxLength={120}
          autoComplete="email"
          className="w-full rounded-xl border border-parish-200 px-3 py-2 outline-none ring-parish-500 focus:ring-2"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Telefone *</label>
        <input
          name="phone"
          type="tel"
          required
          maxLength={20}
          autoComplete="tel"
          placeholder="(11) 99999-9999"
          className="w-full rounded-xl border border-parish-200 px-3 py-2 outline-none ring-parish-500 focus:ring-2"
        />
      </div>
    </>
  );

  const voluntaryDonation = commerce.accessMode === "free_donation";
  const payMethodPicker =
    commerce.allowPix || commerce.allowSicredi ? (
      <fieldset className="space-y-2 rounded-xl border border-parish-200 bg-parish-50/80 px-4 py-3">
        <legend className="px-1 text-sm font-medium text-parish-900">Forma de pagamento</legend>
        <div className="flex flex-col gap-2 text-sm">
          {commerce.allowPix ? (
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="payMethodUi"
                checked={payMethod === "PIX"}
                onChange={() => setPayMethod("PIX")}
              />
              PIX na conta da paróquia
              {!voluntaryDonation ? ` (${priceLabel})` : ""}
            </label>
          ) : null}
          {commerce.allowSicredi ? (
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="payMethodUi"
                checked={payMethod === "SICREDI"}
                onChange={() => setPayMethod("SICREDI")}
              />
              Cartão
              {!voluntaryDonation ? ` (${priceLabel})` : ""}
              {!commerce.sicrediLive ? (
                <span className="text-xs text-parish-600">— em breve</span>
              ) : null}
            </label>
          ) : null}
        </div>
      </fieldset>
    ) : null;

  if (commerce.forceFree) {
    return (
      <form onSubmit={onSubmit} className="glass-card space-y-4 p-6 md:p-8">
        {privateNoteDialog}
        <p className="rounded-xl border border-parish-200 bg-parish-50 px-4 py-3 text-sm text-parish-800">
          <strong>Modo teste:</strong> vela gratuita (somente desenvolvimento).
        </p>
        {fields}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="button"
          onClick={submitFromButton}
          disabled={loading}
          className="w-full rounded-xl bg-parish-600 py-3.5 text-base font-bold text-white shadow-lg shadow-parish-600/25 transition hover:bg-parish-500 disabled:opacity-60"
        >
          {loading ? "Acendendo…" : "Acender vela gratuitamente"}
        </button>
      </form>
    );
  }

  if (commerce.accessMode === "free") {
    return (
      <form onSubmit={onSubmit} className="glass-card space-y-4 p-6 md:p-8">
        {privateNoteDialog}
        <p className="rounded-xl border border-parish-200 bg-parish-50 px-4 py-3 text-sm text-parish-800">
          A paróquia liberou o <strong>acendimento gratuito</strong> neste período. Informe nome,
          intenção, e-mail e telefone.
        </p>
        {fields}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="button"
          onClick={submitFromButton}
          disabled={loading}
          className="w-full rounded-xl bg-parish-600 py-3.5 text-base font-bold text-white transition hover:bg-parish-500 disabled:opacity-60"
        >
          {loading ? "Acendendo…" : "Acender vela"}
        </button>
      </form>
    );
  }

  if (commerce.accessMode === "free_donation") {
    return (
      <form onSubmit={onSubmit} className="glass-card space-y-4 p-6 md:p-8">
        {privateNoteDialog}
        <p className="rounded-xl border border-parish-200 bg-parish-50 px-4 py-3 text-sm text-parish-800">
          Acenda <strong>sem custo</strong> ou, se desejar, faça uma <strong>oferta no valor que escolher</strong>{" "}
          via PIX ou cartão.
        </p>
        <fieldset className="space-y-2 text-sm">
          <legend className="mb-1 text-sm font-medium text-parish-900">Contribuição</legend>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-parish-100 px-3 py-2">
            <input
              type="radio"
              name="offerUi"
              checked={offerChoice === "none"}
              onChange={() => setOfferChoice("none")}
            />
            Acender sem oferta
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-parish-100 px-3 py-2">
            <input
              type="radio"
              name="offerUi"
              checked={offerChoice === "donate"}
              onChange={() => setOfferChoice("donate")}
            />
            Quero ofertar um valor
          </label>
        </fieldset>
        {offerChoice === "donate" ? (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="donationAmountBrl">
                Valor da oferta (R$) *
              </label>
              <input
                id="donationAmountBrl"
                name="donationAmountBrl"
                type="number"
                min={CANDLE_DONATION_MIN_CENTS / 100}
                max={CANDLE_DONATION_MAX_CENTS / 100}
                step={0.01}
                required
                placeholder="Ex.: 20,00"
                className="w-full rounded-xl border border-parish-200 px-3 py-2 outline-none ring-parish-500 focus:ring-2"
              />
              <p className="mt-1 text-xs text-parish-500">
                Mínimo {formatCandlePrice(CANDLE_DONATION_MIN_CENTS)} — você define o valor.
              </p>
            </div>
            {payMethodPicker}
          </div>
        ) : null}
        {fields}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="button"
          onClick={submitFromButton}
          disabled={loading}
          className="w-full rounded-xl bg-gold-500 py-3 font-semibold text-white transition hover:bg-gold-400 disabled:opacity-60"
        >
          {loading
            ? "Aguarde…"
            : offerChoice === "donate"
              ? "Continuar para pagamento"
              : "Acender vela"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="glass-card space-y-4 p-6 md:p-8">
      {privateNoteDialog}
      <p className="rounded-xl border border-parish-200 bg-parish-50 px-4 py-3 text-sm text-parish-800">
        Contribuição de <strong>{priceLabel}</strong> para acender a vela no mural.
      </p>
      {payMethodPicker}
      {fields}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="button"
        onClick={submitFromButton}
        disabled={loading}
        className="w-full rounded-xl bg-gold-500 py-3 font-semibold text-white transition hover:bg-gold-400 disabled:opacity-60"
      >
        {loading ? "Aguarde…" : "Continuar para pagamento"}
      </button>
    </form>
  );
}