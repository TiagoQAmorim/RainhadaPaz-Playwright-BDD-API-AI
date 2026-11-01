import { NextResponse } from "next/server";
import { createSession, verifyAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = (await req.json()) as {
    email?: string;
    password?: string;
  };
  if (!email || !password) {
    return NextResponse.json({ error: "Credenciais incompletas." }, { status: 400 });
  }
  const admin = await verifyAdmin(email.trim().toLowerCase(), password);
  if (!admin) {
    return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
  }
  await createSession(admin.id);
  return NextResponse.json({ ok: true });
}
