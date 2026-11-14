import { NextResponse } from "next/server";
import { resolveMaintenance } from "@/lib/maintenance";

export const dynamic = "force-dynamic";

export async function GET() {
  const view = await resolveMaintenance();
  return NextResponse.json(view);
}