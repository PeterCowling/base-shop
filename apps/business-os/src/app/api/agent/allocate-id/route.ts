import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  allocateNextCardId,
  allocateNextIdeaId,
} from "@acme/platform-core/repositories/businessOs.server";

import { requireAgentAuth } from "@/lib/auth/middleware";
import { BUSINESSES } from "@/lib/business-catalog";
import { getDb } from "@/lib/d1.server";

const AllocateIdSchema = z.object({
  business: z.string().min(1),
  type: z.enum(["card", "idea"]),
});

function isBusinessValid(business: string): boolean {
  return BUSINESSES.some((entry) => entry.id === business);
}

/**
 * POST /api/agent/allocate-id
 * Allocate next card/idea ID with agent auth.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAgentAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const parsed = AllocateIdSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        // i18n-exempt -- BOS-02 API validation message [ttl=2026-03-31]
        { error: "Invalid request", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { business, type } = parsed.data;
    if (!isBusinessValid(business)) {
      return NextResponse.json(
        // i18n-exempt -- BOS-02 API validation message [ttl=2026-03-31]
        { error: `Invalid business: ${business}` },
        { status: 400 }
      );
    }

    const db = getDb();
    const id =
      type === "card"
        ? await allocateNextCardId(db, business)
        : await allocateNextIdeaId(db, business);

    return NextResponse.json({ id });
  } catch (error) {
    return NextResponse.json(
      // i18n-exempt -- BOS-02 API error message [ttl=2026-03-31]
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
