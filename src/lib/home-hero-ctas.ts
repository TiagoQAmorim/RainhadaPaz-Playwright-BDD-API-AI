import { prisma } from "@/lib/prisma";

export type HeroCtaVariant = "primary" | "secondary";

export type HeroCtaItem = {
  id: string;
  label: string;
  href: string;
  variant: HeroCtaVariant;
};

const FALLBACK: HeroCtaItem[] = [
  { id: "fallback-1", label: "Horários de missa", href: "/horarios", variant: "primary" },
  { id: "fallback-2", label: "Acender vela virtual", href: "/velas", variant: "secondary" },
];

export async function listHomeHeroCtasForAdmin() {
  return prisma.homeHeroCta.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function getHomeHeroCtas(): Promise<HeroCtaItem[]> {
  const rows = await prisma.homeHeroCta.findMany({ orderBy: { sortOrder: "asc" } });
  if (rows.length === 0) return FALLBACK;
  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    href: row.href,
    variant: row.variant === "secondary" ? "secondary" : "primary",
  }));
}

export async function ensureHomeHeroCtasSeeded() {
  const count = await prisma.homeHeroCta.count();
  if (count > 0) return;
  await prisma.homeHeroCta.createMany({ data: DEFAULT_HERO_CTA_SEED });
}

export const DEFAULT_HERO_CTA_SEED = FALLBACK.map((item, sortOrder) => ({
  label: item.label,
  href: item.href,
  variant: item.variant,
  sortOrder,
}));