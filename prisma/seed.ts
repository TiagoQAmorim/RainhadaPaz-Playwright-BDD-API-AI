import { PrismaClient } from "@prisma/client";

import bcrypt from "bcryptjs";

import { PAROCHIAL } from "../src/lib/parish-social";

import { getWpImportedPages } from "../src/lib/wp-content";

import {

  MASS_SCHEDULE_HTML,

  WP_IMAGES,

} from "../src/lib/wordpress-assets";

import { syncSaintCatalogToDb } from "../src/lib/saints-catalog";



const prisma = new PrismaClient();



const wpPages = getWpImportedPages();

const matriz = wpPages.find((p) => p.slug === "matriz-paroquial");

const padroeira = wpPages.find((p) => p.slug === "padroeira");



const settingsData = {

  parishName: "Paróquia Nossa Senhora Rainha da Paz",

  diocese: "Diocese de Santo Amaro",

  address: "R. Sócrates, 813 — Vila Sofia, São Paulo — SP, CEP 04671-072",

  phone: "(11) 5524-5657",

  email: "contato@paroquiarainhadapaz.com.br",

  heroTitle: "Unidos pela fé, guiados por Maria.",

  heroSubtitle: "Uma comunidade que acolhe, celebra e vive o amor de Cristo.",

  aboutHtml:

    matriz?.body ??

    `<p>A Paróquia Nossa Senhora Rainha da Paz é um lugar de encontro com Cristo e com a comunidade.</p>

<p>Nosso pároco é o <strong>${PAROCHIAL.priestName}</strong>. Acompanhe novidades pastorais no Instagram <a href="${PAROCHIAL.priestInstagram}" target="_blank" rel="noreferrer">${PAROCHIAL.priestInstagramHandle}</a>.</p>`,

  massScheduleHtml: MASS_SCHEDULE_HTML,

  logoUrl: "/logo-rainha-da-paz.png",

  heroImageUrl: matriz?.featuredImage ?? WP_IMAGES.heroChurchWide,

  matrizImageUrl: matriz?.featuredImage ?? WP_IMAGES.matriz,

  capelaImageUrl:

    wpPages.find((p) => p.slug === "capela-santa-maria")?.featuredImage ??

    WP_IMAGES.capela,

  youtubeChannelUrl: null,

  facebookUrl: "https://www.facebook.com/paroquiarainhadapaz",

  youtubeUrl: null,

  instagramUrl: PAROCHIAL.priestInstagram,

  tercoOnlineSchedule: "Segunda a sexta, 19h30",

  tercoOnlineLink:
    "https://zoom.us/j/731786592?pwd=YWdzSzRBVGI5TXdzL1UvZkNxSmh6Zz09",

};



async function main() {

  const email = process.env.ADMIN_EMAIL ?? "admin@paroquiarainhadapaz.com.br";

  const password = process.env.ADMIN_PASSWORD ?? "AltereEstaSenha123!";

  const hash = await bcrypt.hash(password, 12);



  await prisma.admin.upsert({

    where: { email },

    update: {},

    create: {

      email,

      passwordHash: hash,

      name: "Administrador Paroquial",

    },

  });



  await prisma.siteSettings.upsert({

    where: { id: 1 },

    update: settingsData,

    create: { id: 1, ...settingsData },

  });

  const saintCount = await syncSaintCatalogToDb();
  console.log(`Santos no catálogo: ${saintCount}`);

  const tercoSlotCount = await prisma.tercoOnlineSlot.count();
  if (tercoSlotCount === 0) {
    await prisma.tercoOnlineSlot.createMany({
      data: [
        {
          title: "Terço online",
          scheduleText: "Segunda, terça e quarta — 19h30",
          meetingUrl:
            "https://zoom.us/j/731786592?pwd=YWdzSzRBVGI5TXdzL1UvZkNxSmh6Zz09",
          sortOrder: 0,
        },
        {
          title: "Terço online",
          scheduleText: "Quinta e sexta — 19h30",
          meetingUrl: "https://meet.google.com/ova-mhdw-rdh",
          sortOrder: 1,
        },
      ],
    });
  }

  for (const page of wpPages) {

    let body = page.body;

    if (page.slug === "paroco") {

      body = `${body}\n<p><strong>${PAROCHIAL.priestName}</strong> — pároco atual. Instagram: <a href="${PAROCHIAL.priestInstagram}" target="_blank" rel="noreferrer">${PAROCHIAL.priestInstagramHandle}</a>.</p>`;

    }

    await prisma.page.upsert({

      where: { slug: page.slug },

      update: { title: page.title, body },

      create: { slug: page.slug, title: page.title, body },

    });

  }



  if (padroeira && !wpPages.some((p) => p.slug === "padroeira")) {

    /* covered in loop */

  }



  const posts = [

    {

      title: "Horários de missa — Matriz e Capela",

      slug: "horarios-missa-matriz-capela",

      excerpt: "Confira celebrações na R. Sócrates e na Capela Santa Maria.",

      body: `<p>Veja a página de <a href="/horarios">horários</a> para a programação completa das celebrações na Matriz e na Capela.</p>`,

      coverImage: WP_IMAGES.matriz,

    },

  ];



  for (const post of posts) {

    await prisma.post.upsert({

      where: { slug: post.slug },

      update: {

        title: post.title,

        excerpt: post.excerpt,

        body: post.body,

        coverImage: post.coverImage,

        published: true,

        publishedAt: new Date(),

      },

      create: {

        ...post,

        published: true,

        publishedAt: new Date(),

      },

    });

  }



  const massLocations = [

    {

      name: "Matriz Paroquial",

      address: "R. Sócrates, 813 — Vila Sofia, São Paulo — SP, CEP 04671-072",

      scheduleText: `Quinta-feira: 19h

Sábado: 16h

Domingo: 12h e 20h

1ª sexta do mês: 15h — Missa ao Sagrado Coração de Jesus`,

      sortOrder: 0,

    },

    {

      name: "Capela do Colégio Santa Maria",

      address: "Colégio Santa Maria — consulte a secretaria paroquial para o endereço de acesso",

      scheduleText: "Domingo: 8h e 10h",

      sortOrder: 1,

    },

  ];



  for (const loc of massLocations) {

    const existing = await prisma.massLocation.findFirst({

      where: { name: loc.name },

    });

    if (existing) {

      await prisma.massLocation.update({

        where: { id: existing.id },

        data: { ...loc, published: true },

      });

    } else {

      await prisma.massLocation.create({

        data: { ...loc, published: true },

      });

    }

  }



  await prisma.notice.upsert({

    where: { id: "seed-welcome-notice" },

    update: {},

    create: {

      id: "seed-welcome-notice",

      title: "Conteúdo migrado do site paroquial",

      body: "<p>Textos e imagens principais foram importados de paroquiarainhadapaz.com.br. Ajustes finos podem ser feitos no painel admin.</p>",

      published: true,

      publishedAt: new Date(),

    },

  });

}



main()

  .then(() => prisma.$disconnect())

  .catch(async (e) => {

    console.error(e);

    await prisma.$disconnect();

    process.exit(1);

  });

