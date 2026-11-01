import { syncSaintCatalogToDb } from "../src/lib/saints-catalog";
import { prisma } from "../src/lib/prisma";

async function main() {
  const before = await prisma.saint.count();
  const synced = await syncSaintCatalogToDb();
  const after = await prisma.saint.count();
  console.log(`Santos no banco: ${before} → ${after} (catálogo JSON: ${synced})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
