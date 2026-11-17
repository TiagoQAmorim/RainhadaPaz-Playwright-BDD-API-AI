import { NextResponse } from "next/server";
import { listLitCandles, toPublicCandle } from "@/lib/candles";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? "0") || 0);
  const limit = Math.min(24, Math.max(1, Number(url.searchParams.get("limit") ?? "8") || 8));
  const { candles, total } = await listLitCandles({ skip: offset, take: limit });
  return NextResponse.json({
    candles: candles.map(toPublicCandle),
    total,
    hasMore: offset + candles.length < total,
  });
}
