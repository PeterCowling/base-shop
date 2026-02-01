import { NextResponse } from "next/server";
import { z } from "zod";

import {
  appendAuditEntry,
  type Card,
  getCardById,
  upsertCard,
} from "@acme/platform-core/repositories/businessOs.server";

import { canEditCard } from "@/lib/current-user";
import { getCurrentUserServer } from "@/lib/current-user.server-only";
import { getDb } from "@/lib/d1.server";
import { computeEntitySha } from "@/lib/entity-sha";

export const runtime = "edge";

const CompleteCardSchema = z.object({
  cardId: z.string().min(1),
});

/**
 * POST /api/cards/complete
 * Mark a card as complete (move Lane to Done, add timestamp)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsed = CompleteCardSchema.safeParse(body);
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

    if (!canEditCard(currentUser, card)) {
      return NextResponse.json(
        // i18n-exempt -- BOS-D1 Phase 0 API error message [ttl=2026-03-31]
        {
          error: `Only the card owner (${card.Owner || "unassigned"}) or admins can mark this card complete`,
        },
        { status: 403 }
      );
    }

    if (card.Lane === "Done") {
      return NextResponse.json(
        // i18n-exempt -- BOS-D1 Phase 0 API error message [ttl=2026-03-31]
        { error: "Card is already marked as complete" },
        { status: 400 }
      );
    }

    const completedDate = new Date().toISOString().split("T")[0];

    const updatedCardBase: Card = {
      ...card,
      Lane: "Done",
      Updated: completedDate,
      "Completed-Date": completedDate,
    };

    const updatedCard: Card = {
      ...updatedCardBase,
      fileSha: await computeEntitySha(updatedCardBase as unknown as Record<string, unknown>),
    };

    const result = await upsertCard(db, updatedCard, null);
    if (!result.success) {
      return NextResponse.json(
        // i18n-exempt -- BOS-D1 Phase 0 API error message [ttl=2026-03-31]
        { error: result.error || "Failed to mark card complete" },
        { status: 500 }
      );
    }

    await appendAuditEntry(db, {
      entity_type: "card",
      entity_id: cardId,
      action: "move",
      actor: currentUser.id,
      changes_json: JSON.stringify({ from: card.Lane, to: "Done", completedDate }),
    });

    return NextResponse.json(
      {
        success: true,
        cardId,
        lane: "Done",
        completedDate,
        // i18n-exempt -- BOS-D1 Phase 0 API success message [ttl=2026-03-31]
        message: "Card marked as complete",
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

