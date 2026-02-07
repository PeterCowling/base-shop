import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireAgentAuth } from "@/lib/auth/middleware";
import { BUSINESSES } from "@/lib/business-catalog";
/**
 * GET /api/agent/businesses
 * List businesses for agents. Reads from in-memory catalog.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAgentAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status") ?? undefined;

  // Validate status filter if provided
  const validStatuses = ["active", "inactive", "archived"];
  if (statusParam && !validStatuses.includes(statusParam)) {
    return NextResponse.json(
      // i18n-exempt -- BOS-02 API validation message [ttl=2026-03-31]
      { error: "Invalid status filter" },
      { status: 400 }
    );
  }

  const filtered = statusParam
    ? BUSINESSES.filter((b) => b.status === statusParam)
    : BUSINESSES;

  return NextResponse.json({ businesses: filtered });
}
