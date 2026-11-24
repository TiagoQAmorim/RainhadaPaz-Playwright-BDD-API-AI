import Link from "next/link";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeading } from "@/components/SectionHeading";
import { SACRAMENT_INDEX_SLUGS } from "@/lib/wp-content";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Sacramentos e pastorais",
  description:
    "Sacramentos e pastorais da Paróquia Nossa Senhora Rainha da Paz: batismo, crisma, catequese e dízimo.",
};

export default async function SacramentosPage() {
  const pages = await prisma.page.findMany({
    where: { published: true, slug: { in: [...SACRAMENT_INDEX_SLUGS] } },
    orderBy: { title: "asc" },
  });
  return (
    <PageContainer wide className="py-12 md:py-16">
      <SectionHeading
        eyebrow="Igreja"
        title="Sacramentos e pastorais"
        description="Batismo, casamento, crisma, catequese, dízimo e a vida pastoral da paróquia."
      />
      <ul className="grid gap-5 sm:grid-cols-2">
        {pages.map((p) => (
          <li key={p.id}>
            <Link
              href={`/sacramentos/${p.slug}`}
              className="glass-card block p-8 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <span className="font-[family-name:var(--font-display)] text-2xl font-semibold text-parish-900">
                {p.title}
              </span>
              <span className="mt-3 block text-sm font-bold text-gold-600">Saiba mais →</span>
            </Link>
          </li>
        ))}
      </ul>
    </PageContainer>
  );
}
