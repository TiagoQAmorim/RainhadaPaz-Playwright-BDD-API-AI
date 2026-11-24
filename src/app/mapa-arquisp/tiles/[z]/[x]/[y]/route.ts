import { NextResponse } from "next/server";
import { ensureCartoKey } from "@/lib/arquisp-map";

export const dynamic = "force-dynamic";

const tileHeaders = {
  "Content-Type": "image/png",
  "Cache-Control": "public, max-age=86400",
  "X-Content-Type-Options": "nosniff",
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ z: string; x: string; y: string }> },
) {
  const { z, x, y } = await ctx.params;
  const zoom = Number(z);
  if (!/^\d+$/.test(z) || !/^\d+$/.test(x) || !/^\d+$/.test(y) || zoom > 19) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const key = await ensureCartoKey();
    const upstream = `https://a.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png?key=${encodeURIComponent(key)}`;
    const res = await fetch(upstream, {
      headers: {
        Referer: "https://arquisp.org.br/mapa/",
        Accept: "image/png",
        "User-Agent": "Mozilla/5.0",
      },
    });
    if (!res.ok) return new NextResponse(null, { status: 502 });
    return new NextResponse(await res.arrayBuffer(), { headers: tileHeaders });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
