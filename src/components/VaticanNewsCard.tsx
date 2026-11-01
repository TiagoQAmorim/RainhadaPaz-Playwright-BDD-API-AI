import Image from "next/image";
import { cn } from "@/lib/cn";
import { WP_IMAGES } from "@/lib/wordpress-assets";
import { parseVaticanPublishedAt, type VaticanNewsItem } from "@/lib/vatican-news";

type Props = {
  item: VaticanNewsItem;
  variant?: "default" | "compact";
};

export function VaticanNewsCard({ item, variant = "default" }: Props) {
  const publishedAt = parseVaticanPublishedAt(item.publishedAt);
  const img = item.imageUrl ?? WP_IMAGES.heroChurch;
  const compact = variant === "compact";

  return (
    <article
      className={cn(
        "group flex h-full overflow-hidden bg-white ring-1 ring-parish-100 transition hover:ring-parish-200",
        compact
          ? "flex-row gap-0 rounded-lg shadow-sm hover:shadow-md"
          : "flex-col rounded-2xl shadow-md hover:shadow-xl",
      )}
    >
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "relative shrink-0 overflow-hidden bg-parish-100",
          compact ? "aspect-square w-20 sm:w-24" : "block aspect-[16/10] w-full",
        )}
      >
        <Image
          src={img}
          alt=""
          fill
          className={cn(
            "object-cover",
            compact ? "transition group-hover:opacity-90" : "transition duration-500 group-hover:scale-105",
          )}
          sizes={compact ? "96px" : "(max-width:768px) 100vw, 400px"}
        />
        {!compact ? (
          <span className="absolute left-3 top-3 rounded-full bg-parish-600/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
            Vatican News
          </span>
        ) : null}
      </a>
      <div className={cn("flex min-w-0 flex-1 flex-col", compact ? "justify-center py-2 pr-3 pl-2.5" : "p-5")}>
        <time
          dateTime={publishedAt.toISOString()}
          className={cn(
            "text-parish-500",
            compact
              ? "text-[10px] font-medium uppercase tracking-wide"
              : "text-xs font-medium uppercase tracking-wide",
          )}
        >
          {publishedAt.toLocaleDateString("pt-BR", compact ? { day: "2-digit", month: "short" } : { dateStyle: "long" })}
        </time>
        <a href={item.link} target="_blank" rel="noopener noreferrer" className="min-w-0">
          <h3
            className={cn(
              "text-parish-900 group-hover:text-parish-600",
              compact
                ? "mt-0.5 text-sm font-semibold leading-snug line-clamp-2"
                : "mt-2 font-[family-name:var(--font-display)] text-xl font-semibold",
            )}
          >
            {item.title}
          </h3>
        </a>
        {!compact && item.excerpt ? (
          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-parish-700/85">
            {item.excerpt}
          </p>
        ) : null}
        {!compact ? (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 text-sm font-bold text-gold-600 hover:text-gold-500"
          >
            Ler no Vatican News →
          </a>
        ) : null}
      </div>
    </article>
  );
}
