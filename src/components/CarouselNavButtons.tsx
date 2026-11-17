"use client";

type Variant = "light" | "dark";

type Props = {
  onPrev: () => void;
  onNext: () => void;
  prevLabel: string;
  nextLabel: string;
  variant?: Variant;
  /** No toque não existe hover: as setas ficam visíveis em telas estreitas. */
  mobileVisible?: boolean;
};

const variantClass: Record<Variant, string> = {
  light:
    "text-white/90 hover:bg-white/15 focus-visible:bg-white/15",
  dark: "text-parish-800 hover:bg-white/90 focus-visible:bg-white/90",
};

const sharedClass =
  "absolute top-1/2 z-20 -translate-y-1/2 rounded-full px-3 py-2 text-lg font-bold leading-none opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100";

/** O contêiner do carrossel precisa da classe `group`. */
export function CarouselNavButtons({
  onPrev,
  onNext,
  prevLabel,
  nextLabel,
  variant = "light",
  mobileVisible = false,
}: Props) {
  const c = `${sharedClass} ${variantClass[variant]}${
    mobileVisible ? " max-sm:bg-black/40 max-sm:opacity-100" : ""
  }`;
  return (
    <>
      <button type="button" aria-label={prevLabel} onClick={onPrev} className={`left-2 ${c}`}>
        ‹
      </button>
      <button type="button" aria-label={nextLabel} onClick={onNext} className={`right-2 ${c}`}>
        ›
      </button>
    </>
  );
}