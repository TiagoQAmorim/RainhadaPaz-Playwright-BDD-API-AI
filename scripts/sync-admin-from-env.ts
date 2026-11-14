import { PrismaClient } from "@prisma/client";
import { normalizeAdminEmail, syncAdminFromEnv } from "../src/lib/admin-credentials";

const prisma = new PrismaClient();

async function main() {
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!password) {
    console.log("[sync-admin] ADMIN_PASSWORD não definido — admin não alterado");
    return;
  }

  const email = await syncAdminFromEnv(prisma);
  if (email) {
    console.log(`[sync-admin] Admin ${email} sincronizado com ADMIN_PASSWORD`);
  }

  const expected = normalizeAdminEmail(process.env.ADMIN_EMAIL);
  const admins = await prisma.admin.findMany();
  for (const a of admins) {
    const low = a.email.trim().toLowerCase();
    if (low !== a.email) {
      const clash = admins.some((o) => o.id !== a.id && o.email.toLowerCase() === low);
      if (!clash && low === expected) {
        await prisma.admin.update({ where: { id: a.id }, data: { email: low } });
        console.log(`[sync-admin] E-mail normalizado: ${low}`);
      }
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });