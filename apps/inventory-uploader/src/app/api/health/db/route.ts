import { NextResponse } from "next/server";

import { apiError } from "../../../../lib/api-helpers";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Lazy import so a missing DATABASE_URL fails here (not at bundle time)
    const { prisma } = await import("@acme/platform-core/db");
    // Lightweight connectivity check — queryRaw is available on all Prisma clients
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError(err, 503);
  }
}
