import Image from "next/image";
import Link from "next/link";
import { HomeSpotlightCarousel } from "@/components/HomeSpotlightCarousel";
import { ParishLogo } from "@/components/ParishLogo";
import type { HomeCarouselSlide } from "@/lib/home-carousel";
import type { HeroCtaItem } from "@/lib/home-hero-ctas";

type Props = {
  /** Frase curta (ex.: “Unidos pela fé…”) — texto menor abaixo do título. */
  tagline?: string;
  /** Complemento do texto menor do banner. */
  intro?: string;
  diocese: string;
  heroImage: string;
  parishName: string;
  logoUrl?: string | null;
  carouselSlides: HomeCarouselSlide[];
  heroCtas: HeroCtaItem[];
};

export function HeroHome({
  tagline,
  intro,
  diocese,
  heroImage,
  parishName,
  logoUrl,
  carouselSlides,
  heroCtas,
}: Props) {
  const bannerText = [tagline?.trim(), intro?.trim()].filter(Boolean).join(" ");
  return (
    <section className="relative min-h-[248px] overflow-hidden sm:min-h-[360px] md:min-h-[400px] lg:min-h-[420px]">
      <div className="absolute inset-0">
        <Image
          src={heroImage}
          alt=""
          fill
          priority
          className="object-cover object-center max-sm:scale-100 sm:scale-105"
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-parish-600/92 via-parish-500/75 to-parish-400/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-parish-600/70 via-transparent to-parish-500/20" />

      <div className="relative mx-auto flex min-w-0 max-w-7xl flex-col gap-5 px-4 py-5 max-sm:gap-4 max-sm:py-4 sm:gap-8 sm:py-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:py-10">
        {logoUrl ? (
          <Link
            href="/"
            className="mx-auto shrink-0 lg:mx-0 lg:self-center"
            aria-label={`Página inicial — ${parishName}`}
          >
            <ParishLogo src={logoUrl} alt={parishName} variant="hero" priority />
          </Link>
        ) : null}

        <div className="min-w-0 max-w-2xl flex-1 text-center lg:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-300">
            {diocese}
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold leading-[1.1] text-white max-sm:mt-1 sm:text-3xl md:text-4xl lg:text-5xl">
            {parishName}
          </h1>
          {bannerText ? (
            <p className="mt-3 max-w-xl text-base leading-relaxed text-white/90 md:text-lg">
              {bannerText}
            </p>
          ) : null}
          {heroCtas.length > 0 ? (
            <div className="mt-5 flex flex-wrap justify-center gap-3 md:mt-6 lg:justify-start">
              {heroCtas.map((cta) => (
                <Link
                  key={cta.id}
                  href={cta.href}
                  className={
                    cta.variant === "secondary"
                      ? "inline-flex items-center rounded-full border-2 border-white/35 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
                      : "inline-flex items-center rounded-full bg-gold-500 px-6 py-3 text-sm font-bold text-parish-950 shadow-lg shadow-gold-500/30 transition hover:bg-gold-400"
                  }
                >
                  {cta.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        {carouselSlides.length > 0 ? (
          <div className="mx-auto w-full min-w-0 max-w-full lg:mx-0 lg:w-auto">
            <HomeSpotlightCarousel slides={carouselSlides} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
