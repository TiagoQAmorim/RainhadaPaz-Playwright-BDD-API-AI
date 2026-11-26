import { NextResponse } from "next/server";
import { lookupParishByAddress } from "@/lib/diocese-lookup";

export const dynamic = "force-dynamic";

/** Paróquia da diocese cujo território cobre o endereço ou o CEP. */
export async function GET(req: Request) {
  const query = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 3) {
    return NextResponse.json(
      { error: "Informe o endereço ou o CEP." },
      { status: 400 },
    );
  }

  try {
    const result = await lookupParishByAddress(query);
    if (!result) {
      return NextResponse.json(
        { error: "Não encontramos esse endereço. Use o CEP ou escreva rua, número e bairro." },
        { status: 404 },
      );
    }
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível consultar o mapa agora. Tente de novo em instantes." },
      { status: 503 },
    );
  }
}
