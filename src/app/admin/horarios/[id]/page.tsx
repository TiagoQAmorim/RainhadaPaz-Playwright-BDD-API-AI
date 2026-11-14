import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { deleteMassLocation } from "@/app/admin/actions";
import { AdminConfirmDeleteForm } from "@/components/admin/AdminConfirmDeleteForm";
import { AdminMassLocationForm } from "@/components/admin/AdminMassLocationForm";
import { adminBtnDanger, adminCard, adminLink } from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ id: string }> };

export default async function AdminEditHorarioPage({ params }: Props) {
  if (!(await getSessionAdmin())) redirect("/admin/login");
  const { id } = await params;
  const loc = await prisma.massLocation.findUnique({ where: { id } });
  if (!loc) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/horarios" className={adminLink}>
        ← Voltar à lista
      </Link>
      <section className={adminCard}>
        <h1 className="text-lg font-semibold">Editar local</h1>
        <div className="mt-6">
          <AdminMassLocationForm
            submitLabel="Salvar local"
            location={{
              id: loc.id,
              name: loc.name,
              address: loc.address,
              scheduleText: loc.scheduleText,
              sortOrder: loc.sortOrder,
              published: loc.published,
            }}
          />
        </div>
        <AdminConfirmDeleteForm
          action={deleteMassLocation}
          className="mt-6"
          confirmMessage="Excluir este local?"
        >
          <input type="hidden" name="id" value={loc.id} />
          <input type="hidden" name="returnTo" value="/admin/horarios" />
          <button type="submit" className={adminBtnDanger}>
            Excluir local
          </button>
        </AdminConfirmDeleteForm>
      </section>
    </div>
  );
}