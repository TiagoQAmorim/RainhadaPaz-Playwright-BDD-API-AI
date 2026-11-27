"use client";

import { useState } from "react";
import QRCode from "react-qr-code";

export function WorkPixRow({
  amountLabel,
  pixCopiaECola,
}: {
  amountLabel: string;
  pixCopiaECola: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex items-center gap-3">
      <div className="shrink-0 rounded-lg bg-white p-1.5 shadow-sm">
        <QRCode value={pixCopiaECola} size={84} level="M" aria-label="QR Code para pagamento PIX" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold tabular-nums text-parish-900">{amountLabel}</p>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(pixCopiaECola).then(() => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 2000);
            });
          }}
          className="mt-1 rounded-full border border-parish-300 bg-white px-3 py-1 text-xs font-bold text-parish-800 hover:bg-parish-50"
        >
          {copied ? "Copiado" : "Copiar PIX"}
        </button>
      </div>
    </div>
  );
}
