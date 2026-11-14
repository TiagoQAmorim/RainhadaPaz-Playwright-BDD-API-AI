"use client";

import { useState } from "react";
import { PARISH_PAYMENT } from "@/lib/parish-payments";

type Props = {
  className?: string;
  showDizimoHint?: boolean;
};

export function ParishBankDetails({ className, showDizimoHint = true }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyPix() {
    try {
      await navigator.clipboard.writeText(PARISH_PAYMENT.pixKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className={
        className ??
        "rounded-2xl border border-parish-200/80 bg-white p-6 shadow-sm md:p-8"
      }
    >
      <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-parish-900">
        Dados para pagamento
      </h2>
      <p className="mt-2 text-sm text-parish-600">{PARISH_PAYMENT.legalName}</p>

      <dl className="mt-6 space-y-4 text-sm text-parish-800">
        <div>
          <dt className="font-semibold text-parish-900">Chave PIX ({PARISH_PAYMENT.pixKeyType})</dt>
          <dd className="mt-1 flex flex-wrap items-center gap-3">
            <code className="rounded-lg bg-parish-50 px-3 py-2 font-mono text-base text-parish-900">
              {PARISH_PAYMENT.pixKey}
            </code>
            <button
              type="button"
              onClick={() => void copyPix()}
              className="rounded-full border border-parish-300 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-parish-800 transition hover:bg-parish-50"
            >
              {copied ? "Copiado!" : "Copiar PIX"}
            </button>
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-parish-900">Transferência bancária</dt>
          <dd className="mt-1 leading-relaxed">
            Banco <strong>{PARISH_PAYMENT.bank.name}</strong>
            <br />
            Ag. {PARISH_PAYMENT.bank.agency} · C/C {PARISH_PAYMENT.bank.account}
          </dd>
        </div>
      </dl>

      {showDizimoHint ? (
        <p className="mt-5 rounded-xl bg-parish-50 px-4 py-3 text-xs leading-relaxed text-parish-700">
          No PIX ou na transferência, informe <strong>Dízimo</strong> e o seu nome. Envie o comprovante
          à secretaria se quiser registro formal.
        </p>
      ) : null}
    </div>
  );
}
