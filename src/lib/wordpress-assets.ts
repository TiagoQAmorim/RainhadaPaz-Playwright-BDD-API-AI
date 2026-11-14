import { PARISH_LOGO_PATH } from "@/lib/parish-brand";
import { PAROCHIAL } from "@/lib/parish-social";

/** Imagens padrão servidas pelo próprio site (`public/images/parish`). */
export const SITE_IMAGES = {
  logo: PARISH_LOGO_PATH,
  heroChurch: "/images/parish/hero-church-960.jpg",
  heroChurchWide: "/images/parish/hero-church-wide.jpg",
  matriz: "/images/parish/matriz-600.png",
  capela: "/images/parish/capela-600.png",
  tercoOnline: "/images/parish/terco-online-600.png",
  batismo: "/images/parish/batismo-600.png",
} as const;

/** @deprecated Use `SITE_IMAGES`. Mantido para imports antigos. */
export const WP_IMAGES = SITE_IMAGES;

export const QUICK_LINKS = [
  {
    title: "Horários de missa",
    description: "Matriz e Capela Santa Maria",
    href: "/horarios",
    image: SITE_IMAGES.matriz,
  },
  {
    title: "Vela virtual",
    description: "Intenção, oração e luz de fé",
    href: "/velas",
    image: SITE_IMAGES.heroChurch,
  },
  {
    title: "Terço online",
    description: "Segunda a sexta, 19h30",
    href: "/terco-online",
    image: SITE_IMAGES.tercoOnline,
  },
  {
    title: "Dízimo",
    description: "Sustente a missão paroquial",
    href: "/sacramentos/dizimo",
    image: SITE_IMAGES.heroChurch,
  },
  {
    title: "Batismo",
    description: "Curso e agendamento",
    href: "/sacramentos/batizado",
    image: SITE_IMAGES.batismo,
  },
  {
    title: PAROCHIAL.priestName,
    description: `Instagram ${PAROCHIAL.priestInstagramHandle}`,
    href: PAROCHIAL.priestInstagram,
    external: true,
    image: SITE_IMAGES.capela,
  },
] as const;

export const MASS_SCHEDULE_HTML = `<div class="space-y-6">
<section>
<h3>Matriz — R. Sócrates, 813</h3>
<ul>
<li><strong>Quinta-feira:</strong> 19h</li>
<li><strong>Sábado:</strong> 16h</li>
<li><strong>Domingo:</strong> 12h e 20h</li>
<li><strong>1ª sexta do mês:</strong> 15h — Missa ao Sagrado Coração de Jesus</li>
</ul>
</section>
<section>
<h3>Capela do Colégio Santa Maria</h3>
<ul>
<li><strong>Domingo:</strong> 8h e 10h</li>
</ul>
</section>
<p class="text-sm opacity-80">Acompanhe avisos e pastorais no Instagram do pároco, <a href="${PAROCHIAL.priestInstagram}" target="_blank" rel="noreferrer">${PAROCHIAL.priestInstagramHandle}</a>.</p>
</div>`;