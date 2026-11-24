import { NextResponse } from "next/server";
import { runCandleMailCycle } from "@/lib/candle-mail-run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Dispara o relatório de sexta e os avisos de 1 hora. POST + Bearer AUTH_SECRET. */
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

  try {
    const result = await runCandleMailCycle();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha no envio";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
