import { NextResponse } from "next/server";
import { z } from "zod";
import { parseNameLines, resolveAvailableTicketsByNames } from "@/lib/raffle-bulk-names";
import { getRaffleBySlug } from "@/lib/raffles";

export const dynamic = "force-dynamic";

const schema = z.object({
  namesText: z.string().min(1).max(4000),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const raffle = await getRaffleBySlug(slug);
  if (!raffle || raffle.status !== "ACTIVE") {
    return NextResponse.json({ error: "Rifa indisponível." }, { status: 404 });
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Informe ao menos um nome." }, { status: 400 });
  }

  const names = parseNameLines(parsed.data.namesText);
  if (names.length === 0) {
    return NextResponse.json({ error: "Informe ao menos um nome." }, { status: 400 });
  }
  if (names.length > 30) {
    return NextResponse.json(
      { error: "Máximo de 30 nomes por vez. Divida em lotes menores." },
      { status: 400 },
    );
  }

  const result = await resolveAvailableTicketsByNames(raffle.id, names);
  return NextResponse.json(result);
}
