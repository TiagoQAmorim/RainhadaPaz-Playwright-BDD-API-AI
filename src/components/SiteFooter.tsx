import Link from "next/link";
import { ParishLogo } from "@/components/ParishLogo";

type Props = {
  parishName: string;
  diocese: string;
  address: string;
  phone: string;
  facebookUrl?: string | null;
  youtubeUrl?: string | null;
  instagramUrl?: string | null;
  logoUrl?: string | null;
};

export function SiteFooter({
  parishName,
  diocese,
  address,
  phone,
  facebookUrl,
  youtubeUrl,
  instagramUrl,
  logoUrl,
}: Props) {
  return (
    <footer className="mt-20 border-t border-parish-500 bg-parish-600 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-12">
        <div className="md:col-span-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
            {logoUrl ? (
              <ParishLogo src={logoUrl} alt={parishName} variant="footer" />
            ) : null}
            <div>
              <p className="font-[family-name:var(--font-display)] text-xl font-semibold text-white">
                {parishName}
              </p>
              <p className="text-sm text-parish-200/80">{diocese}</p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-parish-200/85">{address}</p>
        </div>

        <div className="md:col-span-3">
          <p className="text-xs font-bold uppercase tracking-widest text-gold-400">Navegação</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/horarios" className="hover:text-gold-300">Horários</Link></li>
            <li><Link href="/terco-online" className="hover:text-gold-300">Terço online</Link></li>
            <li><Link href="/velas" className="hover:text-gold-300">Vela virtual</Link></li>
            <li><Link href="/rifas" className="hover:text-gold-300">Rifas dos Santos</Link></li>
            <li><Link href="/sacramentos" className="hover:text-gold-300">Sacramentos</Link></li>
            <li><Link href="/admin/login" className="text-parish-400 hover:text-parish-200">Área admin</Link></li>
          </ul>
        </div>

        <div className="md:col-span-3">
          <p className="text-xs font-bold uppercase tracking-widest text-gold-400">Contato</p>
          <ul className="mt-4 space-y-2 text-sm">
            {phone ? (
              <li>
                <a href={`tel:${phone.replace(/\D/g, "")}`} className="hover:text-gold-300">
                  {phone}
                </a>
              </li>
            ) : null}
            {instagramUrl ? (
              <li>
                <a href={instagramUrl} target="_blank" rel="noreferrer" className="hover:text-gold-300">
                  Instagram
                </a>
              </li>
            ) : null}
            {youtubeUrl ? (
              <li>
                <a href={youtubeUrl} target="_blank" rel="noreferrer" className="hover:text-gold-300">
                  YouTube — Missas
                </a>
              </li>
            ) : null}
            {facebookUrl ? (
              <li>
                <a href={facebookUrl} target="_blank" rel="noreferrer" className="hover:text-gold-300">
                  Facebook
                </a>
              </li>
            ) : null}
          </ul>
        </div>

        <div className="md:col-span-2">
          <p className="text-xs font-bold uppercase tracking-widest text-gold-400">Oferta</p>
          <p className="mt-4 text-sm text-parish-200/85">
            Sustente a paróquia pelo dízimo ou acenda uma vela virtual com sua intenção.
          </p>
          <Link
            href="/velas"
            className="mt-4 inline-block rounded-full bg-gold-500 px-4 py-2 text-xs font-bold text-parish-950"
          >
            Vela virtual
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-parish-400">
        © {new Date().getFullYear()} {parishName}
      </div>
    </footer>
  );
}
