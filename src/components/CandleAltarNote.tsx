import { cn } from "@/lib/cn";

/** Aviso de que as velas e orações seguem ao padre e ao altar. */
export function CandleAltarNote({ className }: { className?: string }) {
  return (
    <p className={cn("text-sm font-medium leading-snug md:text-base", className)}>
      Todas as orações e velas acesas são enviadas <strong>ao padre</strong> e <strong>ao altar</strong> da
      Rainha da Paz para unirmos forças em oração.
    </p>
  );
}
