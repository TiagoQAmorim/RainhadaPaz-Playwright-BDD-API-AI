import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminHomeHeroCtaForm } from "@/components/admin/AdminHomeHeroCtaForm";
import { adminCard, adminLink } from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";

export default async function AdminNovaBannerBotaoPage() {
  if (!(await getSessionAdmin())) redirect("/admin/login");
  return (
    <div className="space-y-6">
      <Link href="/admin/informacoes/banner" className={adminLink}>
        ← Voltar à lista
      </Link>
      <section className={adminCard}>
        <h1 className="text-lg font-semibold">Novo botão do banner</h1>
        <div className="mt-6">
          <AdminHomeHeroCtaForm submitLabel="Criar botão" />
        </div>
      </section>
    </div>
  );
}