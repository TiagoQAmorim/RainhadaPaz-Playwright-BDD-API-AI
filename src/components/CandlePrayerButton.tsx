"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";
import { cn } from "@/lib/cn";

const JOINED_KEY = "rp-oracao-velas";

function readJoined(candleId: string) {
  try {
    const raw = window.localStorage.getItem(JOINED_KEY);
    const ids = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(ids) && ids.includes(candleId);
  } catch {
    return false;
  }
}

function rememberJoined(candleId: string) {
  try {
    const raw = window.localStorage.getItem(JOINED_KEY);
    const ids = raw ? (JSON.parse(raw) as unknown) : [];
    const list = Array.isArray(ids) ? ids.filter((item): item is string => typeof item === "string") : [];
    if (!list.includes(candleId)) list.push(candleId);
    window.localStorage.setItem(JOINED_KEY, JSON.stringify(list.slice(-400)));
  } catch {
    // navegador sem armazenamento
  }
}

export function CandlePrayerButton({
  candleId,
  count,
  className,
  style,
}: {
  candleId: string;
  count: number;
  className?: string;
  style?: CSSProperties;
}) {
  const [total, setTotal] = useState(count);
  const [pending, setPending] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    setTotal(count);
  }, [count]);

  useEffect(() => {
    setJoined(readJoined(candleId));
  }, [candleId]);

  async function join() {
    if (pending || joined || readJoined(candleId)) {
      setJoined(true);
      return;
    }
    setPending(true);
    setTotal((value) => value + 1);
    try {
      const response = await fetch(`/api/candles/${encodeURIComponent(candleId)}/oracao`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("oracao");
      const data = (await response.json()) as { count?: number; already?: boolean };
      if (typeof data.count === "number") setTotal(data.count);
      rememberJoined(candleId);
      setJoined(true);
    } catch {
      setTotal((value) => Math.max(0, value - 1));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={cn("group relative", className)} style={style}>
      <button
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => {
          void join();
        }}
        disabled={pending || joined}
        aria-pressed={joined}
        aria-label="Em oração Juntos"
        title="Em oração Juntos"
        className={cn("relative inline-flex items-center bg-transparent p-0", joined && "opacity-80")}
      >
        <Image
          src="/images/oracao-juntos.png"
          alt=""
          width={48}
          height={74}
          unoptimized
          className="h-10 w-auto object-contain"
        />
        <span className="ml-0.5 min-w-[1ch] text-[11px] font-semibold leading-none text-gold-300">{total}</span>
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+0.35rem)] right-0 z-30 whitespace-nowrap rounded-md bg-parish-950 px-2 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-within:opacity-100"
      >
        Em oração Juntos
      </span>
    </div>
  );
}
