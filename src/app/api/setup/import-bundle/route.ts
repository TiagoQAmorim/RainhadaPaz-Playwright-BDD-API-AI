import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { importSiteBundle } from "@/lib/import-site-bundle";
import { allowSiteBundleRestore } from "@/lib/prod-content-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Último recurso: repõe do `site-bundle.json` do Git (ambiente local), não do que foi feito só em prod.
 * Exige ALLOW_SITE_BUNDLE_IMPORT=true em produção. Restauração normal: POST /api/setup/restore-backup.
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

  const prisma = new PrismaClient();
  try {
    if (!(await allowSiteBundleRestore(prisma))) {
      return NextResponse.json(
        {
          error:
            "Import bloqueado em produção sem ALLOW_SITE_BUNDLE_IMPORT=true. Prefira POST /api/setup/restore-backup (backup do volume).",
        },
        { status: 403 },
      );
    }

    await importSiteBundle(prisma);
    const [posts, pages, notices, raffles, raffleTickets, raffleOrders, candles] = await Promise.all([
      prisma.post.count(),
      prisma.page.count(),
      prisma.notice.count(),
      prisma.raffle.count(),
      prisma.raffleTicket.count(),
      prisma.raffleOrder.count(),
      prisma.virtualCandle.count(),
    ]);
    return NextResponse.json({
      ok: true,
      posts,
      pages,
      notices,
      raffles,
      raffleTickets,
      raffleOrders,
      candles,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao importar bundle";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}