import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { deleteNotice } from "@/app/admin/actions";
import { AdminConfirmDeleteForm } from "@/components/admin/AdminConfirmDeleteForm";
import { AdminNoticeForm } from "@/components/admin/AdminNoticeForm";
import { adminBtnDanger, adminCard, adminLink } from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ id: string }> };

export default async function AdminEditAvisoPage({ params }: Props) {
  if (!(await getSessionAdmin())) redirect("/admin/login");
  const { id } = await params;
  const notice = await prisma.notice.findUnique({ where: { id } });
  if (!notice) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/avisos" className={adminLink}>
        ← Voltar à lista
      </Link>
      <section className={adminCard}>
        <h1 className="text-lg font-semibold">Editar aviso</h1>
        <div className="mt-6">
          <AdminNoticeForm
            submitLabel="Salvar aviso"
            notice={{
              id: notice.id,
              title: notice.title,
              body: notice.body,
              coverImage: notice.coverImage,
              published: notice.published,
              featuredOnHomeCarousel: notice.featuredOnHomeCarousel,
              expiresAt: notice.expiresAt,
            }}
          />
        </div>
        <AdminConfirmDeleteForm action={deleteNotice} className="mt-6" confirmMessage="Excluir este aviso?">
          <input type="hidden" name="id" value={notice.id} />
          <input type="hidden" name="returnTo" value="/admin/avisos" />
          <button type="submit" className={adminBtnDanger}>
            Excluir aviso
          </button>
        </AdminConfirmDeleteForm>
      </section>
    </div>
  );
}