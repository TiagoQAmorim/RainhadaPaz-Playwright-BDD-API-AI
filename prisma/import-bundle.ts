import { PrismaClient } from "@prisma/client";
import { importSiteBundle } from "../src/lib/import-site-bundle";

const prisma = new PrismaClient();

async function main() {
  await importSiteBundle(prisma);
  console.log("[import-bundle] Conteúdo completo aplicado (rifas, velas, posts, imagens no HTML).");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });