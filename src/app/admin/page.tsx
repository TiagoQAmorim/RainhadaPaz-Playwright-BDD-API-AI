import Link from "next/link";
import { redirect } from "next/navigation";
import { adminCard } from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";
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
];

export default async function AdminHomePage() {
  const admin = await getSessionAdmin();
  if (!admin) redirect("/admin/login");

  const [posts, notices, locations, candlesActive] = await Promise.all([
    prisma.post.count(),
    prisma.notice.count(),
    prisma.massLocation.count(),
    prisma.virtualCandle.count({ where: { status: "PAID" } }),
  ]);

  return (
    <div className="space-y-8">
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
