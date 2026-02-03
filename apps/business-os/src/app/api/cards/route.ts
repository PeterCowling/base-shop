import { NextResponse } from "next/server";
import { z } from "zod";

import {
  allocateNextCardId,
  appendAuditEntry,
  type Card,
  upsertCard,
} from "@acme/platform-core/repositories/businessOs.server";

import { BUSINESSES } from "@/lib/business-catalog";
import { getCurrentUserServer } from "@/lib/current-user.server-only";
import { getDb } from "@/lib/d1.server";
import { computeEntitySha } from "@/lib/entity-sha";

export const runtime = "edge";

const CreateCardSchema = z.object({
  business: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  lane: z.enum([
    "Inbox",
    "Fact-finding",
    "Planned",
    "In progress",
    "Blocked",
    "Done",
    "Reflected",
  ]),
  priority: z.enum(["P0", "P1", "P2", "P3", "P4", "P5"]),
  owner: z.string().min(1),
  proposedLane: z
    .enum([
      "Inbox",
      "Fact-finding",
      "Planned",
      "In progress",
      "Blocked",
      "Done",
      "Reflected",
    ])
    .optional(),
  tags: z.array(z.string()).optional(),
  dueDate: z.string().optional(),
});

/**
 * POST /api/cards
 * Create a new card (D1-hosted path)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsed = CreateCardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        // i18n-exempt -- BOS-D1 Phase 0 API error message [ttl=2026-03-31]
        { error: "Invalid request", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { business, title, description, lane, priority, owner, proposedLane, tags, dueDate } =
      parsed.data;

    if (!BUSINESSES.some((b) => b.id === business)) {
      return NextResponse.json(
        // i18n-exempt -- BOS-D1 Phase 0 API error message [ttl=2026-03-31]
        { error: `Invalid business: ${business}` },
        { status: 400 }
      );
    }

    const db = getDb();
    const currentUser = await getCurrentUserServer();
    const cardId = await allocateNextCardId(db, business);

    const content = `# ${title}\n\n${description}`;
    const created = new Date().toISOString().split("T")[0];

    const cardBase: Card = {
      Type: "Card",
      ID: cardId,
      Lane: lane,
      Priority: priority,
      Owner: owner,
      Business: business,
      Title: title,
      "Proposed-Lane": proposedLane,
      Tags: tags,
      "Due-Date": dueDate,
      Created: created,
      content,
      filePath: `docs/business-os/cards/${cardId}.user.md`,
    };

    const card: Card = {
      ...cardBase,
      fileSha: await computeEntitySha(cardBase),
    };

    const result = await upsertCard(db, card, null);
    if (!result.success) {
      return NextResponse.json(
        // i18n-exempt -- BOS-D1 Phase 0 API error message [ttl=2026-03-31]
        { error: result.error || "Failed to create card" },
        { status: 500 }
      );
    }

    await appendAuditEntry(db, {
      entity_type: "card",
      entity_id: cardId,
      action: "create",
      actor: currentUser.id,
      changes_json: JSON.stringify({
        business,
        lane,
        priority,
        owner,
      }),
    });

    return NextResponse.json(
      {
        success: true,
        cardId,
        // i18n-exempt -- BOS-D1 Phase 0 API success message [ttl=2026-03-31]
        message: "Card created",
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      // i18n-exempt -- BOS-D1 Phase 0 API error message [ttl=2026-03-31]
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

