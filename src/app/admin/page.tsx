import Link from "next/link";
import { redirect } from "next/navigation";
import { restoreFromProductionBackup } from "@/app/admin/actions";
import { hasUsableProductionBackup, sqlitePathFromDatabaseUrl } from "@/lib/db-restore-from-backup";
import { adminCard, adminBtn } from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";
import { countCandlesActiveOnMural } from "@/lib/candle-report";
import { prisma } from "@/lib/prisma";

const sections = [
  { href: "/admin/noticias", title: "Notícias", desc: "Cadastrar, editar e excluir notícias" },
  { href: "/admin/avisos", title: "Avisos", desc: "Avisos paroquiais na página /avisos" },
  {
    href: "/admin/horarios",
    title: "Horários e endereços",
    desc: "Locais de missa, endereços e horários",
  },
  {
    href: "/admin/informacoes",
    title: "Informações gerais",
    desc: "Contato, banner, sobre e páginas de conteúdo",
  },
  {
    href: "/admin/manutencao",
    title: "Manutenção",
    desc: "Página temporária com logo enquanto o site está fora do ar",
  },
  {
    href: "/admin/terco-online",
    title: "Terço online",
    desc: "Vários blocos (dias + link) e texto da página /terco-online",
  },
  { href: "/admin/velas", title: "Velas virtuais", desc: "Listar, encerrar ou excluir velas" },
  {
    href: "/admin/rifas",
    title: "Rifa dos Santos",
    desc: "Criar rifas, cotas e santos (até 2.000)",
  },
  {
    href: "/admin/usuarios",
    title: "Administradores",
    desc: "Criar ou remover acessos ao painel",
  },
];

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const admin = await getSessionAdmin();
  if (!admin) redirect("/admin/login");
  const { erro } = await searchParams;

  const dbPath = sqlitePathFromDatabaseUrl();
  const hasProdBackup = dbPath ? hasUsableProductionBackup(dbPath) : false;

  const [posts, notices, locations, candlesActive, pages] = await Promise.all([
    prisma.post.count(),
    prisma.notice.count(),
    prisma.massLocation.count(),
    countCandlesActiveOnMural(),
    prisma.page.count(),
  ]);

  return (
    <div className="space-y-8">
      {erro ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{erro}</p>
      ) : null}
      {(posts === 0 || pages === 0 || locations === 0) && (
        <section className={`${adminCard} border-amber-200 bg-amber-50/80`}>
          <h2 className="text-lg font-semibold text-parish-900">Conteúdo ausente no servidor</h2>
          <p className="mt-2 text-sm text-parish-700">
            O banco no volume parece incompleto (deploy não apaga linhas — confira volume <code>/data</code> e{" "}
            <code>DATABASE_URL</code>). A restauração usa sempre a última cópia feita em{" "}
            <strong>produção</strong> (<code>/data/backups/</code>), nunca o snapshot do Git.
          </p>
          {hasProdBackup ? (
            <form action={restoreFromProductionBackup} className="mt-4">
              <button type="submit" className={adminBtn}>
                Restaurar do backup de produção
              </button>
            </form>
          ) : (
            <p className="mt-4 text-sm text-parish-800">
              Ainda não há backup no volume. Rode o backup diário (GitHub Action) ou{" "}
              <code>POST /api/setup/backup</code> com <code>AUTH_SECRET</code>, depois tente de novo.
            </p>
          )}
        </section>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat n={posts} label="Notícias" />
        <Stat n={notices} label="Avisos" />
        <Stat n={locations} label="Locais de missa" />
        <Stat n={candlesActive} label="Velas acesas" />
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <li key={s.href}>
            <Link
              href={s.href}
              className={`${adminCard} block transition hover:shadow-md`}
            >
              <span className="text-lg font-semibold text-parish-900">{s.title}</span>
              <p className="mt-1 text-sm text-parish-600">{s.desc}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className={adminCard}>
      <p className="text-2xl font-semibold text-parish-900">{n}</p>
      <p className="text-sm text-parish-600">{label}</p>
    </div>
  );
}
