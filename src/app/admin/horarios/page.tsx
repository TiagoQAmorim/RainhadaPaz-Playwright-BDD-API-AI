import Link from "next/link";
import { redirect } from "next/navigation";
import { deleteMassLocation } from "@/app/admin/actions";
import { AdminConfirmDeleteForm } from "@/components/admin/AdminConfirmDeleteForm";
import {
  adminBtn,
  adminBtnDanger,
  adminCard,
  adminLink,
} from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminHorariosListPage() {
  if (!(await getSessionAdmin())) redirect("/admin/login");
  const locations = await prisma.massLocation.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/horarios/nova" className={adminBtn}>
          Novo local
        </Link>
      </div>
      <section className={adminCard}>
        <h1 className="text-lg font-semibold text-parish-900">Horários de missa</h1>
        <p className="mt-1 text-sm text-parish-600">Locais e horários exibidos em /horarios.</p>
        <ul className="mt-6 divide-y divide-parish-100">
          {locations.map((loc) => (
            <li key={loc.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="font-medium text-parish-900">{loc.name}</p>
                <p className="text-xs text-parish-500">{loc.address}</p>
                <p className="text-xs text-parish-600">
                  {loc.published ? "Publicado" : "Oculto"} · ordem {loc.sortOrder}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/admin/horarios/${loc.id}`} className={adminLink}>
                  Editar
                </Link>
                <AdminConfirmDeleteForm
                  action={deleteMassLocation}
                  confirmMessage="Excluir este local de missa?"
                >
                  <input type="hidden" name="id" value={loc.id} />
                  <input type="hidden" name="returnTo" value="/admin/horarios" />
                  <button type="submit" className={adminBtnDanger}>
                    Excluir
                  </button>
                </AdminConfirmDeleteForm>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}