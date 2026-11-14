import Link from "next/link";
import { redirect } from "next/navigation";
import { updatePage } from "@/app/admin/actions";
import { AdminRichTextField } from "@/components/admin/AdminRichTextField";
import { adminBtn, adminCard, adminInput, adminLink } from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminTercoConteudoPage() {
  if (!(await getSessionAdmin())) redirect("/admin/login");
  const page = await prisma.page.findUnique({ where: { slug: "terco-online" } });

  return (
    <div className="space-y-6">
      <Link href="/admin/terco-online" className={adminLink}>
        ← Voltar ao Terço online
      </Link>
      <section className={adminCard}>
        <h1 className="text-lg font-semibold">Conteúdo extra — Terço online</h1>
        <p className="mt-1 text-sm text-parish-600">Texto abaixo dos blocos de horário em /terco-online.</p>
        {page ? (
          <form action={updatePage} className="mt-6 space-y-3">
            <input type="hidden" name="id" value={page.id} />
            <input type="hidden" name="slug" value="terco-online" />
            <input type="hidden" name="returnTo" value="/admin/terco-online/conteudo" />
            <div>
              <label className="mb-1 block text-sm font-medium">Título da página</label>
              <input name="title" defaultValue={page.title} className={adminInput} />
            </div>
            <AdminRichTextField label="Conteúdo" name="body" defaultValue={page.body} />
            <button type="submit" className={adminBtn}>
              Salvar conteúdo
            </button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-parish-600">
            Rode <code className="text-xs">npm run db:seed</code> para importar a página.
          </p>
        )}
      </section>
    </div>
  );
}