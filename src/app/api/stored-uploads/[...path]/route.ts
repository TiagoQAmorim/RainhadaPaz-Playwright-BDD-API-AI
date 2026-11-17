import { readFile, stat } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { persistentUploadRoot, publicUploadRoot } from "@/lib/upload-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

function resolveInside(root: string, parts: string[]): string | null {
  if (parts.length === 0 || parts.length > 4) return null;
  if (parts.some((part) => part !== path.basename(part) || part === "." || part === "..")) return null;
  const full = path.resolve(root, ...parts);
  const base = path.resolve(root);
  if (full !== base && !full.startsWith(base + path.sep)) return null;
  return full;
}

export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await ctx.params;
  const ext = path.extname(parts.at(-1) ?? "").toLowerCase();
  const type = MIME[ext];
  if (!type) return new NextResponse("Tipo não permitido", { status: 415 });

  const roots = [persistentUploadRoot(), publicUploadRoot()];
  const seen = new Set<string>();
  for (const root of roots) {
    const resolvedRoot = path.resolve(root);
    if (seen.has(resolvedRoot)) continue;
    seen.add(resolvedRoot);
    const file = resolveInside(root, parts);
    if (!file) continue;
    try {
      const info = await stat(file);
      if (!info.isFile() || info.size > 8 * 1024 * 1024) continue;
      const bytes = await readFile(file);
      return new NextResponse(new Uint8Array(bytes), {
        headers: {
          "Content-Type": type,
          "Content-Length": String(info.size),
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      continue;
    }
  }

  return new NextResponse("Não encontrado", { status: 404 });
}
