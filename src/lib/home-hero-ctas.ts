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

function isObraHref(href: string) {
  const path = href.trim().replace(/\/$/, "") || "/";
  return path === "/obra" || path === "/obras";
}

export async function getHomeHeroCtas(): Promise<HeroCtaItem[]> {
  const rows = await prisma.homeHeroCta.findMany({ orderBy: { sortOrder: "asc" } });
  if (rows.length === 0) return FALLBACK;
  let seenObra = false;
  return rows.flatMap((row) => {
    if (isObraHref(row.href)) {
      if (seenObra) return [];
      seenObra = true;
    }
    return [
      {
        id: row.id,
        label: row.label,
        href: row.href,
        variant: row.variant === "secondary" ? "secondary" : "primary",
      },
    ];
  });
}

export async function ensureHomeHeroCtasSeeded() {
  const count = await prisma.homeHeroCta.count();
  if (count > 0) return;
  await prisma.homeHeroCta.createMany({ data: DEFAULT_HERO_CTA_SEED });
}

const OBRA_HREFS = ["/obra", "/obras", "/obra/", "/obras/"];

/** Liga ou desliga o botão A obra no banner. Só existe quando o admin marca. */
export async function setObraHeroCtaVisible(visible: boolean) {
  const obras = await prisma.homeHeroCta.findMany({
    where: { href: { in: OBRA_HREFS } },
    orderBy: { sortOrder: "asc" },
  });
  if (!visible) {
    if (obras.length > 0) {
      await prisma.homeHeroCta.deleteMany({
        where: { id: { in: obras.map((row) => row.id) } },
      });
    }
    return;
  }
  if (obras.length > 1) {
    await prisma.homeHeroCta.deleteMany({
      where: { id: { in: obras.slice(1).map((row) => row.id) } },
    });
    return;
  }
  if (obras.length === 1) return;
  const max = await prisma.homeHeroCta.aggregate({ _max: { sortOrder: true } });
  await prisma.homeHeroCta.create({
    data: {
      label: "A obra",
      href: "/obra",
      variant: "primary",
      sortOrder: (max._max.sortOrder ?? 0) + 1,
    },
  });
}

export const DEFAULT_HERO_CTA_SEED = FALLBACK.map((item, sortOrder) => ({
  label: item.label,
  href: item.href,
  variant: item.variant,
  sortOrder,
}));