import { resolveImageSrc } from "@/lib/local-image-url";
import { prisma } from "@/lib/prisma";
import { unpublishedPublicHrefs } from "@/lib/public-pages";
import { QUICK_LINKS, SITE_IMAGES } from "@/lib/wordpress-assets";

export type QuickLinkItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  image: string;
  external?: boolean;
};

export async function listHomeQuickLinksForAdmin() {
  return prisma.homeQuickLink.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function getPublishedHomeQuickLinks(): Promise<QuickLinkItem[]> {
  const [rows, hidden] = await Promise.all([
    prisma.homeQuickLink.findMany({
      where: { published: true },
      orderBy: { sortOrder: "asc" },
    }),
    unpublishedPublicHrefs(),
  ]);
  const hiddenHrefs = new Set(hidden);
  if (rows.length === 0) {
    return QUICK_LINKS.filter((item) => !hiddenHrefs.has(item.href)).map((item, i) => ({
      id: `fallback-${i}`,
      title: item.title,
      description: item.description,
      href: item.href,
      image: item.image,
      ...("external" in item && item.external ? { external: true } : {}),
    }));
  }
  return rows.filter((row) => !hiddenHrefs.has(row.href)).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    href: row.href,
    image: resolveImageSrc(row.imageUrl, SITE_IMAGES.heroChurch),
    ...(row.external ? { external: true } : {}),
  }));
}

export async function ensureHomeQuickLinksSeeded() {
  const count = await prisma.homeQuickLink.count();
  if (count > 0) return;
  await prisma.homeQuickLink.createMany({ data: DEFAULT_QUICK_LINK_SEED });
}

export const DEFAULT_QUICK_LINK_SEED = QUICK_LINKS.map((item, sortOrder) => ({
  title: item.title,
  description: item.description,
  href: item.href,
  imageUrl: item.image,
  external: "external" in item && Boolean(item.external),
  sortOrder,
  published: true,
}));