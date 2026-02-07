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

const AcceptCardSchema = z.object({
  cardId: z.string().min(1),
});

/**
 * POST /api/cards/accept
 * Accept a claimed card (move Lane from Inbox to In progress)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsed = AcceptCardSchema.safeParse(body);
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

    if (card.Owner !== currentUser.name) {
      return NextResponse.json(
        // i18n-exempt -- BOS-D1 Phase 0 API error message [ttl=2026-03-31]
        {
          error: `Only the card owner (${card.Owner || "unassigned"}) can accept this card`,
        },
        { status: 403 }
      );
    }

    if (card.Lane !== "Inbox") {
      return NextResponse.json(
        // i18n-exempt -- BOS-D1 Phase 0 API error message [ttl=2026-03-31]
        { error: `Card is already in ${card.Lane} lane (can only accept from Inbox)` },
        { status: 400 }
      );
    }

    const updatedDate = new Date().toISOString().split("T")[0];

    const updatedCardBase: Card = {
      ...card,
      Lane: "In progress",
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
        { error: result.error || "Failed to accept card" },
        { status: 500 }
      );
    }

    await appendAuditEntry(db, {
      entity_type: "card",
      entity_id: cardId,
      action: "move",
      actor: currentUser.id,
      changes_json: JSON.stringify({ from: "Inbox", to: "In progress" }),
    });

    return NextResponse.json(
      {
        success: true,
        cardId,
        lane: "In progress",
        // i18n-exempt -- BOS-D1 Phase 0 API success message [ttl=2026-03-31]
        message: "Card accepted and moved to In progress",
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
