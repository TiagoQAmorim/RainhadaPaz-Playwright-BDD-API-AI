"use client";

import Image from "next/image";
import Link from "next/link";
import { CarouselNavButtons } from "@/components/CarouselNavButtons";
import { RaffleCartelaIllustration } from "@/components/RaffleCartelaIllustration";
import { useRotatingCarousel } from "@/components/useRotatingCarousel";
import type { HomeCarouselSlide } from "@/lib/home-carousel";
import {
  HOME_SPOTLIGHT_CARD_CLASS,
  HOME_SPOTLIGHT_MEDIA_BOX_CLASS,
} from "@/lib/home-spotlight-layout";
import { ticketPriceLabel } from "@/lib/raffle-rules";

const ROTATE_MS = 7000;

type Props = {
  slides: HomeCarouselSlide[];
};

export function HomeSpotlightCarousel({ slides }: Props) {
  const count = slides.length;
  const { index, select, next, prev, canNavigate } = useRotatingCarousel(count, ROTATE_MS);

  if (count === 0) return null;

  return (
    <div className="relative w-full shrink-0 lg:max-w-md">
      <div className="group relative grid w-full">
        {slides.map((slide, i) => (
          <div
            key={
              slide.type === "raffle"
                ? `rifa-${slide.slug}`
                : slide.type === "news"
                  ? `news-${slide.slug}`
                  : `aviso-${slide.id}`
            }
            className={`col-start-1 row-start-1 transition-opacity duration-700 ease-in-out ${
              i === index ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"
            }`}
            aria-hidden={i !== index}
          >
            {slide.type === "raffle" ? (
              <RaffleSlide slide={slide} priority={i === 0} />
            ) : slide.type === "notice" ? (
              <NoticeSlide slide={slide} priority={i === 0} />
            ) : (
              <NewsSlide slide={slide} priority={i === 0} />
            )}
          </div>
        ))}
        {canNavigate ? (
          <CarouselNavButtons
            onPrev={prev}
            onNext={next}
            prevLabel="Destaque anterior"
            nextLabel="Próximo destaque"
            variant="light"
          />
        ) : null}
      </div>
      {canNavigate ? (
        <div
          className="absolute -bottom-6 left-0 right-0 flex justify-center gap-2"
          role="tablist"
          aria-label="Destaques"
        >
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Destaque ${i + 1}`}
              onClick={() => select(i)}
              className={`h-2 w-2 rounded-full transition ${
                i === index ? "bg-gold-400" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function RaffleSlide({
  slide,
  priority,
}: {
  slide: Extract<HomeCarouselSlide, { type: "raffle" }>;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/rifas/${slide.slug}`}
      className={`${HOME_SPOTLIGHT_CARD_CLASS} border border-gold-400/50 bg-parish-600/75 hover:border-gold-400/80 hover:bg-parish-600/90`}
    >
      {slide.coverImageUrl ? (
        <div className="absolute inset-0 -z-10 opacity-30">
          <Image
            src={slide.coverImageUrl}
            alt=""
            fill
            priority={priority}
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="400px"
          />
        </div>
      ) : null}
      <div className="flex flex-1 gap-4">
        <RaffleCartelaIllustration
          size={112}
          priority={priority}
          className="shrink-0 transition duration-300 group-hover:scale-[1.03]"
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-400">Rifa em destaque</p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold text-white md:text-2xl">
            {slide.title}
          </h2>
          <p className="mt-2 line-clamp-2 text-sm text-white/85">
            Prêmio: <strong className="text-gold-200">{slide.prizeTitle}</strong>
          </p>
          <p className="mt-1 text-sm text-white/75">
            Cotas a partir de {ticketPriceLabel(slide.ticketPriceCents)}
          </p>
        </div>
      </div>
      <span className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-gold-500 py-3 text-sm font-bold text-parish-950 transition group-hover:bg-gold-400">
        Participar da rifa
      </span>
    </Link>
  );
}

function NoticeSlide({
  slide,
  priority,
}: {
  slide: Extract<HomeCarouselSlide, { type: "notice" }>;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/avisos/${slide.id}`}
      className={`${HOME_SPOTLIGHT_CARD_CLASS} border border-white/25 bg-parish-600/75 hover:border-white/40 hover:bg-parish-600/90`}
    >
      {slide.coverImage ? (
        <div className="absolute inset-0 -z-10 opacity-35">
          <Image
            src={slide.coverImage}
            alt=""
            fill
            priority={priority}
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="400px"
          />
        </div>
      ) : null}
      <div className="flex flex-1 gap-4">
        {slide.coverImage ? (
          <div className={HOME_SPOTLIGHT_MEDIA_BOX_CLASS}>
            <Image
              src={slide.coverImage}
              alt=""
              width={120}
              height={120}
              priority={priority}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              sizes="120px"
            />
          </div>
        ) : (
          <div
            className={`${HOME_SPOTLIGHT_MEDIA_BOX_CLASS} flex items-center justify-center text-[10px] font-bold uppercase tracking-wider text-gold-200`}
          >
            Aviso
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-300">Aviso em destaque</p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold text-white md:text-2xl">
            {slide.title}
          </h2>
          {slide.excerpt ? (
            <p className="mt-2 line-clamp-3 flex-1 text-sm text-white/85">{slide.excerpt}</p>
          ) : null}
        </div>
      </div>
      <span className="mt-4 inline-flex w-full items-center justify-center rounded-full border-2 border-white/35 bg-white/10 py-3 text-sm font-bold text-white transition group-hover:bg-white/20">
        Ler aviso
      </span>
    </Link>
  );
}

function NewsSlide({
  slide,
  priority,
}: {
  slide: Extract<HomeCarouselSlide, { type: "news" }>;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/noticias/${slide.slug}`}
      className={`${HOME_SPOTLIGHT_CARD_CLASS} border border-white/25 bg-parish-600/75 hover:border-white/40 hover:bg-parish-600/90`}
    >
      {slide.coverImage ? (
        <div className="absolute inset-0 -z-10 opacity-35">
          <Image
            src={slide.coverImage}
            alt=""
            fill
            priority={priority}
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="400px"
          />
        </div>
      ) : null}
      <div className="flex flex-1 gap-4">
        {slide.coverImage ? (
          <div className={HOME_SPOTLIGHT_MEDIA_BOX_CLASS}>
            <Image
              src={slide.coverImage}
              alt=""
              width={120}
              height={120}
              priority={priority}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              sizes="120px"
            />
          </div>
        ) : (
          <div
            className={`${HOME_SPOTLIGHT_MEDIA_BOX_CLASS} flex items-center justify-center text-[10px] font-bold uppercase tracking-wider text-gold-200`}
          >
            Notícia
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-300">Notícia em destaque</p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold text-white md:text-2xl">
            {slide.title}
          </h2>
          <p className="mt-2 line-clamp-3 flex-1 text-sm text-white/85">{slide.excerpt}</p>
        </div>
      </div>
      <span className="mt-4 inline-flex w-full items-center justify-center rounded-full border-2 border-white/35 bg-white/10 py-3 text-sm font-bold text-white transition group-hover:bg-white/20">
        Ler notícia
      </span>
    </Link>
  );
}