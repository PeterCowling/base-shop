/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/logistics/lanes/index.ts

import type { PipelineEventContext } from "../../_lib/types";
import { z } from "zod";
import { getDb, nowIso, type PipelineEnv } from "../../_lib/db";
import { errorResponse, jsonResponse } from "../../_lib/response";

type LaneListRow = {
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
  version_id: string | null;
  version_status: string | null;
  version_confidence: string | null;
  version_expires_at: string | null;
  version_cost_basis: string | null;
  version_cost_amount: number | null;
  version_lead_time_base_days: number | null;
  version_created_at: string | null;
  version_count: number | null;
};

const createSchema = z.object({
  name: z.string().min(1),
  model: z.string().min(1),
  origin: z.string().min(1).optional(),
  destination: z.string().min(1).optional(),
  destinationType: z.string().min(1).optional(),
  incoterm: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  active: z.boolean().optional(),
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

function parseActiveParam(value: string | null): number | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") return 1;
  if (normalized === "false" || normalized === "0") return 0;
  return null;
}

export const onRequestGet = async ({
  request,
  env,
}: PipelineEventContext<PipelineEnv>) => {
  const url = new URL(request.url);
  const limit = parseIntParam(url.searchParams.get("limit"), 50, 1, 200);
  const offset = parseIntParam(url.searchParams.get("offset"), 0, 0, 10_000);
  const activeFilter = parseActiveParam(url.searchParams.get("active"));

  const conditions: string[] = [];
  const binds: Array<string | number> = [];
  if (activeFilter !== null) {
    conditions.push("logistics_lanes.active = ?");
    binds.push(activeFilter);
  }

  let query = `
    SELECT
      logistics_lanes.id,
      logistics_lanes.name,
      logistics_lanes.model,
      logistics_lanes.origin,
      logistics_lanes.destination,
      logistics_lanes.destination_type,
      logistics_lanes.incoterm,
      logistics_lanes.description,
      logistics_lanes.active,
      logistics_lanes.created_at,
      logistics_lanes.updated_at,
      latest_versions.id AS version_id,
      latest_versions.status AS version_status,
      latest_versions.confidence AS version_confidence,
      latest_versions.expires_at AS version_expires_at,
      latest_versions.cost_basis AS version_cost_basis,
      latest_versions.cost_amount AS version_cost_amount,
      latest_versions.lead_time_base_days AS version_lead_time_base_days,
      latest_versions.created_at AS version_created_at,
      version_counts.version_count AS version_count
    FROM logistics_lanes
    LEFT JOIN (
      SELECT lv1.*
      FROM lane_versions lv1
      INNER JOIN (
        SELECT lane_id, MAX(created_at) AS latest_created_at
        FROM lane_versions
        GROUP BY lane_id
      ) latest
      ON lv1.lane_id = latest.lane_id
      AND lv1.created_at = latest.latest_created_at
    ) AS latest_versions
    ON latest_versions.lane_id = logistics_lanes.id
    LEFT JOIN (
      SELECT lane_id, COUNT(*) AS version_count
      FROM lane_versions
      GROUP BY lane_id
    ) AS version_counts
    ON version_counts.lane_id = logistics_lanes.id
  `;

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }
  query += " ORDER BY logistics_lanes.created_at DESC LIMIT ? OFFSET ?";
  binds.push(limit, offset);

  const db = getDb(env);
  const result = await db.prepare(query).bind(...binds).all<LaneListRow>();

  const lanes = (result.results ?? []).map((row) => ({
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
    versionCount: row.version_count ?? 0,
    latestVersion: row.version_id
      ? {
          id: row.version_id,
          status: row.version_status,
          confidence: row.version_confidence,
          expiresAt: row.version_expires_at,
          costBasis: row.version_cost_basis,
          costAmount: row.version_cost_amount,
          leadTimeBaseDays: row.version_lead_time_base_days,
          createdAt: row.version_created_at,
        }
      : null,
  }));

  return jsonResponse({ ok: true, lanes, limit, offset });
};

export const onRequestPost = async ({
  request,
  env,
}: PipelineEventContext<PipelineEnv>) => {
  const raw = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse(400, "invalid_body", {
      issues: parsed.error.flatten(),
    });
  }

  const {
    name,
    model,
    origin,
    destination,
    destinationType,
    incoterm,
    description,
    active,
  } = parsed.data;

  const db = getDb(env);
  const id = crypto.randomUUID();
  const now = nowIso();
  const activeValue = active === undefined ? 1 : active ? 1 : 0;

  await db
    .prepare(
      "INSERT INTO logistics_lanes (id, name, model, origin, destination, destination_type, incoterm, description, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      id,
      name,
      model,
      origin ?? null,
      destination ?? null,
      destinationType ?? null,
      incoterm ?? null,
      description ?? null,
      activeValue,
      now,
      now,
    )
    .run();

  return jsonResponse(
    {
      ok: true,
      lane: {
        id,
        name,
        model,
        origin: origin ?? null,
        destination: destination ?? null,
        destinationType: destinationType ?? null,
        incoterm: incoterm ?? null,
        description: description ?? null,
        active: activeValue === 1,
        createdAt: now,
        updatedAt: now,
      },
    },
    201,
  );
};
