
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  allocateNextIdeaId,
  appendAuditEntry,
  type Idea,
  upsertIdea,
} from "@acme/platform-core/repositories/businessOs.server";

import { BUSINESSES } from "@/lib/business-catalog";
import { getCurrentUserServer } from "@/lib/current-user.server-only";
import { getDb } from "@/lib/d1.server";
import { computeEntitySha } from "@/lib/entity-sha";

const CreateIdeaSchema = z.object({
  business: z.string().min(1),
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
});

/**
 * POST /api/ideas
 * Create a new idea in inbox (D1-hosted path)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsed = CreateIdeaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        // i18n-exempt -- BOS-D1 Phase 0 API error message [ttl=2026-03-31]
        { error: "Invalid request", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { business, content, tags } = parsed.data;

    if (!BUSINESSES.some((b) => b.id === business)) {
      return NextResponse.json(
        // i18n-exempt -- BOS-D1 Phase 0 API error message [ttl=2026-03-31]
        { error: `Invalid business: ${business}` },
        { status: 400 }
      );
    }

    const db = getDb();
    const currentUser = await getCurrentUserServer();
    const ideaId = await allocateNextIdeaId(db, business);

    const createdDate = new Date().toISOString().split("T")[0];

    const ideaBase: Idea = {
      Type: "Idea",
      ID: ideaId,
      Business: business,
      Status: "raw",
      "Created-Date": createdDate,
      Tags: tags,
      content,
      filePath: `docs/business-os/ideas/inbox/${ideaId}.user.md`,
    };

    const idea: Idea = {
      ...ideaBase,
      fileSha: await computeEntitySha(ideaBase),
    };

    const result = await upsertIdea(db, idea, "inbox");
    if (!result.success) {
      return NextResponse.json(
        // i18n-exempt -- BOS-D1 Phase 0 API error message [ttl=2026-03-31]
        { error: "Failed to create idea" },
        { status: 500 }
      );
    }

    await appendAuditEntry(db, {
      entity_type: "idea",
      entity_id: ideaId,
      action: "create",
      actor: currentUser.id,
      changes_json: JSON.stringify({ business, status: "raw" }),
    });

    return NextResponse.json(
      {
        success: true,
        ideaId,
        // i18n-exempt -- BOS-D1 Phase 0 API success message [ttl=2026-03-31]
        message: "Idea created",
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
