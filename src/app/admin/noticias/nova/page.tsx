import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPostForm } from "@/components/admin/AdminPostForm";
import { adminCard } from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";

const adminLink =
  "inline-flex items-center rounded-xl border border-parish-200 bg-white px-4 py-2 text-sm font-semibold text-parish-800 hover:bg-parish-50";

export default async function AdminNovaNoticiaPage() {
  if (!(await getSessionAdmin())) redirect("/admin/login");

  return (
    <div className="space-y-6">
      <Link href="/admin/noticias" className={adminLink}>
        ← Voltar à lista
      </Link>
      <section className={adminCard}>
        <h1 className="text-lg font-semibold text-parish-900">Nova notícia</h1>
        <div className="mt-6">
          <AdminPostForm submitLabel="Cadastrar notícia" />
        </div>
      </section>
    </div>
  );
}