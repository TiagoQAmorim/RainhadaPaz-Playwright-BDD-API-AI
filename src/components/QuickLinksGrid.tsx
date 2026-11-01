import Image from "next/image";
import Link from "next/link";
import { QUICK_LINKS } from "@/lib/wordpress-assets";

import { cn } from "@/lib/cn";

export function QuickLinksGrid({ className }: { className?: string }) {
  return (
    <section
      className={cn("relative z-10 border-b border-parish-100 bg-white py-10 md:py-14", className)}
    >
      <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_LINKS.map((item) => {
          const inner = (
            <>
              <div className="relative h-36 overflow-hidden sm:h-40">
                <Image
                  src={item.image}
                  alt=""
                  fill
                  className="object-cover transition duration-500 group-hover:scale-110"
                  sizes="(max-width:768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-parish-600/90 via-parish-500/45 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-white/80">{item.description}</p>
              </div>
            </>
          );

          const className =
            "group relative overflow-hidden rounded-2xl bg-parish-600 shadow-lg shadow-parish-600/20 ring-1 ring-parish-300/80 transition hover:-translate-y-0.5 hover:bg-parish-500 hover:shadow-xl";

          if ("external" in item && item.external) {
            return (
              <a
                key={item.title}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className={className}
              >
                {inner}
              </a>
            );
          }

          return (
            <Link key={item.title} href={item.href} className={className}>
              {inner}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
