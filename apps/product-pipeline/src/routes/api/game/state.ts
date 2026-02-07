/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/game/state.ts

import { getDb, type PipelineEnv } from "../_lib/db";
import { jsonResponse } from "../_lib/response";
import type { D1Database,PipelineEventContext } from "../_lib/types";

type CountRow = { count: number };
type StageCountRow = { stage: string; count: number };
type StageRunEventRow = {
  id: string;
  stage: string | null;
  status: string | null;
  created_at: string | null;
  candidate_id: string | null;
  lead_title: string | null;
};

type LootRow = {
  id: string;
  kind: string | null;
  uri: string | null;
  created_at: string | null;
  stage: string | null;
  candidate_id: string | null;
  lead_title: string | null;
};

function safeCount(value: number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (!Number.isFinite(value) || value < 0) return 0;
  return value;
}

async function fetchCount(
  db: D1Database,
  query: string,
  binds: unknown[] = [],
): Promise<number> {
  const result = await db.prepare(query).bind(...binds).first<CountRow>();
  return safeCount(result?.count);
}

function computeStreak(days: string[]): number {
  const set = new Set(days);
  let streak = 0;
  for (let offset = 0; offset < 365; offset += 1) {
    const day = new Date(Date.now() - offset * 86400000).toISOString().slice(0, 10);
    if (!set.has(day)) break;
    streak += 1;
  }
  return streak;
}

function titleForLevel(level: number): string {
  if (level >= 9) return "Admiral";
  if (level >= 7) return "Strategist";
  if (level >= 5) return "Commander";
  if (level >= 3) return "Navigator";
  if (level >= 2) return "Operator";
  return "Cadet";
}

function computeLevel(xp: number): {
  level: number;
  title: string;
  nextLevelXp: number;
  progress: number;
} {
  const clamped = Math.max(0, Math.trunc(xp));
  const level = Math.max(1, Math.floor(Math.sqrt(clamped / 100)) + 1);
  const prevThreshold = Math.max(0, (level - 1) * (level - 1) * 100);
  const nextThreshold = level * level * 100;
  const progress =
    nextThreshold === prevThreshold
      ? 0
      : Math.min(
          1,
          Math.max(0, (clamped - prevThreshold) / (nextThreshold - prevThreshold)),
        );
  return {
    level,
    title: titleForLevel(level),
    nextLevelXp: nextThreshold,
    progress,
  };
}

function computeXp(input: {
  stageCounts: Record<string, number>;
  artifactsTotal: number;
  candidatesTotal: number;
}): number {
  const weights: Record<string, number> = {
    P: 2,
    M: 10,
    S: 6,
    K: 12,
    R: 8,
    L: 16,
  };

  let xp = 0;
  for (const [stage, count] of Object.entries(input.stageCounts)) {
    const weight = weights[stage] ?? 3;
    xp += safeCount(count) * weight;
  }

  xp += safeCount(input.artifactsTotal) * 4;
  xp += safeCount(input.candidatesTotal) * 15;
  return xp;
}

export const onRequestGet = async ({
  request,
  env,
}: PipelineEventContext<PipelineEnv>) => {
  const db = getDb(env);
  const url = new URL(request.url);
  const limit = Math.min(
    50,
    Math.max(10, Number.parseInt(url.searchParams.get("limit") ?? "24", 10) || 24),
  );

  const [leadsNew, candidatesTotal, artifactsTotal, stageRunsToday] =
    await Promise.all([
      fetchCount(db, "SELECT COUNT(*) AS count FROM leads WHERE status = ?", [
        "NEW",
      ]),
      fetchCount(db, "SELECT COUNT(*) AS count FROM candidates"),
      fetchCount(db, "SELECT COUNT(*) AS count FROM artifacts"),
      fetchCount(
        db,
        "SELECT COUNT(*) AS count FROM stage_runs WHERE date(created_at) = date('now')",
      ),
    ]);

  const stageCountsResult = await db
    .prepare("SELECT stage, COUNT(*) AS count FROM stage_runs GROUP BY stage")
    .all<StageCountRow>();
  const stageCounts: Record<string, number> = {};
  for (const row of stageCountsResult.results ?? []) {
    if (!row.stage) continue;
    stageCounts[row.stage] = safeCount(row.count);
  }

  const streakDaysResult = await db
    .prepare(
      "SELECT DISTINCT date(created_at) AS day FROM stage_runs WHERE created_at IS NOT NULL ORDER BY day DESC LIMIT 30",
    )
    .all<{ day: string | null }>();
  const streakDays = computeStreak(
    (streakDaysResult.results ?? [])
      .map((row) => row.day)
      .filter((value): value is string => Boolean(value)),
  );

  const xp = computeXp({ stageCounts, artifactsTotal, candidatesTotal });
  const levelInfo = computeLevel(xp);

  const stageRunsTotal = Object.values(stageCounts).reduce(
    (sum, value) => sum + safeCount(value),
    0,
  );

  const achievements = [
    {
      id: "first_scan",
      progress: Math.min(stageRunsTotal, 1),
      target: 1,
      unlocked: stageRunsTotal >= 1,
    },
    {
      id: "triage_trail",
      progress: Math.min(safeCount(stageCounts["P"]), 25),
      target: 25,
      unlocked: safeCount(stageCounts["P"]) >= 25,
    },
    {
      id: "market_probe",
      progress: Math.min(safeCount(stageCounts["M"]), 10),
      target: 10,
      unlocked: safeCount(stageCounts["M"]) >= 10,
    },
    {
      id: "loot_cache",
      progress: Math.min(artifactsTotal, 10),
      target: 10,
      unlocked: artifactsTotal >= 10,
    },
    {
      id: "streak_3",
      progress: Math.min(streakDays, 3),
      target: 3,
      unlocked: streakDays >= 3,
    },
  ];

  const eventsResult = await db
    .prepare(
      `
      SELECT
        stage_runs.id,
        stage_runs.stage,
        stage_runs.status,
        stage_runs.created_at,
        stage_runs.candidate_id,
        leads.title AS lead_title
      FROM stage_runs
      LEFT JOIN candidates ON candidates.id = stage_runs.candidate_id
      LEFT JOIN leads ON leads.id = candidates.lead_id
      ORDER BY stage_runs.created_at DESC
      LIMIT ?
    `,
    )
    .bind(limit)
    .all<StageRunEventRow>();

  const events = (eventsResult.results ?? []).map((row) => ({
    id: row.id,
    stage: row.stage,
    status: row.status,
    createdAt: row.created_at,
    candidateId: row.candidate_id,
    leadTitle: row.lead_title,
  }));

  const lootResult = await db
    .prepare(
      `
      SELECT
        artifacts.id,
        artifacts.kind,
        artifacts.uri,
        artifacts.created_at,
        stage_runs.stage AS stage,
        artifacts.candidate_id,
        leads.title AS lead_title
      FROM artifacts
      LEFT JOIN stage_runs ON stage_runs.id = artifacts.stage_run_id
      LEFT JOIN candidates ON candidates.id = artifacts.candidate_id
      LEFT JOIN leads ON leads.id = candidates.lead_id
      ORDER BY artifacts.created_at DESC
      LIMIT ?
    `,
    )
    .bind(limit)
    .all<LootRow>();

  const loot = (lootResult.results ?? []).map((row) => ({
    id: row.id,
    kind: row.kind,
    uri: row.uri,
    createdAt: row.created_at,
    stage: row.stage,
    candidateId: row.candidate_id,
    leadTitle: row.lead_title,
  }));

  return jsonResponse({
    ok: true,
    state: {
      operator: {
        ...levelInfo,
        xp,
        streakDays,
      },
      stats: {
        leadsNew,
        candidatesTotal,
        stageRunsToday,
        artifactsTotal,
        stageCounts,
      },
      achievements,
      events,
      loot,
    },
  });
};
