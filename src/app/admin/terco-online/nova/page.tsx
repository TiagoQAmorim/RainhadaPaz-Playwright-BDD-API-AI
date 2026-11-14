import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminTercoSlotForm } from "@/components/admin/AdminTercoSlotForm";
import { adminCard, adminLink } from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminNovaTercoSlotPage() {
  if (!(await getSessionAdmin())) redirect("/admin/login");
  const slots = await prisma.tercoOnlineSlot.findMany({ select: { sortOrder: true } });
  const nextSort =
    slots.length === 0 ? 0 : Math.max(...slots.map((s) => s.sortOrder), 0) + 1;

  return (
    <div className="space-y-6">
      <Link href="/admin/terco-online" className={adminLink}>
        ← Voltar à lista
      </Link>
      <section className={adminCard}>
        <h1 className="text-lg font-semibold">Novo bloco — Terço online</h1>
        <div className="mt-6">
          <AdminTercoSlotForm
            submitLabel="Cadastrar bloco"
            slot={{ title: "Terço online", scheduleText: "", meetingUrl: "", sortOrder: nextSort }}
          />
        </div>
      </section>
    </div>
  );
}