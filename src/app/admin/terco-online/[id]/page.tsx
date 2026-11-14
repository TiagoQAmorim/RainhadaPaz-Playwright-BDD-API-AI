import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { deleteTercoOnlineSlot } from "@/app/admin/actions";
import { AdminConfirmDeleteForm } from "@/components/admin/AdminConfirmDeleteForm";
import { AdminTercoSlotForm } from "@/components/admin/AdminTercoSlotForm";
import { adminBtnDanger, adminCard, adminLink } from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ id: string }> };

export default async function AdminEditTercoSlotPage({ params }: Props) {
  if (!(await getSessionAdmin())) redirect("/admin/login");
  const { id } = await params;
  const slot = await prisma.tercoOnlineSlot.findUnique({ where: { id } });
  if (!slot) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/terco-online" className={adminLink}>
        ← Voltar à lista
      </Link>
      <section className={adminCard}>
        <h1 className="text-lg font-semibold">Editar bloco</h1>
        <div className="mt-6">
          <AdminTercoSlotForm
            submitLabel="Salvar bloco"
            slot={{
              id: slot.id,
              title: slot.title,
              scheduleText: slot.scheduleText,
              meetingUrl: slot.meetingUrl,
              sortOrder: slot.sortOrder,
            }}
          />
        </div>
        <AdminConfirmDeleteForm
          action={deleteTercoOnlineSlot}
          className="mt-6"
          confirmMessage="Excluir este bloco?"
        >
          <input type="hidden" name="id" value={slot.id} />
          <input type="hidden" name="returnTo" value="/admin/terco-online" />
          <button type="submit" className={adminBtnDanger}>
            Excluir bloco
          </button>
        </AdminConfirmDeleteForm>
      </section>
    </div>
  );
}