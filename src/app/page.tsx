import Image from "next/image";
import Link from "next/link";
import { CandleWall } from "@/components/CandleWall";
import { NoticePreviewCard } from "@/components/NoticePreviewCard";
import { HeroHome } from "@/components/HeroHome";
import { PageContainer } from "@/components/PageContainer";
import { PostCard } from "@/components/PostCard";
import { QuickLinksGrid } from "@/components/QuickLinksGrid";
import { SectionHeading } from "@/components/SectionHeading";
import { VerseStrip } from "@/components/VerseStrip";
import { listActiveCandles } from "@/lib/candles";
import { getFeaturedHomeRaffle } from "@/lib/raffles";
import { getPublishedNotices } from "@/lib/notices";
import { prisma } from "@/lib/prisma";
import { VaticanNewsCard } from "@/components/VaticanNewsCard";
import { PhotoHeroBanner } from "@/components/PhotoHeroBanner";
import { CANDLES_BANNER_PATH } from "@/lib/parish-brand";
import { getCandleDurationHours, getSiteSettings } from "@/lib/settings";
import { listVaticanNews, VATICAN_NEWS_HOME_URL } from "@/lib/vatican-news";
import { TercoOnlineSlots } from "@/components/TercoOnlineSlots";
import { getTercoOnlineSlots, summarizeTercoSchedules } from "@/lib/terco-online";
import { WP_IMAGES } from "@/lib/wordpress-assets";

