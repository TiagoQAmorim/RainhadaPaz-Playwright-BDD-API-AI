import { redirect } from "next/navigation";
import { createAdminUser, deleteAdminUser } from "@/app/admin/actions";
import { AdminConfirmDeleteForm } from "@/components/admin/AdminConfirmDeleteForm";
import {
  adminBtn,
  adminBtnDanger,
  adminCard,
  adminInput,
} from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function AdminUsuariosPage({ searchParams }: Props) {
  const session = await getSessionAdmin();
  if (!session) redirect("/admin/login");

  const { error } = await searchParams;
  const admins = await prisma.admin.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  return (
    <div className="space-y-8">
      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-900"
        >
          {error}
        </div>
      ) : null}

      <section className={adminCard}>
        <h1 className="text-lg font-semibold text-parish-900">Administradores</h1>
        <p className="mt-1 text-sm text-parish-600">
          Cadastre outra pessoa da equipe paroquial com acesso ao painel. O login é feito com e-mail e
          senha definidos aqui (não é mais necessário configurar variável de ambiente para cada
          usuário).
        </p>

        <form action={createAdminUser} className="mt-6 space-y-3 border-t border-parish-100 pt-6">
          <h2 className="font-medium text-parish-800">Novo administrador</h2>
          <div>
            <label className="mb-1 block text-sm font-medium">Nome</label>
            <input
              name="name"
              required
              autoComplete="name"
              placeholder="Ex.: Secretaria paroquial"
              className={adminInput}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">E-mail</label>
            <input
              name="email"
              type="email"
              required
              autoComplete="off"
              placeholder="usuario@exemplo.com"
              className={adminInput}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Senha</label>
            <input
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              className={adminInput}
            />
            <p className="mt-1 text-xs text-parish-500">Mínimo de 8 caracteres.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Confirmar senha</label>
            <input
              name="passwordConfirm"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              className={adminInput}
            />
          </div>
          <button type="submit" className={adminBtn}>
            Criar administrador
          </button>
        </form>
      </section>

      <section className={adminCard}>
        <h2 className="text-lg font-semibold text-parish-900">Usuários cadastrados</h2>
        <ul className="mt-4 divide-y divide-parish-100">
          {admins.map((admin) => {
            const isSelf = admin.id === session.id;
            return (
              <li key={admin.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-medium text-parish-900">
                    {admin.name}
                    {isSelf ? (
                      <span className="ml-2 rounded-full bg-parish-100 px-2 py-0.5 text-xs font-semibold text-parish-700">
                        Você
                      </span>
                    ) : null}
                  </p>
                  <p className="text-sm text-parish-600">{admin.email}</p>
                  <p className="text-xs text-parish-400">
                    Desde{" "}
                    {admin.createdAt.toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                {!isSelf ? (
                  <AdminConfirmDeleteForm
                    action={deleteAdminUser}
                    confirmMessage={`Remover o acesso de ${admin.name} (${admin.email})?`}
                  >
                    <input type="hidden" name="id" value={admin.id} />
                    <button type="submit" className={adminBtnDanger}>
                      Excluir
                    </button>
                  </AdminConfirmDeleteForm>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}