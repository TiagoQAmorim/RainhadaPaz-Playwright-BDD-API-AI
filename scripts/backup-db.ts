import { PrismaClient } from "@prisma/client";
import { runDatabaseBackup } from "../src/lib/db-backup";

const site = process.env.BACKUP_URL?.replace(/\/$/, "");
const secret = process.env.AUTH_SECRET?.trim();

async function main() {
  if (site && secret) {
    const res = await fetch(`${site}/api/setup/backup`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
    });
    const body = await res.text();
    console.log(res.status, body);
    process.exit(res.ok ? 0 : 1);
  }

  const prisma = new PrismaClient();
  try {
    const r = await runDatabaseBackup(prisma);
    console.log("[backup]", JSON.stringify(r, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});