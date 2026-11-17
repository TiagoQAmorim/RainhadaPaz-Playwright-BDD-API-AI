import Link from "next/link";
import { redirect } from "next/navigation";
import { deleteNotice } from "@/app/admin/actions";
import { AdminConfirmDeleteForm } from "@/components/admin/AdminConfirmDeleteForm";
import {
  adminBtn,
  adminBtnDanger,
  adminCard,
  adminLink,
} from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";
import { noticeVisibleOnSite } from "@/lib/datetime-local";
import { prisma } from "@/lib/prisma";

export default async function AdminAvisosListPage() {
  if (!(await getSessionAdmin())) redirect("/admin/login");
  const notices = await prisma.notice.findMany({ orderBy: { updatedAt: "desc" } });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/avisos/nova" className={adminBtn}>
          Novo aviso
        </Link>
      </div>
      <section className={adminCard}>
        <h1 className="text-lg font-semibold text-parish-900">Avisos</h1>
        <p className="mt-1 text-sm text-parish-600">Lista dos avisos em /avisos e na home.</p>
        <ul className="mt-6 divide-y divide-parish-100">
          {notices.map((n) => {
            const onSite = noticeVisibleOnSite(n);
            return (
              <li key={n.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-medium text-parish-900">{n.title}</p>
                  <p className="text-xs text-parish-600">
                    {onSite ? (
                      <span className="font-semibold text-green-700">Visível no site</span>
                    ) : n.published ? (
                      <span className="font-semibold text-amber-800">Publicado, oculto por data</span>
                    ) : (
                      <span className="font-semibold text-parish-600">Rascunho</span>
                    )}
                    {n.featuredOnHomeCarousel ? " · Carrossel do banner" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/admin/avisos/${n.id}`} className={adminLink}>
                    Editar
                  </Link>
                  <AdminConfirmDeleteForm action={deleteNotice} confirmMessage="Excluir este aviso?">
                    <input type="hidden" name="id" value={n.id} />
                    <input type="hidden" name="returnTo" value="/admin/avisos" />
                    <button type="submit" className={adminBtnDanger}>
                      Excluir
                    </button>
                  </AdminConfirmDeleteForm>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}