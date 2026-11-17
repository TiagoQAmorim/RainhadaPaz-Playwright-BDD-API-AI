import Link from "next/link";
import { redirect } from "next/navigation";
import { updatePage } from "@/app/admin/actions";
import { AdminImageField } from "@/components/admin/AdminImageField";
import { AdminRichTextField } from "@/components/admin/AdminRichTextField";
import { adminBtn, adminCard, adminFormEncType, adminInput, adminLink } from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SITE_IMAGES } from "@/lib/wordpress-assets";

export default async function AdminTercoConteudoPage() {
  if (!(await getSessionAdmin())) redirect("/admin/login");
  const page = await prisma.page.findUnique({ where: { slug: "terco-online" } });

  return (
    <div className="space-y-6">
      <Link href="/admin/terco-online" className={adminLink}>
        ← Voltar ao Terço online
      </Link>
      <section className={adminCard}>
        <h1 className="text-lg font-semibold">Conteúdo — Terço online</h1>
        <p className="mt-1 text-sm text-parish-600">
          A imagem aparece na home, ao lado dos horários, e no topo da página do terço. O texto fica abaixo
          dos blocos de horário.
        </p>
        {page ? (
          <form action={updatePage} encType={adminFormEncType} className="mt-6 space-y-3">
            <input type="hidden" name="id" value={page.id} />
            <input type="hidden" name="slug" value="terco-online" />
            <input type="hidden" name="returnTo" value="/admin/terco-online/conteudo" />
            <AdminImageField
              label="Imagem ilustrativa"
              name="featuredImage"
              fileFieldName="featuredImageFile"
              defaultValue={page.featuredImage || SITE_IMAGES.tercoOnline}
            />
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