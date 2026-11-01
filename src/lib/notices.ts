import { prisma } from "@/lib/prisma";

export async function getPublishedNotices(limit?: number) {
  const now = new Date();
  return prisma.notice.findMany({
    where: {
      published: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
}
