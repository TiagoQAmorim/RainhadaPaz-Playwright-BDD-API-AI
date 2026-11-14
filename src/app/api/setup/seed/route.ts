import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
  databaseNeedsSeed,
  runPrismaDbPush,
  runPrismaSeedFromDisk,
} from "@/lib/db-bootstrap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Uma vez em produção: POST com header Authorization: Bearer <AUTH_SECRET> */
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

  const prisma = new PrismaClient();
  try {
    runPrismaDbPush();
    const need = await databaseNeedsSeed(prisma);
    if (need) {
      runPrismaSeedFromDisk();
    }
    const [admins, pages] = await Promise.all([
      prisma.admin.count(),
      prisma.page.count(),
    ]);
    return NextResponse.json({ ok: true, admins, pages, seeded: need });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao popular banco";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}