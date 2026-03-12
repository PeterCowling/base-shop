import "server-only";

import type { D1Database } from "@acme/platform-core/d1";

import { getInboxDb } from "./db.server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VolumeMetrics = {
  totalThreads: number;
  admitted: number;
  drafted: number;
  sent: number;
  resolved: number;
};

export type QualityMetrics = {
  totalDrafted: number;
  qualityPassed: number;
  qualityFailed: number;
  passRate: number | null;
  topFailureReasons: { reason: string; count: number }[];
};

export type ResolutionMetrics = {
  resolvedCount: number;
  avgAdmittedToSentHours: number | null;
  avgAdmittedToResolvedHours: number | null;
};

export type AdmissionMetrics = {
  totalProcessed: number;
  admitted: number;
  admittedRate: number | null;
  autoArchived: number;
  autoArchivedRate: number | null;
  reviewLater: number;
  reviewLaterRate: number | null;
};

export type AnalyticsResult = {
  volume?: VolumeMetrics;
  quality?: QualityMetrics;
  resolution?: ResolutionMetrics;
  admission?: AdmissionMetrics;
  period: { days: number | null };
};

export type MetricGroup = "volume" | "quality" | "resolution" | "admission";

export const ALL_METRIC_GROUPS: readonly MetricGroup[] = [
  "volume",
  "quality",
  "resolution",
  "admission",
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeFilter(days: number | undefined, tableAlias?: string): string {
  if (!days) {
    return "";
  }
  const col = tableAlias ? `${tableAlias}.timestamp` : "timestamp";
  return `AND ${col} >= datetime('now', '-${days} days')`;
}

function admissionTimeFilter(days: number | undefined): string {
  if (!days) {
    return "";
  }
  return `AND created_at >= datetime('now', '-${days} days')`;
}

function rate(count: number, total: number): number | null {
  if (total === 0) {
    return null;
  }
  return Math.round((count / total) * 1000) / 10;
}

async function resolveDb(db?: D1Database): Promise<D1Database> {
  return db ?? await getInboxDb();
}

// ---------------------------------------------------------------------------
// Volume Metrics
// ---------------------------------------------------------------------------

export async function computeVolumeMetrics(
  options: { db?: D1Database; days?: number } = {},
): Promise<VolumeMetrics> {
  const db = await resolveDb(options.db);
  const filter = timeFilter(options.days);

  const query = `
    SELECT
      event_type,
      COUNT(DISTINCT thread_id) AS thread_count
    FROM thread_events
    WHERE event_type IN ('admitted', 'drafted', 'sent', 'resolved')
    ${filter}
    GROUP BY event_type
  `;

  const result = await db
    .prepare(query)
    .all<{ event_type: string; thread_count: number }>();

  const counts: Record<string, number> = {};
  for (const row of result.results ?? []) {
    counts[row.event_type] = row.thread_count;
  }

  const admitted = counts["admitted"] ?? 0;
  const drafted = counts["drafted"] ?? 0;
  const sent = counts["sent"] ?? 0;
  const resolved = counts["resolved"] ?? 0;

  return {
    totalThreads: admitted + (counts["auto_archived"] ?? 0) + (counts["review_later"] ?? 0),
    admitted,
    drafted,
    sent,
    resolved,
  };
}

// ---------------------------------------------------------------------------
// Quality Metrics
// ---------------------------------------------------------------------------

export async function computeQualityMetrics(
  options: { db?: D1Database; days?: number } = {},
): Promise<QualityMetrics> {
  const db = await resolveDb(options.db);
  const filter = timeFilter(options.days);

  // Count threads that had a drafted event
  const totalQuery = `
    SELECT COUNT(DISTINCT thread_id) AS total
    FROM thread_events
    WHERE event_type = 'drafted'
    ${filter}
  `;

  // Count quality pass/fail from draft rows that have quality_json
  // A draft passed quality if quality_json contains "passed":true
  const qualityQuery = `
    SELECT
      CASE
        WHEN json_extract(d.quality_json, '$.passed') = 1 THEN 'passed'
        ELSE 'failed'
      END AS quality_outcome,
      COUNT(*) AS count
    FROM drafts d
    INNER JOIN thread_events te ON te.thread_id = d.thread_id AND te.event_type = 'drafted'
    WHERE d.quality_json IS NOT NULL
    ${filter.replace("timestamp", "te.timestamp")}
    GROUP BY quality_outcome
  `;

  // Top failure reasons from draft quality_json
  const failureQuery = `
    SELECT
      je.value AS reason,
      COUNT(*) AS count
    FROM drafts d,
      json_each(d.quality_json, '$.failed_checks') AS je
    INNER JOIN thread_events te ON te.thread_id = d.thread_id AND te.event_type = 'drafted'
    WHERE d.quality_json IS NOT NULL
      AND json_extract(d.quality_json, '$.passed') = 0
    ${filter.replace("timestamp", "te.timestamp")}
    GROUP BY je.value
    ORDER BY count DESC
    LIMIT 3
  `;

  const [totalResult, qualityResult, failureResult] = await Promise.all([
    db.prepare(totalQuery).first<{ total: number }>(),
    db.prepare(qualityQuery).all<{ quality_outcome: string; count: number }>(),
    db.prepare(failureQuery).all<{ reason: string; count: number }>(),
  ]);

  const totalDrafted = totalResult?.total ?? 0;

  const qualityCounts: Record<string, number> = {};
  for (const row of qualityResult.results ?? []) {
    qualityCounts[row.quality_outcome] = row.count;
  }
  const qualityPassed = qualityCounts["passed"] ?? 0;
  const qualityFailed = qualityCounts["failed"] ?? 0;

  const topFailureReasons = (failureResult.results ?? []).map((row) => ({
    reason: row.reason,
    count: row.count,
  }));

  return {
    totalDrafted,
    qualityPassed,
    qualityFailed,
    passRate: rate(qualityPassed, qualityPassed + qualityFailed),
    topFailureReasons,
  };
}

// ---------------------------------------------------------------------------
// Resolution Metrics
// ---------------------------------------------------------------------------

export async function computeResolutionMetrics(
  options: { db?: D1Database; days?: number } = {},
): Promise<ResolutionMetrics> {
  const db = await resolveDb(options.db);
  const filter = timeFilter(options.days, "admitted");

  // For each thread, find the time between the first "admitted" event
  // and the first "sent" or "resolved" event that follows it.
  const query = `
    WITH admitted AS (
      SELECT
        thread_id,
        MIN(timestamp) AS admitted_at
      FROM thread_events
      WHERE event_type = 'admitted'
      ${filter}
      GROUP BY thread_id
    ),
    sent AS (
      SELECT
        thread_id,
        MIN(timestamp) AS sent_at
      FROM thread_events
      WHERE event_type = 'sent'
      GROUP BY thread_id
    ),
    resolved AS (
      SELECT
        thread_id,
        MIN(timestamp) AS resolved_at
      FROM thread_events
      WHERE event_type = 'resolved'
      GROUP BY thread_id
    ),
    timings AS (
      SELECT
        a.thread_id,
        CASE WHEN s.sent_at IS NOT NULL
          THEN (julianday(s.sent_at) - julianday(a.admitted_at)) * 24
          ELSE NULL
        END AS hours_to_sent,
        CASE WHEN r.resolved_at IS NOT NULL
          THEN (julianday(r.resolved_at) - julianday(a.admitted_at)) * 24
          ELSE NULL
        END AS hours_to_resolved
      FROM admitted a
      LEFT JOIN sent s ON s.thread_id = a.thread_id
      LEFT JOIN resolved r ON r.thread_id = a.thread_id
    )
    SELECT
      COUNT(CASE WHEN hours_to_resolved IS NOT NULL THEN 1 END) AS resolved_count,
      AVG(hours_to_sent) AS avg_hours_to_sent,
      AVG(hours_to_resolved) AS avg_hours_to_resolved
    FROM timings
  `;

  const result = await db
    .prepare(query)
    .first<{
      resolved_count: number;
      avg_hours_to_sent: number | null;
      avg_hours_to_resolved: number | null;
    }>();

  return {
    resolvedCount: result?.resolved_count ?? 0,
    avgAdmittedToSentHours: result?.avg_hours_to_sent != null
      ? Math.round(result.avg_hours_to_sent * 10) / 10
      : null,
    avgAdmittedToResolvedHours: result?.avg_hours_to_resolved != null
      ? Math.round(result.avg_hours_to_resolved * 10) / 10
      : null,
  };
}

// ---------------------------------------------------------------------------
// Admission Metrics
// ---------------------------------------------------------------------------

export async function computeAdmissionMetrics(
  options: { db?: D1Database; days?: number } = {},
): Promise<AdmissionMetrics> {
  const db = await resolveDb(options.db);
  const filter = admissionTimeFilter(options.days);

  // Use admission_outcomes table for accurate admission decision data.
  // Count only the latest decision per thread to avoid double-counting
  // threads that were re-processed.
  const query = `
    WITH latest_admission AS (
      SELECT
        thread_id,
        decision,
        MAX(created_at) AS latest_at
      FROM admission_outcomes
      WHERE 1=1
      ${filter}
      GROUP BY thread_id
    )
    SELECT
      decision,
      COUNT(*) AS count
    FROM latest_admission
    GROUP BY decision
  `;

  const result = await db
    .prepare(query)
    .all<{ decision: string; count: number }>();

  const counts: Record<string, number> = {};
  for (const row of result.results ?? []) {
    counts[row.decision] = row.count;
  }

  const admitted = counts["admit"] ?? 0;
  const autoArchived = counts["auto-archive"] ?? 0;
  const reviewLater = counts["review-later"] ?? 0;
  const totalProcessed = admitted + autoArchived + reviewLater;

  return {
    totalProcessed,
    admitted,
    admittedRate: rate(admitted, totalProcessed),
    autoArchived,
    autoArchivedRate: rate(autoArchived, totalProcessed),
    reviewLater,
    reviewLaterRate: rate(reviewLater, totalProcessed),
  };
}

// ---------------------------------------------------------------------------
// Combined Analytics
// ---------------------------------------------------------------------------

export async function computeAnalytics(
  options: {
    db?: D1Database;
    days?: number;
    metrics?: MetricGroup[];
  } = {},
): Promise<AnalyticsResult> {
  const db = await resolveDb(options.db);
  const groups = options.metrics && options.metrics.length > 0
    ? options.metrics
    : ALL_METRIC_GROUPS;

  const groupSet = new Set(groups);
  const opts = { db, days: options.days };

  const [volume, quality, resolution, admission] = await Promise.all([
    groupSet.has("volume") ? computeVolumeMetrics(opts) : undefined,
    groupSet.has("quality") ? computeQualityMetrics(opts) : undefined,
    groupSet.has("resolution") ? computeResolutionMetrics(opts) : undefined,
    groupSet.has("admission") ? computeAdmissionMetrics(opts) : undefined,
  ]);

  return {
    volume,
    quality,
    resolution,
    admission,
    period: { days: options.days ?? null },
  };
}
