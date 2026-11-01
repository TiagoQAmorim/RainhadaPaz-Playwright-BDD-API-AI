import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentCoverImage } from "@/components/ContentCoverImage";
import { PageContainer } from "@/components/PageContainer";
import { noticeVisibleOnSite } from "@/lib/datetime-local";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const notice = await prisma.notice.findUnique({ where: { id } });
  if (!notice || !noticeVisibleOnSite(notice)) return { title: "Aviso" };
  return { title: notice.title };
}

export default async function AvisoDetailPage({ params }: Props) {
  const { id } = await params;
  const notice = await prisma.notice.findUnique({ where: { id } });
  if (!notice || !noticeVisibleOnSite(notice)) notFound();

  return (
    <PageContainer className="py-12 md:py-16">
      <Link href="/avisos" className="text-sm font-bold text-parish-600 hover:text-gold-600">
        ← Todos os avisos
      </Link>
      <article className="glass-card mt-6 overflow-hidden p-6 md:p-8">
        {notice.coverImage ? (
          <ContentCoverImage src={notice.coverImage} alt="" priority />
        ) : null}
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-parish-900">
          {notice.title}
        </h1>
        {notice.publishedAt ? (
          <p className="mt-2 text-sm text-parish-500">
            {notice.publishedAt.toLocaleDateString("pt-BR", { dateStyle: "long" })}
          </p>
        ) : null}
        <div
          className="prose-parish mt-6"
          dangerouslySetInnerHTML={{ __html: notice.body }}
        />
      </article>
    </PageContainer>
  );
}
