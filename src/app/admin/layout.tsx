import Link from "next/link";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { AdminFlashBanner } from "@/components/admin/AdminFlashBanner";
import { getSessionAdmin } from "@/lib/auth";

const links = [
  { href: "/admin", label: "Início" },
  { href: "/admin/noticias", label: "Notícias" },
  { href: "/admin/avisos", label: "Avisos" },
  { href: "/admin/horarios", label: "Horários" },
  { href: "/admin/informacoes", label: "Informações" },
  { href: "/admin/terco-online", label: "Terço online" },
  { href: "/admin/velas", label: "Velas" },
  { href: "/admin/rifas", label: "Rifas" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getSessionAdmin();

  return (
    <div className="-mx-4 -mt-8 min-h-screen bg-parish-100 px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <div
          data-admin-nav
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm"
        >
          <div>
            <p className="text-xs uppercase tracking-wide text-parish-500">Painel paroquial</p>
            <p className="font-semibold text-parish-900">
              {admin ? `Olá, ${admin.name}` : "Acesso restrito"}
            </p>
          </div>
          {admin ? (
            <nav className="flex flex-wrap gap-1 text-sm">
              {links.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-1.5 hover:bg-parish-50"
                >
                  {item.label}
                </Link>
              ))}
              <AdminLogoutButton />
            </nav>
          ) : null}
        </div>
        <AdminFlashBanner />
        {children}
      </div>
    </div>
  );
}
