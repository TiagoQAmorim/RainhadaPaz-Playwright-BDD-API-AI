import Link from "next/link";
import { redirect } from "next/navigation";
import { deletePage } from "@/app/admin/actions";
import { AdminConfirmDeleteForm } from "@/components/admin/AdminConfirmDeleteForm";
import {
  adminBtn,
  adminBtnDanger,
  adminCard,
  adminLink,
} from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminPaginasListPage() {
  if (!(await getSessionAdmin())) redirect("/admin/login");
  const pages = await prisma.page.findMany({ orderBy: { title: "asc" } });
  const sorted = [...pages].sort((a, b) => {
    if (a.slug === "terco-online") return -1;
    if (b.slug === "terco-online") return 1;
    return a.title.localeCompare(b.title, "pt-BR");
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/informacoes" className={adminLink}>
          ← Informações
        </Link>
        <Link href="/admin/informacoes/paginas/nova" className={adminBtn}>
          Nova página
        </Link>
      </div>

      <section className={adminCard}>
        <h1 className="text-lg font-semibold text-parish-900">Páginas de conteúdo</h1>
        <p className="mt-1 text-sm text-parish-600">
          Clique em <strong>Editar</strong> para alterar texto e imagem. Exclusão pede confirmação.
        </p>
        <ul className="mt-6 divide-y divide-parish-100">
          {sorted.map((page) => (
            <li key={page.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="font-medium text-parish-900">{page.title}</p>
                <p className="text-xs text-parish-500">/{page.slug}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/admin/informacoes/paginas/${page.id}`} className={adminLink}>
                  Editar
                </Link>
                <AdminConfirmDeleteForm
                  action={deletePage}
                  confirmMessage="Excluir esta página permanentemente? Esta ação não pode ser desfeita."
                >
                  <input type="hidden" name="id" value={page.id} />
                  <input type="hidden" name="returnTo" value="/admin/informacoes/paginas" />
                  <button type="submit" className={adminBtnDanger}>
                    Excluir
                  </button>
                </AdminConfirmDeleteForm>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}