export default async function HomePage() {
  const [settings, tercoSlots, candles, posts, notices, featuredRaffle, candleHours, vaticanNews] =
    await Promise.all([
    getSiteSettings(),
    getTercoOnlineSlots(),
    listActiveCandles(5),
    prisma.post.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
    getPublishedNotices(3),
    getFeaturedHomeRaffle(),
    getCandleDurationHours(),
    listVaticanNews(2),
  ]);

  const heroImage = settings.heroImageUrl ?? WP_IMAGES.heroChurchWide;
  const matriz = settings.matrizImageUrl ?? WP_IMAGES.matriz;
  const capela = settings.capelaImageUrl ?? WP_IMAGES.capela;

  return (
    <>
      <HeroHome
        tagline={settings.heroTitle}
        intro={settings.heroSubtitle}
        diocese={settings.diocese}
        heroImage={heroImage}
        parishName={settings.parishName}
        logoUrl={settings.logoUrl}
        featuredRaffle={
          featuredRaffle
            ? {
                slug: featuredRaffle.slug,
                title: featuredRaffle.title,
                prizeTitle: featuredRaffle.prizeTitle,
                ticketPriceCents: featuredRaffle.ticketPriceCents,
                coverImageUrl: featuredRaffle.coverImageUrl,
              }
            : null
        }
      />
      <QuickLinksGrid className="-mt-6 md:-mt-8" />
      <VerseStrip />

      <PageContainer wide className="py-16 md:py-20">
        <SectionHeading
          eyebrow="Nossa comunidade"
          title="Duas casas, uma só família de fé"
          description="Matriz na Vila Sofia e Capela do Colégio Santa Maria — celebrações, formação e pastoral."
        />
        <div className="grid gap-6 md:grid-cols-2">
          <article className="group relative overflow-hidden rounded-3xl shadow-xl ring-1 ring-black/5">
            <div className="relative aspect-[4/3]">
              <Image
                src={matriz}
                alt="Matriz paroquial"
                fill
                className="object-cover transition duration-700 group-hover:scale-105"
                sizes="50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-parish-600/90 via-parish-500/30 to-transparent" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
                Matriz Paroquial
              </h3>
              <p className="mt-1 text-sm text-white/85">R. Sócrates, 813 — Vila Sofia</p>
              <Link href="/horarios" className="mt-3 inline-block text-sm font-bold text-gold-300">
                Ver horários →
              </Link>
            </div>
          </article>
          <article className="group relative overflow-hidden rounded-3xl shadow-xl ring-1 ring-black/5">
            <div className="relative aspect-[4/3]">
              <Image
                src={capela}
                alt="Capela Santa Maria"
                fill
                className="object-cover transition duration-700 group-hover:scale-105"
                sizes="50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-parish-600/90 via-parish-500/30 to-transparent" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
                Capela Santa Maria
              </h3>
              <p className="mt-1 text-sm text-white/85">Colégio Santa Maria</p>
              <Link href="/horarios" className="mt-3 inline-block text-sm font-bold text-gold-300">
                Ver horários →
              </Link>
            </div>
          </article>
        </div>
      </PageContainer>

      <PhotoHeroBanner
        imageSrc={CANDLES_BANNER_PATH}
        wide
        minHeightClass="min-h-0"
        contentClassName="py-6 md:py-8"
      >
        <SectionHeading
          inverse
          className="mb-3 max-w-xl [&_h2]:text-2xl [&_h2]:md:text-3xl [&_p]:mt-1 [&_p]:text-sm"
          eyebrow="Oração viva"
          title="Mural de velas virtuais"
          description="Intenções acesas pela comunidade."
        />
        <div className="overflow-visible rounded-2xl border border-white/15 bg-black/40 p-2 pt-3 backdrop-blur-sm md:p-3 md:pt-4">
          <CandleWall
            candles={candles}
            banner
            compact
            dense
            showViewAllHref="/velas#mural"
            durationHours={candleHours}
          />
        </div>
        <div className="mt-4 text-center">
          <Link
            href="/velas"
            className="inline-flex rounded-full bg-gold-500 px-6 py-2.5 text-sm font-bold text-parish-950 shadow-lg shadow-gold-500/20"
          >
            Acender minha vela
          </Link>
        </div>
      </PhotoHeroBanner>

      <PageContainer wide className="py-16 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow="Paróquia" title="Notícias e avisos" />
          <Link href="/noticias" className="text-sm font-bold text-parish-600 hover:text-gold-600">
            Ver todas as notícias →
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
        {notices.length > 0 ? (
          <div className="mt-12 rounded-2xl border border-parish-200 bg-parish-50/80 p-6 md:p-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-parish-900">Avisos recentes</h3>
              <Link href="/avisos" className="text-sm font-bold text-parish-600 hover:text-gold-600">
                Todos os avisos →
              </Link>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {notices.map((n) => (
                <li key={n.id}>
                  <NoticePreviewCard notice={n} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {vaticanNews.length > 0 ? (
          <div className="mt-10 border-t border-parish-200/70 pt-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-parish-500">
                Do Vaticano
              </p>
              <Link
                href="/noticias"
                className="text-xs text-parish-500 hover:text-parish-700"
              >
                Ver mais em Notícias →
              </Link>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {vaticanNews.map((item) => (
                <li key={item.link}>
                  <VaticanNewsCard item={item} variant="compact" />
                </li>
              ))}
            </ul>
            <p className="mt-2 text-right text-[11px] text-parish-400">
              <a
                href={VATICAN_NEWS_HOME_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-parish-600"
              >
                Fonte: Vatican News ↗
              </a>
            </p>
          </div>
        ) : null}
      </PageContainer>

      <PageContainer wide className="pb-20">
        <div className="glass-card grid gap-8 p-8 md:grid-cols-2 md:p-10">
          <div className="relative min-h-[280px] overflow-hidden rounded-2xl md:min-h-[320px]">
            <Image src={WP_IMAGES.tercoOnline} alt="Terço online" fill className="object-cover" sizes="50vw" />
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-parish-600/90 p-6 text-white">
              <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold">Terço online</h3>
              <p className="mt-1 text-sm text-white/85">
                {summarizeTercoSchedules(tercoSlots)} — reze conosco.
              </p>
              <Link href="/terco-online" className="mt-3 text-sm font-bold text-gold-300">
                Horários e links →
              </Link>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <SectionHeading
              eyebrow="Oração"
              title="Terço online"
              description={`${summarizeTercoSchedules(tercoSlots)} — escolha o link do seu dia.`}
            />
            <TercoOnlineSlots slots={tercoSlots} variant="home" />
            <Link
              href="/terco-online"
              className="mt-4 inline-flex w-fit text-sm font-bold text-parish-600 hover:text-gold-600"
            >
              Página completa do terço →
            </Link>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
