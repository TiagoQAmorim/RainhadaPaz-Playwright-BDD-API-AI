import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const settings = await prisma.siteSettings.findFirst({
  select: {
    heroImageUrl: true,
    heroImageUrl2: true,
    heroImageUrl3: true,
    matrizImageUrl: true,
    aboutBannerUrl: true,
  },
});
console.log(JSON.stringify(settings, null, 2));
await prisma.$disconnect();

const html = await (await fetch("https://www.paroquiarainhadapaz.com.br/")).text();
const imgs = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((match) => match[1]);
console.log("prod_imgs");
for (const src of imgs.slice(0, 8)) console.log(src);
