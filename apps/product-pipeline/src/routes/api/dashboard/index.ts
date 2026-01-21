/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/dashboard/index.ts

import { getDb, type PipelineEnv } from "../_lib/db";
import { jsonResponse } from "../_lib/response";
import type { PipelineEventContext } from "../_lib/types";

const DEFAULT_PROMOTION_LIMIT = 5;
const DEFAULT_STAGE_M_AMAZON_DAILY_LIMIT = 20;
const DEFAULT_STAGE_M_TAOBAO_DAILY_LIMIT = 10;

type CountRow = { count: number };

function parseDailyLimit(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function parseCents(value: unknown): bigint | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return BigInt(Math.round(value));
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!/^-?\d+$/.test(trimmed)) return null;
    return BigInt(trimmed);
  }
  return null;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    const left = sorted[mid - 1];
    const right = sorted[mid];
    if (left === undefined || right === undefined) return null;
    return (left + right) / 2;
  }
  return sorted[mid] ?? null;
}

export const onRequestGet = async ({
  env,
}: PipelineEventContext<PipelineEnv>) => {
  const db = getDb(env);

  const [
    leadQueueResult,
    leadsTodayResult,
    candidatesActiveResult,
    candidatesTotalResult,
    stagePTodayResult,
    promotionsTodayResult,
    stageMQueuedResult,
    stageMRunningResult,
    stageMTodayResult,
  ] = await Promise.all([
    db
      .prepare(
        "SELECT COUNT(*) AS count FROM leads WHERE status IN ('NEW', 'ON_HOLD')",
      )
      .first<CountRow>(),
    db
      .prepare("SELECT COUNT(*) AS count FROM leads WHERE date(created_at) = date('now')")
      .first<CountRow>(),
    db
      .prepare("SELECT COUNT(*) AS count FROM candidates WHERE decision IS NULL")
      .first<CountRow>(),
    db
      .prepare("SELECT COUNT(*) AS count FROM candidates")
      .first<CountRow>(),
    db
      .prepare("SELECT COUNT(*) AS count FROM stage_runs WHERE stage = 'P' AND date(created_at) = date('now')")
      .first<CountRow>(),
    db
      .prepare("SELECT COUNT(*) AS count FROM candidates WHERE date(created_at) = date('now')")
      .first<CountRow>(),
    db
      .prepare(
        "SELECT COUNT(DISTINCT candidate_id) AS count FROM stage_runs WHERE stage = 'M' AND status = 'queued'",
      )
      .first<CountRow>(),
    db
      .prepare(
        "SELECT COUNT(DISTINCT candidate_id) AS count FROM stage_runs WHERE stage = 'M' AND status = 'running'",
      )
      .first<CountRow>(),
    db
      .prepare("SELECT COUNT(*) AS count FROM stage_runs WHERE stage = 'M' AND date(created_at) = date('now')")
      .first<CountRow>(),
  ]);

  const stageSReviewResult = await db
    .prepare(
      `
      SELECT COUNT(*) AS count
      FROM stage_runs AS sr
      WHERE sr.stage = 'S'
        AND sr.status = 'succeeded'
        AND sr.created_at = (
          SELECT MAX(created_at)
          FROM stage_runs
          WHERE candidate_id = sr.candidate_id
            AND stage = 'S'
            AND status = 'succeeded'
        )
        AND json_extract(sr.output_json, '$.summary.action') IN ('REVIEW', 'BLOCK')
    `,
    )
    .first<CountRow>();

  const stageKRows = await db
    .prepare(
      `
      SELECT sr.output_json
      FROM stage_runs AS sr
      INNER JOIN candidates AS c
        ON c.id = sr.candidate_id
      WHERE sr.stage = 'K'
        AND sr.status = 'succeeded'
        AND c.decision IS NULL
        AND sr.created_at = (
          SELECT MAX(created_at)
          FROM stage_runs
          WHERE candidate_id = sr.candidate_id
            AND stage = 'K'
            AND status = 'succeeded'
        )
    `,
    )
    .all<{ output_json: string | null }>();

  let capitalCents = 0n;
  const paybackDays: number[] = [];
  for (const row of stageKRows.results ?? []) {
    const output = safeJsonParse<{ summary?: Record<string, unknown> }>(
      row.output_json,
    );
    const summary = output?.summary ?? null;
    if (summary) {
      const peak = parseCents(summary["peakCashOutlayCents"]);
      if (peak !== null) {
        capitalCents += peak;
      }
      const payback = parseNumber(summary["paybackDay"]);
      if (payback !== null) {
        paybackDays.push(payback);
      }
    }
  }

  const promotionLimit = parseDailyLimit(
    env.PIPELINE_PROMOTION_DAILY_LIMIT,
    DEFAULT_PROMOTION_LIMIT,
  );
  const stageMLimit =
    parseDailyLimit(
      env.PIPELINE_STAGE_M_AMAZON_DAILY_LIMIT,
      DEFAULT_STAGE_M_AMAZON_DAILY_LIMIT,
    ) +
    parseDailyLimit(
      env.PIPELINE_STAGE_M_TAOBAO_DAILY_LIMIT,
      DEFAULT_STAGE_M_TAOBAO_DAILY_LIMIT,
    );

  const leadQueueCount = leadQueueResult?.count ?? 0;
  const leadsTodayCount = leadsTodayResult?.count ?? 0;
  const candidatesActiveCount = candidatesActiveResult?.count ?? 0;
  const candidatesTotalCount = candidatesTotalResult?.count ?? 0;
  const stagePTodayCount = stagePTodayResult?.count ?? 0;
  const promotionsUsedCount = promotionsTodayResult?.count ?? 0;
  const stageMQueuedCount = stageMQueuedResult?.count ?? 0;
  const stageMRunningCount = stageMRunningResult?.count ?? 0;
  const stageMTodayCount = stageMTodayResult?.count ?? 0;
  const stageSReviewCount = stageSReviewResult?.count ?? 0;

  const stageMTotal = stageMQueuedCount + stageMRunningCount;
  const stageMStatus =
    stageMQueuedCount > 0
      ? "queued"
      : stageMRunningCount > 0
        ? "running"
        : "ready";
  const stagePStatus = leadQueueCount > 0 ? "running" : "ready";
  const stageSStatus = stageSReviewCount > 0 ? "inReview" : "ready";

  return jsonResponse({
    ok: true,
    metrics: {
      leads: {
        queueCount: leadQueueCount,
        todayCount: leadsTodayCount,
      },
      candidates: {
        activeCount: candidatesActiveCount,
        totalCount: candidatesTotalCount,
      },
      capital: {
        totalCents: capitalCents.toString(),
        sampleCount: stageKRows.results?.length ?? 0,
      },
      payback: {
        medianDays: median(paybackDays),
        sampleCount: paybackDays.length,
      },
    },
    stageRail: {
      preSelection: { count: leadQueueCount, status: stagePStatus },
      marketVelocity: { count: stageMTotal, status: stageMStatus },
      safetyFeasibility: { count: stageSReviewCount, status: stageSStatus },
      capitalTimeline: { count: stageKRows.results?.length ?? 0, status: "ready" },
    },
    budgets: {
      leadIngest: { used: leadsTodayCount },
      triageScans: { used: stagePTodayCount },
      promotions: { used: promotionsUsedCount, limit: promotionLimit },
      deepEval: { used: stageMTodayCount, limit: stageMLimit },
    },
  });
};
