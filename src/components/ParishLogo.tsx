import Image from "next/image";
import { cn } from "@/lib/cn";

type Props = {
  src: string;
  alt: string;
  variant?: "header" | "hero" | "footer";
  className?: string;
  priority?: boolean;
};

const variantClass: Record<NonNullable<Props["variant"]>, string> = {
  header:
    "max-h-11 max-w-[min(100%,220px)] sm:max-h-12 sm:max-w-[260px] md:max-h-14 md:max-w-[300px]",
  hero: "max-h-40 max-w-[min(100%,340px)] sm:max-h-48 sm:max-w-[400px] md:max-h-56 md:max-w-[480px] lg:max-h-[15rem] lg:max-w-[520px] drop-shadow-[0_8px_32px_rgba(0,0,0,0.45)]",
  footer:
    "max-h-[4.5rem] max-w-[280px] sm:max-h-[5.25rem] sm:max-w-[320px] md:max-h-[6rem] md:max-w-[360px]",
};

/** Logo paroquial inteiro (sem recorte circular). */
export function ParishLogo({
  src,
  alt,
  variant = "header",
  className,
  priority,
}: Props) {
  return (
    <Image
      src={src}
      alt={alt}
      width={512}
      height={512}
      priority={priority}
      className={cn("h-auto w-auto object-contain object-left", variantClass[variant], className)}
      sizes={
        variant === "hero"
          ? "(max-width:640px) 340px, (max-width:1024px) 480px, 520px"
          : variant === "header"
            ? "(max-width:768px) 260px, 300px"
            : "360px"
      }
    />
  );
}
