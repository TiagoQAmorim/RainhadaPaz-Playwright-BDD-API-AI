import { cn } from "@/lib/cn";

export function SectionHeading({
  eyebrow,
  title,
  description,
  inverse,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  inverse?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("mb-8 max-w-2xl", className)}>
      {eyebrow ? (
        <p
          className={cn(
            "text-xs font-bold uppercase tracking-[0.2em]",
            inverse ? "text-gold-300" : "text-gold-600",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold md:text-4xl",
          inverse ? "text-white" : "text-parish-900",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-3 text-base leading-relaxed",
            inverse ? "text-white/85" : "text-parish-700/90",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
