import { type NextRequest,NextResponse } from "next/server";
import { z } from "zod";

import {
  appendAuditEntry,
  getLatestStageDoc,
  type StageDoc,
  StageDocSchema,
  StageTypeSchema,
  upsertStageDoc,
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
    cardId: string;
    stage: string;
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

function stripFileSha(stageDoc: StageDoc): Omit<StageDoc, "fileSha"> {
  const { fileSha: _fileSha, ...rest } = stageDoc;
  return rest;
}

async function computeStageDocEntitySha(stageDoc: StageDoc): Promise<string> {
  return computeEntitySha(stripFileSha(stageDoc) as Record<string, unknown>);
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
 * GET /api/agent/stage-docs/[cardId]/[stage]
 * Fetch a stage doc with entity SHA for optimistic concurrency.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAgentAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { cardId, stage } = await params;
  const stageResult = StageTypeSchema.safeParse(stage);
  if (!stageResult.success) {
    return NextResponse.json(
      // i18n-exempt -- BOS-02 API validation message [ttl=2026-03-31]
      { error: "Invalid stage" },
      { status: 400 }
    );
  }

  const db = getDb();
  const stageDoc = await getLatestStageDoc(db, cardId, stageResult.data);

  if (!stageDoc) {
    return NextResponse.json(
      // i18n-exempt -- BOS-02 API not found message [ttl=2026-03-31]
      { error: "Stage doc not found" },
      { status: 404 }
    );
  }

  const entitySha = await computeStageDocEntitySha(stageDoc);
  return NextResponse.json({ entity: stageDoc, entitySha });
}

/**
 * PATCH /api/agent/stage-docs/[cardId]/[stage]
 * Update stage doc with JSON Merge Patch + optimistic concurrency.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAgentAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { cardId, stage } = await params;
  const stageResult = StageTypeSchema.safeParse(stage);
  if (!stageResult.success) {
    return NextResponse.json(
      // i18n-exempt -- BOS-02 API validation message [ttl=2026-03-31]
      { error: "Invalid stage" },
      { status: 400 }
    );
  }

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

  if (!isPlainObject(parsed.data.patch)) {
    return NextResponse.json(
      // i18n-exempt -- BOS-02 API validation message [ttl=2026-03-31]
      { error: "Invalid patch payload" },
      { status: 400 }
    );
  }

  const db = getDb();
  const currentStageDoc = await getLatestStageDoc(db, cardId, stageResult.data);
  if (!currentStageDoc) {
    return NextResponse.json(
      // i18n-exempt -- BOS-02 API not found message [ttl=2026-03-31]
      { error: "Stage doc not found" },
      { status: 404 }
    );
  }

  const currentEntitySha = await computeStageDocEntitySha(currentStageDoc);
  if (currentEntitySha !== parsed.data.baseEntitySha) {
    return NextResponse.json(
      {
        error: "CONFLICT",
        // i18n-exempt -- BOS-02 API conflict message [ttl=2026-03-31]
        message: "Entity modified since last read",
        currentEntitySha,
        entity: currentStageDoc,
      },
      { status: 409 }
    );
  }

  const merged = applyMergePatch(currentStageDoc, parsed.data.patch);
  if (!isPlainObject(merged)) {
    return NextResponse.json(
      // i18n-exempt -- BOS-02 API validation message [ttl=2026-03-31]
      { error: "Invalid patch payload" },
      { status: 400 }
    );
  }

  const updatedDate = new Date().toISOString().split("T")[0];
  const updatedStageDocBase: StageDoc = {
    ...(merged as StageDoc),
    Type: "Stage",
    Stage: stageResult.data,
    "Card-ID": cardId,
    Updated: updatedDate,
    filePath: `docs/business-os/cards/${cardId}/${stageResult.data}.user.md`,
  };

  const validation = StageDocSchema.safeParse(updatedStageDocBase);
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

  const updatedStageDoc: StageDoc = {
    ...validation.data,
    fileSha: entitySha,
  };

  const result = await upsertStageDoc(db, updatedStageDoc, null);
  if (!result.success) {
    return NextResponse.json(
      // i18n-exempt -- BOS-02 API error message [ttl=2026-03-31]
      { error: "Failed to update stage doc" },
      { status: 500 }
    );
  }

  await appendAuditEntry(db, {
    entity_type: "stage_doc",
    entity_id: `${cardId}:${stageResult.data}`,
    action: "update",
    actor: "agent",
    changes_json: JSON.stringify({ updated_at: updatedDate }),
  });

  return NextResponse.json({ entity: updatedStageDoc, entitySha });
}
