"use client";

import { useState } from "react";
import Link from "next/link";
import QRCode from "react-qr-code";

type Props = {
  legalName: string;
  pixKey: string;
  pixKeyType: string;
  bank: { name: string; code?: string; branchLabel?: string; agency: string; account: string };
  amountLabel: string;
  reference: string;
  messageSuggestion: string;
  title: string;
  afterPayNote: string;
  backHref: string;
  backLabel: string;
  /** BR Code com valor + txid (gerado em parish-pix.ts). */
  pixCopiaECola?: string | null;
  depositTitle?: string;
  cardNote?: string;
};

export function PixPaymentInstructions(props: Props) {
  const [copied, setCopied] = useState<"key" | "ref" | "msg" | "brcode" | null>(null);

  async function copy(text: string, which: "key" | "ref" | "msg" | "brcode") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="rounded-2xl border border-parish-200 bg-white p-6 shadow-sm md:p-8">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-parish-900">
          {props.title}
        </h1>
        <p className="mt-2 text-sm text-parish-600">{props.legalName}</p>

        <p className="mt-6 text-3xl font-bold tabular-nums text-parish-900">{props.amountLabel}</p>

        {props.pixCopiaECola ? (
          <div className="mt-6 flex w-full flex-col items-center rounded-xl border border-parish-200 bg-parish-50/80 px-4 py-5 text-center">
            <p className="w-full text-sm font-semibold text-parish-900">QR Code PIX</p>
            <p className="mt-1 w-full text-xs text-parish-600">
              Abra o app do banco e escaneie (valor já preenchido).
            </p>
            <div className="mt-4 flex w-full justify-center">
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <QRCode
                  value={props.pixCopiaECola}
                  size={200}
                  level="M"
                  className="mx-auto block h-auto w-[200px] max-w-full"
                  aria-label="QR Code para pagamento PIX"
                />
              </div>
            </div>
            <div className="mt-4 flex w-full justify-center">
              <CopyBtn
                label={copied === "brcode" ? "Copiado!" : "Copiar PIX copia e cola"}
                onClick={() => void copy(props.pixCopiaECola!, "brcode")}
              />
            </div>
          </div>
        ) : null}

        <dl className="mt-6 space-y-4 text-sm text-parish-800">
          <div>
            <dt className="font-semibold text-parish-900">Chave PIX ({props.pixKeyType})</dt>
            <dd className="mt-1 flex flex-wrap items-center gap-2">
              <code className="rounded-lg bg-parish-50 px-3 py-2 font-mono text-base">
                {props.pixKey}
              </code>
              <CopyBtn
                label={copied === "key" ? "Copiado!" : "Copiar chave"}
                onClick={() => void copy(props.pixKey, "key")}
              />
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-parish-900">Identificador (cole na mensagem do PIX)</dt>
            <dd className="mt-1 flex flex-wrap items-center gap-2">
              <code className="rounded-lg bg-gold-50 px-3 py-2 font-mono text-sm font-bold text-parish-900">
                {props.reference}
              </code>
              <CopyBtn
                label={copied === "ref" ? "Copiado!" : "Copiar"}
                onClick={() => void copy(props.reference, "ref")}
              />
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-parish-900">Sugestão de mensagem</dt>
            <dd className="mt-1">
              <p className="rounded-lg bg-parish-50 px-3 py-2 text-xs leading-relaxed">{props.messageSuggestion}</p>
              <CopyBtn
                className="mt-2"
                label={copied === "msg" ? "Copiado!" : "Copiar mensagem"}
                onClick={() => void copy(props.messageSuggestion, "msg")}
              />
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-parish-900">{props.depositTitle ?? "Transferência (alternativa)"}</dt>
            <dd className="mt-1">
              Banco <strong>{props.bank.name}</strong>
              {props.bank.code ? ` (${props.bank.code})` : ""} · {props.bank.branchLabel ?? "Ag."}{" "}
              {props.bank.agency} · Conta {props.bank.account}
            </dd>
          </div>
        </dl>
        {props.cardNote ? (
          <p className="mt-6 rounded-xl border border-parish-200 bg-parish-50 px-4 py-3 text-sm text-parish-800">
            {props.cardNote}
          </p>
        ) : null}

        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {props.afterPayNote}
        </p>

        <Link
          href={props.backHref}
          className="mt-6 inline-flex rounded-full border border-parish-300 px-5 py-2.5 text-sm font-semibold text-parish-800 hover:bg-parish-50"
        >
          {props.backLabel}
        </Link>
      </div>
    </div>
  );
}

function CopyBtn({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border border-parish-300 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-parish-800 hover:bg-parish-50 ${className ?? ""}`}
    >
      {label}
    </button>
  );
}