"use client";

import { useFormStatus } from "react-dom";

export function WeeklyCandleEmailButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl border border-parish-300 bg-white px-4 py-2 text-sm font-semibold text-parish-800 hover:bg-parish-50 disabled:opacity-60"
    >
      {pending ? "Enviando e-mail…" : "Enviar e-mail da semana agora"}
    </button>
  );
}
