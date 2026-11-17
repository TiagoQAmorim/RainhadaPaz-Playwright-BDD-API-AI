import { PrismaClient } from "@prisma/client";
import { runDatabaseBackup } from "../src/lib/db-backup";

const prisma = new PrismaClient();

async function main() {
  const pages = await prisma.page.count();
  if (pages === 0) {
    console.log("[post-boot-backup] Banco vazio — backup ignorado.");
    return;
  }
  const r = await runDatabaseBackup(prisma);
  console.log("[post-boot-backup]", r.backupFile, r.counts);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });