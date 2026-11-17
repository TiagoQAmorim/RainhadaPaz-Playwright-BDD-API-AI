import { prisma } from "@/lib/prisma";

/** Endereços públicos de páginas marcadas como ocultas no admin. */
export async function unpublishedPublicHrefs(): Promise<string[]> {
  const pages = await prisma.page.findMany({
    where: { published: false },
    select: { slug: true },
  });
  return pages.flatMap((page) => [`/${page.slug}`, `/sacramentos/${page.slug}`]);
}
