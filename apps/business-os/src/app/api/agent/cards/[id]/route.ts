import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  appendAuditEntry,
  type Card,
  CardSchema,
  getCardById,
  upsertCard,
} from "@acme/platform-core/repositories/businessOs.server";

import { requireAgentAuth } from "@/lib/auth/middleware";
import { getDb } from "@/lib/d1.server";
import { computeEntitySha } from "@/lib/entity-sha";

export const runtime = "edge";

const PatchRequestSchema = z.object({
  baseEntitySha: z.string().min(1),
  patch: z.record(z.unknown()),
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function applyMergePatch(target: unknown, patch: unknown): unknown {
  if (!isPlainObject(patch)) {
    return patch;
  }

  const targetObject = isPlainObject(target) ? { ...target } : {};

  for (const [key, value] of Object.entries(patch)) {
    if (value === null) {
      delete targetObject[key];
      continue;
    }

    if (isPlainObject(value)) {
      const currentValue = targetObject[key];
      targetObject[key] = applyMergePatch(currentValue, value);
      continue;
    }

    targetObject[key] = value;
  }

  return targetObject;
}

function stripFileSha(card: Card): Omit<Card, "fileSha"> {
  const { fileSha: _fileSha, ...rest } = card;
  return rest;
}

async function computeCardEntitySha(card: Card): Promise<string> {
  return computeEntitySha(stripFileSha(card) as Record<string, unknown>);
}

async function readRequestJson(request: NextRequest): Promise<
  | { ok: true; body: unknown }
  | { ok: false; response: NextResponse }
> {
  try {
    return { ok: true, body: await request.json() };
  } catch (error) {
    return {
      ok: false,
      response: NextResponse.json(
        // i18n-exempt -- BOS-02 API validation message [ttl=2026-03-31]
        { error: "Invalid JSON", details: String(error) },
        { status: 400 }
      ),
    };
  }
}

/**
 * GET /api/agent/cards/[id]
 * Fetch a single card with entity SHA for optimistic concurrency.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAgentAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const db = getDb();
  const card = await getCardById(db, id);

  if (!card) {
    return NextResponse.json(
      // i18n-exempt -- BOS-02 API not found message [ttl=2026-03-31]
      { error: "Card not found" },
      { status: 404 }
    );
  }

  const entitySha = await computeCardEntitySha(card);
  return NextResponse.json({ entity: card, entitySha });
}

/**
 * PATCH /api/agent/cards/[id]
 * Update card with JSON Merge Patch + optimistic concurrency.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAgentAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  const bodyResult = await readRequestJson(request);
  if (!bodyResult.ok) return bodyResult.response;

  const parsed = PatchRequestSchema.safeParse(bodyResult.body);
  if (!parsed.success) {
    return NextResponse.json(
      // i18n-exempt -- BOS-02 API validation message [ttl=2026-03-31]
      { error: "Invalid request", details: parsed.error.errors },
      { status: 400 }
    );
  }

  const db = getDb();
  const currentCard = await getCardById(db, id);
  if (!currentCard) {
    return NextResponse.json(
      // i18n-exempt -- BOS-02 API not found message [ttl=2026-03-31]
      { error: "Card not found" },
      { status: 404 }
    );
  }

  const currentEntitySha = await computeCardEntitySha(currentCard);
  if (currentEntitySha !== parsed.data.baseEntitySha) {
    return NextResponse.json(
      {
        error: "CONFLICT",
        // i18n-exempt -- BOS-02 API conflict message [ttl=2026-03-31]
        message: "Entity modified since last read",
        currentEntitySha,
        entity: currentCard,
      },
      { status: 409 }
    );
  }

  const merged = applyMergePatch(currentCard, parsed.data.patch);
  const updatedDate = new Date().toISOString().split("T")[0];
  const laneBefore = currentCard.Lane;

  const updatedCardBase = {
    ...(merged as Card),
    Type: "Card",
    ID: currentCard.ID,
    filePath: currentCard.filePath,
    Updated: updatedDate,
  };

  const laneAfter = updatedCardBase.Lane;
  if (laneBefore !== "Done" && laneAfter === "Done") {
    updatedCardBase["Completed-Date"] = updatedDate;
  } else if (laneBefore === "Done" && laneAfter !== "Done") {
    delete updatedCardBase["Completed-Date"];
  }

  const validation = CardSchema.safeParse(updatedCardBase);
  if (!validation.success) {
    return NextResponse.json(
      // i18n-exempt -- BOS-02 API validation message [ttl=2026-03-31]
      { error: "Invalid patch", details: validation.error.errors },
      { status: 400 }
    );
  }

  const entitySha = await computeEntitySha(
    stripFileSha(validation.data) as Record<string, unknown>
  );

  const updatedCard: Card = {
    ...validation.data,
    fileSha: entitySha,
  };

  const result = await upsertCard(db, updatedCard, null);
  if (!result.success) {
    return NextResponse.json(
      // i18n-exempt -- BOS-02 API error message [ttl=2026-03-31]
      { error: result.error || "Failed to update card" },
      { status: 500 }
    );
  }

  await appendAuditEntry(db, {
    entity_type: "card",
    entity_id: id,
    action: laneBefore !== laneAfter ? "move" : "update",
    actor: "agent",
    changes_json:
      laneBefore !== laneAfter
        ? JSON.stringify({ from: laneBefore, to: laneAfter })
        : JSON.stringify({ updated_at: updatedDate }),
  });

  return NextResponse.json({ entity: updatedCard, entitySha });
}
