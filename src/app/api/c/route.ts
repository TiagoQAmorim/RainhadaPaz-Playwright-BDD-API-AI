import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const WINDOW_MS = 60_000;
const MAX_TRIES = 8;
const attempts = new Map<string, { count: number; resetAt: number }>();

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function notes() {
  const found: { code: string; text: string }[] = [];
  for (let i = 1; i <= 6; i++) {
    const code = process.env[`FAMILY_NOTE_${i}_CODE`]?.trim();
    const text = process.env[`FAMILY_NOTE_${i}_TEXT`]?.trim();
    if (!code || !text) continue;
    found.push({ code: normalize(code), text });
  }
  return found;
}

function limited(ip: string) {
  const now = Date.now();
  const current = attempts.get(ip);
  if (!current || current.resetAt <= now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > MAX_TRIES;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return NextResponse.json({ ok: false }, { status: 404 });

  const body = (await req.json().catch(() => null)) as { code?: unknown } | null;
  const code = normalize(typeof body?.code === "string" ? body.code : "");
  if (code.length < 6 || code.length > 48) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const match = notes().find((note) => note.code === code);
  if (!match) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({ ok: true, text: match.text });
}
