import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminMassLocationForm } from "@/components/admin/AdminMassLocationForm";
import { adminCard, adminLink } from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";

export default async function AdminNovaHorarioPage() {
  if (!(await getSessionAdmin())) redirect("/admin/login");
  return (
    <div className="space-y-6">
      <Link href="/admin/horarios" className={adminLink}>
        ← Voltar à lista
      </Link>
      <section className={adminCard}>
        <h1 className="text-lg font-semibold">Novo local de missa</h1>
        <div className="mt-6">
          <AdminMassLocationForm submitLabel="Cadastrar local" />
        </div>
      </section>
    </div>
  );
}