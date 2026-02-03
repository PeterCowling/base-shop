import { NextResponse } from "next/server";
import { z } from "zod";

import {
  appendAuditEntry,
  type Card,
  getCardById,
  upsertCard,
} from "@acme/platform-core/repositories/businessOs.server";

import { getCurrentUserServer } from "@/lib/current-user.server-only";
import { getDb } from "@/lib/d1.server";
import { computeEntitySha } from "@/lib/entity-sha";

export const runtime = "edge";

const ClaimCardSchema = z.object({
  cardId: z.string().min(1),
});

/**
 * POST /api/cards/claim
 * Claim an unassigned card (set Owner to current user)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsed = ClaimCardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        // i18n-exempt -- BOS-D1 Phase 0 API error message [ttl=2026-03-31]
        { error: "Invalid request", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { cardId } = parsed.data;

    const db = getDb();
    const currentUser = await getCurrentUserServer();

    const card = await getCardById(db, cardId);
    if (!card) {
      return NextResponse.json(
        // i18n-exempt -- BOS-D1 Phase 0 API error message [ttl=2026-03-31]
        { error: "Card not found" },
        { status: 404 }
      );
    }

    if (card.Owner && card.Owner.trim() !== "") {
      return NextResponse.json(
        // i18n-exempt -- BOS-D1 Phase 0 API error message [ttl=2026-03-31]
        { error: `Card is already claimed by ${card.Owner}` },
        { status: 400 }
      );
    }

    const updatedDate = new Date().toISOString().split("T")[0];

    const updatedCardBase: Card = {
      ...card,
      Owner: currentUser.name,
      Updated: updatedDate,
    };

    const updatedCard: Card = {
      ...updatedCardBase,
      fileSha: await computeEntitySha(updatedCardBase as unknown as Record<string, unknown>),
    };

    const result = await upsertCard(db, updatedCard, null);
    if (!result.success) {
      return NextResponse.json(
        // i18n-exempt -- BOS-D1 Phase 0 API error message [ttl=2026-03-31]
        { error: result.error || "Failed to claim card" },
        { status: 500 }
      );
    }

    await appendAuditEntry(db, {
      entity_type: "card",
      entity_id: cardId,
      action: "update",
      actor: currentUser.id,
      changes_json: JSON.stringify({ owner: currentUser.name }),
    });

    return NextResponse.json(
      {
        success: true,
        cardId,
        owner: currentUser.name,
        // i18n-exempt -- BOS-D1 Phase 0 API success message [ttl=2026-03-31]
        message: `Card claimed by ${currentUser.name}`,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      // i18n-exempt -- BOS-D1 Phase 0 API error message [ttl=2026-03-31]
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

