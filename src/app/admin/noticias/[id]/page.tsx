import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { deletePost } from "@/app/admin/actions";
import { AdminConfirmDeleteForm } from "@/components/admin/AdminConfirmDeleteForm";
import { AdminPostForm } from "@/components/admin/AdminPostForm";
import { adminBtnDanger, adminCard } from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const adminLink =
  "inline-flex items-center rounded-xl border border-parish-200 bg-white px-4 py-2 text-sm font-semibold text-parish-800 hover:bg-parish-50";

type Props = { params: Promise<{ id: string }> };

export default async function AdminEditNoticiaPage({ params }: Props) {
  if (!(await getSessionAdmin())) redirect("/admin/login");
  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      galleryImages: { orderBy: { sortOrder: "asc" } },
      youtubeVideos: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!post) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/noticias" className={adminLink}>
        ← Voltar à lista
      </Link>
      <section className={adminCard}>
        <h1 className="text-lg font-semibold text-parish-900">Editar notícia</h1>
        <p className="mt-1 text-sm text-parish-500">{post.title}</p>
        <div className="mt-6">
          <AdminPostForm
            submitLabel="Salvar notícia"
            post={{
              id: post.id,
              title: post.title,
              slug: post.slug,
              excerpt: post.excerpt,
              body: post.body,
              coverImage: post.coverImage,
              published: post.published,
              featuredOnHomeCarousel: post.featuredOnHomeCarousel,
              galleryImages: post.galleryImages.map((g) => ({
                id: g.id,
                imageUrl: g.imageUrl,
                caption: g.caption,
              })),
              youtubeVideos: post.youtubeVideos.map((v) => ({
                id: v.id,
                youtubeVideoId: v.youtubeVideoId,
                title: v.title,
              })),
            }}
          />
        </div>
        <AdminConfirmDeleteForm
          action={deletePost}
          className="mt-6"
          confirmMessage="Excluir esta notícia permanentemente?"
        >
          <input type="hidden" name="id" value={post.id} />
          <input type="hidden" name="returnTo" value="/admin/noticias" />
          <button type="submit" className={adminBtnDanger}>
            Excluir notícia
          </button>
        </AdminConfirmDeleteForm>
      </section>
    </div>
  );
}