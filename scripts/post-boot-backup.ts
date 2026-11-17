import { PrismaClient } from "@prisma/client";
import { runDatabaseBackup } from "../src/lib/db-backup";

const prisma = new PrismaClient();
try {
  const pages = await prisma.page.count();
  if (pages === 0) {
    console.log("[post-boot-backup] Banco vazio — backup ignorado.");
    process.exit(0);
  }
  const r = await runDatabaseBackup(prisma);
  console.log("[post-boot-backup]", r.backupFile, r.counts);
} finally {
  await prisma.$disconnect();
}