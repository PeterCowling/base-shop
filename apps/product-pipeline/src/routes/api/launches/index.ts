/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/launches/index.ts

import type { PipelineEventContext } from "../_lib/types";
import { z } from "zod";
import { getDb, nowIso, type PipelineEnv } from "../_lib/db";
import { errorResponse, jsonResponse } from "../_lib/response";

const createSchema = z.object({
  candidateId: z.string().min(1),
  status: z.string().min(1).optional(),
  plannedUnits: z.number().int().positive().optional(),
  plannedUnitsPerDay: z.number().positive().optional(),
  notes: z.string().optional(),
});

type LaunchPlanRow = {
  id: string;
  candidate_id: string;
  status: string;
  planned_units: number | null;
  planned_units_per_day: number | null;
  plan_json: string | null;
  created_at: string | null;
  updated_at: string | null;
  lead_title: string | null;
  actual_units_sold: number | null;
  actual_max_day: number | null;
  prior_velocity_per_day: number | null;
  prior_source: string | null;
  prior_created_at: string | null;
  decision: string | null;
  decision_notes: string | null;
  decision_by: string | null;
  decision_at: string | null;
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

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export const onRequestGet = async ({
  request,
  env,
}: PipelineEventContext<PipelineEnv>) => {
  const url = new URL(request.url);
  const limit = parseIntParam(url.searchParams.get("limit"), 50, 1, 200);
  const offset = parseIntParam(url.searchParams.get("offset"), 0, 0, 10_000);
  const db = getDb(env);

  const result = await db
    .prepare(
      `
      SELECT
        launch_plans.id,
        launch_plans.candidate_id,
        launch_plans.status,
        launch_plans.planned_units,
        launch_plans.planned_units_per_day,
        launch_plans.plan_json,
        launch_plans.created_at,
        launch_plans.updated_at,
        leads.title as lead_title,
        latest_actuals.units_sold_total as actual_units_sold,
        latest_actuals.max_day as actual_max_day,
        latest_prior.velocity_per_day as prior_velocity_per_day,
        latest_prior.source as prior_source,
        latest_prior.created_at as prior_created_at,
        latest_decision.decision as decision,
        latest_decision.notes as decision_notes,
        latest_decision.decided_by as decision_by,
        latest_decision.created_at as decision_at
      FROM launch_plans
      LEFT JOIN candidates ON candidates.id = launch_plans.candidate_id
      LEFT JOIN leads ON leads.id = candidates.lead_id
      LEFT JOIN launch_actuals AS latest_actuals ON latest_actuals.id = (
        SELECT id FROM launch_actuals AS la
        WHERE la.launch_id = launch_plans.id
        ORDER BY la.created_at DESC
        LIMIT 1
      )
      LEFT JOIN velocity_priors AS latest_prior ON latest_prior.id = (
        SELECT id FROM velocity_priors AS vp
        WHERE vp.candidate_id = launch_plans.candidate_id
          AND (vp.expires_at IS NULL OR vp.expires_at >= datetime('now'))
        ORDER BY vp.created_at DESC
        LIMIT 1
      )
      LEFT JOIN launch_decisions AS latest_decision ON latest_decision.id = (
        SELECT id FROM launch_decisions AS ld
        WHERE ld.launch_id = launch_plans.id
        ORDER BY ld.created_at DESC
        LIMIT 1
      )
      ORDER BY launch_plans.created_at DESC
      LIMIT ? OFFSET ?
    `,
    )
    .bind(limit, offset)
    .all<LaunchPlanRow>();

  const plans = (result.results ?? []).map((row) => {
    const planNotes = safeJsonParse<{ notes?: string }>(row.plan_json);
    const plannedUnitsPerDay = row.planned_units_per_day ?? null;
    const actualUnits = row.actual_units_sold ?? null;
    const actualMaxDay = row.actual_max_day ?? null;
    const actualVelocity =
      actualUnits !== null &&
      actualMaxDay !== null &&
      actualMaxDay > 0
        ? actualUnits / actualMaxDay
        : null;
    const variancePct =
      actualVelocity !== null && plannedUnitsPerDay
        ? (actualVelocity - plannedUnitsPerDay) / plannedUnitsPerDay
        : null;

    return {
      id: row.id,
      candidateId: row.candidate_id,
      status: row.status,
      plannedUnits: row.planned_units,
      plannedUnitsPerDay,
      notes: planNotes?.notes ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lead: row.lead_title ? { title: row.lead_title } : null,
      actuals: actualUnits !== null
        ? {
            unitsSoldTotal: actualUnits,
            maxDay: actualMaxDay,
            velocityPerDay: actualVelocity,
            variancePct,
          }
        : null,
      velocityPrior:
        row.prior_velocity_per_day !== null
          ? {
              velocityPerDay: row.prior_velocity_per_day,
              source: row.prior_source,
              createdAt: row.prior_created_at,
            }
          : null,
      decision:
        row.decision !== null
          ? {
              decision: row.decision,
              notes: row.decision_notes,
              decidedBy: row.decision_by,
              decidedAt: row.decision_at,
            }
          : null,
    };
  });

  return jsonResponse({ ok: true, plans, limit, offset });
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

  const { candidateId, status, plannedUnits, plannedUnitsPerDay, notes } =
    parsed.data;
  const db = getDb(env);
  const candidate = await db
    .prepare("SELECT id FROM candidates WHERE id = ?")
    .bind(candidateId)
    .first<{ id: string }>();
  if (!candidate) {
    return errorResponse(404, "candidate_not_found", { candidateId });
  }

  const id = crypto.randomUUID();
  const now = nowIso();
  const planJson = notes ? JSON.stringify({ notes }) : null;

  await db
    .prepare(
      "INSERT INTO launch_plans (id, candidate_id, status, planned_units, planned_units_per_day, plan_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      id,
      candidateId,
      status ?? "PLANNED",
      plannedUnits ?? null,
      plannedUnitsPerDay ?? null,
      planJson,
      now,
      now,
    )
    .run();

  return jsonResponse(
    {
      ok: true,
      plan: {
        id,
        candidateId,
        status: status ?? "PLANNED",
        plannedUnits: plannedUnits ?? null,
        plannedUnitsPerDay: plannedUnitsPerDay ?? null,
        notes: notes ?? null,
        createdAt: now,
        updatedAt: now,
      },
    },
    201,
  );
};
