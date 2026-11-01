import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { expireStaleReservations } from "@/lib/raffle-reservations";
import { getRaffleBySlug, getRaffleStats } from "@/lib/raffles";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const raffle = await getRaffleBySlug(slug);
  if (!raffle || raffle.status !== "ACTIVE") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await expireStaleReservations(raffle.id);
  const stats = await getRaffleStats(raffle.id);
  return NextResponse.json(stats);
}
