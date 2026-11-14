import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { normalizeAdminEmail, syncAdminFromEnv } from "@/lib/admin-credentials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Redefine login do admin (produção).
 * POST + Authorization: Bearer AUTH_SECRET
 * Body opcional: { "email": "...", "password": "..." } — senão usa ADMIN_* das Variables.
 */
export async function POST(req: Request) {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret || secret.length < 32) {
    return NextResponse.json({ error: "AUTH_SECRET inválido no servidor" }, { status: 500 });
  }

  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (token !== secret) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let bodyEmail: string | undefined;
  let bodyPassword: string | undefined;
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    bodyEmail = body.email;
    bodyPassword = body.password;
  } catch {
    /* body vazio = só env */
  }

  const email = normalizeAdminEmail(bodyEmail ?? process.env.ADMIN_EMAIL);
  const password = (bodyPassword ?? process.env.ADMIN_PASSWORD)?.trim();
  if (!password) {
    return NextResponse.json(
      { error: "Defina password no body ou ADMIN_PASSWORD nas Variables" },
      { status: 400 },
    );
  }

  const prisma = new PrismaClient();
  try {
    if (!bodyEmail && !bodyPassword) {
      await syncAdminFromEnv(prisma);
    } else {
      const passwordHash = await bcrypt.hash(password, 12);
      await prisma.admin.upsert({
        where: { email },
        update: { passwordHash, name: "Administrador Paroquial" },
        create: { email, passwordHash, name: "Administrador Paroquial" },
      });
    }
    const count = await prisma.admin.count();
    return NextResponse.json({ ok: true, email, admins: count });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao atualizar admin";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}