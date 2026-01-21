/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/logistics/lanes/[id].ts

import { z } from "zod";

import { getDb, nowIso, type PipelineEnv } from "../../_lib/db";
import { errorResponse, jsonResponse } from "../../_lib/response";
import type { PipelineEventContext } from "../../_lib/types";

type LaneRow = {
  id: string;
  name: string;
  model: string;
  origin: string | null;
  destination: string | null;
  destination_type: string | null;
  incoterm: string | null;
  description: string | null;
  active: number | null;
  created_at: string | null;
  updated_at: string | null;
};

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
  actuals_count: number | null;
  actual_cost_avg: number | null;
  actual_lead_time_avg: number | null;
  actuals_latest_at: string | null;
};

const updateSchema = z
  .object({
    name: z.string().min(1).optional(),
    model: z.string().min(1).optional(),
    origin: z.string().min(1).nullable().optional(),
    destination: z.string().min(1).nullable().optional(),
    destinationType: z.string().min(1).nullable().optional(),
    incoterm: z.string().min(1).nullable().optional(),
    description: z.string().min(1).nullable().optional(),
    active: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const hasUpdate = Object.values(data).some((value) => value !== undefined);
    if (!hasUpdate) {
      ctx.addIssue({ code: "custom", path: [], message: "empty_update" });
    }
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

function mapLane(row: LaneRow) {
  return {
    id: row.id,
    name: row.name,
    model: row.model,
    origin: row.origin,
    destination: row.destination,
    destinationType: row.destination_type,
    incoterm: row.incoterm,
    description: row.description,
    active: row.active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapVersion(row: VersionRow) {
  const actualCostVariancePct =
    row.actual_cost_avg !== null &&
    row.actual_cost_avg !== undefined &&
    row.cost_amount !== null &&
    row.cost_amount !== undefined &&
    row.cost_amount !== 0
      ? (row.actual_cost_avg - row.cost_amount) / row.cost_amount
      : null;
  const actualLeadTimeVariancePct =
    row.actual_lead_time_avg !== null &&
    row.actual_lead_time_avg !== undefined &&
    row.lead_time_base_days !== null &&
    row.lead_time_base_days !== undefined &&
    row.lead_time_base_days !== 0
      ? (row.actual_lead_time_avg - row.lead_time_base_days) /
        row.lead_time_base_days
      : null;

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
    actualsCount: row.actuals_count ?? 0,
    actualCostAvg: row.actual_cost_avg ?? null,
    actualLeadTimeAvg: row.actual_lead_time_avg ?? null,
    actualsLatestAt: row.actuals_latest_at ?? null,
    actualCostVariancePct,
    actualLeadTimeVariancePct,
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
    .prepare(
      "SELECT id, name, model, origin, destination, destination_type, incoterm, description, active, created_at, updated_at FROM logistics_lanes WHERE id = ?",
    )
    .bind(laneId)
    .first<LaneRow>();

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
        evidence_counts.evidence_count AS evidence_count,
        actuals_stats.actuals_count AS actuals_count,
        actuals_stats.actual_cost_avg AS actual_cost_avg,
        actuals_stats.actual_lead_time_avg AS actual_lead_time_avg,
        actuals_stats.actuals_latest_at AS actuals_latest_at
      FROM lane_versions
      LEFT JOIN (
        SELECT lane_version_id, COUNT(*) AS evidence_count
        FROM lane_version_evidence
        GROUP BY lane_version_id
      ) AS evidence_counts
      ON evidence_counts.lane_version_id = lane_versions.id
      LEFT JOIN (
        SELECT
          lane_version_id,
          COUNT(*) AS actuals_count,
          AVG(actual_cost_amount) AS actual_cost_avg,
          AVG(actual_lead_time_days) AS actual_lead_time_avg,
          MAX(created_at) AS actuals_latest_at
        FROM lane_actuals
        GROUP BY lane_version_id
      ) AS actuals_stats
      ON actuals_stats.lane_version_id = lane_versions.id
      WHERE lane_versions.lane_id = ?
      ORDER BY lane_versions.created_at DESC
      LIMIT ? OFFSET ?
    `,
    )
    .bind(laneId, limit, offset)
    .all<VersionRow>();

  const versionCount = await db
    .prepare("SELECT COUNT(*) as count FROM lane_versions WHERE lane_id = ?")
    .bind(laneId)
    .first<{ count: number }>();

  return jsonResponse({
    ok: true,
    lane: mapLane(lane),
    versions: (versions.results ?? []).map(mapVersion),
    versionCount: versionCount?.count ?? 0,
    limit,
    offset,
  });
};

export const onRequestPatch = async ({
  params,
  request,
  env,
}: PipelineEventContext<PipelineEnv, { id: string }>) => {
  const laneId = String(params["id"]);
  const raw = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse(400, "invalid_body", {
      issues: parsed.error.flatten(),
    });
  }

  const update = parsed.data;
  const fields: string[] = [];
  const binds: Array<string | number | null> = [];

  if (update.name !== undefined) {
    fields.push("name = ?");
    binds.push(update.name);
  }
  if (update.model !== undefined) {
    fields.push("model = ?");
    binds.push(update.model);
  }
  if (update.origin !== undefined) {
    fields.push("origin = ?");
    binds.push(update.origin);
  }
  if (update.destination !== undefined) {
    fields.push("destination = ?");
    binds.push(update.destination);
  }
  if (update.destinationType !== undefined) {
    fields.push("destination_type = ?");
    binds.push(update.destinationType);
  }
  if (update.incoterm !== undefined) {
    fields.push("incoterm = ?");
    binds.push(update.incoterm);
  }
  if (update.description !== undefined) {
    fields.push("description = ?");
    binds.push(update.description);
  }
  if (update.active !== undefined) {
    fields.push("active = ?");
    binds.push(update.active ? 1 : 0);
  }

  const now = nowIso();
  const query = `UPDATE logistics_lanes SET ${fields.join(", ")}, updated_at = ? WHERE id = ?`;
  binds.push(now, laneId);

  const db = getDb(env);
  const result = await db.prepare(query).bind(...binds).run();
  if ((result.meta?.changes ?? 0) === 0) {
    return errorResponse(404, "lane_not_found", { laneId });
  }

  const lane = await db
    .prepare(
      "SELECT id, name, model, origin, destination, destination_type, incoterm, description, active, created_at, updated_at FROM logistics_lanes WHERE id = ?",
    )
    .bind(laneId)
    .first<LaneRow>();

  if (!lane) {
    return errorResponse(404, "lane_not_found", { laneId });
  }

  return jsonResponse({ ok: true, lane: mapLane(lane) });
};
