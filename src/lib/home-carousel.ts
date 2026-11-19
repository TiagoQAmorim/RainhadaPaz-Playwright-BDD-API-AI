import { prisma } from "@/lib/prisma";
import { stripHtml } from "@/lib/strip-html";
import { getFeaturedHomeRaffle } from "@/lib/raffles";

export const HOME_CAROUSEL_MAX = 3;

export type HomeCarouselRaffleSlide = {
  type: "raffle";
  slug: string;
  title: string;
  prizeTitle: string;
  ticketPriceCents: number;
  coverImageUrl: string | null;
};

export type HomeCarouselNewsSlide = {
  type: "news";
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string | null;
};

export type HomeCarouselNoticeSlide = {
  type: "notice";
  id: string;
  title: string;
  excerpt: string;
  coverImage: string | null;
};

export type HomeCarouselSlide = HomeCarouselRaffleSlide | HomeCarouselNewsSlide | HomeCarouselNoticeSlide;

function visibleNoticeWhere(now: Date) {
  return {
    published: true,
    featuredOnHomeCarousel: true,
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };
}

export async function getHomeCarouselSlides(): Promise<HomeCarouselSlide[]> {
  const raffle = await getFeaturedHomeRaffle();
  const newsLimit = HOME_CAROUSEL_MAX - (raffle ? 1 : 0);
  const slides: HomeCarouselSlide[] = [];

  if (raffle) {
    slides.push({
      type: "raffle",
      slug: raffle.slug,
      title: raffle.title,
      prizeTitle: raffle.prizeTitle,
      ticketPriceCents: raffle.ticketPriceCents,
      coverImageUrl: raffle.prizeImageUrl || raffle.coverImageUrl,
    });
  }

  if (newsLimit > 0) {
    const now = new Date();
    const [posts, notices] = await Promise.all([
      prisma.post.findMany({
        where: { published: true, featuredOnHomeCarousel: true },
        orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
        select: {
          slug: true,
          title: true,
          excerpt: true,
          coverImage: true,
          publishedAt: true,
          updatedAt: true,
        },
      }),
      prisma.notice.findMany({
        where: visibleNoticeWhere(now),
        orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
        select: {
          id: true,
          title: true,
          body: true,
          coverImage: true,
          publishedAt: true,
          updatedAt: true,
        },
      }),
    ]);

    const ranked = [
      ...posts.map((p) => ({
        at: p.publishedAt ?? p.updatedAt,
        slide: {
          type: "news" as const,
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt,
          coverImage: p.coverImage,
        },
      })),
      ...notices.map((n) => ({
        at: n.publishedAt ?? n.updatedAt,
        slide: {
          type: "notice" as const,
          id: n.id,
          title: n.title,
          excerpt: stripHtml(n.body).slice(0, 180),
          coverImage: n.coverImage,
        },
      })),
    ]
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, newsLimit);

    for (const item of ranked) slides.push(item.slide);
  }

  return slides.slice(0, HOME_CAROUSEL_MAX);
}

/** Notícias e avisos dividem as vagas do carrossel (máx. 3 com a rifa em destaque). */
export async function assertHomeCarouselContentSlot(except?: { postId?: string; noticeId?: string }) {
  const raffle = await getFeaturedHomeRaffle();
  const maxItems = HOME_CAROUSEL_MAX - (raffle ? 1 : 0);
  const now = new Date();
  const [posts, notices] = await Promise.all([
    prisma.post.count({
      where: {
        published: true,
        featuredOnHomeCarousel: true,
        ...(except?.postId ? { id: { not: except.postId } } : {}),
      },
    }),
    prisma.notice.count({
      where: {
        ...visibleNoticeWhere(now),
        ...(except?.noticeId ? { id: { not: except.noticeId } } : {}),
      },
    }),
  ]);
  if (posts + notices >= maxItems) {
    throw new Error(
      raffle
        ? `No máximo ${maxItems} item(ns) de notícia ou aviso no carrossel quando há rifa em destaque (total ${HOME_CAROUSEL_MAX}).`
        : `No máximo ${HOME_CAROUSEL_MAX} notícias ou avisos no carrossel da home.`,
    );
  }
}

/** @deprecated use assertHomeCarouselContentSlot */
export async function assertHomeCarouselPostSlot(postId?: string) {
  await assertHomeCarouselContentSlot(postId ? { postId } : undefined);
}