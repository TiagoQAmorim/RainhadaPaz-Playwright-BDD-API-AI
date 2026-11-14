import Link from "next/link";
import { redirect } from "next/navigation";
import { deleteHomeQuickLink } from "@/app/admin/actions";
import { AdminConfirmDeleteForm } from "@/components/admin/AdminConfirmDeleteForm";
import { adminBtn, adminBtnDanger, adminCard, adminLink } from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";
import { ensureHomeQuickLinksSeeded, listHomeQuickLinksForAdmin } from "@/lib/home-quick-links";

export default async function AdminAtalhosListPage() {
  if (!(await getSessionAdmin())) redirect("/admin/login");
  await ensureHomeQuickLinksSeeded();
  const links = await listHomeQuickLinksForAdmin();

  return (
    <div className="space-y-6">
      <Link href="/admin/informacoes" className={adminLink}>
        ← Voltar às informações
      </Link>
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/informacoes/atalhos/nova" className={adminBtn}>
          Novo atalho
        </Link>
      </div>
      <section className={adminCard}>
        <h1 className="text-lg font-semibold">Cards da home</h1>
        <ul className="mt-6 divide-y divide-parish-100">
          {links.map((link) => (
            <li key={link.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="font-medium text-parish-900">{link.title}</p>
                <p className="text-xs text-parish-500">{link.href}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/informacoes/atalhos/${link.id}`} className={adminLink}>
                  Editar
                </Link>
                <AdminConfirmDeleteForm action={deleteHomeQuickLink} confirmMessage="Excluir atalho?">
                  <input type="hidden" name="id" value={link.id} />
                  <input type="hidden" name="returnTo" value="/admin/informacoes/atalhos" />
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