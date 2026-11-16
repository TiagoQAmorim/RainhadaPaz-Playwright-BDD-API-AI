import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { syncAdminFromEnv } from "@/lib/admin-credentials";
import {
  databaseNeedsBundleImport,
  databaseNeedsSeed,
  runPrismaDbPush,
  runPrismaSeedFromDisk,
  runSiteBundleImport,
} from "@/lib/db-bootstrap";
import { isProdRuntime } from "@/lib/prod-runtime";

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
    await syncAdminFromEnv(prisma);

    if (isProdRuntime()) {
      const [admins, pages, posts, raffles, candles] = await Promise.all([
        prisma.admin.count(),
        prisma.page.count(),
        prisma.post.count(),
        prisma.raffle.count(),
        prisma.virtualCandle.count(),
      ]);
      return NextResponse.json({
        ok: true,
        productionSafe: true,
        admins,
        pages,
        posts,
        raffles,
        candles,
        message:
          "Produção: apenas schema + sync do admin. Seed e site-bundle não rodam aqui (preserva conteúdo).",
      });
    }

    const need = await databaseNeedsSeed(prisma);
    if (need) {
      runPrismaSeedFromDisk();
    } else if (await databaseNeedsBundleImport(prisma)) {
      runSiteBundleImport();
    }
    const [admins, pages, raffles, candles] = await Promise.all([
      prisma.admin.count(),
      prisma.page.count(),
      prisma.raffle.count(),
      prisma.virtualCandle.count(),
    ]);
    return NextResponse.json({ ok: true, admins, pages, raffles, candles, seeded: need });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao popular banco";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}