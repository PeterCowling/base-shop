import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  appendAuditEntry,
  getIdeaById,
  type Idea,
  IdeaLocationSchema,
  IdeaSchema,
  upsertIdea,
} from "@acme/platform-core/repositories/businessOs.server";

import { requireAgentAuth } from "@/lib/auth/middleware";
import { getDb } from "@/lib/d1.server";
import { computeEntitySha } from "@/lib/entity-sha";

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

function stripFileSha(idea: Idea): Omit<Idea, "fileSha"> {
  const { fileSha: _fileSha, ...rest } = idea;
  return rest;
}

function getLocationFromFilePath(filePath: string | undefined): "inbox" | "worked" {
  if (filePath?.includes("/ideas/worked/")) {
    return "worked";
  }
  return "inbox";
}

async function computeIdeaEntitySha(idea: Idea): Promise<string> {
  return computeEntitySha(stripFileSha(idea) as Record<string, unknown>);
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
 * GET /api/agent/ideas/[id]
 * Fetch a single idea with entity SHA for optimistic concurrency.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAgentAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const db = getDb();
  const idea = await getIdeaById(db, id);

  if (!idea) {
    return NextResponse.json(
      // i18n-exempt -- BOS-02 API not found message [ttl=2026-03-31]
      { error: "Idea not found" },
      { status: 404 }
    );
  }

  const entitySha = await computeIdeaEntitySha(idea);
  return NextResponse.json({ entity: idea, entitySha });
}

/**
 * PATCH /api/agent/ideas/[id]
 * Update idea with JSON Merge Patch + optimistic concurrency.
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

  if (!isPlainObject(parsed.data.patch)) {
    return NextResponse.json(
      // i18n-exempt -- BOS-02 API validation message [ttl=2026-03-31]
      { error: "Invalid patch payload" },
      { status: 400 }
    );
  }

  const db = getDb();
  const currentIdea = await getIdeaById(db, id);
  if (!currentIdea) {
    return NextResponse.json(
      // i18n-exempt -- BOS-02 API not found message [ttl=2026-03-31]
      { error: "Idea not found" },
      { status: 404 }
    );
  }

  const currentEntitySha = await computeIdeaEntitySha(currentIdea);
  if (currentEntitySha !== parsed.data.baseEntitySha) {
    return NextResponse.json(
      {
        error: "CONFLICT",
        // i18n-exempt -- BOS-02 API conflict message [ttl=2026-03-31]
        message: "Entity modified since last read",
        currentEntitySha,
        entity: currentIdea,
      },
      { status: 409 }
    );
  }

  const { location: locationPatchRaw, ...ideaPatch } = parsed.data.patch;
  const currentLocation = getLocationFromFilePath(currentIdea.filePath);

  let locationOverride: "inbox" | "worked" | undefined;
  if (locationPatchRaw !== undefined) {
    const locationResult = IdeaLocationSchema.safeParse(locationPatchRaw);
    if (!locationResult.success) {
      return NextResponse.json(
        // i18n-exempt -- BOS-02 API validation message [ttl=2026-03-31]
        { error: "Invalid location value" },
        { status: 400 }
      );
    }
    locationOverride = locationResult.data;
  }

  const merged = applyMergePatch(currentIdea, ideaPatch);
  if (!isPlainObject(merged)) {
    return NextResponse.json(
      // i18n-exempt -- BOS-02 API validation message [ttl=2026-03-31]
      { error: "Invalid patch payload" },
      { status: 400 }
    );
  }

  const mergedIdea = merged as Idea;
  const nextLocation = locationOverride ?? currentLocation;
  const locationChanged = nextLocation !== currentLocation;
  const nextStatus =
    locationChanged &&
    (mergedIdea.Status === "raw" || mergedIdea.Status === "worked" || !mergedIdea.Status)
      ? nextLocation === "worked"
        ? "worked"
        : "raw"
      : mergedIdea.Status;

  const updatedIdeaBase: Idea = {
    ...mergedIdea,
    Type: "Idea",
    ID: currentIdea.ID,
    Status: nextStatus,
    filePath: `docs/business-os/ideas/${nextLocation}/${currentIdea.ID}.user.md`,
  };

  const validation = IdeaSchema.safeParse(updatedIdeaBase);
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

  const updatedIdea: Idea = {
    ...validation.data,
    fileSha: entitySha,
  };

  const result = await upsertIdea(db, updatedIdea, nextLocation);
  if (!result.success) {
    return NextResponse.json(
      // i18n-exempt -- BOS-02 API error message [ttl=2026-03-31]
      { error: "Failed to update idea" },
      { status: 500 }
    );
  }

  await appendAuditEntry(db, {
    entity_type: "idea",
    entity_id: id,
    action: locationChanged ? "move" : "update",
    actor: "agent",
    changes_json: locationChanged
      ? JSON.stringify({ from: currentLocation, to: nextLocation })
      : JSON.stringify({ updated_at: new Date().toISOString() }),
  });

  return NextResponse.json({ entity: updatedIdea, entitySha });
}
