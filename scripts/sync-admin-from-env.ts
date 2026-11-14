/**
 * Mantém o admin alinhado a ADMIN_EMAIL / ADMIN_PASSWORD (Railway ou .env).
 * Roda no boot — assim a senha nas Variables vira a senha de login.
 */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim() || "admin@paroquiarainhadapaz.com.br";
  const password = process.env.ADMIN_PASSWORD;
  if (!password?.trim()) {
    console.log("[sync-admin] ADMIN_PASSWORD não definido — admin não alterado");
    return;
  }

  const passwordHash = await bcrypt.hash(password.trim(), 12);
  await prisma.admin.upsert({
    where: { email },
    update: { passwordHash, name: "Administrador Paroquial" },
    create: {
      email,
      passwordHash,
      name: "Administrador Paroquial",
    },
  });
  console.log(`[sync-admin] Senha do admin (${email}) sincronizada com ADMIN_PASSWORD`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });