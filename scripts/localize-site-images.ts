/**
 * Baixa imagens do WordPress antigo e atualiza banco + wp-pages.json para caminhos locais.
 * Uso: npx tsx scripts/localize-site-images.ts
 */
import { PrismaClient } from "@prisma/client";
import { mkdir, writeFile, access } from "fs/promises";
import { constants, readFileSync, writeFileSync } from "fs";
import path from "path";
import { localizeImageField, localizeParishImagesInHtml } from "../src/lib/mirror-image";

const prisma = new PrismaClient();

const PARISH_DIR = path.join(process.cwd(), "public", "images", "parish");

/** Atalhos padrão do site — arquivos estáveis em /images/parish */
const PARISH_DEFAULTS: { file: string; url: string }[] = [
  {
    file: "hero-church-960.jpg",
    url: "https://paroquiarainhadapaz.com.br/wp-content/uploads/2020/06/DSC_7515-960x350.jpg",
  },
  {
    file: "hero-church-wide.jpg",
    url: "https://paroquiarainhadapaz.com.br/wp-content/uploads/2020/06/DSC_7515-2048x495.jpg",
  },
  {
    file: "matriz-600.png",
    url: "https://paroquiarainhadapaz.com.br/wp-content/uploads/2020/06/Matriz-600x400.png",
  },
  {
    file: "capela-600.png",
    url: "https://paroquiarainhadapaz.com.br/wp-content/uploads/2019/02/Capela-600x400.png",
  },
  {
    file: "terco-online-600.png",
    url: "https://paroquiarainhadapaz.com.br/wp-content/uploads/2021/05/Terco-Online-600x400.png",
  },
  {
    file: "batismo-600.png",
    url: "https://paroquiarainhadapaz.com.br/wp-content/uploads/2020/01/Curso-de-Batismo-600x400.png",
  },
];

async function fileOk(p: string) {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function downloadTo(fileName: string, url: string): Promise<string> {
  await mkdir(PARISH_DIR, { recursive: true });
  const full = path.join(PARISH_DIR, fileName);
  if (await fileOk(full)) return `/images/parish/${fileName}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(full, buf);
  return `/images/parish/${fileName}`;
}

async function migrateWpPagesJson() {
  const jsonPath = path.join(process.cwd(), "src", "data", "wp-pages.json");
  const raw = readFileSync(jsonPath, "utf8");
  const data = JSON.parse(raw) as {
    pages: { slug: string; title: string; body: string; featuredImage?: string }[];
  };
  for (const page of data.pages) {
    if (page.featuredImage) {
      page.featuredImage = (await localizeImageField(page.featuredImage)) ?? undefined;
    }
    page.body = await localizeParishImagesInHtml(page.body);
  }
  writeFileSync(jsonPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log("wp-pages.json atualizado.");
}

async function migrateDatabase() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  if (settings) {
    await prisma.siteSettings.update({
      where: { id: 1 },
      data: {
        logoUrl: await localizeImageField(settings.logoUrl),
        heroImageUrl: await localizeImageField(settings.heroImageUrl),
        heroImageUrl2: await localizeImageField(settings.heroImageUrl2),
        heroImageUrl3: await localizeImageField(settings.heroImageUrl3),
        matrizImageUrl: await localizeImageField(settings.matrizImageUrl),
        capelaImageUrl: await localizeImageField(settings.capelaImageUrl),
        aboutHtml: await localizeParishImagesInHtml(settings.aboutHtml),
        massScheduleHtml: await localizeParishImagesInHtml(settings.massScheduleHtml),
      },
    });
  }

  for (const page of await prisma.page.findMany()) {
    await prisma.page.update({
      where: { id: page.id },
      data: {
        body: await localizeParishImagesInHtml(page.body),
        featuredImage: await localizeImageField(page.featuredImage),
      },
    });
  }

  for (const post of await prisma.post.findMany()) {
    await prisma.post.update({
      where: { id: post.id },
      data: {
        body: await localizeParishImagesInHtml(post.body),
        coverImage: await localizeImageField(post.coverImage),
      },
    });
    for (const img of await prisma.postGalleryImage.findMany({ where: { postId: post.id } })) {
      const imageUrl = await localizeImageField(img.imageUrl);
      if (imageUrl && imageUrl !== img.imageUrl) {
        await prisma.postGalleryImage.update({ where: { id: img.id }, data: { imageUrl } });
      }
    }
  }

  for (const notice of await prisma.notice.findMany()) {
    await prisma.notice.update({
      where: { id: notice.id },
      data: {
        body: await localizeParishImagesInHtml(notice.body),
        coverImage: await localizeImageField(notice.coverImage),
      },
    });
  }

  for (const link of await prisma.homeQuickLink.findMany()) {
    const imageUrl = await localizeImageField(link.imageUrl);
    if (imageUrl) {
      await prisma.homeQuickLink.update({ where: { id: link.id }, data: { imageUrl } });
    }
  }

  for (const raffle of await prisma.raffle.findMany()) {
    await prisma.raffle.update({
      where: { id: raffle.id },
      data: {
        coverImageUrl: await localizeImageField(raffle.coverImageUrl),
        prizeImageUrl: await localizeImageField(raffle.prizeImageUrl),
        description: await localizeParishImagesInHtml(raffle.description),
      },
    });
  }

  console.log("Banco SQLite atualizado.");
}

async function main() {
  console.log("Baixando imagens padrão em /public/images/parish …");
  for (const item of PARISH_DEFAULTS) {
    const local = await downloadTo(item.file, item.url);
    console.log(`  ${item.file} → ${local}`);
  }
  await migrateWpPagesJson();
  await migrateDatabase();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());