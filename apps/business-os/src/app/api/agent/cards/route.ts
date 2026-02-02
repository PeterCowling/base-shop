import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  allocateNextCardId,
  appendAuditEntry,
  type Card,
  CardSchema,
  LaneSchema,
  listCardsForBoard,
  PrioritySchema,
  upsertCard,
} from "@acme/platform-core/repositories/businessOs.server";

import { requireAgentAuth } from "@/lib/auth/middleware";
import { BUSINESSES } from "@/lib/business-catalog";
import { getDb } from "@/lib/d1.server";
import { computeEntitySha } from "@/lib/entity-sha";

export const runtime = "edge";

const CreateAgentCardSchema = z
  .object({
    business: z.string().min(1),
    title: z.string().min(1),
    description: z.string().optional(),
    content: z.string().optional(),
    lane: LaneSchema,
    priority: PrioritySchema,
    owner: z.string().min(1),
    proposedLane: LaneSchema.optional(),
    tags: z.array(z.string()).optional(),
    dueDate: z.string().optional(),
    "Feature-Slug": z.string().optional(),
    "Last-Progress": z.string().optional(),
    "Plan-Link": z.string().optional(),
  })
  .refine((data) => Boolean(data.description) || Boolean(data.content), {
    // i18n-exempt -- BOS-02 API validation message [ttl=2026-03-31]
    message: "description or content is required",
    path: ["description"],
  });

function isBusinessValid(business: string): boolean {
  return BUSINESSES.some((entry) => entry.id === business);
}

/**
 * GET /api/agent/cards
 * List cards for agents (D1-hosted path).
 */
export async function GET(request: NextRequest) {
  const auth = await requireAgentAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const business = searchParams.get("business") ?? undefined;
  const laneParam = searchParams.get("lane") ?? undefined;

  const laneResult = laneParam ? LaneSchema.safeParse(laneParam) : null;
  if (laneParam && !laneResult?.success) {
    return NextResponse.json(
      // i18n-exempt -- BOS-02 API validation message [ttl=2026-03-31]
      { error: "Invalid lane filter" },
      { status: 400 }
    );
  }

  const db = getDb();
  const cards = await listCardsForBoard(db, {
    business,
    lane: laneResult?.success ? laneResult.data : undefined,
  });

  return NextResponse.json({ cards });
}

/**
 * POST /api/agent/cards
 * Create a new card with agent auth (D1-hosted path).
 */
export async function POST(request: NextRequest) {
  const auth = await requireAgentAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const parsed = CreateAgentCardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        // i18n-exempt -- BOS-02 API validation message [ttl=2026-03-31]
        { error: "Invalid request", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const {
      business,
      title,
      description,
      content,
      lane,
      priority,
      owner,
      proposedLane,
      tags,
      dueDate,
      "Feature-Slug": featureSlug,
      "Last-Progress": lastProgress,
      "Plan-Link": planLink,
    } = parsed.data;

    if (!isBusinessValid(business)) {
      return NextResponse.json(
        // i18n-exempt -- BOS-02 API validation message [ttl=2026-03-31]
        { error: `Invalid business: ${business}` },
        { status: 400 }
      );
    }

    const db = getDb();
    const cardId = await allocateNextCardId(db, business);
    const created = new Date().toISOString().split("T")[0];
    const cardContent =
      content ?? `# ${title}\n\n${description ?? ""}`.trim();

    const cardBase: Card = CardSchema.parse({
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
      "Feature-Slug": featureSlug,
      "Last-Progress": lastProgress,
      "Plan-Link": planLink,
      content: cardContent,
      filePath: `docs/business-os/cards/${cardId}.user.md`,
    });

    const card: Card = {
      ...cardBase,
      fileSha: await computeEntitySha(cardBase as Record<string, unknown>),
    };

    const result = await upsertCard(db, card, null);
    if (!result.success) {
      return NextResponse.json(
        // i18n-exempt -- BOS-02 API error message [ttl=2026-03-31]
        { error: result.error || "Failed to create card" },
        { status: 500 }
      );
    }

    await appendAuditEntry(db, {
      entity_type: "card",
      entity_id: cardId,
      action: "create",
      actor: "agent",
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
        // i18n-exempt -- BOS-02 API success message [ttl=2026-03-31]
        message: "Card created",
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      // i18n-exempt -- BOS-02 API error message [ttl=2026-03-31]
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
