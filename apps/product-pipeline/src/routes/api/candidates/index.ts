/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/candidates/index.ts

import { z } from "zod";

import { getDb, nowIso, type PipelineEnv } from "../_lib/db";
import { errorResponse, jsonResponse } from "../_lib/response";
import type { D1PreparedStatement, PipelineEventContext } from "../_lib/types";

type CandidateListRow = {
  id: string;
  lead_id: string | null;
  stage_status: string | null;
  decision: string | null;
  decision_reason: string | null;
  created_at: string | null;
  updated_at: string | null;
  lead_title: string | null;
  lead_source: string | null;
  lead_url: string | null;
  stage_m_status: string | null;
  stage_m_created_at: string | null;
  stage_t_output: string | null;
  stage_t_status: string | null;
  stage_t_created_at: string | null;
  stage_s_output: string | null;
  stage_s_status: string | null;
  stage_s_created_at: string | null;
  stage_b_status: string | null;
  stage_b_created_at: string | null;
  stage_c_output: string | null;
  stage_c_status: string | null;
  stage_c_created_at: string | null;
  stage_k_output: string | null;
  stage_k_status: string | null;
  stage_k_created_at: string | null;
  stage_r_output: string | null;
  stage_r_status: string | null;
  stage_r_created_at: string | null;
};

