/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/logistics/lanes/[id]/versions.ts

import type { PipelineEventContext } from "../../../_lib/types";
import { z } from "zod";
import { getDb, nowIso, type PipelineEnv } from "../../../_lib/db";
import { errorResponse, jsonResponse } from "../../../_lib/response";

type VersionRow = {
  id: string;
  lane_id: string;
  version_label: string | null;
  status: string | null;
  confidence: string | null;
  expires_at: string | null;
  currency: string | null;
  source_currency: string | null;
  fx_rate: number | null;
  fx_date: string | null;
  fx_source: string | null;
  lead_time_low_days: number | null;
  lead_time_base_days: number | null;
  lead_time_high_days: number | null;
  cost_basis: string | null;
  cost_amount: number | null;
  cost_minimum: number | null;
  included_notes: string | null;
  excluded_notes: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  evidence_count: number | null;
};

const statusSchema = z.enum(["active", "superseded", "expired", "draft"]);
const confidenceSchema = z.enum(["C0", "C1", "C2", "C3"]);

const createSchema = z.object({
  versionLabel: z.string().min(1).optional(),
  status: statusSchema.optional(),
  confidence: confidenceSchema,
  expiresAt: z.string().min(1).nullable().optional(),
  currency: z.string().min(1),
  sourceCurrency: z.string().min(1).nullable().optional(),
  fxRate: z.number().positive().nullable().optional(),
  fxDate: z.string().min(1).nullable().optional(),
  fxSource: z.string().min(1).nullable().optional(),
  leadTimeLowDays: z.number().int().min(0).nullable().optional(),
  leadTimeBaseDays: z.number().int().min(0).nullable().optional(),
  leadTimeHighDays: z.number().int().min(0).nullable().optional(),
  costBasis: z.string().min(1).nullable().optional(),
  costAmount: z.number().min(0).nullable().optional(),
  costMinimum: z.number().min(0).nullable().optional(),
  includedNotes: z.string().min(1).nullable().optional(),
  excludedNotes: z.string().min(1).nullable().optional(),
  notes: z.string().min(1).nullable().optional(),
});

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

function mapVersion(row: VersionRow) {
  return {
    id: row.id,
    laneId: row.lane_id,
    versionLabel: row.version_label,
    status: row.status,
    confidence: row.confidence,
    expiresAt: row.expires_at,
    currency: row.currency,
    sourceCurrency: row.source_currency,
    fxRate: row.fx_rate,
    fxDate: row.fx_date,
    fxSource: row.fx_source,
    leadTimeLowDays: row.lead_time_low_days,
    leadTimeBaseDays: row.lead_time_base_days,
    leadTimeHighDays: row.lead_time_high_days,
    costBasis: row.cost_basis,
    costAmount: row.cost_amount,
    costMinimum: row.cost_minimum,
    includedNotes: row.included_notes,
    excludedNotes: row.excluded_notes,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    evidenceCount: row.evidence_count ?? 0,
  };
}

export const onRequestGet = async ({
  params,
  request,
  env,
}: PipelineEventContext<PipelineEnv, { id: string }>) => {
  const laneId = String(params["id"]);
  const url = new URL(request.url);
  const limit = parseIntParam(url.searchParams.get("limit"), 20, 1, 200);
  const offset = parseIntParam(url.searchParams.get("offset"), 0, 0, 10_000);

  const db = getDb(env);
  const lane = await db
    .prepare("SELECT id FROM logistics_lanes WHERE id = ?")
    .bind(laneId)
    .first<{ id: string }>();
  if (!lane) {
    return errorResponse(404, "lane_not_found", { laneId });
  }

  const versions = await db
    .prepare(
      `
      SELECT
        lane_versions.id,
        lane_versions.lane_id,
        lane_versions.version_label,
        lane_versions.status,
        lane_versions.confidence,
        lane_versions.expires_at,
        lane_versions.currency,
        lane_versions.source_currency,
        lane_versions.fx_rate,
        lane_versions.fx_date,
        lane_versions.fx_source,
        lane_versions.lead_time_low_days,
        lane_versions.lead_time_base_days,
        lane_versions.lead_time_high_days,
        lane_versions.cost_basis,
        lane_versions.cost_amount,
        lane_versions.cost_minimum,
        lane_versions.included_notes,
        lane_versions.excluded_notes,
        lane_versions.notes,
        lane_versions.created_at,
        lane_versions.updated_at,
        evidence_counts.evidence_count AS evidence_count
      FROM lane_versions
      LEFT JOIN (
        SELECT lane_version_id, COUNT(*) AS evidence_count
        FROM lane_version_evidence
        GROUP BY lane_version_id
      ) AS evidence_counts
      ON evidence_counts.lane_version_id = lane_versions.id
      WHERE lane_versions.lane_id = ?
      ORDER BY lane_versions.created_at DESC
      LIMIT ? OFFSET ?
    `,
    )
    .bind(laneId, limit, offset)
    .all<VersionRow>();

  return jsonResponse({
    ok: true,
    laneId,
    versions: (versions.results ?? []).map(mapVersion),
    limit,
    offset,
  });
};

export const onRequestPost = async ({
  params,
  request,
  env,
}: PipelineEventContext<PipelineEnv, { id: string }>) => {
  const laneId = String(params["id"]);
  const raw = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse(400, "invalid_body", {
      issues: parsed.error.flatten(),
    });
  }

  const db = getDb(env);
  const lane = await db
    .prepare("SELECT id FROM logistics_lanes WHERE id = ?")
    .bind(laneId)
    .first<{ id: string }>();
  if (!lane) {
    return errorResponse(404, "lane_not_found", { laneId });
  }

  const {
    versionLabel,
    status,
    confidence,
    expiresAt,
    currency,
    sourceCurrency,
    fxRate,
    fxDate,
    fxSource,
    leadTimeLowDays,
    leadTimeBaseDays,
    leadTimeHighDays,
    costBasis,
    costAmount,
    costMinimum,
    includedNotes,
    excludedNotes,
    notes,
  } = parsed.data;

  const id = crypto.randomUUID();
  const now = nowIso();

  await db
    .prepare(
      `
      INSERT INTO lane_versions (
        id,
        lane_id,
        version_label,
        status,
        confidence,
        expires_at,
        currency,
        source_currency,
        fx_rate,
        fx_date,
        fx_source,
        lead_time_low_days,
        lead_time_base_days,
        lead_time_high_days,
        cost_basis,
        cost_amount,
        cost_minimum,
        included_notes,
        excluded_notes,
        notes,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    )
    .bind(
      id,
      laneId,
      versionLabel ?? null,
      status ?? "active",
      confidence,
      expiresAt ?? null,
      currency,
      sourceCurrency ?? null,
      fxRate ?? null,
      fxDate ?? null,
      fxSource ?? null,
      leadTimeLowDays ?? null,
      leadTimeBaseDays ?? null,
      leadTimeHighDays ?? null,
      costBasis ?? null,
      costAmount ?? null,
      costMinimum ?? null,
      includedNotes ?? null,
      excludedNotes ?? null,
      notes ?? null,
      now,
      now,
    )
    .run();

  return jsonResponse(
    {
      ok: true,
      version: {
        id,
        laneId,
        versionLabel: versionLabel ?? null,
        status: status ?? "active",
        confidence,
        expiresAt: expiresAt ?? null,
        currency,
        sourceCurrency: sourceCurrency ?? null,
        fxRate: fxRate ?? null,
        fxDate: fxDate ?? null,
        fxSource: fxSource ?? null,
        leadTimeLowDays: leadTimeLowDays ?? null,
        leadTimeBaseDays: leadTimeBaseDays ?? null,
        leadTimeHighDays: leadTimeHighDays ?? null,
        costBasis: costBasis ?? null,
        costAmount: costAmount ?? null,
        costMinimum: costMinimum ?? null,
        includedNotes: includedNotes ?? null,
        excludedNotes: excludedNotes ?? null,
        notes: notes ?? null,
        createdAt: now,
        updatedAt: now,
      },
    },
    201,
  );
};
