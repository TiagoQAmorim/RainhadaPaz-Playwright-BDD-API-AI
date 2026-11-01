import Image from "next/image";
import { RAFFLE_CARTELA_ICON_PATH } from "@/lib/parish-brand";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  /** Largura em px (altura proporcional ~1:1). */
  size?: number;
  priority?: boolean;
};

export function RaffleCartelaIllustration({ className, size = 160, priority }: Props) {
  return (
    <div
      className={cn("relative shrink-0 drop-shadow-lg", className)}
      style={{ width: size, height: size }}
    >
      <Image
        src={RAFFLE_CARTELA_ICON_PATH}
        alt="Ilustração de cartela de rifa paroquial"
        width={size}
        height={size}
        priority={priority}
        className="h-full w-full object-contain object-center"
        sizes={`${size}px`}
      />
    </div>
  );
}
