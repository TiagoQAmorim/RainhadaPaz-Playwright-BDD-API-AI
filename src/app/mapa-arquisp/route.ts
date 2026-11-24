import { NextResponse } from "next/server";
import { arquispMapFallbackDocument, getArquispMapDocument } from "@/lib/arquisp-map";

export const dynamic = "force-dynamic";

const csp = [
  "default-src 'none'",
  "script-src 'unsafe-inline' https://unpkg.com",
  "style-src 'unsafe-inline' https://unpkg.com",
  "img-src 'self' data: blob: http: https:",
  "font-src data: https://unpkg.com",
  "connect-src 'none'",
  "worker-src blob:",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'self'",
].join("; ");

function headers(cacheControl: string) {
  return {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Security-Policy": csp,
    "Referrer-Policy": "no-referrer",
    "X-Frame-Options": "SAMEORIGIN",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": cacheControl,
  };
}

export async function GET() {
  try {
    const html = await getArquispMapDocument();
    return new NextResponse(html, { headers: headers("public, max-age=600") });
  } catch {
    return new NextResponse(arquispMapFallbackDocument(), {
      headers: headers("no-store"),
    });
  }
}
