import Link from "next/link";
import { redirect } from "next/navigation";
import { deletePost } from "@/app/admin/actions";
import { AdminConfirmDeleteForm } from "@/components/admin/AdminConfirmDeleteForm";
import { adminBtn, adminBtnDanger, adminCard } from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const adminLink =
  "inline-flex items-center rounded-xl border border-parish-200 bg-white px-4 py-2 text-sm font-semibold text-parish-800 hover:bg-parish-50";

export default async function AdminNoticiasListPage() {
  if (!(await getSessionAdmin())) redirect("/admin/login");

  const posts = await prisma.post.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { galleryImages: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/noticias/nova" className={adminBtn}>
          Nova notícia
        </Link>
      </div>

      <section className={adminCard}>
        <h1 className="text-lg font-semibold text-parish-900">Notícias</h1>
        <p className="mt-1 text-sm text-parish-600">
          Lista do que já foi criado. Clique em <strong>Editar</strong> para texto, capa e carrossel
          de fotos.
        </p>

        {posts.length === 0 ? (
          <p className="mt-6 text-sm text-parish-600">Nenhuma notícia cadastrada ainda.</p>
        ) : (
          <ul className="mt-6 divide-y divide-parish-100">
            {posts.map((post) => (
              <li
                key={post.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div className="min-w-0">
                  <p className="font-medium text-parish-900">{post.title}</p>
                  <p className="text-xs text-parish-500">/noticias/{post.slug}</p>
                  <p className="mt-1 text-xs text-parish-600">
                    {post.published ? (
                      <span className="font-semibold text-emerald-700">Publicada</span>
                    ) : (
                      <span className="font-semibold text-amber-700">Rascunho</span>
                    )}
                    {post.featuredOnHomeCarousel ? " · Carrossel da home" : ""}
                    {post._count.galleryImages > 0
                      ? ` · ${post._count.galleryImages} foto(s) no carrossel`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/noticias/${post.id}`} className={adminLink}>
                    Editar
                  </Link>
                  <AdminConfirmDeleteForm
                    action={deletePost}
                    confirmMessage="Excluir esta notícia permanentemente?"
                  >
                    <input type="hidden" name="id" value={post.id} />
                    <input type="hidden" name="returnTo" value="/admin/noticias" />
                    <button type="submit" className={adminBtnDanger}>
                      Excluir
                    </button>
                  </AdminConfirmDeleteForm>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}