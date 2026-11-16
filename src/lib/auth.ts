import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findAdminByEmail } from "@/lib/admin-credentials";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "paroquia_session";

function authSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET?.trim();
  if (secret && secret.length >= 32) {
    return new TextEncoder().encode(secret);
  }
  if (process.env.NODE_ENV === "production") {
    console.error("[auth] AUTH_SECRET ausente ou curto — sessões admin desativadas até corrigir.");
  }
  return new TextEncoder().encode("dev-only-secret-change-in-production-32");
}

export async function hashAdminPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyAdmin(email: string, password: string) {
  const admin = await findAdminByEmail(prisma, email);
  if (!admin) return null;
  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) return null;
  return admin;
}

export async function createSession(adminId: string) {
  const token = await new SignJWT({ sub: adminId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(authSecret());

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

/** Sessão admin válida (só JWT — serve para bypass de manutenção sem query extra no banco). */
export async function hasValidAdminSession(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, authSecret());
    return Boolean(payload.sub);
  } catch {
    return false;
  }
}

export async function getSessionAdmin() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, authSecret());
    const id = payload.sub;
    if (!id) return null;
    return prisma.admin.findUnique({ where: { id } });
  } catch {
    return null;
  }
}

/** Server Actions / páginas admin: redireciona em vez de lançar (evita “This page couldn’t load”). */
export async function requireAdmin() {
  const admin = await getSessionAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
