import Link from "next/link";
import { redirect } from "next/navigation";
import { deleteHomeHeroCta } from "@/app/admin/actions";
import { AdminConfirmDeleteForm } from "@/components/admin/AdminConfirmDeleteForm";
import { adminBtn, adminBtnDanger, adminCard, adminLink } from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";
import { ensureHomeHeroCtasSeeded, listHomeHeroCtasForAdmin } from "@/lib/home-hero-ctas";

export default async function AdminBannerBotoesListPage() {
  if (!(await getSessionAdmin())) redirect("/admin/login");
  await ensureHomeHeroCtasSeeded();
  const ctas = await listHomeHeroCtasForAdmin();

  return (
    <div className="space-y-6">
      <Link href="/admin/informacoes" className={adminLink}>
        ← Voltar às informações
      </Link>
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/informacoes/banner/nova" className={adminBtn}>
          Novo botão
        </Link>
      </div>
      <section className={adminCard}>
        <h1 className="text-lg font-semibold">Botões do banner</h1>
        <ul className="mt-6 divide-y divide-parish-100">
          {ctas.map((cta) => (
            <li key={cta.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="font-medium text-parish-900">{cta.label}</p>
                <p className="text-xs text-parish-500">
                  {cta.href} · {cta.variant === "secondary" ? "secundário" : "destaque"}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/informacoes/banner/${cta.id}`} className={adminLink}>
                  Editar
                </Link>
                <AdminConfirmDeleteForm action={deleteHomeHeroCta} confirmMessage="Excluir botão?">
                  <input type="hidden" name="id" value={cta.id} />
                  <input type="hidden" name="returnTo" value="/admin/informacoes/banner" />
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