import Link from "next/link";
import { redirect } from "next/navigation";
import { createPage } from "@/app/admin/actions";
import { AdminImageField } from "@/components/admin/AdminImageField";
import { AdminRichTextField } from "@/components/admin/AdminRichTextField";
import {
  adminBtn,
  adminCard,
  adminInput,
  adminFormEncType,
} from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";

const adminLink =
  "inline-flex items-center rounded-xl border border-parish-200 bg-white px-4 py-2 text-sm font-semibold text-parish-800 hover:bg-parish-50";

export default async function AdminNovaPaginaPage() {
  if (!(await getSessionAdmin())) redirect("/admin/login");

  return (
    <div className="space-y-6">
      <Link href="/admin/informacoes/paginas" className={adminLink}>
        ← Voltar à lista
      </Link>

      <section className={adminCard}>
        <h1 className="text-lg font-semibold text-parish-900">Nova página</h1>
        <form
          action={createPage}
          encType={adminFormEncType}
          className="mt-6 space-y-3"
        >
          <div>
            <label className="mb-1 block text-sm font-medium">Título</label>
            <input name="title" required className={adminInput} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Slug (opcional)</label>
            <input name="slug" placeholder="ex: crisma" className={adminInput} />
          </div>
          <AdminImageField
            label="Imagem de destaque (opcional)"
            name="featuredImage"
            fileFieldName="featuredImageFile"
          />
          <AdminRichTextField label="Conteúdo" name="body" required />
          <button type="submit" className={adminBtn}>
            Cadastrar página
          </button>
        </form>
      </section>
    </div>
  );
}