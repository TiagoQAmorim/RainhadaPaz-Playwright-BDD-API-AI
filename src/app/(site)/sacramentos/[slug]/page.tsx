import { notFound } from "next/navigation";
import { ContentCoverImage } from "@/components/ContentCoverImage";
import { PageContainer } from "@/components/PageContainer";
import { sanitizeWpHtml } from "@/lib/sanitize-wp-html";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const page = await prisma.page.findUnique({ where: { slug } });
  return { title: page?.title ?? "Sacramento" };
}

export default async function SacramentPage({ params }: Props) {
  const { slug } = await params;
  const page = await prisma.page.findUnique({ where: { slug } });
  if (!page) notFound();

  return (
    <PageContainer className="py-12 md:py-16">
      <article className="prose-parish mx-auto max-w-3xl">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-parish-900">
          {page.title}
        </h1>
        {page.featuredImage ? (
          <ContentCoverImage src={page.featuredImage} alt="" className="mt-6" />
        ) : null}
        <div
          className="mt-8"
          dangerouslySetInnerHTML={{ __html: sanitizeWpHtml(page.body, { slug }) }}
        />
      </article>
    </PageContainer>
  );
}
