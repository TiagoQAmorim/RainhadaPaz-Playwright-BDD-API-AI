import Image from "next/image";
import Link from "next/link";
import { ParishLogo } from "@/components/ParishLogo";
import { RaffleCartelaIllustration } from "@/components/RaffleCartelaIllustration";
import { ticketPriceLabel } from "@/lib/raffle-rules";

export type FeaturedRaffleHero = {
  slug: string;
  title: string;
  prizeTitle: string;
  ticketPriceCents: number;
  coverImageUrl?: string | null;
};

type Props = {
  /** Frase curta (ex.: “Unidos pela fé…”) — texto menor abaixo do título. */
  tagline?: string;
  /** Complemento do texto menor do banner. */
  intro?: string;
  diocese: string;
  heroImage: string;
  parishName: string;
  logoUrl?: string | null;
  featuredRaffle?: FeaturedRaffleHero | null;
};

export function HeroHome({
  tagline,
  intro,
  diocese,
  heroImage,
  parishName,
  logoUrl,
  featuredRaffle,
}: Props) {
  const bannerText = [tagline?.trim(), intro?.trim()].filter(Boolean).join(" ");
  return (
    <section className="relative min-h-[320px] overflow-hidden sm:min-h-[360px] md:min-h-[400px] lg:min-h-[420px]">
      <Image
        src={heroImage}
        alt=""
        fill
        priority
        className="object-cover object-center scale-105"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-parish-600/92 via-parish-500/75 to-parish-400/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-parish-600/70 via-transparent to-parish-500/20" />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:py-10">
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
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold leading-[1.1] text-white md:text-4xl lg:text-5xl">
            {parishName}
          </h1>
          {bannerText ? (
            <p className="mt-3 max-w-xl text-base leading-relaxed text-white/90 md:text-lg">
              {bannerText}
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap justify-center gap-3 md:mt-6 lg:justify-start">
            <Link
              href="/horarios"
              className="inline-flex items-center rounded-full bg-gold-500 px-6 py-3 text-sm font-bold text-parish-950 shadow-lg shadow-gold-500/30 transition hover:bg-gold-400"
            >
              Horários de missa
            </Link>
            <Link
              href="/velas"
              className="inline-flex items-center rounded-full border-2 border-white/35 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              Acender vela virtual
            </Link>
          </div>
        </div>

        {featuredRaffle ? (
          <Link
            href={`/rifas/${featuredRaffle.slug}`}
            className="group relative w-full shrink-0 overflow-hidden rounded-2xl border border-gold-400/50 bg-parish-600/75 p-5 shadow-2xl backdrop-blur-md transition hover:border-gold-400/80 hover:bg-parish-600/90 lg:max-w-md"
          >
            {featuredRaffle.coverImageUrl ? (
              <div className="absolute inset-0 -z-10 opacity-30">
                <Image
                  src={featuredRaffle.coverImageUrl}
                  alt=""
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="400px"
                />
              </div>
            ) : null}
            <div className="flex gap-4">
              <RaffleCartelaIllustration
                size={112}
                priority
                className="transition duration-300 group-hover:scale-[1.03]"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-400">
                  Rifa em destaque
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold text-white md:text-2xl">
                  {featuredRaffle.title}
                </h2>
                <p className="mt-2 text-sm text-white/85">
                  Prêmio: <strong className="text-gold-200">{featuredRaffle.prizeTitle}</strong>
                </p>
                <p className="mt-1 text-sm text-white/75">
                  Cotas a partir de {ticketPriceLabel(featuredRaffle.ticketPriceCents)}
                </p>
              </div>
            </div>
            <span className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-gold-500 py-3 text-sm font-bold text-parish-950 transition group-hover:bg-gold-400">
              Participar da rifa
            </span>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
