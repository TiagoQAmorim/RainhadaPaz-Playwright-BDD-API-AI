import { notFound } from "next/navigation";
import { ContentCoverImage } from "@/components/ContentCoverImage";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } });
  return { title: post?.title ?? "Notícia" };
}

export default async function NoticiaPage({ params }: Props) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug, published: true } });
  if (!post) notFound();

  return (
    <article className="prose-parish mx-auto max-w-3xl">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-parish-900">
        {post.title}
      </h1>
      {post.publishedAt ? (
        <p className="mt-2 text-sm text-parish-700/70">
          {post.publishedAt.toLocaleDateString("pt-BR", { dateStyle: "long" })}
        </p>
      ) : null}
      {post.coverImage ? <ContentCoverImage src={post.coverImage} alt="" priority /> : null}
      <div className="mt-8" dangerouslySetInnerHTML={{ __html: post.body }} />
    </article>
  );
}
