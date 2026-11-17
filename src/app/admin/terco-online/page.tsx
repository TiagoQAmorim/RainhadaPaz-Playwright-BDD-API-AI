import Link from "next/link";
import { redirect } from "next/navigation";
import { deleteTercoOnlineSlot } from "@/app/admin/actions";
import { AdminConfirmDeleteForm } from "@/components/admin/AdminConfirmDeleteForm";
import {
  adminBtn,
  adminBtnDanger,
  adminCard,
  adminLink,
} from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminTercoOnlineHubPage() {
  if (!(await getSessionAdmin())) redirect("/admin/login");
  const slots = await prisma.tercoOnlineSlot.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/terco-online/nova" className={adminBtn}>
          Novo bloco de horário
        </Link>
        <Link href="/admin/terco-online/conteudo" className={adminLink}>
          Imagem e texto
        </Link>
        <Link href="/terco-online" target="_blank" className={adminLink}>
          Ver no site →
        </Link>
      </div>
      <section className={adminCard}>
        <h1 className="text-lg font-semibold text-parish-900">Terço online</h1>
        <p className="mt-1 text-sm text-parish-600">
          Blocos de dias, horário e link exibidos em /terco-online.
        </p>
        <ul className="mt-6 divide-y divide-parish-100">
          {slots.map((slot) => (
            <li key={slot.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="font-medium text-parish-900">{slot.title}</p>
                <p className="text-sm text-parish-600">{slot.scheduleText}</p>
                <p className="text-xs text-parish-500">Ordem {slot.sortOrder}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/admin/terco-online/${slot.id}`} className={adminLink}>
                  Editar
                </Link>
                <AdminConfirmDeleteForm
                  action={deleteTercoOnlineSlot}
                  confirmMessage="Excluir este bloco?"
                >
                  <input type="hidden" name="id" value={slot.id} />
                  <input type="hidden" name="returnTo" value="/admin/terco-online" />
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