"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const ROTATE_MS = 7000;

type Props = {
  images: string[];
};

export function HeroHomeBannerRotator({ images }: Props) {
  const count = images.length;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (count <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [count]);

  if (count === 1) {
    return (
      <Image
        src={images[0]!}
        alt=""
        fill
        priority
        className="object-cover object-center max-sm:scale-100 sm:scale-105"
        sizes="100vw"
      />
    );
  }

  return (
  <>
      {images.map((src, i) => (
        <div
          key={`${src}-${i}`}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={i !== index}
        >
          <Image
            src={src}
            alt=""
            fill
            priority={i === 0}
            className="object-cover object-center max-sm:scale-100 sm:scale-105"
            sizes="100vw"
          />
        </div>
      ))}
      <div
        className="pointer-events-none absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-2 sm:bottom-4"
        role="tablist"
        aria-label="Banners da home"
      >
        {images.map((_, i) => (
          <span
            key={i}
            role="tab"
            aria-selected={i === index}
            className={`h-2 w-2 rounded-full shadow-sm transition ${
              i === index ? "bg-gold-400" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </>
  );
}