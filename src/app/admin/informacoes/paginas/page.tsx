import Link from "next/link";
import { redirect } from "next/navigation";
import { deletePage, setPagePublished } from "@/app/admin/actions";
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
          Cada página mostra se está <strong>visível</strong> ou <strong>oculta</strong>. Ocultar tira do
          site sem apagar. Exclusão pede confirmação.
        </p>
        <ul className="mt-6 divide-y divide-parish-100">
          {sorted.map((page) => (
            <li
              key={page.id}
              id={`pagina-${page.id}`}
              className={
                page.published
                  ? "flex scroll-mt-28 flex-wrap items-center justify-between gap-3 py-4"
                  : "flex scroll-mt-28 flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 px-3 py-4"
              }
            >
              <div>
                <p className="flex flex-wrap items-center gap-2 font-medium text-parish-900">
                  {page.title}
                  {page.published ? (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-emerald-800">
                      Visível
                    </span>
                  ) : (
                    <span className="rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-amber-950">
                      Oculta
                    </span>
                  )}
                </p>
                <p className="text-xs text-parish-500">/{page.slug}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <form action={setPagePublished}>
                  <input type="hidden" name="id" value={page.id} />
                  <input type="hidden" name="published" value={page.published ? "false" : "true"} />
                  <button type="submit" className={page.published ? adminLink : adminBtn}>
                    {page.published ? "Ocultar" : "Mostrar no site"}
                  </button>
                </form>
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