
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

const UpdateCardSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  baseFileSha: z.string().min(1).optional(),
  force: z.boolean().optional(),
  lane: z
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
  priority: z.enum(["P0", "P1", "P2", "P3", "P4", "P5"]).optional(),
  owner: z.string().min(1).optional(),
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

type UpdateCardInput = z.infer<typeof UpdateCardSchema>;

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

function extractTitle(content: string): string | undefined {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1] : undefined;
}

function extractDescription(content: string): string {
  const lines = content.split("\n");
  const firstHeadingIndex = lines.findIndex((line) => line.startsWith("# "));
  if (firstHeadingIndex === -1) return content.trim();
  return lines
    .slice(firstHeadingIndex + 1)
    .join("\n")
    .trim();
}

async function getCardFileSha(card: Card): Promise<string> {
  if (card.fileSha) return card.fileSha;
  return computeEntitySha(card as unknown as Record<string, unknown>);
}

async function readRequestJson(request: Request): Promise<
  | { ok: true; body: unknown }
  | { ok: false; response: NextResponse }
> {
  try {
    return { ok: true, body: await request.json() };
  } catch (error) {
    return {
      ok: false,
      response: NextResponse.json(
        // i18n-exempt -- BOS-D1 Phase 0 API error message [ttl=2026-03-31]
        { error: "Invalid JSON", details: String(error) },
        { status: 400 }
      ),
    };
  }
}

async function getConflictResponse(params: {
  id: string;
  currentCard: Card;
  baseFileSha: string | undefined;
  force: boolean | undefined;
}): Promise<NextResponse | null> {
  const { id, currentCard, baseFileSha, force } = params;
  if (!baseFileSha || force === true) return null;

  const currentFileSha = await getCardFileSha(currentCard);
  if (currentFileSha === baseFileSha) return null;

  return NextResponse.json(
    {
      // i18n-exempt -- BOS-32 Phase 0 optimistic concurrency copy [ttl=2026-03-31]
      error: "Conflict: this card changed since you loaded it.",
      conflict: {
        kind: "card",
        id,
        currentFileSha,
        currentCard,
      },
    },
    { status: 409 }
  );
}

async function buildUpdatedCard(
  currentCard: Card,
  input: UpdateCardInput
): Promise<{
  updatedCard: Card;
  laneBefore: Card["Lane"];
  laneAfter: Card["Lane"];
  updatedAtIso: string;
}> {
  const updatedAtIso = new Date().toISOString();
  const updatedDate = updatedAtIso.split("T")[0];

  const laneBefore = currentCard.Lane;
  const laneAfter = input.lane ?? currentCard.Lane;

  const nextTitle = input.title ?? currentCard.Title ?? extractTitle(currentCard.content) ?? "";
  const nextDescription = input.description ?? extractDescription(currentCard.content);

  const updatedCardBase: Card = {
    ...currentCard,
    Title: input.title ?? currentCard.Title,
    Lane: laneAfter,
    Priority: input.priority ?? currentCard.Priority,
    Owner: input.owner ?? currentCard.Owner,
    "Proposed-Lane": input.proposedLane ?? currentCard["Proposed-Lane"],
    Tags: input.tags ?? currentCard.Tags,
    "Due-Date": input.dueDate ?? currentCard["Due-Date"],
    Updated: updatedDate,
  };

  if (input.title !== undefined || input.description !== undefined) {
    updatedCardBase.content = `# ${nextTitle}\n\n${nextDescription}`;
  }

  if (laneBefore !== "Done" && laneAfter === "Done") {
    updatedCardBase["Completed-Date"] = updatedDate;
  } else if (laneBefore === "Done" && laneAfter !== "Done") {
    delete updatedCardBase["Completed-Date"];
  }

  const fileSha = await computeEntitySha(updatedCardBase as unknown as Record<string, unknown>);

  return {
    updatedCard: {
      ...updatedCardBase,
      fileSha,
    },
    laneBefore,
    laneAfter,
    updatedAtIso,
  };
}

/**
 * PATCH /api/cards/[id]
 * Update an existing card (D1-hosted path)
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const bodyResult = await readRequestJson(request);
    if (!bodyResult.ok) return bodyResult.response;

    const parsed = UpdateCardSchema.safeParse(bodyResult.body);
    if (!parsed.success) {
      return NextResponse.json(
        // i18n-exempt -- BOS-D1 Phase 0 API error message [ttl=2026-03-31]
        { error: "Invalid request", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const db = getDb();
    const currentUser = await getCurrentUserServer();

    const currentCard = await getCardById(db, id);
    if (!currentCard) {
      return NextResponse.json(
        // i18n-exempt -- BOS-D1 Phase 0 API error message [ttl=2026-03-31]
        { error: "Card not found" },
        { status: 404 }
      );
    }

    if (!canEditCard(currentUser, currentCard)) {
      return NextResponse.json(
        // i18n-exempt -- BOS-D1 Phase 0 API error message [ttl=2026-03-31]
        { error: "You do not have permission to edit this card" },
        { status: 403 }
      );
    }

    const conflictResponse = await getConflictResponse({
      id,
      currentCard,
      baseFileSha: parsed.data.baseFileSha,
      force: parsed.data.force,
    });
    if (conflictResponse) return conflictResponse;

    const { updatedCard, laneBefore, laneAfter, updatedAtIso } =
      await buildUpdatedCard(currentCard, parsed.data);

    const result = await upsertCard(db, updatedCard, null);
    if (!result.success) {
      return NextResponse.json(
        // i18n-exempt -- BOS-D1 Phase 0 API error message [ttl=2026-03-31]
        { error: result.error || "Failed to update card" },
        { status: 500 }
      );
    }

    await appendAuditEntry(db, {
      entity_type: "card",
      entity_id: id,
      action: laneBefore !== laneAfter ? "move" : "update",
      actor: currentUser.id,
      changes_json:
        laneBefore !== laneAfter
          ? JSON.stringify({ from: laneBefore, to: laneAfter })
          : JSON.stringify({ updated_at: updatedAtIso }),
    });

    return NextResponse.json({
      success: true,
      cardId: id,
      // i18n-exempt -- BOS-D1 Phase 0 API success message [ttl=2026-03-31]
      message: "Card updated",
    });
  } catch (error) {
    return NextResponse.json(
      // i18n-exempt -- BOS-D1 Phase 0 API error message [ttl=2026-03-31]
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
