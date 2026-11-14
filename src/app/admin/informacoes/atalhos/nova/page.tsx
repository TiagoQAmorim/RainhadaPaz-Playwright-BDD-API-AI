import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminHomeQuickLinkForm } from "@/components/admin/AdminHomeQuickLinkForm";
import { adminCard, adminLink } from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";

export default async function AdminNovaAtalhoPage() {
  if (!(await getSessionAdmin())) redirect("/admin/login");
  return (
    <div className="space-y-6">
      <Link href="/admin/informacoes/atalhos" className={adminLink}>
        ← Voltar à lista
      </Link>
      <section className={adminCard}>
        <h1 className="text-lg font-semibold">Novo atalho na home</h1>
        <div className="mt-6">
          <AdminHomeQuickLinkForm submitLabel="Criar atalho" />
        </div>
      </section>
    </div>
  );
}