import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  appendAuditEntry,
  getCardById,
  listStageDocsForCard,
  type StageDoc,
  StageDocSchema,
  type StageType,
  StageTypeSchema,
  upsertStageDoc,
} from "@acme/platform-core/repositories/businessOs.server";

import { requireAgentAuth } from "@/lib/auth/middleware";
import { getDb } from "@/lib/d1.server";
import { computeEntitySha } from "@/lib/entity-sha";

const CreateStageDocSchema = z.object({
  cardId: z.string().min(1),
  stage: z.string().min(1),
  content: z.string().min(1),
});
// i18n-exempt -- BOS-02 API validation message [ttl=2026-12-31]
const INVALID_REQUEST_ERROR = "Invalid request";
// i18n-exempt -- BOS-02 API validation message [ttl=2026-12-31]
const INVALID_STAGE_ERROR = "Invalid stage";

/**
 * GET /api/agent/stage-docs
 * List stage docs for a card (D1-hosted path).
 */
export async function GET(request: NextRequest) {
  const auth = await requireAgentAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const cardId = searchParams.get("cardId") ?? undefined;
  const stageParam = searchParams.get("stage") ?? undefined;

  if (!cardId) {
    return NextResponse.json(
      // i18n-exempt -- BOS-02 API validation message [ttl=2026-03-31]
      { error: "cardId is required" },
      { status: 400 }
    );
  }

  let stageFilter: StageType | undefined;

  if (stageParam) {
    const parsed = StageTypeSchema.safeParse(stageParam);
    if (!parsed.success) {
      return NextResponse.json(
        // i18n-exempt -- BOS-02 API validation message [ttl=2026-03-31]
        { error: "Invalid stage filter" },
        { status: 400 }
      );
    }

    stageFilter = parsed.data;
  }

  const db = getDb();
  const stageDocs = await listStageDocsForCard(db, cardId, stageFilter);

  return NextResponse.json({ stageDocs });
}

/**
 * POST /api/agent/stage-docs
 * Create a new stage doc with agent auth (D1-hosted path).
 */
export async function POST(request: NextRequest) {
  const auth = await requireAgentAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const parsed = CreateStageDocSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        // i18n-exempt -- BOS-02 API validation message [ttl=2026-03-31]
        { error: INVALID_REQUEST_ERROR, details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { cardId, stage: rawStage, content } = parsed.data;

    const stageParsed = StageTypeSchema.safeParse(rawStage);
    if (!stageParsed.success) {
      return NextResponse.json(
        // i18n-exempt -- BOS-02 API validation message [ttl=2026-03-31]
        {
          error: INVALID_REQUEST_ERROR,
          details: [
            {
              code: "custom",
              path: ["stage"],
              message: INVALID_STAGE_ERROR,
            },
          ],
        },
        { status: 400 }
      );
    }

    const stage = stageParsed.data;

    const db = getDb();

    const card = await getCardById(db, cardId);
    if (!card) {
      return NextResponse.json(
        // i18n-exempt -- BOS-02 API validation message [ttl=2026-03-31]
        { error: "Parent card not found" },
        { status: 400 }
      );
    }

    const created = new Date().toISOString().split("T")[0];
    const stageDocBase: StageDoc = StageDocSchema.parse({
      Type: "Stage",
      Stage: stage,
      "Card-ID": cardId,
      Created: created,
      content,
      filePath: `docs/business-os/cards/${cardId}/${stage}.user.md`,
    });

    const stageDoc: StageDoc = {
      ...stageDocBase,
      fileSha: await computeEntitySha(stageDocBase as Record<string, unknown>),
    };

    const result = await upsertStageDoc(db, stageDoc, null);
    if (!result.success) {
      return NextResponse.json(
        // i18n-exempt -- BOS-02 API error message [ttl=2026-03-31]
        { error: "Failed to create stage doc" },
        { status: 500 }
      );
    }

    await appendAuditEntry(db, {
      entity_type: "stage_doc",
      entity_id: `${cardId}:${stage}`,
      action: "create",
      actor: "agent",
      changes_json: JSON.stringify({ cardId, stage }),
    });

    return NextResponse.json(
      {
        success: true,
        // i18n-exempt -- BOS-02 API success message [ttl=2026-03-31]
        message: "Stage doc created",
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
