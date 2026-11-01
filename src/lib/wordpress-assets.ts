import { PAROCHIAL } from "@/lib/parish-social";

/** Imagens e atalhos espelhados do site WordPress original (wp-content). */
export const WP_IMAGES = {  logo: "https://paroquiarainhadapaz.com.br/wp-content/uploads/2019/01/Logo.png",
  heroChurch:
    "https://paroquiarainhadapaz.com.br/wp-content/uploads/2020/06/DSC_7515-960x350.jpg",
  heroChurchWide:
    "https://paroquiarainhadapaz.com.br/wp-content/uploads/2020/06/DSC_7515-2048x495.jpg",
  matriz: "https://paroquiarainhadapaz.com.br/wp-content/uploads/2020/06/Matriz-600x400.png",
  capela:
    "https://paroquiarainhadapaz.com.br/wp-content/uploads/2019/02/Capela-600x400.png",
  tercoOnline:
    "https://paroquiarainhadapaz.com.br/wp-content/uploads/2021/05/Terco-Online-600x400.png",
  batismo:
    "https://paroquiarainhadapaz.com.br/wp-content/uploads/2020/01/Curso-de-Batismo-600x400.png",
} as const;

export const QUICK_LINKS = [
  {
    title: "Horários de missa",
    description: "Matriz e Capela Santa Maria",
    href: "/horarios",
    image: WP_IMAGES.matriz,
  },
  {
    title: "Vela virtual",
    description: "Intenção, oração e luz de fé",
    href: "/velas",
    image: WP_IMAGES.heroChurch,
  },
  {
    title: "Terço online",
    description: "Segunda a sexta, 19h30",
    href: "/terco-online",
    image: WP_IMAGES.tercoOnline,
  },
  {
    title: "Dízimo",
    description: "Sustente a missão paroquial",
    href: "/sacramentos/dizimo",
    image: WP_IMAGES.heroChurch,
  },
  {
    title: "Batismo",
    description: "Curso e agendamento",
    href: "/sacramentos/batizado",
    image: WP_IMAGES.batismo,
  },
  {
    title: PAROCHIAL.priestName,
    description: `Instagram ${PAROCHIAL.priestInstagramHandle}`,
    href: PAROCHIAL.priestInstagram,
    external: true,
    image: WP_IMAGES.capela,
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
