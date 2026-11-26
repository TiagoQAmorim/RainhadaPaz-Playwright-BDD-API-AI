"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const MOBILE_NAV_TOGGLE_ID = "site-mobile-nav-toggle";

function closeMobileNav() {
  const el = document.getElementById(MOBILE_NAV_TOGGLE_ID) as HTMLInputElement | null;
  if (el) el.checked = false;
}

const links = [
  { href: "/institucional", label: "Institucional" },
  { href: "/mapa-de-paroquias", label: "Mapa" },
  { href: "/horarios", label: "Horários" },
  { href: "/sacramentos", label: "Sacramentos" },
  { href: "/noticias", label: "Notícias" },
  { href: "/avisos", label: "Avisos" },
  { href: "/velas", label: "Velas" },
  { href: "/rifas", label: "Rifas" },
  { href: "/doacoes", label: "Doações" },
  { href: "/contato", label: "Contato" },
];

type Props = {
  parishName: string;
  logoUrl?: string | null;
  /** false = só nome da paróquia (ex.: painel admin), sem links do site. */
  showNav?: boolean;
  /** Endereços de páginas ocultas no admin, para não deixar o menu apontando para elas. */
  hiddenHrefs?: string[];
};

export function SiteHeader({ parishName, showNav = true, hiddenHrefs = [] }: Props) {
  const pathname = usePathname();
  const hidden = new Set(hiddenHrefs);
  const navLinks = links.filter((item) => !hidden.has(item.href));
  const showTerco = !hidden.has("/terco-online");

  if (!showNav) {
    return (
      <header className="sticky top-0 z-50 border-b border-white/20 bg-parish-600/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 md:h-16">
          <p className="min-w-0 line-clamp-2 text-sm font-semibold leading-tight text-white sm:text-base">
            {parishName}
          </p>
          <Link
            href="/"
            prefetch={false}
            className="inline-flex shrink-0 items-center rounded-full bg-gold-500 px-4 py-2 text-sm font-bold text-parish-950 transition hover:bg-gold-400"
          >
            Ir para o site
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/20 bg-parish-600/90 backdrop-blur-xl transition">
      <input
        id={MOBILE_NAV_TOGGLE_ID}
        type="checkbox"
        className="peer sr-only lg:hidden"
        aria-hidden
      />
      <label
        htmlFor={MOBILE_NAV_TOGGLE_ID}
        aria-hidden
        className="absolute inset-x-0 top-full z-40 hidden h-[100dvh] bg-black/60 max-lg:peer-checked:block"
      />
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 md:h-16">
        <Link
          href="/"
          title="Página inicial"
          aria-label={`Ir para a página inicial — ${parishName}`}
          prefetch
          className="group flex min-w-0 flex-1 items-center rounded-md py-1 sm:max-w-xs md:max-w-sm lg:max-w-md"
          onClick={(e) => {
            if (pathname === "/") {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
        >
          <span className="line-clamp-2 cursor-pointer text-balance text-sm font-semibold leading-tight tracking-tight text-white transition group-hover:text-gold-200 sm:text-base">
            {parishName}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const className = cn(
                "rounded-full px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-white/15 text-white"
                  : "text-white/85 hover:bg-white/10 hover:text-white",
              );
              if (item.href === "/mapa-de-paroquias") {
                return (
                  <a key={item.href} href={item.href} className={className}>
                    {item.label}
                  </a>
                );
              }
              return (
                <Link key={item.href} href={item.href} className={className}>
                  {item.label}
                </Link>
              );
          })}
          {showTerco ? (
            <Link
              href="/terco-online"
              className="ml-2 inline-flex items-center rounded-full bg-gold-500 px-4 py-2 text-sm font-bold text-parish-950 transition hover:bg-gold-400"
            >
              Terço online
            </Link>
          ) : null}
        </nav>

        <label
          htmlFor={MOBILE_NAV_TOGGLE_ID}
          className="cursor-pointer select-none rounded-lg px-3 py-2 text-sm font-semibold text-white lg:hidden"
        >
          Menu
        </label>
      </div>

      <nav
        aria-label="Navegação principal"
        className="hidden border-t border-white/10 px-2 py-3 peer-checked:block lg:hidden"
      >
        <ul className="grid gap-1">
          <li>
            <Link
              href="/"
              onClick={closeMobileNav}
              className="block rounded-xl px-3 py-2.5 text-sm font-medium text-white hover:bg-white/10"
            >
              Início
            </Link>
          </li>
          {navLinks.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
const className = cn(
                  "block rounded-xl px-3 py-2.5 text-sm font-medium",
                  active ? "bg-white/15 text-white" : "text-white hover:bg-white/10",
                );
              if (item.href === "/mapa-de-paroquias") {
                return (
                  <li key={item.href}>
                    <a href={item.href} onClick={closeMobileNav} className={className}>
                      {item.label}
                    </a>
                  </li>
                );
              }
              return (
                <li key={item.href}>
                  <Link href={item.href} onClick={closeMobileNav} className={className}>
                    {item.label}
                  </Link>
                </li>
              );
          })}
          {showTerco ? (
            <li className="px-3 pt-2">
              <Link
                href="/terco-online"
                className="inline-flex w-full justify-center rounded-full bg-gold-500 px-4 py-2.5 text-sm font-bold text-parish-950"
                onClick={closeMobileNav}
              >
                Terço online
              </Link>
            </li>
          ) : null}
        </ul>
      </nav>
    </header>
  );
}
