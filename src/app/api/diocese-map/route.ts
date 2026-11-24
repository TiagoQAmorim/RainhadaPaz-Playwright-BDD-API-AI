import { NextResponse } from "next/server";
import { getDiocesePlaces } from "@/lib/diocese-map";

export const dynamic = "force-dynamic";

/** Lista da busca do mapa. A página abre sem esperar esta resposta. */
export async function GET() {
  try {
    const { places, complete } = await getDiocesePlaces();
    return NextResponse.json(places, {
      headers: {
        "Cache-Control": "no-store",
        "X-Diocese-Complete": complete ? "1" : "0",
      },
    });
  } catch {
    return NextResponse.json([], {
      status: 503,
      headers: { "X-Diocese-Complete": "1" },
    });
  }
}
