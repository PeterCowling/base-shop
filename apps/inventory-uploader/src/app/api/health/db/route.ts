import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Lazy import so a missing DATABASE_URL fails here (not at bundle time)
    const { prisma } = await import("@acme/platform-core/db");
    // Lightweight connectivity check — queryRaw is available on all Prisma clients
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}
