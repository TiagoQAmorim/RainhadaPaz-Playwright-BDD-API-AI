import bcrypt from "bcryptjs";
import type { PrismaClient } from "@prisma/client";

export function normalizeAdminEmail(email: string | undefined): string {
  return (email?.trim() || "admin@paroquiarainhadapaz.com.br").toLowerCase();
}

export function adminPasswordFromEnv(): string | null {
  const p = process.env.ADMIN_PASSWORD?.trim();
  return p || null;
}

export async function syncAdminFromEnv(prisma: PrismaClient): Promise<string | null> {
  const email = normalizeAdminEmail(process.env.ADMIN_EMAIL);
  const password = adminPasswordFromEnv();
  if (!password) return null;

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.admin.upsert({
    where: { email },
    update: { passwordHash, name: "Administrador Paroquial" },
    create: {
      email,
      passwordHash,
      name: "Administrador Paroquial",
    },
  });
  return email;
}

/** Acha admin mesmo se o e-mail no banco não estiver em minúsculas. */
export async function findAdminByEmail(prisma: PrismaClient, email: string) {
  const normalized = email.trim().toLowerCase();
  const direct = await prisma.admin.findUnique({ where: { email: normalized } });
  if (direct) return direct;
  const admins = await prisma.admin.findMany({ take: 20 });
  return admins.find((a) => a.email.trim().toLowerCase() === normalized) ?? null;
}