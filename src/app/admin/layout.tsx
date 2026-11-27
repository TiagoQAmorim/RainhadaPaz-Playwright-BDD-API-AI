import Link from "next/link";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { AdminFlashBanner } from "@/components/admin/AdminFlashBanner";
import { SiteHeader } from "@/components/SiteHeader";
import { TopBar } from "@/components/TopBar";
import { headers } from "next/headers";
import { getSessionAdmin } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const links = [
  { href: "/admin", label: "Início" },
  { href: "/admin/noticias", label: "Notícias" },
  { href: "/admin/avisos", label: "Avisos" },
  { href: "/admin/horarios", label: "Horários" },
  { href: "/admin/informacoes", label: "Informações" },
  { href: "/admin/manutencao", label: "Manutenção" },
  { href: "/admin/terco-online", label: "Terço online" },
  { href: "/admin/velas", label: "Velas" },
  { href: "/admin/rifas", label: "Rifas" },
  { href: "/admin/obra", label: "Obra" },
  { href: "/admin/usuarios", label: "Administradores" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "";
  const flash = new URLSearchParams(h.get("x-search")?.replace(/^\?/, "") ?? "").get("flash");
  const isLogin = pathname === "/admin/login";

  if (isLogin) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center bg-parish-100 px-4 py-12">
        {children}
      </div>
    );
  }

  const [admin, settings] = await Promise.all([getSessionAdmin(), getSiteSettings()]);

  return (
    <>
      <TopBar address={settings.address} phone={settings.phone} />
      <SiteHeader parishName={settings.parishName} logoUrl={settings.logoUrl} showNav={false} />
      <div className="flex-1 bg-parish-100 px-4 py-6">
        <div className="mx-auto max-w-6xl">
          <div
            data-admin-nav
            className="mb-6 flex flex-col gap-4 rounded-2xl border border-parish-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-parish-500">
                Área administrativa
              </p>
              <p className="mt-0.5 font-semibold text-parish-900">
                {admin ? `Olá, ${admin.name}` : "Login do painel"}
              </p>
            </div>
            {admin ? (
              <nav
                className="flex max-w-full flex-wrap gap-1 text-sm"
                aria-label="Menu do painel"
              >
                {links.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-lg px-3 py-1.5 font-medium text-parish-800 hover:bg-parish-50"
                  >
                    {item.label}
                  </Link>
                ))}
                <AdminLogoutButton />
              </nav>
            ) : null}
          </div>
          <AdminFlashBanner kind={flash} />
          {children}
        </div>
      </div>
    </>
  );
}
