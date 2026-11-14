import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNoticeForm } from "@/components/admin/AdminNoticeForm";
import { adminCard, adminLink } from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";

export default async function AdminNovaAvisoPage() {
  if (!(await getSessionAdmin())) redirect("/admin/login");
  return (
    <div className="space-y-6">
      <Link href="/admin/avisos" className={adminLink}>
        ← Voltar à lista
      </Link>
      <section className={adminCard}>
        <h1 className="text-lg font-semibold">Novo aviso</h1>
        <div className="mt-6">
          <AdminNoticeForm submitLabel="Cadastrar aviso" />
        </div>
      </section>
    </div>
  );
}