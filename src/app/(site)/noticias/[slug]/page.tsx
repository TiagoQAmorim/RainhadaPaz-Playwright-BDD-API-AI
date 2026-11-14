import { notFound } from "next/navigation";
import { ContentCoverImage } from "@/components/ContentCoverImage";
import { PostGalleryCarousel } from "@/components/PostGalleryCarousel";
import { PostYoutubeEmbeds } from "@/components/PostYoutubeEmbeds";
import { isLocalSiteImageUrl } from "@/lib/local-image-url";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } });
  return { title: post?.title ?? "Notícia" };
}

export default async function NoticiaPage({ params }: Props) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({
    where: { slug, published: true },
    include: {
      galleryImages: { orderBy: { sortOrder: "asc" } },
      youtubeVideos: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!post) notFound();

  const gallery = post.galleryImages
    .filter((g) => isLocalSiteImageUrl(g.imageUrl))
    .map((g) => ({
      imageUrl: g.imageUrl,
      caption: g.caption,
    }));

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
      {gallery.length > 0 ? <PostGalleryCarousel items={gallery} title={post.title} /> : null}
      <PostYoutubeEmbeds
        items={post.youtubeVideos.map((v) => ({
          youtubeVideoId: v.youtubeVideoId,
          title: v.title,
        }))}
      />
      <div className="prose-parish mt-8" dangerouslySetInnerHTML={{ __html: post.body }} />
    </article>
  );
}
