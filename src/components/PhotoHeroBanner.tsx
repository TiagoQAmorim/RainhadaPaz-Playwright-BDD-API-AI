import Image from "next/image";
import { cn } from "@/lib/cn";

type Props = {
  imageSrc: string;
  imageAlt?: string;
  priority?: boolean;
  className?: string;
  contentClassName?: string;
  minHeightClass?: string;
  wide?: boolean;
  /** Overlay azul mais fechado (ex.: mural de velas). */
  deepOverlay?: boolean;
  children: React.ReactNode;
};

/** Foto de fundo com overlays azul manto (mesmo efeito do banner principal). */
export function PhotoHeroBanner({
  imageSrc,
  imageAlt = "",
  priority,
  className,
  contentClassName,
  minHeightClass = "min-h-[240px] sm:min-h-[280px] md:min-h-[320px]",
  wide,
  deepOverlay,
  children,
}: Props) {
  return (
    <section className={cn("relative overflow-hidden", minHeightClass, className)}>
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        priority={priority}
        className={cn("object-cover object-center", deepOverlay ? "scale-110 brightness-[0.55]" : "scale-105")}
        sizes="100vw"
      />
      {deepOverlay ? (
        <>
          <div className="absolute inset-0 bg-parish-900/55" />
          <div className="absolute inset-0 bg-gradient-to-r from-parish-800/95 via-parish-700/88 to-parish-600/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-parish-900/80 via-parish-800/25 to-parish-700/35" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-parish-600/92 via-parish-500/75 to-parish-400/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-parish-600/70 via-transparent to-parish-500/20" />
        </>
      )}
      <div
        className={cn(
          "relative mx-auto px-4 py-10 md:py-12",
          wide ? "max-w-7xl" : "max-w-6xl",
          contentClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}
