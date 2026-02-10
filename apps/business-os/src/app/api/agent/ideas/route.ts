import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  allocateNextIdeaId,
  appendAuditEntry,
  type Idea,
  IdeaLocationSchema,
  IdeaPrioritySchema,
  IdeaSchema,
  listInboxIdeas,
  listWorkedIdeas,
  upsertIdea,
} from "@acme/platform-core/repositories/businessOs.server";

import { requireAgentAuth } from "@/lib/auth/middleware";
import { BUSINESSES } from "@/lib/business-catalog";
import { getDb } from "@/lib/d1.server";
import { computeEntitySha } from "@/lib/entity-sha";

const CreateAgentIdeaSchema = z.object({
  business: z.string().min(1),
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
  priority: IdeaPrioritySchema.optional(),
  location: IdeaLocationSchema.optional(),
});

function isBusinessValid(business: string): boolean {
  return BUSINESSES.some((entry) => entry.id === business);
}

/**
 * GET /api/agent/ideas
 * List ideas for agents (D1-hosted path).
 */
export async function GET(request: NextRequest) {
  const auth = await requireAgentAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const business = searchParams.get("business") ?? undefined;
  const locationParam = searchParams.get("location") ?? undefined;
  const priorityParam = searchParams.get("priority") ?? undefined;

  const locationResult = locationParam
    ? IdeaLocationSchema.safeParse(locationParam)
    : null;
  const priorityResult = priorityParam
    ? IdeaPrioritySchema.safeParse(priorityParam)
    : null;
  if (locationParam && !locationResult?.success) {
    return NextResponse.json(
      // i18n-exempt -- BOS-02 API validation message [ttl=2026-03-31]
      { error: "Invalid location filter" },
      { status: 400 }
    );
  }
  if (priorityParam && !priorityResult?.success) {
    return NextResponse.json(
      // i18n-exempt -- BOS-02 API validation message [ttl=2026-03-31]
      { error: "Invalid priority filter" },
      { status: 400 }
    );
  }

  const location = locationResult?.success ? locationResult.data : "inbox";
  const priority = priorityResult?.success ? priorityResult.data : undefined;
  const db = getDb();
  const ideas =
    location === "worked"
      ? await listWorkedIdeas(db, { business, priority })
      : await listInboxIdeas(db, { business, priority });

  return NextResponse.json({ ideas });
}

/**
 * POST /api/agent/ideas
 * Create a new idea with agent auth (D1-hosted path).
 */
export async function POST(request: NextRequest) {
  const auth = await requireAgentAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const parsed = CreateAgentIdeaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        // i18n-exempt -- BOS-02 API validation message [ttl=2026-03-31]
        { error: "Invalid request", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const {
      business,
      content,
      tags,
      priority,
      location: locationOverride,
    } = parsed.data;

    if (!isBusinessValid(business)) {
      return NextResponse.json(
        // i18n-exempt -- BOS-02 API validation message [ttl=2026-03-31]
        { error: `Invalid business: ${business}` },
        { status: 400 }
      );
    }

    const location = locationOverride ?? "inbox";
    const status = location === "worked" ? "worked" : "raw";
    const db = getDb();
    const ideaId = await allocateNextIdeaId(db, business);
    const createdDate = new Date().toISOString().split("T")[0];

    const ideaBase: Idea = IdeaSchema.parse({
      Type: "Idea",
      ID: ideaId,
      Business: business,
      Status: status,
      Priority: priority ?? "P3",
      "Created-Date": createdDate,
      Tags: tags,
      content,
      filePath: `docs/business-os/ideas/${location}/${ideaId}.user.md`,
    });

    const idea: Idea = {
      ...ideaBase,
      fileSha: await computeEntitySha(ideaBase as Record<string, unknown>),
    };

    const result = await upsertIdea(db, idea, location);
    if (!result.success) {
      return NextResponse.json(
        // i18n-exempt -- BOS-02 API error message [ttl=2026-03-31]
        { error: "Failed to create idea" },
        { status: 500 }
      );
    }

    await appendAuditEntry(db, {
      entity_type: "idea",
      entity_id: ideaId,
      action: "create",
      actor: "agent",
      changes_json: JSON.stringify({
        business,
        status,
        priority: idea.Priority,
        location,
      }),
    });

    return NextResponse.json(
      {
        success: true,
        ideaId,
        // i18n-exempt -- BOS-02 API success message [ttl=2026-03-31]
        message: "Idea created",
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
