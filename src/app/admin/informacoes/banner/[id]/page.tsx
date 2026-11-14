import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { deleteHomeHeroCta } from "@/app/admin/actions";
import { AdminConfirmDeleteForm } from "@/components/admin/AdminConfirmDeleteForm";
import { AdminHomeHeroCtaForm } from "@/components/admin/AdminHomeHeroCtaForm";
import { adminBtnDanger, adminCard, adminLink } from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ id: string }> };

export default async function AdminEditBannerBotaoPage({ params }: Props) {
  if (!(await getSessionAdmin())) redirect("/admin/login");
  const { id } = await params;
  const cta = await prisma.homeHeroCta.findUnique({ where: { id } });
  if (!cta) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/informacoes/banner" className={adminLink}>
        ← Voltar à lista
      </Link>
      <section className={adminCard}>
        <h1 className="text-lg font-semibold">Editar botão do banner</h1>
        <div className="mt-6">
          <AdminHomeHeroCtaForm
            submitLabel="Salvar botão"
            cta={{
              id: cta.id,
              label: cta.label,
              href: cta.href,
              variant: cta.variant,
              sortOrder: cta.sortOrder,
            }}
          />
        </div>
        <AdminConfirmDeleteForm action={deleteHomeHeroCta} className="mt-6" confirmMessage="Excluir botão?">
          <input type="hidden" name="id" value={cta.id} />
          <input type="hidden" name="returnTo" value="/admin/informacoes/banner" />
          <button type="submit" className={adminBtnDanger}>
            Excluir
          </button>
        </AdminConfirmDeleteForm>
      </section>
    </div>
  );
}