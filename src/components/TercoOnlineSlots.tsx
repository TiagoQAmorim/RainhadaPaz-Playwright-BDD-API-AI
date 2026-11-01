import Link from "next/link";
import type { TercoOnlineSlotView } from "@/lib/terco-online";

type Props = {
  slots: TercoOnlineSlotView[];
  variant?: "page" | "home";
};

export function TercoOnlineSlots({ slots, variant = "page" }: Props) {
  if (slots.length === 0) {
    return (
      <p className="text-sm text-parish-600">
        Horários em breve.{" "}
        <Link href="/contato" className="font-semibold text-parish-800 underline">
          Contato
        </Link>
      </p>
    );
  }

  const gridClass =
    variant === "home"
      ? "grid gap-4"
      : "grid gap-5 sm:grid-cols-2";

  return (
    <div className={gridClass}>
      {slots.map((slot) => (
        <article
          key={slot.id}
          className={
            variant === "home"
              ? "rounded-xl border border-parish-200 bg-parish-50/60 p-4"
              : "rounded-2xl border border-parish-200 bg-parish-50/80 p-6 md:p-7"
          }
        >
          <h3
            className={
              variant === "home"
                ? "font-semibold text-parish-900"
                : "font-[family-name:var(--font-display)] text-xl font-semibold text-parish-900 md:text-2xl"
            }
          >
            {slot.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-parish-700 md:text-base">
            {slot.scheduleText}
          </p>
          {slot.meetingUrl ? (
            <a
              href={slot.meetingUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex rounded-full bg-gold-500 px-6 py-2.5 text-sm font-bold text-parish-950 shadow-md shadow-gold-500/20 transition hover:bg-gold-400"
            >
              Entrar na reunião →
            </a>
          ) : (
            <p className="mt-3 text-xs text-parish-500">Link em breve</p>
          )}
        </article>
      ))}
    </div>
  );
}
