"use client";

import { useState } from "react";

export function CancelRaffleHoldButton({ slug, orderId }: { slug: string; orderId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    setPending(true);
    setError(null);
    const sessionId = sessionStorage.getItem("raffle_session_id") ?? "";
    const res = await fetch(`/api/rifas/${slug}/reservas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, orderId }),
    });
    if (!res.ok) {
      setError("Não foi possível liberar. Abra esta página no mesmo navegador da compra.");
      setPending(false);
      return;
    }
    window.location.href = `/rifas/${slug}`;
  }

  return (
    <div className="text-center">
      <button
        type="button"
        onClick={() => void cancel()}
        disabled={pending}
        className="text-sm font-semibold text-parish-700 underline disabled:opacity-50"
      >
        {pending ? "Liberando…" : "Desistir e liberar as cotas"}
      </button>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
