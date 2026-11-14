import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { deleteHomeQuickLink } from "@/app/admin/actions";
import { AdminConfirmDeleteForm } from "@/components/admin/AdminConfirmDeleteForm";
import { AdminHomeQuickLinkForm } from "@/components/admin/AdminHomeQuickLinkForm";
import { adminBtnDanger, adminCard, adminLink } from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ id: string }> };

export default async function AdminEditAtalhoPage({ params }: Props) {
  if (!(await getSessionAdmin())) redirect("/admin/login");
  const { id } = await params;
  const link = await prisma.homeQuickLink.findUnique({ where: { id } });
  if (!link) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/informacoes/atalhos" className={adminLink}>
        ← Voltar à lista
      </Link>
      <section className={adminCard}>
        <h1 className="text-lg font-semibold">Editar atalho</h1>
        <div className="mt-6">
          <AdminHomeQuickLinkForm
            submitLabel="Salvar atalho"
            link={{
              id: link.id,
              title: link.title,
              description: link.description,
              href: link.href,
              imageUrl: link.imageUrl,
              sortOrder: link.sortOrder,
              published: link.published,
              external: link.external,
            }}
          />
        </div>
        <AdminConfirmDeleteForm action={deleteHomeQuickLink} className="mt-6" confirmMessage="Excluir atalho?">
          <input type="hidden" name="id" value={link.id} />
          <input type="hidden" name="returnTo" value="/admin/informacoes/atalhos" />
          <button type="submit" className={adminBtnDanger}>
            Excluir
          </button>
        </AdminConfirmDeleteForm>
      </section>
    </div>
  );
}