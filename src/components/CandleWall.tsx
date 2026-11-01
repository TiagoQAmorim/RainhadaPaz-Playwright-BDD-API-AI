import Link from "next/link";
import { CandleVisual } from "@/components/CandleVisual";
import { candleVisualSlotHeight, type CandleVisualSize } from "@/lib/candle-visual-size";
import { resolveCandleBurnWindow } from "@/lib/candle-burn";
import { formatCandleTimeLeft } from "@/lib/candles";
import { cn } from "@/lib/cn";

export type CandleItem = {
  id: string;
  donorName: string;
  intention: string;
  prayer: string | null;
  intentionPublic?: boolean;
  prayerPublic?: boolean;
  litAt: Date | null;
  expiresAt?: Date | null;
};

const textBlock =
  "min-w-0 overflow-hidden break-normal text-pretty [word-break:normal] [overflow-wrap:break-word]";

function normalizeLine(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

export function CandleWall({
  candles,
  dark,
  banner,
  compact,
  embedded,
  showViewAllHref,
  durationHours,
  dense,
  muralDark,
}: {
  candles: CandleItem[];
  dark?: boolean;
  banner?: boolean;
  muralDark?: boolean;
  compact?: boolean;
  embedded?: boolean;
  dense?: boolean;
  showViewAllHref?: string;
  durationHours: number;
}) {
  const onPhoto = banner === true;
  const velario = dark === true && !banner;
  const darkCard = velario || muralDark === true;
  const nightText = onPhoto || darkCard;
  const tightText = dense || compact;
  const uniformMural = embedded === true && muralDark === true;
  const roomyText = embedded && !tightText && !uniformMural;
  const visualSize: CandleVisualSize = onPhoto ? "xs" : dense || compact ? "sm" : "lg";
  const candleSize: CandleVisualSize = uniformMural ? "md" : visualSize;
  const slotHeight = candleVisualSlotHeight(candleSize);
  const wellHeight =
    onPhoto || !dense ? slotHeight : Math.round(slotHeight * 0.9);

  if (candles.length === 0) {
    return (
      <p
        className={
          nightText
            ? "rounded-xl border border-dashed border-white/25 bg-black/20 p-10 text-center text-amber-100/60"
            : "rounded-xl border border-dashed border-parish-300 bg-parish-50 p-10 text-center text-parish-600"
        }
      >
        Seja o primeiro a acender uma vela virtual hoje.
      </p>
    );
  }

  const gridClass = compact
    ? onPhoto
      ? "grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      : "grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4"
    : embedded
      ? uniformMural
        ? "grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3"
        : "grid grid-cols-1 items-start gap-4 sm:grid-cols-2 xl:grid-cols-3"
      : "grid grid-cols-1 items-start gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4";

  return (
    <div className={cn("candle-velario", velario && "candle-velario--sanctuary")}>
      {velario ? <div className="candle-velario__rack-glow" aria-hidden /> : null}

      <ul className={cn(gridClass, "relative z-[1]")}>
        {candles.map((c, i) => {
          const burn = resolveCandleBurnWindow(c.litAt, c.expiresAt, durationHours);
          const timeLeft = formatCandleTimeLeft(c.litAt, c.expiresAt, durationHours);
          const name = normalizeLine(c.donorName);
          const intention = normalizeLine(c.intention);
          const prayer = c.prayer ? normalizeLine(c.prayer) : null;
          const showIntention = c.intentionPublic === true;
          const showPrayer = c.prayerPublic === true && !!prayer;
          const sigiloNote =
            "Intenção e oração em sigilo — unidas em oração com a comunidade.";

          return (
            <li
              key={c.id}
              className={cn(
                "candle-velario-slot flex min-h-0 min-w-0",
                !uniformMural && "[content-visibility:auto]",
                (tightText || uniformMural) && "h-full min-h-0",
                embedded && !tightText && !uniformMural && "mx-auto w-full max-w-[19rem] sm:max-w-none",
              )}
            >
              <div
                className={cn(
                  "candle-velario-slot__frame flex h-full min-h-0 w-full flex-col",
                  onPhoto || uniformMural ? "overflow-visible" : "overflow-hidden",
                  onPhoto && "candle-velario-slot__frame--home",
                  darkCard && "candle-velario-slot__frame--dark",
                  muralDark && "candle-velario-slot__frame--banner",
                  uniformMural && "candle-velario-slot__frame--mural",
                  !onPhoto && !darkCard && "rounded-2xl border border-parish-200 bg-white shadow-md",
                )}
              >
                <div
                  className={cn(
                    "candle-velario-slot__well relative flex shrink-0 items-end justify-center",
                    onPhoto || uniformMural ? "overflow-visible pt-2" : "overflow-hidden",
                  )}
                  style={{ height: wellHeight, minHeight: wellHeight }}
                >
                  <CandleVisual
                    size={candleSize}
                    mural={uniformMural}
                    delaySec={i * 0.13}
                    litAt={burn?.litAt ?? c.litAt}
                    expiresAt={burn?.expiresAt ?? c.expiresAt}
                    durationHours={durationHours}
                    priority={i < 4}
                  />
                </div>

                <div
                  className={cn(
                    "flex flex-col overflow-hidden text-center",
                    uniformMural
                      ? "h-[8.75rem] shrink-0 border-t border-amber-900/30 bg-black/25 px-3 pb-3 pt-3 text-amber-50"
                      : cn(
                          "min-h-0 flex-1",
                          tightText ? "min-h-[6.25rem] px-2.5 pb-2.5 pt-2.5" : "border-t border-parish-100 px-3 pb-4 pt-3",
                          onPhoto && "border-t border-white/10 text-amber-50",
                          darkCard && !onPhoto && "border-t border-amber-900/30 bg-black/25 text-amber-50",
                          !nightText && "text-parish-900",
                        ),
                  )}
                >
                  <p
                    className={cn(
                      textBlock,
                      "shrink-0 font-semibold",
                      uniformMural
                        ? "line-clamp-1 text-sm leading-snug"
                        : tightText
                          ? "line-clamp-1 text-sm leading-snug"
                          : roomyText
                            ? "line-clamp-2 text-base"
                            : "line-clamp-2 text-sm",
                      nightText && "text-amber-50",
                    )}
                    title={name}
                  >
                    {name}
                  </p>

                  <div
                    className={cn(
                      "min-h-0 flex-1 overflow-hidden",
                      uniformMural ? "mt-1.5 space-y-1" : tightText ? "mt-1 space-y-0.5" : "mt-2 space-y-1.5",
                    )}
                  >
                    {showIntention ? (
                      <p
                        className={cn(
                          textBlock,
                          "font-medium leading-snug",
                          uniformMural
                            ? "line-clamp-1 text-xs"
                            : tightText
                              ? "line-clamp-1 text-xs"
                              : roomyText
                                ? "line-clamp-2 text-sm"
                                : "line-clamp-2 text-sm",
                          nightText ? "text-amber-100/85" : "text-parish-800",
                        )}
                        title={intention}
                      >
                        {intention}
                      </p>
                    ) : null}
                    {showPrayer ? (
                      <p
                        className={cn(
                          textBlock,
                          "italic leading-snug",
                          uniformMural
                            ? "line-clamp-2 text-xs"
                            : tightText
                              ? "line-clamp-2 text-[11px] leading-snug"
                              : roomyText
                                ? "line-clamp-5 text-sm leading-relaxed"
                                : "line-clamp-5 text-xs leading-relaxed",
                          nightText ? "text-white/65" : "text-parish-600",
                        )}
                        title={prayer ?? undefined}
                      >
                        “{prayer}”
                      </p>
                    ) : null}
                    {!showIntention && !showPrayer ? (
                      <p
                        className={cn(
                          textBlock,
                          "leading-snug",
                          uniformMural
                            ? "line-clamp-2 text-xs"
                            : tightText
                              ? "line-clamp-2 text-xs leading-snug"
                              : roomyText
                                ? "line-clamp-4 text-sm"
                                : "line-clamp-4 text-sm",
                          nightText ? "text-amber-100/55" : "text-parish-600",
                        )}
                      >
                        {uniformMural || tightText
                          ? "Intenção e oração em sigilo — unidas em oração."
                          : sigiloNote}
                      </p>
                    ) : !showPrayer && prayer ? (
                      <p
                        className={cn(
                          textBlock,
                          uniformMural || tightText ? "line-clamp-1 text-[11px]" : "line-clamp-2 text-sm",
                          nightText ? "text-white/45" : "text-parish-500",
                        )}
                      >
                        Oração em sigilo.
                      </p>
                    ) : null}
                  </div>

                  {timeLeft ? (
                    <p
                      className={cn(
                        "shrink-0 font-medium uppercase tracking-wide",
                        uniformMural
                          ? "pt-2 text-[11px] leading-snug sm:text-xs"
                          : tightText
                            ? "pt-1.5 text-[11px] leading-snug sm:text-xs"
                            : roomyText
                              ? "pt-3 text-sm"
                              : "pt-3 text-xs",
                        nightText ? "text-gold-400/90" : "text-amber-700/80",
                      )}
                    >
                      {timeLeft}
                    </p>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {showViewAllHref ? (
        <div className={cn("relative z-[1] text-center", dense ? "mt-3" : "mt-8")}>
          <Link
            href={showViewAllHref}
            className="text-sm font-semibold text-gold-400 hover:text-gold-300"
          >
            Ver todas as velas acesas →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
