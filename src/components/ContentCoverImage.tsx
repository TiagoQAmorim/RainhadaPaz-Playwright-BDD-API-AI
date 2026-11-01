import Image from "next/image";
import { cn } from "@/lib/cn";

type Props = {
  src: string;
  alt?: string;
  className?: string;
  priority?: boolean;
};

/** Ilustração opcional de aviso, notícia ou página institucional. */
export function ContentCoverImage({ src, alt = "", className, priority }: Props) {
  return (
    <figure
      className={cn(
        "relative mb-6 aspect-[16/10] w-full overflow-hidden rounded-2xl bg-parish-100",
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 720px"
        unoptimized={src.startsWith("/uploads/")}
      />
    </figure>
  );
}
