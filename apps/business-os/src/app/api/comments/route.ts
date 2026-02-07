import { NextResponse } from "next/server";
import { z } from "zod";

import { appendAuditEntry } from "@acme/platform-core/repositories/businessOs.server";

import { getCurrentUserServer } from "@/lib/current-user.server-only";
import { getDb } from "@/lib/d1.server";
import { isRecord } from "@/lib/json";

const CreateCommentSchema = z.object({
  content: z.string().min(1),
  entityType: z.enum(["card", "idea"]),
  entityId: z.string().min(1),
});

/**
 * POST /api/comments
 * Create a new comment (D1-hosted path)
 *
 * Note: D1 schema currently supports card comments only.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsed = CreateCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        // i18n-exempt -- BOS-D1 Phase 0 API error message [ttl=2026-03-31]
        { error: "Invalid request", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { content, entityType, entityId } = parsed.data;

    if (entityType !== "card") {
      return NextResponse.json(
        // i18n-exempt -- BOS-D1 Phase 0 API error message [ttl=2026-03-31]
        { error: "Comments are not available for ideas yet." },
        { status: 501 }
      );
    }

    const db = getDb();
    const currentUser = await getCurrentUserServer();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const result = await db
      .prepare(
         
        `
        INSERT INTO business_os_comments (id, card_id, author, content, created_at)
        VALUES (?, ?, ?, ?, ?)
      `
      )
      .bind(id, entityId, currentUser.name, content, now)
      .run();

    if (!result.success) {
      return NextResponse.json(
        // i18n-exempt -- BOS-D1 Phase 0 API error message [ttl=2026-03-31]
        { error: "Failed to create comment" },
        { status: 500 }
      );
    }

    await appendAuditEntry(db, {
      entity_type: "comment",
      entity_id: id,
      action: "create",
      actor: currentUser.id,
      changes_json: JSON.stringify({
        entityType,
        entityId,
      }),
    });

    return NextResponse.json(
      { success: true, id },
      { status: 201 }
    );
  } catch (error) {
    const details =
      isRecord(error) && typeof error.message === "string"
        ? error.message
        : String(error);

    return NextResponse.json(
      // i18n-exempt -- BOS-D1 Phase 0 API error message [ttl=2026-03-31]
      { error: "Internal server error", details },
      { status: 500 }
    );
  }
}
