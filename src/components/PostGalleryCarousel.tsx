"use client";

import Image from "next/image";
import { CarouselNavButtons } from "@/components/CarouselNavButtons";
import { useRotatingCarousel } from "@/components/useRotatingCarousel";
import { POST_CAROUSEL_ASPECT_CLASS } from "@/lib/post-carousel-layout";

export type PostGalleryItem = {
  imageUrl: string;
  caption: string | null;
};

type Props = {
  items: PostGalleryItem[];
  title: string;
};

const ROTATE_MS = 6000;

export function PostGalleryCarousel({ items, title }: Props) {
  const count = items.length;
  const { index, select, next, prev, canNavigate } = useRotatingCarousel(count, ROTATE_MS);

  if (count === 0) return null;

  const current = items[index]!;

  return (
    <figure className="my-8 overflow-hidden rounded-2xl border border-parish-200 bg-parish-50 shadow-sm">
      <div className={`group relative w-full bg-parish-100 ${POST_CAROUSEL_ASPECT_CLASS}`}>
        <div className="absolute inset-0 grid">
          {items.map((item, i) => (
            <div
              key={`${item.imageUrl}-${i}`}
              className={`relative col-start-1 row-start-1 h-full w-full transition-opacity duration-500 ${
                i === index ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"
              }`}
            >
              <Image
                src={item.imageUrl}
                alt={item.caption?.trim() || title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 720px"
                priority={i === 0}
                unoptimized={
                  item.imageUrl.startsWith("/uploads/") || item.imageUrl.startsWith("/images/")
                }
              />
            </div>
          ))}
        </div>
        {canNavigate ? (
          <CarouselNavButtons
            onPrev={prev}
            onNext={next}
            prevLabel="Imagem anterior"
            nextLabel="Próxima imagem"
            variant="dark"
          />
        ) : null}
      </div>
      {current.caption?.trim() ? (
        <figcaption className="border-t border-parish-100 px-4 py-3 text-center text-sm text-parish-700">
          {current.caption}
        </figcaption>
      ) : null}
      {canNavigate ? (
        <div className="flex justify-center gap-1.5 pb-3" role="tablist" aria-label="Imagens da notícia">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              onClick={() => select(i)}
              className={`h-2 w-2 rounded-full ${i === index ? "bg-parish-600" : "bg-parish-300"}`}
            />
          ))}
        </div>
      ) : null}
    </figure>
  );
}