const createSchema = z.object({
  leadId: z.string().min(1),
  stageStatus: z.string().min(1).optional(),
  decision: z.string().min(1).optional(),
  decisionReason: z.string().min(1).optional(),
  fingerprint: z.string().min(1).optional(),
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

type StageKSummary = {
  peakCashOutlayCents: string | null;
  paybackDay: number | null;
  annualizedCapitalReturnRate: number | null;
  returnBand: string | null;
};

type StageRSummary = {
  riskScore: number | null;
  riskBand: string | null;
  effortScore: number | null;
  effortBand: string | null;
  returnRate: number | null;
  rankScore: number | null;
  nextAction: string | null;
};

type StageTSummary = {
  decision: string | null;
  action: string | null;
};

type StageCSummary = {
  contributionPerUnitCents: string | null;
  contributionMarginPct: number | null;
};

type StageSSummary = {
  overallRisk: string | null;
  action: string | null;
};

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function parseStageKSummary(value: string | null): StageKSummary | null {
  const payload = safeJsonParse<{
    summary?: {
      peakCashOutlayCents?: string;
      paybackDay?: number | null;
      annualizedCapitalReturnRate?: number | null;
      returnBand?: string;
    };
  }>(value);
  if (!payload?.summary) return null;
  const summary = payload.summary;
  return {
    peakCashOutlayCents: summary.peakCashOutlayCents ?? null,
    paybackDay:
      summary.paybackDay === undefined ? null : summary.paybackDay ?? null,
    annualizedCapitalReturnRate:
      summary.annualizedCapitalReturnRate === undefined
        ? null
        : summary.annualizedCapitalReturnRate ?? null,
    returnBand: summary.returnBand ?? null,
  };
}

function parseStageRSummary(value: string | null): StageRSummary | null {
  const payload = safeJsonParse<{
    summary?: {
      riskScore?: number;
      riskBand?: string;
      effortScore?: number;
      effortBand?: string;
      returnRate?: number | null;
      rankScore?: number | null;
      nextAction?: string;
    };
  }>(value);
  if (!payload?.summary) return null;
  const summary = payload.summary;
  return {
    riskScore: summary.riskScore ?? null,
    riskBand: summary.riskBand ?? null,
    effortScore: summary.effortScore ?? null,
    effortBand: summary.effortBand ?? null,
    returnRate:
      summary.returnRate === undefined ? null : summary.returnRate ?? null,
    rankScore:
      summary.rankScore === undefined ? null : summary.rankScore ?? null,
    nextAction: summary.nextAction ?? null,
  };
}

function parseStageCSummary(value: string | null): StageCSummary | null {
  const payload = safeJsonParse<{
    summary?: { contributionPerUnitCents?: string; contributionMarginPct?: number | null };
  }>(value);
  if (!payload?.summary) return null;
  const summary = payload.summary;
  return {
    contributionPerUnitCents: summary.contributionPerUnitCents ?? null,
    contributionMarginPct:
      summary.contributionMarginPct === undefined
        ? null
        : summary.contributionMarginPct ?? null,
  };
}

function parseStageTSummary(value: string | null): StageTSummary | null {
  const payload = safeJsonParse<{
    summary?: { decision?: string; action?: string };
  }>(value);
  if (!payload?.summary) return null;
  const summary = payload.summary;
  return {
    decision: summary.decision ?? null,
    action: summary.action ?? null,
  };
}

function parseStageSSummary(value: string | null): StageSSummary | null {
  const payload = safeJsonParse<{
    summary?: { overallRisk?: string; action?: string };
  }>(value);
  if (!payload?.summary) return null;
  const summary = payload.summary;
  return {
    overallRisk: summary.overallRisk ?? null,
    action: summary.action ?? null,
  };
}

export const onRequestGet = async ({
  request,
  env,
}: PipelineEventContext<PipelineEnv>) => {
  const db = getDb(env);
  const url = new URL(request.url);
  const limit = parseIntParam(url.searchParams.get("limit"), 50, 1, 200);
  const offset = parseIntParam(url.searchParams.get("offset"), 0, 0, 10_000);
  const stageStatus = url.searchParams.get("stage_status");
  const decision = url.searchParams.get("decision");
  const leadId = url.searchParams.get("lead_id");

  const conditions: string[] = [];
  const binds: Array<string | number> = [];

  if (stageStatus) {
    conditions.push("candidates.stage_status = ?");
    binds.push(stageStatus);
  }
  if (decision) {
    conditions.push("candidates.decision = ?");
    binds.push(decision);
  }
  if (leadId) {
    conditions.push("candidates.lead_id = ?");
    binds.push(leadId);
  }

  let query = `
    SELECT
      candidates.id,
      candidates.lead_id,
      candidates.stage_status,
      candidates.decision,
      candidates.decision_reason,
      candidates.created_at,
      candidates.updated_at,
      leads.title as lead_title,
      leads.source as lead_source,
      leads.url as lead_url,
      stage_m.status as stage_m_status,
      stage_m.created_at as stage_m_created_at,
      stage_t.output_json as stage_t_output,
      stage_t.status as stage_t_status,
      stage_t.created_at as stage_t_created_at,
      stage_s.output_json as stage_s_output,
      stage_s.status as stage_s_status,
      stage_s.created_at as stage_s_created_at,
      stage_b.status as stage_b_status,
      stage_b.created_at as stage_b_created_at,
      stage_c.output_json as stage_c_output,
      stage_c.status as stage_c_status,
      stage_c.created_at as stage_c_created_at,
      stage_k.output_json as stage_k_output,
      stage_k.status as stage_k_status,
      stage_k.created_at as stage_k_created_at,
      stage_r.output_json as stage_r_output,
      stage_r.status as stage_r_status,
      stage_r.created_at as stage_r_created_at
    FROM candidates
    LEFT JOIN leads ON leads.id = candidates.lead_id
    LEFT JOIN stage_runs AS stage_m ON stage_m.id = (
      SELECT id FROM stage_runs AS sr
      WHERE sr.candidate_id = candidates.id AND sr.stage = 'M'
      ORDER BY sr.created_at DESC
      LIMIT 1
    )
    LEFT JOIN stage_runs AS stage_t ON stage_t.id = (
      SELECT id FROM stage_runs AS sr
      WHERE sr.candidate_id = candidates.id AND sr.stage = 'T'
      ORDER BY sr.created_at DESC
      LIMIT 1
    )
    LEFT JOIN stage_runs AS stage_s ON stage_s.id = (
      SELECT id FROM stage_runs AS sr
      WHERE sr.candidate_id = candidates.id AND sr.stage = 'S'
      ORDER BY sr.created_at DESC
      LIMIT 1
    )
    LEFT JOIN stage_runs AS stage_b ON stage_b.id = (
      SELECT id FROM stage_runs AS sr
      WHERE sr.candidate_id = candidates.id AND sr.stage = 'B'
      ORDER BY sr.created_at DESC
      LIMIT 1
    )
    LEFT JOIN stage_runs AS stage_c ON stage_c.id = (
      SELECT id FROM stage_runs AS sr
      WHERE sr.candidate_id = candidates.id AND sr.stage = 'C'
      ORDER BY sr.created_at DESC
      LIMIT 1
    )
    LEFT JOIN stage_runs AS stage_k ON stage_k.id = (
      SELECT id FROM stage_runs AS sr
      WHERE sr.candidate_id = candidates.id AND sr.stage = 'K'
      ORDER BY sr.created_at DESC
      LIMIT 1
    )
    LEFT JOIN stage_runs AS stage_r ON stage_r.id = (
      SELECT id FROM stage_runs AS sr
      WHERE sr.candidate_id = candidates.id AND sr.stage = 'R'
      ORDER BY sr.created_at DESC
      LIMIT 1
    )
  `;

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }
  query += " ORDER BY candidates.created_at DESC LIMIT ? OFFSET ?";
  binds.push(limit, offset);

  const result = await db.prepare(query).bind(...binds).all<CandidateListRow>();
  const candidates = (result.results ?? []).map((row) => ({
    id: row.id,
    leadId: row.lead_id,
    stageStatus: row.stage_status,
    decision: row.decision,
    decisionReason: row.decision_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    stageK: {
      status: row.stage_k_status,
      createdAt: row.stage_k_created_at,
      summary: parseStageKSummary(row.stage_k_output),
    },
    stageR: {
      status: row.stage_r_status,
      createdAt: row.stage_r_created_at,
      summary: parseStageRSummary(row.stage_r_output),
    },
    stageM: {
      status: row.stage_m_status,
      createdAt: row.stage_m_created_at,
    },
    stageT: {
      status: row.stage_t_status,
      createdAt: row.stage_t_created_at,
      summary: parseStageTSummary(row.stage_t_output),
    },
    stageS: {
      status: row.stage_s_status,
      createdAt: row.stage_s_created_at,
      summary: parseStageSSummary(row.stage_s_output),
    },
    stageB: {
      status: row.stage_b_status,
      createdAt: row.stage_b_created_at,
    },
    stageC: {
      status: row.stage_c_status,
      createdAt: row.stage_c_created_at,
      summary: parseStageCSummary(row.stage_c_output),
    },
    lead: row.lead_id
      ? {
          id: row.lead_id,
          title: row.lead_title,
          source: row.lead_source,
          url: row.lead_url,
        }
      : null,
  }));

  return jsonResponse({ ok: true, candidates, limit, offset });
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

  const db = getDb(env);
  const { leadId, stageStatus, decision, decisionReason, fingerprint } =
    parsed.data;

  const lead = await db
    .prepare("SELECT id FROM leads WHERE id = ?")
    .bind(leadId)
    .first<{ id: string }>();
  if (!lead) {
    return errorResponse(404, "lead_not_found", { leadId });
  }

  const existing = await db
    .prepare("SELECT id FROM candidates WHERE lead_id = ?")
    .bind(leadId)
    .first<{ id: string }>();
  if (existing) {
    return errorResponse(409, "candidate_exists", { candidateId: existing.id });
  }

  const id = crypto.randomUUID();
  const now = nowIso();
  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        "INSERT INTO candidates (id, lead_id, fingerprint, stage_status, decision, decision_reason, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        id,
        leadId,
        fingerprint ?? null,
        stageStatus ?? "P_DONE",
        decision ?? null,
        decisionReason ?? null,
        now,
        now,
      ),
    db
      .prepare("UPDATE leads SET status = ?, updated_at = ? WHERE id = ?")
      .bind("PROMOTED", now, leadId),
  ];

  await db.batch(statements);

  return jsonResponse(
    {
      ok: true,
      candidate: {
        id,
        leadId,
        stageStatus: stageStatus ?? "P_DONE",
        decision: decision ?? null,
        decisionReason: decisionReason ?? null,
        createdAt: now,
        updatedAt: now,
      },
    },
    201,
  );
};
