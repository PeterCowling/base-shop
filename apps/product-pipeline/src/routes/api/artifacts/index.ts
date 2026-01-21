/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/artifacts/index.ts

import { getDb, type PipelineEnv } from "../_lib/db";
import { jsonResponse } from "../_lib/response";
import type { PipelineEventContext } from "../_lib/types";

type ArtifactRow = {
  id: string;
  candidate_id: string | null;
  stage_run_id: string | null;
  kind: string | null;
  uri: string | null;
  checksum: string | null;
  created_at: string | null;
  stage: string | null;
  stage_status: string | null;
  lead_id: string | null;
  lead_title: string | null;
};

function parseIntParam(
  value: string | null,
  fallback: number,
  min: number,
  max: number,
): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export const onRequestGet = async ({
  request,
  env,
}: PipelineEventContext<PipelineEnv>) => {
  const db = getDb(env);
  const url = new URL(request.url);
  const limit = parseIntParam(url.searchParams.get("limit"), 50, 1, 200);
  const offset = parseIntParam(url.searchParams.get("offset"), 0, 0, 10_000);
  const candidateId = url.searchParams.get("candidate_id");

  const conditions: string[] = [];
  const binds: Array<string | number> = [];
  if (candidateId) {
    conditions.push("artifacts.candidate_id = ?");
    binds.push(candidateId);
  }

  let query = `
    SELECT
      artifacts.id,
      artifacts.candidate_id,
      artifacts.stage_run_id,
      artifacts.kind,
      artifacts.uri,
      artifacts.checksum,
      artifacts.created_at,
      stage_runs.stage AS stage,
      stage_runs.status AS stage_status,
      candidates.lead_id AS lead_id,
      leads.title AS lead_title
    FROM artifacts
    LEFT JOIN stage_runs ON stage_runs.id = artifacts.stage_run_id
    LEFT JOIN candidates ON candidates.id = artifacts.candidate_id
    LEFT JOIN leads ON leads.id = candidates.lead_id
  `;

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }
  query += " ORDER BY artifacts.created_at DESC LIMIT ? OFFSET ?";
  binds.push(limit, offset);

  const result = await db.prepare(query).bind(...binds).all<ArtifactRow>();

  const artifacts = (result.results ?? []).map((row) => ({
    id: row.id,
    candidateId: row.candidate_id,
    stageRunId: row.stage_run_id,
    kind: row.kind,
    uri: row.uri,
    checksum: row.checksum,
    createdAt: row.created_at,
    stage: row.stage,
    stageStatus: row.stage_status,
    lead: row.lead_id
      ? {
          id: row.lead_id,
          title: row.lead_title,
        }
      : null,
  }));

  return jsonResponse({ ok: true, artifacts, limit, offset });
};
