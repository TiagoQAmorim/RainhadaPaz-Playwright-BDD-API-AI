import Link from "next/link";
import { redirect } from "next/navigation";
import { adminCard, adminLink } from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const sections = [
  {
    href: "/admin/informacoes/geral",
    title: "Dados gerais e imagens",
    desc: "Nome, contato, redes, logo, fotos do banner e texto institucional",
  },
  {
    href: "/admin/informacoes/banner",
    title: "Botões do banner",
    desc: "Atalhos dourados ou transparentes no topo da home",
  },
  {
    href: "/admin/informacoes/atalhos",
    title: "Cards da home",
    desc: "Atalhos com imagem na faixa branca abaixo do banner",
  },
  {
    href: "/admin/informacoes/paginas",
    title: "Páginas de conteúdo",
    desc: "Institucional, sacramentos e textos longos",
  },
];

export default async function AdminInformacoesHubPage() {
  if (!(await getSessionAdmin())) redirect("/admin/login");
  const [pages, atalhos, banner] = await Promise.all([
    prisma.page.count(),
    prisma.homeQuickLink.count(),
    prisma.homeHeroCta.count(),
  ]);

  return (
    <div className="space-y-8">
      <section className={adminCard}>
        <h1 className="text-lg font-semibold text-parish-900">Informações do site</h1>
        <p className="mt-1 text-sm text-parish-600">
          Escolha o que editar: cada área tem lista do que existe e opção de criar ou editar um item.
        </p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {sections.map((s) => (
            <li key={s.href}>
              <Link
                href={s.href}
                className="block rounded-xl border border-parish-100 p-4 transition hover:border-parish-300 hover:shadow-sm"
              >
                <span className="font-semibold text-parish-900">{s.title}</span>
                <p className="mt-1 text-sm text-parish-600">{s.desc}</p>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs text-parish-500">
          Resumo: {pages} página(s), {atalhos} card(s) na home, {banner} botão(ões) no banner.
        </p>
      </section>
      <p className="text-sm text-parish-600">
        Terço online:{" "}
        <Link href="/admin/terco-online" className={`${adminLink} inline-flex`}>
          gerenciar horários e conteúdo
        </Link>
      </p>
    </div>
  );
}