"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";

const links = [
  { href: "/institucional", label: "Institucional" },
  { href: "/horarios", label: "Horários" },
  { href: "/sacramentos", label: "Sacramentos" },
  { href: "/noticias", label: "Notícias" },
  { href: "/avisos", label: "Avisos" },
  { href: "/velas", label: "Velas" },
  { href: "/rifas", label: "Rifas" },
  { href: "/contato", label: "Contato" },
];

type Props = {
  parishName: string;
  logoUrl?: string | null;
};

export function SiteHeader({ parishName }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/20 bg-parish-600/90 backdrop-blur-xl transition">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 md:h-16">
        <Link
          href="/"
          title="Página inicial"
          aria-label={`Ir para a página inicial — ${parishName}`}
          prefetch
          className="group flex min-w-0 max-w-[min(100%,14rem)] shrink-0 items-center rounded-md py-1 sm:max-w-xs md:max-w-sm lg:max-w-md"
          onClick={(e) => {
            if (pathname === "/") {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
        >
          <span className="line-clamp-2 cursor-pointer text-sm font-semibold leading-tight tracking-tight text-white transition group-hover:text-gold-200 sm:text-base">
            {parishName}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/85 hover:bg-white/10 hover:text-white",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/terco-online"
            className="ml-2 inline-flex items-center rounded-full bg-gold-500 px-4 py-2 text-sm font-bold text-parish-950 transition hover:bg-gold-400"
          >
            Terço online
          </Link>
        </nav>

        <button
          type="button"
          className="rounded-lg px-3 py-2 text-sm font-semibold text-white lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          Menu
        </button>
      </div>

      {open ? (
        <nav className="border-t border-white/10 px-2 py-3 lg:hidden">
          <ul className="grid gap-1">
            <li>
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3 py-2.5 text-sm font-medium text-white hover:bg-white/10"
              >
                Início
              </Link>
            </li>
            {links.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block rounded-xl px-3 py-2.5 text-sm font-medium",
                      active
                        ? "bg-white/15 text-white"
                        : "text-white hover:bg-white/10",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li className="px-3 pt-2">
              <Link
                href="/terco-online"
                className="inline-flex w-full justify-center rounded-full bg-gold-500 px-4 py-2.5 text-sm font-bold text-parish-950"
                onClick={() => setOpen(false)}
              >
                Terço online
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
