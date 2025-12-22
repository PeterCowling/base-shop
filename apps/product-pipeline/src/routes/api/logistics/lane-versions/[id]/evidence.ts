/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/logistics/lane-versions/[id]/evidence.ts

import type { PipelineEventContext } from "../../../_lib/types";
import { z } from "zod";
import { getDb, nowIso, type PipelineEnv } from "../../../_lib/db";
import { errorResponse, jsonResponse } from "../../../_lib/response";

type EvidenceRow = {
  id: string;
  lane_version_id: string;
  kind: string;
  uri: string;
  checksum: string | null;
  created_at: string | null;
};

const createSchema = z.object({
  kind: z.string().min(1),
  uri: z.string().min(1),
  checksum: z.string().min(1).optional(),
});

export const onRequestGet = async ({
  params,
  env,
}: PipelineEventContext<PipelineEnv, { id: string }>) => {
  const versionId = String(params["id"]);
  const db = getDb(env);

  const version = await db
    .prepare("SELECT id FROM lane_versions WHERE id = ?")
    .bind(versionId)
    .first<{ id: string }>();
  if (!version) {
    return errorResponse(404, "lane_version_not_found", { versionId });
  }

  const evidence = await db
    .prepare(
      "SELECT id, lane_version_id, kind, uri, checksum, created_at FROM lane_version_evidence WHERE lane_version_id = ? ORDER BY created_at DESC",
    )
    .bind(versionId)
    .all<EvidenceRow>();

  return jsonResponse({
    ok: true,
    laneVersionId: versionId,
    evidence: (evidence.results ?? []).map((row) => ({
      id: row.id,
      laneVersionId: row.lane_version_id,
      kind: row.kind,
      uri: row.uri,
      checksum: row.checksum,
      createdAt: row.created_at,
    })),
  });
};

export const onRequestPost = async ({
  params,
  request,
  env,
}: PipelineEventContext<PipelineEnv, { id: string }>) => {
  const versionId = String(params["id"]);
  const raw = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse(400, "invalid_body", {
      issues: parsed.error.flatten(),
    });
  }

  const db = getDb(env);
  const version = await db
    .prepare("SELECT id FROM lane_versions WHERE id = ?")
    .bind(versionId)
    .first<{ id: string }>();
  if (!version) {
    return errorResponse(404, "lane_version_not_found", { versionId });
  }

  const { kind, uri, checksum } = parsed.data;
  const now = nowIso();
  const id = crypto.randomUUID();

  await db
    .prepare(
      "INSERT INTO lane_version_evidence (id, lane_version_id, kind, uri, checksum, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(id, versionId, kind, uri, checksum ?? null, now)
    .run();

  return jsonResponse(
    {
      ok: true,
      evidence: {
        id,
        laneVersionId: versionId,
        kind,
        uri,
        checksum: checksum ?? null,
        createdAt: now,
      },
    },
    201,
  );
};
