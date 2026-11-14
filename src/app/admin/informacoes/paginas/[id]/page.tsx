import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { deletePage, updatePage } from "@/app/admin/actions";
import { AdminConfirmDeleteForm } from "@/components/admin/AdminConfirmDeleteForm";
import { AdminImageField } from "@/components/admin/AdminImageField";
import { AdminRichTextField } from "@/components/admin/AdminRichTextField";
import {
  adminBtn,
  adminBtnDanger,
  adminCard,
  adminInput,
  adminFormEncType,
} from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const adminLink =
  "inline-flex items-center rounded-xl border border-parish-200 bg-white px-4 py-2 text-sm font-semibold text-parish-800 hover:bg-parish-50";

type Props = { params: Promise<{ id: string }> };

export default async function AdminEditPaginaPage({ params }: Props) {
  if (!(await getSessionAdmin())) redirect("/admin/login");
  const { id } = await params;
  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/informacoes/paginas" className={adminLink}>
        ← Voltar à lista
      </Link>

      <section className={adminCard}>
        <h1 className="text-lg font-semibold text-parish-900">Editar página</h1>
        <p className="mt-1 text-sm text-parish-500">{page.title}</p>
        {page.slug === "terco-online" ? (
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-gold-700">
            Também editável em Admin → Terço online
          </p>
        ) : null}
        <form action={updatePage} encType={adminFormEncType} className="mt-6 space-y-3">
          <input type="hidden" name="id" value={page.id} />
          <div>
            <label className="mb-1 block text-sm font-medium">Título</label>
            <input name="title" defaultValue={page.title} className={adminInput} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Slug</label>
            <input name="slug" defaultValue={page.slug} className={adminInput} />
          </div>
          <AdminImageField
            label="Imagem de destaque"
            name="featuredImage"
            fileFieldName="featuredImageFile"
            defaultValue={page.featuredImage}
          />
          <AdminRichTextField label="Conteúdo" name="body" defaultValue={page.body} required />
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={adminBtn}>
              Salvar
            </button>
          </div>
        </form>
        <AdminConfirmDeleteForm
          action={deletePage}
          className="mt-4"
          confirmMessage="Excluir esta página permanentemente? Esta ação não pode ser desfeita."
        >
          <input type="hidden" name="id" value={page.id} />
          <input type="hidden" name="returnTo" value="/admin/informacoes/paginas" />
          <button type="submit" className={adminBtnDanger}>
            Excluir página
          </button>
        </AdminConfirmDeleteForm>
      </section>
    </div>
  );
}