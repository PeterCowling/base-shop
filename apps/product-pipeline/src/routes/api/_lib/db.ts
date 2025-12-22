/* i18n-exempt file -- PP-1100 internal pipeline API helpers [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/_lib/db.ts

import type { D1Database, Queue, R2Bucket } from "./types";

export type PipelineEnv = {
  PIPELINE_DB?: D1Database;
  PIPELINE_EVIDENCE?: R2Bucket;
  PIPELINE_PROMOTION_DAILY_LIMIT?: string;
  PIPELINE_STAGE_M_AMAZON_DAILY_LIMIT?: string;
  PIPELINE_STAGE_M_TAOBAO_DAILY_LIMIT?: string;
  PIPELINE_STAGE_M_CAPTURE_MODE_AMAZON?: string;
  PIPELINE_STAGE_M_CAPTURE_MODE_TAOBAO?: string;
  PIPELINE_STAGE_M_CAPTURE_PROFILES_AMAZON?: string;
  PIPELINE_STAGE_M_CAPTURE_PROFILES_TAOBAO?: string;
  PIPELINE_QUEUE?: Queue;
};

export type LeadRow = {
  id: string;
  source: string | null;
  source_context: string | null;
  title: string | null;
  url: string | null;
  price_band: string | null;
  fingerprint: string | null;
  duplicate_of: string | null;
  status: string | null;
  triage_score: number | null;
  triage_band: string | null;
  triage_reasons: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CandidateRow = {
  id: string;
  lead_id: string | null;
  fingerprint: string | null;
  stage_status: string | null;
  decision: string | null;
  decision_reason: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type StageRunRow = {
  id: string;
  candidate_id: string | null;
  stage: string;
  status: string;
  input_json: string | null;
  output_json: string | null;
  error_json: string | null;
  created_at: string | null;
  started_at: string | null;
  finished_at: string | null;
};

export type CooldownRow = {
  id: string;
  fingerprint: string;
  reason_code: string;
  severity: string;
  recheck_after: string | null;
  what_would_change: string | null;
  snapshot_json: string | null;
  created_at: string | null;
};

export function getDb(env: PipelineEnv): D1Database {
  if (!env.PIPELINE_DB) {
    throw new Error("PIPELINE_DB binding missing");
  }
  return env.PIPELINE_DB;
}

export function getEvidenceBucket(env: PipelineEnv): R2Bucket {
  if (!env.PIPELINE_EVIDENCE) {
    throw new Error("PIPELINE_EVIDENCE binding missing");
  }
  return env.PIPELINE_EVIDENCE;
}

export function nowIso(): string {
  return new Date().toISOString();
}

function buildPlaceholders(count: number): string {
  return Array.from({ length: count }, () => "?").join(", ");
}

export async function fetchLeadsByIds(
  db: D1Database,
  ids: string[],
): Promise<LeadRow[]> {
  if (ids.length === 0) return [];
  const placeholders = buildPlaceholders(ids.length);
  const query = `SELECT id, source, source_context, title, url, price_band, fingerprint, duplicate_of, status, triage_score, triage_band, triage_reasons, created_at, updated_at FROM leads WHERE id IN (${placeholders})`;
  const result = await db.prepare(query).bind(...ids).all<LeadRow>();
  return result.results ?? [];
}

export async function fetchCandidateById(
  db: D1Database,
  id: string,
): Promise<CandidateRow | null> {
  const result = await db
    .prepare(
      "SELECT id, lead_id, fingerprint, stage_status, decision, decision_reason, created_at, updated_at FROM candidates WHERE id = ?",
    )
    .bind(id)
    .first<CandidateRow>();
  return result ?? null;
}

export async function fetchLatestCooldownByFingerprint(
  db: D1Database,
  fingerprint: string,
): Promise<CooldownRow | null> {
  const result = await db
    .prepare(
      "SELECT id, fingerprint, reason_code, severity, recheck_after, what_would_change, snapshot_json, created_at FROM cooldowns WHERE fingerprint = ? ORDER BY created_at DESC LIMIT 1",
    )
    .bind(fingerprint)
    .first<CooldownRow>();
  return result ?? null;
}

export async function fetchCooldownsByFingerprints(
  db: D1Database,
  fingerprints: string[],
): Promise<Map<string, CooldownRow>> {
  if (fingerprints.length === 0) return new Map();
  const placeholders = buildPlaceholders(fingerprints.length);
  const result = await db
    .prepare(
      `
      SELECT
        cooldowns.id,
        cooldowns.fingerprint,
        cooldowns.reason_code,
        cooldowns.severity,
        cooldowns.recheck_after,
        cooldowns.what_would_change,
        cooldowns.snapshot_json,
        cooldowns.created_at
      FROM cooldowns
      INNER JOIN (
        SELECT fingerprint, MAX(created_at) AS latest_created_at
        FROM cooldowns
        WHERE fingerprint IN (${placeholders})
        GROUP BY fingerprint
      ) AS latest
      ON cooldowns.fingerprint = latest.fingerprint
      AND cooldowns.created_at = latest.latest_created_at
    `,
    )
    .bind(...fingerprints)
    .all<CooldownRow>();

  const map = new Map<string, CooldownRow>();
  for (const row of result.results ?? []) {
    map.set(row.fingerprint, row);
  }
  return map;
}

export async function fetchStageRunById(
  db: D1Database,
  id: string,
): Promise<StageRunRow | null> {
  const result = await db
    .prepare(
      "SELECT id, candidate_id, stage, status, input_json, output_json, error_json, created_at, started_at, finished_at FROM stage_runs WHERE id = ?",
    )
    .bind(id)
    .first<StageRunRow>();
  return result ?? null;
}
