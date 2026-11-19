"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  slug: string;
  orderId: string;
  initialStatus: string;
  expiresAt: string | null;
  holdSeconds: number;
  initialSeconds: number;
};

/** Contagem da reserva na tela de PIX (e do cartão, quando existir). No zero, libera as cotas e volta à rifa. */
export function RaffleHoldCountdown({
  slug,
  orderId,
  initialStatus,
  expiresAt,
  holdSeconds,
  initialSeconds,
}: Props) {
  const router = useRouter();
  const [deadline, setDeadline] = useState(expiresAt);
  const deadlineRef = useRef(expiresAt);
  const [now, setNow] = useState<number | null>(null);
  const initialSecondsRef = useRef(initialSeconds);
  const [leaving, setLeaving] = useState(false);
  deadlineRef.current = deadline;

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (initialStatus === "PAID") return;
    let stopped = false;
    let timer = 0;

    const tick = async () => {
      const res = await fetch(`/api/rifas/${slug}/pedidos/${orderId}/status`, { cache: "no-store" });
      if (stopped) return;
      if (res.status === 404) {
        window.location.href = `/rifas/${slug}`;
        return;
      }
      if (!res.ok) return;
      const data = (await res.json()) as { status?: string; expiresAt?: string | null };
      if (data.expiresAt) setDeadline(data.expiresAt);
      if (data.status === "PAID") {
        router.refresh();
        return;
      }
      if (data.status === "CANCELLED") {
        setLeaving(true);
        window.location.href = `/rifas/${slug}`;
      }
    };

    const schedule = () => {
      const end = deadlineRef.current ? new Date(deadlineRef.current).getTime() : Number.POSITIVE_INFINITY;
      const remaining = end - Date.now();
      const wait = remaining <= 0 ? 1000 : Math.min(4000, remaining + 400);
      timer = window.setTimeout(() => {
        void tick().finally(() => {
          if (!stopped) schedule();
        });
      }, wait);
    };

    void tick().finally(() => {
      if (!stopped) schedule();
    });

    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [initialStatus, orderId, router, slug]);

  if (initialStatus === "PAID" || !deadline) return null;

  const end = new Date(deadline).getTime();
  const remainingMs = now === null ? initialSecondsRef.current * 1000 : Math.max(0, end - now);
  const totalMs = Math.max(holdSeconds * 1000, 1);
  const seconds = Math.ceil(remainingMs / 1000);
  const shown = seconds;
  const mm = String(Math.floor(shown / 60)).padStart(2, "0");
  const ss = String(shown % 60).padStart(2, "0");
  const urgent = seconds !== null && seconds > 0 && seconds <= 60;
  const progress = Math.min(100, (remainingMs / totalMs) * 100);

  return (
    <div
      role="timer"
      aria-label={
        leaving || seconds === 0
          ? "Tempo esgotado. Voltando à rifa."
          : `Tempo restante para pagar: ${mm} minutos e ${ss} segundos`
      }
      className={`mb-4 rounded-2xl border px-5 py-4 text-center shadow-sm ${
        urgent || seconds === 0
          ? "border-red-200 bg-red-50 text-red-950"
          : "border-parish-200 bg-white text-parish-900"
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-600">Tempo para pagar</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-4xl font-semibold tabular-nums">
        {leaving || seconds === 0 ? "00:00" : `${mm}:${ss}`}
      </p>
      <div className="mx-auto mt-3 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-parish-100">
        <div
          className={`h-full rounded-full ${urgent || seconds === 0 ? "bg-red-600" : "bg-parish-600"}`}
          style={{ width: `${seconds === 0 ? 0 : progress}%` }}
        />
      </div>
      <p className="mt-3 text-sm">
        {leaving
          ? "Tempo esgotado. As cotas foram liberadas e você volta para a rifa."
          : seconds === 0
            ? "Tempo esgotado. Liberando as cotas…"
            : "Vale para o PIX e, quando existir, para o cartão. Se o tempo acabar, a reserva cai."}
      </p>
    </div>
  );
}
