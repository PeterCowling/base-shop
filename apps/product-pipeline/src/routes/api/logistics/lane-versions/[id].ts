/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/logistics/lane-versions/[id].ts

import type { PipelineEventContext } from "../../_lib/types";
import { z } from "zod";
import { getDb, nowIso, type PipelineEnv } from "../../_lib/db";
import { errorResponse, jsonResponse } from "../../_lib/response";

type LaneRow = {
  id: string;
  name: string;
  model: string;
  origin: string | null;
  destination: string | null;
  destination_type: string | null;
  incoterm: string | null;
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
};

type EvidenceRow = {
  id: string;
  lane_version_id: string;
  kind: string;
  uri: string;
  checksum: string | null;
  created_at: string | null;
};

const statusSchema = z.enum(["active", "superseded", "expired", "draft"]);
const confidenceSchema = z.enum(["C0", "C1", "C2", "C3"]);

const updateSchema = z
  .object({
    versionLabel: z.string().min(1).nullable().optional(),
    status: statusSchema.optional(),
    confidence: confidenceSchema.optional(),
    expiresAt: z.string().min(1).nullable().optional(),
    currency: z.string().min(1).optional(),
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
  })
  .superRefine((data, ctx) => {
    const hasUpdate = Object.values(data).some((value) => value !== undefined);
    if (!hasUpdate) {
      ctx.addIssue({ code: "custom", path: [], message: "empty_update" });
    }
  });

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
  };
}

export const onRequestGet = async ({
  params,
  env,
}: PipelineEventContext<PipelineEnv, { id: string }>) => {
  const versionId = String(params["id"]);
  const db = getDb(env);

  const version = await db
    .prepare(
      `
      SELECT
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
      FROM lane_versions
      WHERE id = ?
    `,
    )
    .bind(versionId)
    .first<VersionRow>();

  if (!version) {
    return errorResponse(404, "lane_version_not_found", { versionId });
  }

  const lane = await db
    .prepare(
      "SELECT id, name, model, origin, destination, destination_type, incoterm FROM logistics_lanes WHERE id = ?",
    )
    .bind(version.lane_id)
    .first<LaneRow>();

  const evidence = await db
    .prepare(
      "SELECT id, lane_version_id, kind, uri, checksum, created_at FROM lane_version_evidence WHERE lane_version_id = ? ORDER BY created_at DESC",
    )
    .bind(versionId)
    .all<EvidenceRow>();

  return jsonResponse({
    ok: true,
    lane: lane
      ? {
          id: lane.id,
          name: lane.name,
          model: lane.model,
          origin: lane.origin,
          destination: lane.destination,
          destinationType: lane.destination_type,
          incoterm: lane.incoterm,
        }
      : null,
    version: mapVersion(version),
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

export const onRequestPatch = async ({
  params,
  request,
  env,
}: PipelineEventContext<PipelineEnv, { id: string }>) => {
  const versionId = String(params["id"]);
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

  if (update.versionLabel !== undefined) {
    fields.push("version_label = ?");
    binds.push(update.versionLabel);
  }
  if (update.status !== undefined) {
    fields.push("status = ?");
    binds.push(update.status);
  }
  if (update.confidence !== undefined) {
    fields.push("confidence = ?");
    binds.push(update.confidence);
  }
  if (update.expiresAt !== undefined) {
    fields.push("expires_at = ?");
    binds.push(update.expiresAt);
  }
  if (update.currency !== undefined) {
    fields.push("currency = ?");
    binds.push(update.currency);
  }
  if (update.sourceCurrency !== undefined) {
    fields.push("source_currency = ?");
    binds.push(update.sourceCurrency);
  }
  if (update.fxRate !== undefined) {
    fields.push("fx_rate = ?");
    binds.push(update.fxRate);
  }
  if (update.fxDate !== undefined) {
    fields.push("fx_date = ?");
    binds.push(update.fxDate);
  }
  if (update.fxSource !== undefined) {
    fields.push("fx_source = ?");
    binds.push(update.fxSource);
  }
  if (update.leadTimeLowDays !== undefined) {
    fields.push("lead_time_low_days = ?");
    binds.push(update.leadTimeLowDays);
  }
  if (update.leadTimeBaseDays !== undefined) {
    fields.push("lead_time_base_days = ?");
    binds.push(update.leadTimeBaseDays);
  }
  if (update.leadTimeHighDays !== undefined) {
    fields.push("lead_time_high_days = ?");
    binds.push(update.leadTimeHighDays);
  }
  if (update.costBasis !== undefined) {
    fields.push("cost_basis = ?");
    binds.push(update.costBasis);
  }
  if (update.costAmount !== undefined) {
    fields.push("cost_amount = ?");
    binds.push(update.costAmount);
  }
  if (update.costMinimum !== undefined) {
    fields.push("cost_minimum = ?");
    binds.push(update.costMinimum);
  }
  if (update.includedNotes !== undefined) {
    fields.push("included_notes = ?");
    binds.push(update.includedNotes);
  }
  if (update.excludedNotes !== undefined) {
    fields.push("excluded_notes = ?");
    binds.push(update.excludedNotes);
  }
  if (update.notes !== undefined) {
    fields.push("notes = ?");
    binds.push(update.notes);
  }

  const now = nowIso();
  const query = `UPDATE lane_versions SET ${fields.join(", ")}, updated_at = ? WHERE id = ?`;
  binds.push(now, versionId);

  const db = getDb(env);
  const result = await db.prepare(query).bind(...binds).run();
  if ((result.meta?.changes ?? 0) === 0) {
    return errorResponse(404, "lane_version_not_found", { versionId });
  }

  const version = await db
    .prepare(
      `
      SELECT
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
      FROM lane_versions
      WHERE id = ?
    `,
    )
    .bind(versionId)
    .first<VersionRow>();

  if (!version) {
    return errorResponse(404, "lane_version_not_found", { versionId });
  }

  return jsonResponse({ ok: true, version: mapVersion(version) });
};
