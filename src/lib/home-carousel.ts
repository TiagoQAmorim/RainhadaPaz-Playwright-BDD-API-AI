import { prisma } from "@/lib/prisma";
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

export type HomeCarouselSlide = HomeCarouselRaffleSlide | HomeCarouselNewsSlide;

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
      coverImageUrl: raffle.coverImageUrl,
    });
  }

  if (newsLimit > 0) {
    const posts = await prisma.post.findMany({
      where: { published: true, featuredOnHomeCarousel: true },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      take: newsLimit,
      select: {
        slug: true,
        title: true,
        excerpt: true,
        coverImage: true,
      },
    });
    for (const p of posts) {
      slides.push({
        type: "news",
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        coverImage: p.coverImage,
      });
    }
  }

  return slides.slice(0, HOME_CAROUSEL_MAX);
}

/** Valida limite ao marcar notícia no carrossel da home (máx. 3 itens com a rifa em destaque). */
export async function assertHomeCarouselPostSlot(postId?: string) {
  const raffle = await getFeaturedHomeRaffle();
  const maxNews = HOME_CAROUSEL_MAX - (raffle ? 1 : 0);
  const count = await prisma.post.count({
    where: {
      featuredOnHomeCarousel: true,
      ...(postId ? { id: { not: postId } } : {}),
    },
  });
  if (count >= maxNews) {
    throw new Error(
      raffle
        ? `No máximo ${maxNews} notícia(s) no carrossel da home quando há rifa em destaque (total ${HOME_CAROUSEL_MAX}).`
        : `No máximo ${HOME_CAROUSEL_MAX} notícias no carrossel da home.`,
    );
  }
}