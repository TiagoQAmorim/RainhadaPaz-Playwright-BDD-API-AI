import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { runDatabaseBackup } from "@/lib/db-backup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Backup diário: cópia de /data/rainhadapaz.db em /data/backups/ (mesmo volume).
 * POST + Authorization: Bearer AUTH_SECRET (GitHub Action, cron externo ou manual).
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
    const result = await runDatabaseBackup(prisma);
    return NextResponse.json({
      ok: true,
      backupDir: result.backupDir,
      backupFile: result.backupFile,
      bytes: result.bytes,
      manifestFile: result.manifestFile,
      prunedOldFiles: result.pruned,
      counts: result.counts,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro no backup";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}