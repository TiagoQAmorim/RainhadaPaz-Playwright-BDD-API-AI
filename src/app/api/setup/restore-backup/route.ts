import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
  hasUsableProductionBackup,
  listProductionBackups,
  restoreDatabaseFromLatestBackup,
  sqlitePathFromDatabaseUrl,
} from "@/lib/db-restore-from-backup";
import { allowProdBackupRestore } from "@/lib/prod-content-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Restaura o SQLite a partir de /data/backups/ (cópia feita em produção).
 * POST + Bearer AUTH_SECRET. Query opcional: ?day=YYYY-MM-DD
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

  const dbPath = sqlitePathFromDatabaseUrl();
  if (!dbPath) {
    return NextResponse.json({ error: "DATABASE_URL deve ser file:..." }, { status: 500 });
  }

  if (!hasUsableProductionBackup(dbPath)) {
    return NextResponse.json(
      {
        error:
          "Nenhum backup em /data/backups com conteúdo. Rode POST /api/setup/backup ou aguarde o backup diário.",
      },
      { status: 404 },
    );
  }

  const url = new URL(req.url);
  const day = url.searchParams.get("day")?.trim() || undefined;

  const prisma = new PrismaClient();
  try {
    if (!(await allowProdBackupRestore(prisma))) {
      return NextResponse.json(
        {
          error:
            "Restore bloqueado: o banco já tem conteúdo. Use ALLOW_FORCE_PROD_BACKUP_RESTORE=true só se quiser sobrescrever com um backup.",
        },
        { status: 403 },
      );
    }

    const restoredFrom = restoreDatabaseFromLatestBackup(dbPath, { day });
    if (!restoredFrom) {
      return NextResponse.json({ error: "Não foi possível restaurar o backup solicitado." }, { status: 500 });
    }

    await prisma.$disconnect();

    const prismaAfter = new PrismaClient();
    try {
      const [posts, pages, notices, raffles, raffleTickets, raffleOrders, candles] = await Promise.all([
        prismaAfter.post.count(),
        prismaAfter.page.count(),
        prismaAfter.notice.count(),
        prismaAfter.raffle.count(),
        prismaAfter.raffleTicket.count(),
        prismaAfter.raffleOrder.count(),
        prismaAfter.virtualCandle.count(),
      ]);
      const available = listProductionBackups(dbPath).map((b) => ({
        day: b.day,
        counts: b.counts,
      }));

      return NextResponse.json({
        ok: true,
        restoredFrom,
        day: day ?? available[0]?.day,
        availableBackups: available,
        counts: { posts, pages, notices, raffles, raffleTickets, raffleOrders, candles },
      });
    } finally {
      await prismaAfter.$disconnect();
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao restaurar backup";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}