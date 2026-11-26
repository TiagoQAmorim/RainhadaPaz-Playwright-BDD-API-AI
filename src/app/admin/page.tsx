import Link from "next/link";
import { redirect } from "next/navigation";
import {
  backupProductionDatabase,
  importGitSnapshotIfEmpty,
  restoreFromProductionBackup,
} from "@/app/admin/actions";
import { hasUsableProductionBackup, sqlitePathFromDatabaseUrl } from "@/lib/db-restore-from-backup";
import { adminCard, adminBtn } from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";
import { countCandlesActiveOnMural } from "@/lib/candle-report";
import { prisma } from "@/lib/prisma";

export const maxDuration = 300;

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
    href: "/admin/obra",
    title: "Obra",
    desc: "Fotos, antes e depois, evolução e texto da página /obra",
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

  const [posts, notices, locations, candlesActive, pages, raffles] = await Promise.all([
    prisma.post.count(),
    prisma.notice.count(),
    prisma.massLocation.count(),
    countCandlesActiveOnMural(),
    prisma.page.count(),
    prisma.raffle.count(),
  ]);
  const fullyEmpty = posts === 0 && pages === 0 && raffles === 0;

  return (
    <div className="space-y-8">
      {erro ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{erro}</p>
      ) : null}
      {(posts === 0 || pages === 0 || locations === 0) && (
        <section className={`${adminCard} border-amber-200 bg-amber-50/80`}>
          <h2 className="text-lg font-semibold text-parish-900">Conteúdo ausente no servidor</h2>
          <p className="mt-2 text-sm text-parish-700">
            Neste disco não há notícias, páginas ou rifas completas. O deploy não preenche o banco sozinho.
            Volume esperado: <code>/data</code> com <code>DATABASE_URL=file:/data/rainhadapaz.db</code>.
          </p>
          {hasProdBackup ? (
            <form action={restoreFromProductionBackup} className="mt-4">
              <button type="submit" className={adminBtn}>
                Restaurar do backup de produção
              </button>
            </form>
          ) : fullyEmpty ? (
            <form action={importGitSnapshotIfEmpty} className="mt-4 space-y-2">
              <p className="text-sm text-parish-800">
                Não existe backup em <code>/data/backups</code>. A única cópia disponível é a do Git, de 16/11
                (páginas, notícias, rifa e velas daquele dia). Isso não roda no próximo deploy.
              </p>
              <button type="submit" className={adminBtn}>
                Carregar a cópia de 16/11
              </button>
            </form>
          ) : (
            <p className="mt-4 text-sm text-parish-800">
              Não há backup no volume, e o banco não está totalmente vazio. A cópia do Git não será aplicada
              para não cobrir o que já existe.
            </p>
          )}
        </section>
      )}
      <section className={adminCard}>
        <h2 className="text-lg font-semibold text-parish-900">Backup do banco</h2>
        <p className="mt-1 text-sm text-parish-600">
          Grava uma cópia do que está no ar agora, no arquivo de hoje em /data/backups. Não mexe nas
          notícias, rifas nem velas.
        </p>
        <form action={backupProductionDatabase} className="mt-4">
          <button type="submit" className={adminBtn}>
            Fazer backup agora
          </button>
        </form>
      </section>
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
