/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/candidates/[id].ts

import type { PipelineEventContext } from "../_lib/types";
import { z } from "zod";
import { isCooldownActive } from "@/lib/pipeline/cooldown";
import { getDb, nowIso, type PipelineEnv, type CooldownRow } from "../_lib/db";
import { errorResponse, jsonResponse } from "../_lib/response";

type CandidateDetailRow = {
  id: string;
  lead_id: string | null;
  fingerprint: string | null;
  stage_status: string | null;
  decision: string | null;
  decision_reason: string | null;
  created_at: string | null;
  updated_at: string | null;
  lead_title: string | null;
  lead_source: string | null;
  lead_url: string | null;
  lead_status: string | null;
};

type StageRunDetailRow = {
  id: string;
  candidate_id: string | null;
  stage: string;
  status: string;
  input_version: string | null;
  input_json: string | null;
  output_json: string | null;
  error_json: string | null;
  created_at: string | null;
  started_at: string | null;
  finished_at: string | null;
};

type ArtifactRow = {
  id: string;
  candidate_id: string | null;
  stage_run_id: string | null;
  kind: string | null;
  uri: string | null;
  checksum: string | null;
  created_at: string | null;
};

type CooldownInfo = {
  id: string;
  fingerprint: string;
  reasonCode: string;
  severity: string;
  recheckAfter: string | null;
  whatWouldChange: string | null;
  createdAt: string | null;
  active: boolean;
};

const updateSchema = z
  .object({
    stageStatus: z.string().min(1).nullable().optional(),
    decision: z.string().min(1).nullable().optional(),
    decisionReason: z.string().min(1).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    const hasUpdate = Object.values(data).some((value) => value !== undefined);
    if (!hasUpdate) {
      ctx.addIssue({ code: "custom", path: [], message: "empty_update" });
    }
  });

function safeJsonParse(value: string | null): unknown | null {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export const onRequestGet = async ({
  params,
  env,
}: PipelineEventContext<PipelineEnv, { id: string }>) => {
  const candidateId = String(params["id"]);
  const db = getDb(env);

  const candidate = await db
    .prepare(
      `
      SELECT
        candidates.id,
        candidates.lead_id,
        candidates.fingerprint,
        candidates.stage_status,
        candidates.decision,
        candidates.decision_reason,
        candidates.created_at,
        candidates.updated_at,
        leads.title as lead_title,
        leads.source as lead_source,
        leads.url as lead_url,
        leads.status as lead_status
      FROM candidates
      LEFT JOIN leads ON leads.id = candidates.lead_id
      WHERE candidates.id = ?
    `,
    )
    .bind(candidateId)
    .first<CandidateDetailRow>();

  if (!candidate) {
    return errorResponse(404, "candidate_not_found", { candidateId });
  }

  const stageRunsResult = await db
    .prepare(
      "SELECT id, candidate_id, stage, status, input_version, input_json, output_json, error_json, created_at, started_at, finished_at FROM stage_runs WHERE candidate_id = ? ORDER BY created_at DESC",
    )
    .bind(candidateId)
    .all<StageRunDetailRow>();

  const artifactsResult = await db
    .prepare(
      "SELECT id, candidate_id, stage_run_id, kind, uri, checksum, created_at FROM artifacts WHERE candidate_id = ? ORDER BY created_at DESC",
    )
    .bind(candidateId)
    .all<ArtifactRow>();

  let cooldown: CooldownInfo | null = null;
  if (candidate.fingerprint) {
    const cooldownRow = await db
      .prepare(
        "SELECT id, fingerprint, reason_code, severity, recheck_after, what_would_change, snapshot_json, created_at FROM cooldowns WHERE fingerprint = ? ORDER BY created_at DESC LIMIT 1",
      )
      .bind(candidate.fingerprint)
      .first<CooldownRow>();
    if (cooldownRow) {
      cooldown = {
        id: cooldownRow.id,
        fingerprint: cooldownRow.fingerprint,
        reasonCode: cooldownRow.reason_code,
        severity: cooldownRow.severity,
        recheckAfter: cooldownRow.recheck_after,
        whatWouldChange: cooldownRow.what_would_change,
        createdAt: cooldownRow.created_at,
        active: isCooldownActive(
          cooldownRow.severity,
          cooldownRow.recheck_after,
        ),
      };
    }
  }

  return jsonResponse({
    ok: true,
    candidate: {
      id: candidate.id,
      leadId: candidate.lead_id,
      fingerprint: candidate.fingerprint,
      stageStatus: candidate.stage_status,
      decision: candidate.decision,
      decisionReason: candidate.decision_reason,
      createdAt: candidate.created_at,
      updatedAt: candidate.updated_at,
      cooldown,
      lead: candidate.lead_id
        ? {
            id: candidate.lead_id,
            title: candidate.lead_title,
            source: candidate.lead_source,
            url: candidate.lead_url,
            status: candidate.lead_status,
          }
        : null,
    },
    stageRuns: (stageRunsResult.results ?? []).map((row) => ({
      id: row.id,
      candidateId: row.candidate_id,
      stage: row.stage,
      status: row.status,
      inputVersion: row.input_version,
      input: safeJsonParse(row.input_json),
      output: safeJsonParse(row.output_json),
      error: safeJsonParse(row.error_json),
      createdAt: row.created_at,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
    })),
    artifacts: (artifactsResult.results ?? []).map((row) => ({
      id: row.id,
      candidateId: row.candidate_id,
      stageRunId: row.stage_run_id,
      kind: row.kind,
      uri: row.uri,
      checksum: row.checksum,
      createdAt: row.created_at,
    })),
  });
};

export const onRequestPatch = async ({
  params,
  request,
  env,
}: PipelineEventContext<PipelineEnv, { id: string }>) => {
  const candidateId = String(params["id"]);
  const raw = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse(400, "invalid_body", {
      issues: parsed.error.flatten(),
    });
  }

  const db = getDb(env);
  const update = parsed.data;
  const fields: string[] = [];
  const binds: Array<string | null> = [];

  if (update.stageStatus !== undefined) {
    fields.push("stage_status = ?");
    binds.push(update.stageStatus);
  }
  if (update.decision !== undefined) {
    fields.push("decision = ?");
    binds.push(update.decision);
  }
  if (update.decisionReason !== undefined) {
    fields.push("decision_reason = ?");
    binds.push(update.decisionReason);
  }

  const now = nowIso();
  const query = `UPDATE candidates SET ${fields.join(", ")}, updated_at = ? WHERE id = ?`;
  binds.push(now, candidateId);

  const result = await db.prepare(query).bind(...binds).run();
  if ((result.meta?.changes ?? 0) === 0) {
    return errorResponse(404, "candidate_not_found", { candidateId });
  }

  return jsonResponse({ ok: true });
};
