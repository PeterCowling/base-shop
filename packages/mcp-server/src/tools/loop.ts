import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import { z } from "zod";

import {
  buildFreshnessEnvelope,
  readJsonFile,
  readJsonLines,
  resolveLoopArtifactPaths,
} from "../lib/loop-artifact-reader.js";
import {
  anomalyGrainSchema,
  assertRefreshStateTransition,
  buildEnvelope,
  contentSourceRecordSchema,
  determineWave2Quality,
  evaluateAnomalyBaseline,
  parseContentSourceRecord,
  parseWave2MetricRecord,
  refreshEnqueueStateSchema,
  validateRunPacketBounds,
} from "../lib/wave2-contracts.js";
import { formatError, jsonResult } from "../utils/validation.js";

import type { ToolCallResult, ToolErrorCode } from "./policy.js";

// STARTUP_LOOP_STAGES: canonical stage ID list for policy validation.
// Canonical source: docs/business-os/startup-loop/_generated/stage-operator-map.json
// (generated from stage-operator-dictionary.yaml via generate-stage-operator-views.ts)
// Migration note (TASK-18, 2026-02-17): literal retained here — NodeNext moduleResolution
// in this package requires JSON import assertions not yet established.
// The scripts/src/startup-loop/stage-addressing.ts resolver uses the generated map directly.
// Re-sync when stages change and bump loop-spec spec_version.
const STARTUP_LOOP_STAGES = [
  "ASSESSMENT-01",
  "ASSESSMENT-02",
  "ASSESSMENT-03",
  "ASSESSMENT-04",
  "ASSESSMENT-05",
  "ASSESSMENT-06",
  "ASSESSMENT-07",
  "ASSESSMENT-08",
  "ASSESSMENT-09",
  "ASSESSMENT",
  "ASSESSMENT-10",
  "ASSESSMENT-11",
  "IDEAS",
  "IDEAS-01",
  "IDEAS-02",
  "IDEAS-03",
  "MEASURE-01",
  "MEASURE-02",
  "PRODUCT",
  "PRODUCT-01",
  "PRODUCTS",
  "PRODUCTS-01",
  "PRODUCTS-02",
  "PRODUCTS-03",
  "PRODUCTS-04",
  "PRODUCTS-05",
  "PRODUCTS-06",
  "PRODUCTS-07",
  "LOGISTICS",
  "LOGISTICS-01",
  "LOGISTICS-02",
  "LOGISTICS-03",
  "LOGISTICS-04",
  "LOGISTICS-05",
  "LOGISTICS-06",
  "LOGISTICS-07",
  "MARKET",
  "MARKET-01",
  "MARKET-02",
  "MARKET-03",
  "MARKET-04",
  "MARKET-05",
  "MARKET-06",
  "MARKET-07",
  "MARKET-08",
  "MARKET-09",
  "MARKET-10",
  "MARKET-11",
  "S3",
  "PRODUCT-02",
  "SELL",
  "SELL-01",
  "SELL-02",
  "SELL-03",
  "SELL-04",
  "SELL-05",
  "SELL-06",
  "SELL-07",
  "SELL-08",
  "S4",
  "S5A",
  "S5B",
  "WEBSITE",
  "WEBSITE-01",
  "WEBSITE-02",
  "DO",
  "S9B",
  "S10",
] as const;

const loopStatusInputSchema = z.object({
  business: z.string().min(1),
  runId: z.string().min(1),
  current_stage: z.string().min(1),
});

const MEASURE_CONNECTOR_SOURCES = [
  "stripe",
  "d1_prisma",
  "cloudflare",
  "ga4_search_console",
  "email_support",
] as const;

const MEASURE_ALL_SOURCES = [...MEASURE_CONNECTOR_SOURCES, "startup_loop_metrics"] as const;

const measureSourceSchema = z.enum(MEASURE_ALL_SOURCES);

const measureSnapshotInputSchema = loopStatusInputSchema.extend({
  metric: z.string().min(1).optional(),
  source: measureSourceSchema.optional(),
});

const packetBuildInputSchema = loopStatusInputSchema;

const packetGetInputSchema = loopStatusInputSchema.extend({
  packetId: z.string().min(1).optional(),
});

const packBuildInputSchema = loopStatusInputSchema.extend({
  packetId: z.string().min(1).optional(),
});

const collectorNameSchema = z.string().regex(/^[a-zA-Z0-9_.-]+$/);

const refreshStatusInputSchema = loopStatusInputSchema.extend({
  collector: collectorNameSchema.default("metrics"),
});

const refreshEnqueueInputSchema = loopStatusInputSchema.extend({
  collector: collectorNameSchema.default("metrics"),
  requestId: z.string().min(1),
  write_reason: z.string().min(1),
  reason: z.string().min(1),
  requestedBy: z.string().min(1),
  transitionTo: refreshEnqueueStateSchema.optional(),
});

const contentSourceIdSchema = z.string().regex(/^[a-z0-9][a-z0-9_-]{1,62}$/);

const contentSourceInputSchema = z.object({
  sourceId: contentSourceIdSchema,
  url: z.string().url(),
  preferSuffix: z.boolean().optional().default(false),
  maxChars: z.number().int().min(1).max(250_000).optional().default(120_000),
});

const loopContentSourcesCollectInputSchema = loopStatusInputSchema.extend({
  sources: z.array(contentSourceInputSchema).min(1).max(20),
});

const loopContentSourcesListInputSchema = loopStatusInputSchema.extend({
  sourceId: contentSourceIdSchema.optional(),
});

const anomalyDetectInputSchema = loopStatusInputSchema.extend({
  grain: anomalyGrainSchema.default("day"),
  metric: z.string().min(1).optional(),
});

const manifestSchema = z.object({
  run_id: z.string().optional(),
  status: z.string().optional(),
  updated_at: z.string().optional(),
  created_at: z.string().optional(),
  artifacts: z.record(z.string()).optional(),
  stage_completions: z.record(
    z.object({
      status: z.string(),
      timestamp: z.string().optional(),
      produced_keys: z.array(z.string()).optional(),
    })
  ),
});

const learningLedgerEntrySchema = z.object({
  entry_id: z.string().optional(),
  created_at: z.string().optional(),
  verdict: z.string().optional(),
});

const metricEntrySchema = z.object({
  timestamp: z.string().optional(),
  metric_name: z.string().optional(),
  value: z.number().optional(),
});

const sourceMetricPointSchema = z.object({
  metric: z.string().min(1),
  value: z.number(),
  valueType: z.enum(["currency", "count", "ratio", "duration"]),
  unit: z.string().min(1),
  segments: z.record(z.string(), z.string().or(z.number()).or(z.boolean())).default({}),
});

const sourceMetricsArtifactSchema = z.object({
  schemaVersion: z.literal("measure.source.metrics.v1"),
  source: z.enum(MEASURE_CONNECTOR_SOURCES),
  observedAt: z.string().datetime({ offset: true }),
  points: z.array(sourceMetricPointSchema).default([]),
});

const analyticsSunsetRunSchema = z.object({
  runId: z.string().min(1),
  generatedAt: z.string().datetime({ offset: true }),
  fullCoverage: z.boolean(),
  sourceCoverage: z.record(z.string(), z.number().int().nonnegative()),
});

const analyticsSunsetStatusSchema = z.object({
  schemaVersion: z.literal("analytics-sunset.v1"),
  business: z.string().min(1),
  requiredSources: z.array(z.enum(MEASURE_CONNECTOR_SOURCES)).min(1),
  minimumConsecutiveRuns: z.number().int().positive(),
  transitionWindowDays: z.number().int().positive(),
  updatedAt: z.string().datetime({ offset: true }),
  runs: z.array(analyticsSunsetRunSchema).default([]),
  consecutiveFullCoverageRuns: z.number().int().nonnegative(),
  sunsetEffectiveAt: z.string().datetime({ offset: true }).nullable(),
  sunsetActive: z.boolean(),
});

const refreshCollectorStatusSchema = z.object({
  schemaVersion: z.literal("refresh.collector.status.v1"),
  collector: z.string().min(1),
  state: refreshEnqueueStateSchema,
  lastRunAt: z.string().datetime({ offset: true }).optional(),
  lastSuccessAt: z.string().datetime({ offset: true }).optional(),
  updatedAt: z.string().datetime({ offset: true }).optional(),
  error: z
    .object({
      code: z.string().min(1),
      message: z.string().min(1),
    })
    .optional(),
});

const refreshRequestHistoryEntrySchema = z.object({
  from: refreshEnqueueStateSchema,
  to: refreshEnqueueStateSchema,
  at: z.string().datetime({ offset: true }),
});

const refreshRequestEntrySchema = z.object({
  requestId: z.string().min(1),
  state: refreshEnqueueStateSchema,
  requestedAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  writeReason: z.string().min(1),
  reason: z.string().min(1),
  requestedBy: z.string().min(1),
  history: z.array(refreshRequestHistoryEntrySchema).default([]),
});

const refreshQueueSchema = z.object({
  schemaVersion: z.literal("refresh.queue.v1"),
  collector: z.string().min(1),
  updatedAt: z.string().datetime({ offset: true }),
  requests: z.array(refreshRequestEntrySchema).default([]),
});

const contentSourcesIndexSchema = z.object({
  schemaVersion: z.literal("content.sources.index.v1"),
  business: z.string().min(1),
  runId: z.string().min(1),
  collector: z.literal("content_sources"),
  collectedAt: z.string().datetime({ offset: true }),
  sourceCount: z.number().int().nonnegative(),
  quality: z.enum(["ok", "partial", "blocked"]),
  qualityNotes: z.array(z.string()).default([]),
  coverage: z.object({
    expectedPoints: z.number().int().positive(),
    observedPoints: z.number().int().nonnegative(),
    samplingFraction: z.number().min(0).max(1),
  }),
  provenance: z.object({
    schemaVersion: z.literal("provenance.v1"),
    querySignature: z.string().min(1),
    generatedAt: z.string().datetime({ offset: true }),
    datasetId: z.string().min(1),
    sourceRef: z.literal("loop_content_sources_collect"),
    artifactRefs: z.array(z.string().min(1)).min(1),
    quality: z.enum(["ok", "partial", "blocked"]),
  }),
  artifactRefs: z.array(z.string().min(1)).min(1),
  sources: z.array(contentSourceRecordSchema).default([]),
});

export const loopToolPoliciesRaw = {
  loop_manifest_status: {
    permission: "read",
    sideEffects: "none",
    allowedStages: [...STARTUP_LOOP_STAGES],
    auditTag: "loop:manifest:status",
    contextRequired: ["business", "runId", "current_stage"],
    sensitiveFields: ["baseEntitySha"],
  },
  loop_learning_ledger_status: {
    permission: "read",
    sideEffects: "none",
    allowedStages: [...STARTUP_LOOP_STAGES],
    auditTag: "loop:learning-ledger:status",
    contextRequired: ["business", "runId", "current_stage"],
    sensitiveFields: ["baseEntitySha"],
  },
  loop_metrics_summary: {
    permission: "read",
    sideEffects: "none",
    allowedStages: [...STARTUP_LOOP_STAGES],
    auditTag: "loop:metrics:summary",
    contextRequired: ["business", "runId", "current_stage"],
    sensitiveFields: ["baseEntitySha"],
  },
  measure_snapshot_get: {
    permission: "read",
    sideEffects: "none",
    allowedStages: [...STARTUP_LOOP_STAGES],
    auditTag: "measure:snapshot:get",
    contextRequired: ["business", "runId", "current_stage"],
    sensitiveFields: ["baseEntitySha"],
  },
  app_run_packet_build: {
    permission: "read",
    sideEffects: "filesystem_write",
    allowedStages: [...STARTUP_LOOP_STAGES],
    auditTag: "app:run-packet:build",
    contextRequired: ["business", "runId", "current_stage"],
    sensitiveFields: ["baseEntitySha"],
  },
  app_run_packet_get: {
    permission: "read",
    sideEffects: "none",
    allowedStages: [...STARTUP_LOOP_STAGES],
    auditTag: "app:run-packet:get",
    contextRequired: ["business", "runId", "current_stage"],
    sensitiveFields: ["baseEntitySha"],
  },
  pack_weekly_s10_build: {
    permission: "read",
    sideEffects: "filesystem_write",
    allowedStages: [...STARTUP_LOOP_STAGES],
    auditTag: "pack:weekly-s10:build",
    contextRequired: ["business", "runId", "current_stage"],
    sensitiveFields: ["baseEntitySha"],
  },
  refresh_status_get: {
    permission: "read",
    sideEffects: "none",
    allowedStages: [...STARTUP_LOOP_STAGES],
    auditTag: "refresh:status:get",
    contextRequired: ["business", "runId", "current_stage"],
    sensitiveFields: ["baseEntitySha"],
  },
  refresh_enqueue_guarded: {
    permission: "guarded_write",
    sideEffects: "filesystem_write",
    allowedStages: [...STARTUP_LOOP_STAGES],
    auditTag: "refresh:enqueue:guarded",
    contextRequired: ["business", "runId", "current_stage"],
    sensitiveFields: ["baseEntitySha"],
  },
  loop_content_sources_collect: {
    permission: "read",
    sideEffects: "filesystem_write",
    allowedStages: [...STARTUP_LOOP_STAGES],
    auditTag: "loop:content-sources:collect",
    contextRequired: ["business", "runId", "current_stage"],
    sensitiveFields: ["baseEntitySha"],
  },
  loop_content_sources_list: {
    permission: "read",
    sideEffects: "none",
    allowedStages: [...STARTUP_LOOP_STAGES],
    auditTag: "loop:content-sources:list",
    contextRequired: ["business", "runId", "current_stage"],
    sensitiveFields: ["baseEntitySha"],
  },
  anomaly_detect_traffic: {
    permission: "read",
    sideEffects: "none",
    allowedStages: [...STARTUP_LOOP_STAGES],
    auditTag: "anomaly:traffic:detect",
    contextRequired: ["business", "runId", "current_stage"],
    sensitiveFields: ["baseEntitySha"],
  },
  anomaly_detect_revenue: {
    permission: "read",
    sideEffects: "none",
    allowedStages: [...STARTUP_LOOP_STAGES],
    auditTag: "anomaly:revenue:detect",
    contextRequired: ["business", "runId", "current_stage"],
    sensitiveFields: ["baseEntitySha"],
  },
  anomaly_detect_errors: {
    permission: "read",
    sideEffects: "none",
    allowedStages: [...STARTUP_LOOP_STAGES],
    auditTag: "anomaly:errors:detect",
    contextRequired: ["business", "runId", "current_stage"],
    sensitiveFields: ["baseEntitySha"],
  },
} as const;

export const loopTools = [
  {
    name: "loop_manifest_status",
    description: "Read startup-loop baseline manifest status and freshness for a run",
    inputSchema: {
      type: "object",
      properties: {
        business: { type: "string", description: "Business code" },
        runId: { type: "string", description: "Startup-loop run identifier" },
        current_stage: { type: "string", description: "Current startup-loop stage" },
      },
      required: ["business", "runId", "current_stage"],
    },
  },
  {
    name: "loop_learning_ledger_status",
    description: "Read startup-loop learning ledger health and freshness for a business",
    inputSchema: {
      type: "object",
      properties: {
        business: { type: "string", description: "Business code" },
        runId: { type: "string", description: "Startup-loop run identifier" },
        current_stage: { type: "string", description: "Current startup-loop stage" },
      },
      required: ["business", "runId", "current_stage"],
    },
  },
  {
    name: "loop_metrics_summary",
    description: "Read startup-loop metrics summary and freshness for a run",
    inputSchema: {
      type: "object",
      properties: {
        business: { type: "string", description: "Business code" },
        runId: { type: "string", description: "Startup-loop run identifier" },
        current_stage: { type: "string", description: "Current startup-loop stage" },
      },
      required: ["business", "runId", "current_stage"],
    },
  },
  {
    name: "measure_snapshot_get",
    description: "Return normalized measure snapshot records from run artifacts",
    inputSchema: {
      type: "object",
      properties: {
        business: { type: "string", description: "Business code" },
        runId: { type: "string", description: "Startup-loop run identifier" },
        current_stage: { type: "string", description: "Current startup-loop stage" },
        metric: { type: "string", description: "Optional metric filter" },
        source: {
          type: "string",
          description: "Optional source filter",
          enum: [...MEASURE_ALL_SOURCES],
        },
      },
      required: ["business", "runId", "current_stage"],
    },
  },
  {
    name: "app_run_packet_build",
    description: "Build and persist bounded app run packet from startup-loop artifacts",
    inputSchema: {
      type: "object",
      properties: {
        business: { type: "string", description: "Business code" },
        runId: { type: "string", description: "Startup-loop run identifier" },
        current_stage: { type: "string", description: "Current startup-loop stage" },
      },
      required: ["business", "runId", "current_stage"],
    },
  },
  {
    name: "app_run_packet_get",
    description: "Read a previously-built app run packet",
    inputSchema: {
      type: "object",
      properties: {
        business: { type: "string", description: "Business code" },
        runId: { type: "string", description: "Startup-loop run identifier" },
        current_stage: { type: "string", description: "Current startup-loop stage" },
        packetId: { type: "string", description: "Optional packet identifier" },
      },
      required: ["business", "runId", "current_stage"],
    },
  },
  {
    name: "pack_weekly_s10_build",
    description: "Build deterministic weekly S10 pack artifacts (markdown + json)",
    inputSchema: {
      type: "object",
      properties: {
        business: { type: "string", description: "Business code" },
        runId: { type: "string", description: "Startup-loop run identifier" },
        current_stage: { type: "string", description: "Current startup-loop stage" },
        packetId: { type: "string", description: "Optional packet identifier" },
      },
      required: ["business", "runId", "current_stage"],
    },
  },
  {
    name: "refresh_status_get",
    description: "Read collector health and refresh queue status for a business/run",
    inputSchema: {
      type: "object",
      properties: {
        business: { type: "string", description: "Business code" },
        runId: { type: "string", description: "Startup-loop run identifier" },
        current_stage: { type: "string", description: "Current startup-loop stage" },
        collector: { type: "string", description: "Collector key", default: "metrics" },
      },
      required: ["business", "runId", "current_stage"],
    },
  },
  {
    name: "refresh_enqueue_guarded",
    description: "Create or transition a guarded refresh request using idempotent request IDs",
    inputSchema: {
      type: "object",
      properties: {
        business: { type: "string", description: "Business code" },
        runId: { type: "string", description: "Startup-loop run identifier" },
        current_stage: { type: "string", description: "Current startup-loop stage" },
        collector: { type: "string", description: "Collector key", default: "metrics" },
        requestId: { type: "string", description: "Stable refresh request identifier" },
        write_reason: { type: "string", description: "Reason for guarded write request" },
        reason: { type: "string", description: "Operational reason for refresh" },
        requestedBy: { type: "string", description: "Requesting operator/system" },
        transitionTo: {
          type: "string",
          description: "Optional lifecycle transition target",
          enum: ["enqueued", "pending", "running", "complete", "failed", "expired"],
        },
      },
      required: ["business", "runId", "current_stage", "requestId", "write_reason", "reason", "requestedBy"],
    },
  },
  {
    name: "loop_content_sources_collect",
    description: "Collect and persist markdown source artifacts for standing refresh workflows",
    inputSchema: {
      type: "object",
      properties: {
        business: { type: "string", description: "Business code" },
        runId: { type: "string", description: "Startup-loop run identifier" },
        current_stage: { type: "string", description: "Current startup-loop stage" },
        sources: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            properties: {
              sourceId: { type: "string", description: "Stable source identifier" },
              url: { type: "string", description: "Public URL to fetch as markdown" },
              preferSuffix: { type: "boolean", description: "Append /markdown suffix", default: false },
              maxChars: { type: "number", description: "Maximum markdown characters", default: 120000 },
            },
            required: ["sourceId", "url"],
          },
        },
      },
      required: ["business", "runId", "current_stage", "sources"],
    },
  },
  {
    name: "loop_content_sources_list",
    description: "Read persisted markdown source metadata for a run",
    inputSchema: {
      type: "object",
      properties: {
        business: { type: "string", description: "Business code" },
        runId: { type: "string", description: "Startup-loop run identifier" },
        current_stage: { type: "string", description: "Current startup-loop stage" },
        sourceId: { type: "string", description: "Optional source identifier filter" },
      },
      required: ["business", "runId", "current_stage"],
    },
  },
  {
    name: "anomaly_detect_traffic",
    description: "Detect traffic anomalies using EWMA + z-score with minimum history gate",
    inputSchema: {
      type: "object",
      properties: {
        business: { type: "string", description: "Business code" },
        runId: { type: "string", description: "Startup-loop run identifier" },
        current_stage: { type: "string", description: "Current startup-loop stage" },
        grain: { type: "string", enum: ["day", "week", "month"], default: "day" },
        metric: { type: "string", description: "Optional metric override" },
      },
      required: ["business", "runId", "current_stage"],
    },
  },
  {
    name: "anomaly_detect_revenue",
    description: "Detect revenue anomalies using EWMA + z-score with minimum history gate",
    inputSchema: {
      type: "object",
      properties: {
        business: { type: "string", description: "Business code" },
        runId: { type: "string", description: "Startup-loop run identifier" },
        current_stage: { type: "string", description: "Current startup-loop stage" },
        grain: { type: "string", enum: ["day", "week", "month"], default: "day" },
        metric: { type: "string", description: "Optional metric override" },
      },
      required: ["business", "runId", "current_stage"],
    },
  },
  {
    name: "anomaly_detect_errors",
    description: "Detect error-rate anomalies using EWMA + z-score with minimum history gate",
    inputSchema: {
      type: "object",
      properties: {
        business: { type: "string", description: "Business code" },
        runId: { type: "string", description: "Startup-loop run identifier" },
        current_stage: { type: "string", description: "Current startup-loop stage" },
        grain: { type: "string", enum: ["day", "week", "month"], default: "day" },
        metric: { type: "string", description: "Optional metric override" },
      },
      required: ["business", "runId", "current_stage"],
    },
  },
] as const;

function toolError(
  code: ToolErrorCode,
  message: string,
  retryable: boolean,
  details?: Record<string, unknown>
): ToolCallResult {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            error: {
              code,
              message,
              retryable,
              details,
            },
          },
          null,
          2
        ),
      },
    ],
    isError: true,
  };
}

function buildMissingArtifactError(filePath: string): ToolCallResult {
  return toolError("MISSING_ARTIFACT", `Required startup-loop artifact is missing: ${filePath}`, false, {
    filePath,
  });
}

function hashPayload(value: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function packetIdFor(business: string, runId: string): string {
  return `RPK-${business}-${runId}`;
}

function parseMetricTimestamp(entry: z.infer<typeof metricEntrySchema>): string {
  if (!entry.timestamp) {
    return new Date(0).toISOString();
  }

  const parsed = Date.parse(entry.timestamp);
  if (Number.isNaN(parsed)) {
    return new Date(0).toISOString();
  }

  return new Date(parsed).toISOString();
}

function inferValueType(metricName: string): "currency" | "count" | "ratio" | "duration" {
  const lower = metricName.toLowerCase();
  if (lower.includes("rate") || lower.includes("ratio") || lower.includes("cvr")) {
    return "ratio";
  }
  if (lower.includes("ms") || lower.includes("latency") || lower.includes("duration")) {
    return "duration";
  }
  if (lower.includes("revenue") || lower.includes("price")) {
    return "currency";
  }
  return "count";
}

function inferUnit(valueType: "currency" | "count" | "ratio" | "duration"): string {
  if (valueType === "currency") {
    return "EUR";
  }
  if (valueType === "ratio") {
    return "ratio";
  }
  if (valueType === "duration") {
    return "ms";
  }
  return "count";
}

function mapMetricEntryToRecord(
  business: string,
  metric: z.infer<typeof metricEntrySchema>,
  sourceRef: string
) {
  const metricName = metric.metric_name ?? "unknown_metric";
  const metricValue = typeof metric.value === "number" ? metric.value : 0;
  const timestamp = parseMetricTimestamp(metric);
  const valueType = inferValueType(metricName);

  return parseWave2MetricRecord({
    schemaVersion: "measure.record.v1",
    business,
    source: "startup_loop_metrics",
    metric: metricName,
    window: {
      startAt: timestamp,
      endAt: timestamp,
      grain: "day",
      timezone: "UTC",
    },
    segmentSchemaVersion: "segments.v1",
    segments: {},
    valueType,
    value: metricValue,
    unit: inferUnit(valueType),
    quality: "ok",
    qualityNotes: [],
    coverage: {
      expectedPoints: 1,
      observedPoints: 1,
      samplingFraction: 1,
    },
    refreshedAt: timestamp,
    provenance: {
      schemaVersion: "provenance.v1",
      querySignature: `sha256:${hashPayload(metric)}`,
      generatedAt: timestamp,
      datasetId: `${business}-${metricName}`,
      sourceRef,
      artifactRefs: [sourceRef],
      quality: "ok",
    },
  });
}

function buildMeasureRecordFromPoint(input: {
  business: string;
  source: z.infer<typeof measureSourceSchema>;
  observedAt: string;
  point: z.infer<typeof sourceMetricPointSchema>;
  sourceRef: string;
}): ReturnType<typeof parseWave2MetricRecord> {
  return parseWave2MetricRecord({
    schemaVersion: "measure.record.v1",
    business: input.business,
    source: input.source,
    metric: input.point.metric,
    window: {
      startAt: input.observedAt,
      endAt: input.observedAt,
      grain: "day",
      timezone: "UTC",
    },
    segmentSchemaVersion: "segments.v1",
    segments: input.point.segments,
    valueType: input.point.valueType,
    value: input.point.value,
    unit: input.point.unit,
    quality: "ok",
    qualityNotes: [],
    coverage: {
      expectedPoints: 1,
      observedPoints: 1,
      samplingFraction: 1,
    },
    refreshedAt: input.observedAt,
    provenance: {
      schemaVersion: "provenance.v1",
      querySignature: `sha256:${hashPayload({ source: input.source, point: input.point })}`,
      generatedAt: input.observedAt,
      datasetId: `${input.business}-${input.source}-${input.point.metric}`,
      sourceRef: input.sourceRef,
      artifactRefs: [input.sourceRef],
      quality: "ok",
    },
  });
}

async function collectMeasureRecords(params: {
  business: string;
  runId: string;
  metricFilter?: string;
  sourceFilter?: z.infer<typeof measureSourceSchema>;
}): Promise<{
  records: Array<ReturnType<typeof parseWave2MetricRecord>>;
  sourceCoverage: Record<string, number>;
  artifactRefs: string[];
  latestTimestamp: string;
}> {
  const paths = resolveLoopArtifactPaths(params.business, params.runId);
  const artifactRefs: string[] = [];
  const records: Array<ReturnType<typeof parseWave2MetricRecord>> = [];
  const sourceCoverage: Record<string, number> = Object.fromEntries(
    MEASURE_ALL_SOURCES.map((source) => [source, 0])
  );

  const metricsRaw = await readJsonLines(paths.metricsPath);
  if (metricsRaw) {
    artifactRefs.push(paths.metricsPath);
    const parsedEntries = metricsRaw.map((entry) => metricEntrySchema.parse(entry));
    for (const [index, entry] of parsedEntries.entries()) {
      if (params.metricFilter && entry.metric_name !== params.metricFilter) {
        continue;
      }
      if (params.sourceFilter && params.sourceFilter !== "startup_loop_metrics") {
        continue;
      }
      const record = mapMetricEntryToRecord(
        params.business,
        entry,
        `${paths.metricsPath}#${index}`
      );
      records.push(record);
      sourceCoverage.startup_loop_metrics += 1;
    }
  }

  for (const source of MEASURE_CONNECTOR_SOURCES) {
    if (params.sourceFilter && params.sourceFilter !== source) {
      continue;
    }
    const artifactPath = sourceMetricsArtifactPath(paths, source);
    const sourceArtifactRaw = await readJsonFile(artifactPath);
    if (!sourceArtifactRaw) {
      continue;
    }
    artifactRefs.push(artifactPath);
    const sourceArtifact = sourceMetricsArtifactSchema.parse(sourceArtifactRaw);
    for (const [index, point] of sourceArtifact.points.entries()) {
      if (params.metricFilter && point.metric !== params.metricFilter) {
        continue;
      }
      const record = buildMeasureRecordFromPoint({
        business: params.business,
        source: sourceArtifact.source,
        observedAt: sourceArtifact.observedAt,
        point,
        sourceRef: `${artifactPath}#${index}`,
      });
      records.push(record);
      sourceCoverage[sourceArtifact.source] += 1;
    }
  }

  const latestTimestamp =
    records.map((record) => record.refreshedAt).sort().at(-1) ?? new Date(0).toISOString();

  return {
    records,
    sourceCoverage,
    artifactRefs,
    latestTimestamp,
  };
}

function hasFullConnectorCoverage(sourceCoverage: Record<string, number>): boolean {
  return MEASURE_CONNECTOR_SOURCES.every((source) => (sourceCoverage[source] ?? 0) > 0);
}

function countConsecutiveFullCoverageRuns(
  runs: Array<z.infer<typeof analyticsSunsetRunSchema>>
): number {
  const sorted = runs.slice().sort((left, right) => left.generatedAt.localeCompare(right.generatedAt));
  let count = 0;
  for (let index = sorted.length - 1; index >= 0; index -= 1) {
    if (!sorted[index]?.fullCoverage) {
      break;
    }
    count += 1;
  }
  return count;
}

async function updateAnalyticsSunsetStatus(params: {
  business: string;
  runId: string;
  generatedAt: string;
  sourceCoverage: Record<string, number>;
  paths: { businessRoot: string };
}): Promise<z.infer<typeof analyticsSunsetStatusSchema>> {
  const statusPath = analyticsSunsetStatusPath(params.paths);
  const existingRaw = await readJsonFile(statusPath);
  const existing = existingRaw
    ? analyticsSunsetStatusSchema.parse(existingRaw)
    : {
        schemaVersion: "analytics-sunset.v1" as const,
        business: params.business,
        requiredSources: [...MEASURE_CONNECTOR_SOURCES],
        minimumConsecutiveRuns: 2,
        transitionWindowDays: 14,
        updatedAt: new Date(0).toISOString(),
        runs: [],
        consecutiveFullCoverageRuns: 0,
        sunsetEffectiveAt: null,
        sunsetActive: false,
      };

  const nextRuns = [
    ...existing.runs.filter((entry) => entry.runId !== params.runId),
    {
      runId: params.runId,
      generatedAt: params.generatedAt,
      fullCoverage: hasFullConnectorCoverage(params.sourceCoverage),
      sourceCoverage: params.sourceCoverage,
    },
  ]
    .sort((left, right) => left.generatedAt.localeCompare(right.generatedAt))
    .slice(-26);

  const consecutiveFullCoverageRuns = countConsecutiveFullCoverageRuns(nextRuns);
  const latestRun = nextRuns.at(-1);
  const latestTimestampMs = Date.parse(latestRun?.generatedAt ?? new Date(0).toISOString());
  const sunsetEffectiveAt =
    consecutiveFullCoverageRuns >= existing.minimumConsecutiveRuns && Number.isFinite(latestTimestampMs)
      ? new Date(
          latestTimestampMs + existing.transitionWindowDays * 24 * 60 * 60 * 1000
        ).toISOString()
      : null;

  const sunsetActive = sunsetEffectiveAt ? Date.now() >= Date.parse(sunsetEffectiveAt) : false;

  const nextStatus = analyticsSunsetStatusSchema.parse({
    ...existing,
    business: params.business,
    updatedAt: params.generatedAt,
    runs: nextRuns,
    consecutiveFullCoverageRuns,
    sunsetEffectiveAt,
    sunsetActive,
  });

  await writeJsonArtifact(statusPath, nextStatus);
  return nextStatus;
}

function metricsToTotals(entries: Array<z.infer<typeof metricEntrySchema>>): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const entry of entries) {
    if (!entry.metric_name || typeof entry.value !== "number") {
      continue;
    }
    totals[entry.metric_name] = (totals[entry.metric_name] ?? 0) + entry.value;
  }
  return totals;
}

function measureRecordsToTotals(
  records: Array<ReturnType<typeof parseWave2MetricRecord>>
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const record of records) {
    totals[record.metric] = (totals[record.metric] ?? 0) + record.value;
  }
  return totals;
}

function topItemsFromPrefix(
  totals: Record<string, number>,
  prefix: string,
  maxItems: number
): string[] {
  return Object.entries(totals)
    .filter(([key]) => key.startsWith(prefix))
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxItems)
    .map(([key]) => key.slice(prefix.length));
}

function refreshQueuePath(paths: { businessRoot: string }, collector: string): string {
  return path.join(paths.businessRoot, "refresh", "requests", `${collector}.json`);
}

function refreshCollectorStatusPath(paths: { businessRoot: string }, collector: string): string {
  return path.join(paths.businessRoot, "refresh", "collectors", `${collector}.status.json`);
}

function sourceMetricsArtifactPath(
  paths: { runRoot: string },
  source: z.infer<typeof measureSourceSchema>
): string {
  return path.join(paths.runRoot, "collectors", `${source}.metrics.json`);
}

function contentSourceMarkdownPath(
  paths: { contentSourcesDir: string },
  sourceId: string
): string {
  return path.join(paths.contentSourcesDir, `${sourceId}.md`);
}

function contentSourceChecksum(markdown: string): string {
  return crypto.createHash("sha256").update(markdown).digest("hex");
}

function buildContentSourceRequestUrl(url: string, preferSuffix: boolean): string {
  const parsed = new URL(url);
  if (!preferSuffix) {
    return parsed.toString();
  }

  if (!parsed.pathname.endsWith("/markdown")) {
    parsed.pathname = `${parsed.pathname.replace(/\/$/, "")}/markdown`;
  }

  return parsed.toString();
}

function isMarkdownContentType(contentType: string | null): boolean {
  return (contentType || "").toLowerCase().includes("text/markdown");
}

class ContentSourceFetchError extends Error {
  readonly classification: "MARKDOWN_UNAVAILABLE" | "MARKDOWN_CONTRACT_MISMATCH";
  readonly details: Record<string, unknown>;
  readonly retryable: boolean;

  constructor(
    classification: "MARKDOWN_UNAVAILABLE" | "MARKDOWN_CONTRACT_MISMATCH",
    message: string,
    details: Record<string, unknown>,
    retryable = false
  ) {
    super(message);
    this.classification = classification;
    this.details = details;
    this.retryable = retryable;
  }
}

type CollectedContentSource = {
  sourceId: string;
  url: string;
  requestUrl: string;
  finalUrl: string;
  fetchedAt: string;
  status: number;
  contentType: string | null;
  markdown: string;
  checksum: string;
  charCount: number;
  truncated: boolean;
  quality: "ok" | "partial" | "blocked";
  qualityNotes: string[];
};

async function collectContentSource(source: z.infer<typeof contentSourceInputSchema>): Promise<CollectedContentSource> {
  const requestUrl = buildContentSourceRequestUrl(source.url, source.preferSuffix);
  const response = await fetch(requestUrl, {
    headers: {
      Accept: "text/markdown, text/plain;q=0.7",
      "User-Agent": "acme-mcp-server/startup-loop-content-collector",
    },
  });

  const status = response.status;
  const finalUrl = response.url || requestUrl;
  const contentType = response.headers.get("content-type");
  const body = await response.text();
  const fetchedAt = new Date().toISOString();

  if (!response.ok) {
    throw new ContentSourceFetchError(
      "MARKDOWN_UNAVAILABLE",
      `Markdown fetch failed with status ${status}.`,
      {
        sourceId: source.sourceId,
        url: source.url,
        requestUrl,
        finalUrl,
        status,
      },
      status >= 500
    );
  }

  if (!isMarkdownContentType(contentType)) {
    throw new ContentSourceFetchError(
      "MARKDOWN_CONTRACT_MISMATCH",
      `Expected text/markdown but received ${contentType || "unknown"}.`,
      {
        sourceId: source.sourceId,
        url: source.url,
        requestUrl,
        finalUrl,
        status,
        contentType,
      },
      false
    );
  }

  if (body.trim().length === 0) {
    throw new ContentSourceFetchError(
      "MARKDOWN_CONTRACT_MISMATCH",
      "Received empty markdown content.",
      {
        sourceId: source.sourceId,
        url: source.url,
        requestUrl,
        finalUrl,
        status,
      },
      false
    );
  }

  const markdown = body.slice(0, source.maxChars);
  const truncated = body.length > source.maxChars;
  const qualityNotes = truncated ? ["truncated"] : [];
  const quality = markdown.trim().length < 200 ? "partial" : "ok";
  if (quality === "partial") {
    qualityNotes.push("low-content-volume");
  }

  return {
    sourceId: source.sourceId,
    url: source.url,
    requestUrl,
    finalUrl,
    fetchedAt,
    status,
    contentType,
    markdown,
    checksum: contentSourceChecksum(markdown),
    charCount: markdown.length,
    truncated,
    quality,
    qualityNotes,
  };
}

function analyticsSunsetStatusPath(paths: { businessRoot: string }): string {
  return path.join(paths.businessRoot, "coverage", "analytics-sunset-status.json");
}

function parseCollectorFreshnessTimestamp(status: z.infer<typeof refreshCollectorStatusSchema> | null): string | null {
  if (!status) {
    return null;
  }
  return status.updatedAt ?? status.lastRunAt ?? status.lastSuccessAt ?? null;
}

async function readContentSourcesIndex(paths: { contentSourcesIndexPath: string }) {
  const raw = await readJsonFile(paths.contentSourcesIndexPath);
  if (!raw) {
    return null;
  }
  const parsed = contentSourcesIndexSchema.parse(raw);
  return {
    ...parsed,
    sources: parsed.sources.map((source) => parseContentSourceRecord(source)),
  };
}

function toWeekBucket(date: Date): string {
  const current = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = current.getUTCDay() || 7;
  current.setUTCDate(current.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(current.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((current.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${current.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function bucketTimestamp(isoTimestamp: string, grain: z.infer<typeof anomalyGrainSchema>): string {
  const date = new Date(isoTimestamp);
  if (grain === "week") {
    return toWeekBucket(date);
  }
  if (grain === "month") {
    return isoTimestamp.slice(0, 7);
  }
  return isoTimestamp.slice(0, 10);
}

function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]): number {
  if (values.length <= 1) {
    return 0;
  }
  const avg = mean(values);
  const variance =
    values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

async function writeJsonArtifact(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

function buildPackMarkdown(payload: {
  business: string;
  runId: string;
  generatedAt: string;
  manifestStatus: string | null;
  stageCompletionCount: number;
  metricCount: number;
  packetId: string;
  contentSourceCount: number;
  evidenceRefs: string[];
}): string {
  return [
    `# Weekly S10 Pack — ${payload.business}`,
    "",
    `- Run: ${payload.runId}`,
    `- Generated: ${payload.generatedAt}`,
    `- Manifest status: ${payload.manifestStatus ?? "unknown"}`,
    `- Stage completions: ${payload.stageCompletionCount}`,
    `- Metric keys: ${payload.metricCount}`,
    `- Packet: ${payload.packetId}`,
    `- Content sources: ${payload.contentSourceCount}`,
    "",
    "## Evidence",
    ...payload.evidenceRefs.map((ref) => `- ${ref}`),
    "",
  ].join("\n");
}

async function handleLoopManifestStatus(args: unknown): Promise<ToolCallResult> {
  const parsed = loopStatusInputSchema.parse(args);
  const paths = resolveLoopArtifactPaths(parsed.business, parsed.runId);
  const manifestRaw = await readJsonFile(paths.manifestPath);
  if (!manifestRaw) {
    return buildMissingArtifactError(paths.manifestPath);
  }

  const manifest = manifestSchema.parse(manifestRaw);
  const stageCompletions = Object.entries(manifest.stage_completions || {});

  const freshness = buildFreshnessEnvelope(
    manifest.updated_at ?? manifest.created_at ?? null
  );

  return jsonResult({
    business: parsed.business,
    runId: parsed.runId,
    status: manifest.status ?? null,
    stageCompletionCount: stageCompletions.length,
    doneStageCount: stageCompletions.filter(([, stage]) => stage.status === "Done").length,
    freshness,
  });
}

async function handleLoopLearningLedgerStatus(args: unknown): Promise<ToolCallResult> {
  const parsed = loopStatusInputSchema.parse(args);
  const paths = resolveLoopArtifactPaths(parsed.business, parsed.runId);
  const ledgerRaw = await readJsonLines(paths.learningLedgerPath);
  if (!ledgerRaw) {
    return buildMissingArtifactError(paths.learningLedgerPath);
  }

  const entries = ledgerRaw.map((entry) => learningLedgerEntrySchema.parse(entry));
  const latest = entries
    .map((entry) => entry.created_at)
    .filter((timestamp): timestamp is string => typeof timestamp === "string")
    .sort()
    .at(-1) ?? null;

  const freshness = buildFreshnessEnvelope(latest);

  return jsonResult({
    business: parsed.business,
    runId: parsed.runId,
    entryCount: entries.length,
    latestEntryAt: latest,
    freshness,
  });
}

async function handleLoopMetricsSummary(args: unknown): Promise<ToolCallResult> {
  const parsed = loopStatusInputSchema.parse(args);
  const paths = resolveLoopArtifactPaths(parsed.business, parsed.runId);
  const metricsRaw = await readJsonLines(paths.metricsPath);
  if (!metricsRaw) {
    return buildMissingArtifactError(paths.metricsPath);
  }

  const entries = metricsRaw.map((entry) => metricEntrySchema.parse(entry));
  const metrics = metricsToTotals(entries);

  const latest = entries
    .map((entry) => entry.timestamp)
    .filter((timestamp): timestamp is string => typeof timestamp === "string")
    .sort()
    .at(-1) ?? null;

  const freshness = buildFreshnessEnvelope(latest);

  return jsonResult({
    business: parsed.business,
    runId: parsed.runId,
    metricCount: Object.keys(metrics).length,
    metrics,
    latestMetricAt: latest,
    freshness,
  });
}

async function handleMeasureSnapshotGet(args: unknown): Promise<ToolCallResult> {
  const parsed = measureSnapshotInputSchema.parse(args);
  const { records, sourceCoverage, artifactRefs, latestTimestamp } = await collectMeasureRecords({
    business: parsed.business,
    runId: parsed.runId,
    metricFilter: parsed.metric,
    sourceFilter: parsed.source,
  });

  if (records.length === 0) {
    const paths = resolveLoopArtifactPaths(parsed.business, parsed.runId);
    return buildMissingArtifactError(paths.metricsPath);
  }

  const observedCoverageSources = parsed.source
    ? (sourceCoverage[parsed.source] ?? 0) > 0
      ? 1
      : 0
    : MEASURE_CONNECTOR_SOURCES.filter((source) => (sourceCoverage[source] ?? 0) > 0).length;
  const expectedCoverageSources = parsed.source ? 1 : MEASURE_CONNECTOR_SOURCES.length;
  const quality = determineWave2Quality({
    expectedPoints: expectedCoverageSources,
    observedPoints: observedCoverageSources,
  });
  const missingConnectorSources = parsed.source
    ? []
    : MEASURE_CONNECTOR_SOURCES.filter((source) => (sourceCoverage[source] ?? 0) === 0);

  const envelope = buildEnvelope({
    schemaVersion: "measure.snapshot.v1",
    refreshedAt: latestTimestamp,
    qualityNotes: missingConnectorSources.map((source) => `missing-source:${source}`),
    coverage: {
      expectedPoints: expectedCoverageSources,
      observedPoints: observedCoverageSources,
      samplingFraction:
        expectedCoverageSources > 0
          ? observedCoverageSources / expectedCoverageSources
          : 0,
    },
    provenance: {
      schemaVersion: "provenance.v1",
      querySignature: `sha256:${hashPayload(records.map((record) => record.metric))}`,
      generatedAt: latestTimestamp,
      datasetId: `${parsed.business}-${parsed.runId}-measure-snapshot`,
      sourceRef: "measure_snapshot_get",
      artifactRefs,
      quality,
    },
  });

  return jsonResult({
    ...envelope,
    business: parsed.business,
    runId: parsed.runId,
    metric: parsed.metric ?? null,
    source: parsed.source ?? null,
    recordCount: records.length,
    sourceCoverage,
    fullConnectorCoverage: hasFullConnectorCoverage(sourceCoverage),
    records,
  });
}

async function handleAppRunPacketBuild(args: unknown): Promise<ToolCallResult> {
  const parsed = packetBuildInputSchema.parse(args);
  const paths = resolveLoopArtifactPaths(parsed.business, parsed.runId);

  const manifestRaw = await readJsonFile(paths.manifestPath);
  if (!manifestRaw) {
    return buildMissingArtifactError(paths.manifestPath);
  }
  const manifest = manifestSchema.parse(manifestRaw);

  const { records, sourceCoverage, latestTimestamp } = await collectMeasureRecords({
    business: parsed.business,
    runId: parsed.runId,
  });
  if (records.length === 0) {
    return buildMissingArtifactError(paths.metricsPath);
  }

  const totals = measureRecordsToTotals(records);
  const packetId = packetIdFor(parsed.business, parsed.runId);
  const latest = latestTimestamp;

  const basePacket = {
    schemaVersion: "run.packet.v1" as const,
    packetId,
    source: "app_run_packet_build",
    timeWindow: {
      start: manifest.created_at ?? latest.slice(0, 10),
      end: manifest.updated_at ?? latest.slice(0, 10),
    },
    segments: {
      business: parsed.business,
      runId: parsed.runId,
    },
    sizeBytes: 0,
    sizeBudgetBytes: 262144,
    redactionApplied: false,
    redactionRulesVersion: "packet-redaction.v1" as const,
    data: {
      bookingsSummary: {
        bookingMetricCount: Object.keys(totals).filter((key) =>
          key.toLowerCase().includes("booking")
        ).length,
      },
      funnelStats: totals,
      inventoryDeltas: {},
      pricingTables: {},
      topPages: topItemsFromPrefix(totals, "page:", 50),
      topQueries: topItemsFromPrefix(totals, "query:", 50),
      topSupportIssues: topItemsFromPrefix(totals, "support:", 25),
    },
    sourceRefs: {
      bookingsSummary: [paths.metricsPath],
      funnelStats: [paths.metricsPath],
      topSupportIssues: [paths.learningLedgerPath],
      sourceCoverage: [sourceMetricsArtifactPath(paths, "stripe")],
    },
    refreshedAt: latest,
    quality: determineWave2Quality({
      expectedPoints: Math.max(MEASURE_CONNECTOR_SOURCES.length, 1),
      observedPoints: MEASURE_CONNECTOR_SOURCES.filter((source) => (sourceCoverage[source] ?? 0) > 0).length,
    }),
    qualityNotes: MEASURE_CONNECTOR_SOURCES.filter((source) => (sourceCoverage[source] ?? 0) === 0).map(
      (source) => `missing-source:${source}`
    ),
    coverage: {
      expectedPoints: Math.max(MEASURE_CONNECTOR_SOURCES.length, 1),
      observedPoints: MEASURE_CONNECTOR_SOURCES.filter((source) => (sourceCoverage[source] ?? 0) > 0).length,
      samplingFraction:
        MEASURE_CONNECTOR_SOURCES.length > 0
          ? MEASURE_CONNECTOR_SOURCES.filter((source) => (sourceCoverage[source] ?? 0) > 0).length /
            MEASURE_CONNECTOR_SOURCES.length
          : 0,
    },
    provenance: {
      schemaVersion: "provenance.v1" as const,
      querySignature: `sha256:${hashPayload({ manifest, totals, sourceCoverage })}`,
      generatedAt: latest,
      datasetId: `${parsed.business}-${parsed.runId}-run-packet`,
      sourceRef: "app_run_packet_build",
      artifactRefs: [paths.manifestPath, paths.metricsPath],
      quality: hasFullConnectorCoverage(sourceCoverage) ? "ok" : "partial",
    },
  };

  const packetJson = JSON.stringify(basePacket);
  const packet = {
    ...basePacket,
    sizeBytes: Buffer.byteLength(packetJson, "utf-8"),
  };

  const boundedPacket = validateRunPacketBounds(packet);
  const packetPath = path.join(paths.runRoot, "run-packets", `${packetId}.json`);
  await writeJsonArtifact(packetPath, boundedPacket);

  return jsonResult({
    ...boundedPacket,
    packetPath,
  });
}

async function handleAppRunPacketGet(args: unknown): Promise<ToolCallResult> {
  const parsed = packetGetInputSchema.parse(args);
  const paths = resolveLoopArtifactPaths(parsed.business, parsed.runId);
  const packetId = parsed.packetId ?? packetIdFor(parsed.business, parsed.runId);
  const packetPath = path.join(paths.runRoot, "run-packets", `${packetId}.json`);

  const packetRaw = await readJsonFile(packetPath);
  if (!packetRaw) {
    return buildMissingArtifactError(packetPath);
  }

  const packet = validateRunPacketBounds(packetRaw);
  return jsonResult({
    ...packet,
    packetPath,
  });
}

async function handleLoopContentSourcesCollect(args: unknown): Promise<ToolCallResult> {
  const parsed = loopContentSourcesCollectInputSchema.parse(args);
  const paths = resolveLoopArtifactPaths(parsed.business, parsed.runId);

  const duplicateSourceIds = parsed.sources.reduce<string[]>((duplicates, source, index, items) => {
    if (items.findIndex((entry) => entry.sourceId === source.sourceId) !== index) {
      duplicates.push(source.sourceId);
    }
    return duplicates;
  }, []);

  if (duplicateSourceIds.length > 0) {
    return toolError(
      "CONTRACT_MISMATCH",
      "Duplicate sourceId values are not allowed in loop_content_sources_collect.",
      false,
      { duplicateSourceIds: [...new Set(duplicateSourceIds)] }
    );
  }

  const orderedSources = parsed.sources.slice().sort((left, right) => left.sourceId.localeCompare(right.sourceId));
  const collected: CollectedContentSource[] = [];

  for (const source of orderedSources) {
    try {
      collected.push(await collectContentSource(source));
    } catch (error) {
      if (error instanceof ContentSourceFetchError) {
        return toolError(
          "CONTRACT_MISMATCH",
          `${error.classification}: ${error.message}`,
          error.retryable,
          error.details
        );
      }
      throw error;
    }
  }

  const sourceRecords = [];
  const artifactRefs: string[] = [];
  const qualityNotes: string[] = [];

  for (const source of collected) {
    const markdownPath = contentSourceMarkdownPath(paths, source.sourceId);
    await fs.mkdir(path.dirname(markdownPath), { recursive: true });
    await fs.writeFile(markdownPath, source.markdown, "utf-8");
    artifactRefs.push(markdownPath);
    qualityNotes.push(...source.qualityNotes.map((note) => `${source.sourceId}:${note}`));

    sourceRecords.push(
      parseContentSourceRecord({
        schemaVersion: "content.source.v1",
        sourceId: source.sourceId,
        url: source.url,
        requestUrl: source.requestUrl,
        finalUrl: source.finalUrl,
        fetchedAt: source.fetchedAt,
        status: source.status,
        contentType: source.contentType,
        markdownPath,
        checksum: source.checksum,
        charCount: source.charCount,
        truncated: source.truncated,
        quality: source.quality,
        qualityNotes: source.qualityNotes,
        coverage: {
          expectedPoints: 1,
          observedPoints: 1,
          samplingFraction: 1,
        },
        provenance: {
          schemaVersion: "provenance.v1",
          querySignature: `sha256:${hashPayload({ sourceId: source.sourceId, checksum: source.checksum })}`,
          generatedAt: source.fetchedAt,
          datasetId: `${parsed.business}-${parsed.runId}-${source.sourceId}-content-source`,
          sourceRef: "loop_content_sources_collect",
          artifactRefs: [markdownPath],
          quality: source.quality,
        },
      })
    );
  }

  artifactRefs.push(paths.contentSourcesIndexPath);
  const sourceCount = sourceRecords.length;
  const coverage = {
    expectedPoints: sourceCount > 0 ? sourceCount : 1,
    observedPoints: sourceCount,
    samplingFraction: sourceCount > 0 ? 1 : 0,
  };
  const quality = sourceRecords.every((source) => source.quality === "ok") ? "ok" : "partial";
  const collectedAt = sourceRecords
    .map((source) => source.fetchedAt)
    .sort((left, right) => left.localeCompare(right))
    .at(-1) ?? new Date(0).toISOString();

  const indexArtifact = contentSourcesIndexSchema.parse({
    schemaVersion: "content.sources.index.v1",
    business: parsed.business,
    runId: parsed.runId,
    collector: "content_sources",
    collectedAt,
    sourceCount,
    quality,
    qualityNotes,
    coverage,
    provenance: {
      schemaVersion: "provenance.v1",
      querySignature: `sha256:${hashPayload({ sources: sourceRecords.map((source) => source.sourceId) })}`,
      generatedAt: collectedAt,
      datasetId: `${parsed.business}-${parsed.runId}-content-sources-index`,
      sourceRef: "loop_content_sources_collect",
      artifactRefs: artifactRefs.filter((ref) => ref !== paths.contentSourcesIndexPath),
      quality,
    },
    artifactRefs,
    sources: sourceRecords,
  });

  await writeJsonArtifact(paths.contentSourcesIndexPath, indexArtifact);

  const envelope = buildEnvelope({
    schemaVersion: "content.sources.index.v1",
    refreshedAt: collectedAt,
    qualityNotes,
    coverage,
    provenance: indexArtifact.provenance,
  });

  return jsonResult({
    ...envelope,
    business: parsed.business,
    runId: parsed.runId,
    collector: "content_sources",
    contentSourcesIndexPath: paths.contentSourcesIndexPath,
    sourceCount,
    sources: sourceRecords,
    artifactRefs,
  });
}

async function handleLoopContentSourcesList(args: unknown): Promise<ToolCallResult> {
  const parsed = loopContentSourcesListInputSchema.parse(args);
  const paths = resolveLoopArtifactPaths(parsed.business, parsed.runId);
  const index = await readContentSourcesIndex(paths);
  if (!index) {
    return buildMissingArtifactError(paths.contentSourcesIndexPath);
  }

  const sources = parsed.sourceId
    ? index.sources.filter((source) => source.sourceId === parsed.sourceId)
    : index.sources;
  const freshness = buildFreshnessEnvelope(index.collectedAt);

  return jsonResult({
    schemaVersion: index.schemaVersion,
    business: index.business,
    runId: index.runId,
    collector: index.collector,
    collectedAt: index.collectedAt,
    sourceCount: sources.length,
    quality: index.quality,
    qualityNotes: index.qualityNotes,
    coverage: index.coverage,
    provenance: index.provenance,
    freshness,
    contentSourcesIndexPath: paths.contentSourcesIndexPath,
    artifactRefs: index.artifactRefs,
    sources,
  });
}

async function handlePackWeeklyS10Build(args: unknown): Promise<ToolCallResult> {
  const parsed = packBuildInputSchema.parse(args);
  const paths = resolveLoopArtifactPaths(parsed.business, parsed.runId);
  const packetId = parsed.packetId ?? packetIdFor(parsed.business, parsed.runId);
  const packetPath = path.join(paths.runRoot, "run-packets", `${packetId}.json`);

  const manifestRaw = await readJsonFile(paths.manifestPath);
  if (!manifestRaw) {
    return buildMissingArtifactError(paths.manifestPath);
  }
  const manifest = manifestSchema.parse(manifestRaw);

  const packetRaw = await readJsonFile(packetPath);
  if (!packetRaw) {
    return buildMissingArtifactError(packetPath);
  }
  const packet = validateRunPacketBounds(packetRaw);

  const measureSnapshot = await collectMeasureRecords({
    business: parsed.business,
    runId: parsed.runId,
  });
  const sunsetStatus = await updateAnalyticsSunsetStatus({
    business: parsed.business,
    runId: parsed.runId,
    generatedAt: packet.refreshedAt,
    sourceCoverage: measureSnapshot.sourceCoverage,
    paths,
  });

  const generatedAt = packet.refreshedAt;
  const contentSourcesIndex = await readContentSourcesIndex(paths);
  const contentSourceEvidenceRefs = contentSourcesIndex
    ? [
        paths.contentSourcesIndexPath,
        ...contentSourcesIndex.sources.map((source) => source.markdownPath),
      ]
    : [];
  const evidenceRefs = [
    paths.manifestPath,
    packetPath,
    paths.metricsPath,
    analyticsSunsetStatusPath(paths),
    ...contentSourceEvidenceRefs,
  ];

  const packJson = {
    schemaVersion: "pack.weekly-s10.v1",
    business: parsed.business,
    runId: parsed.runId,
    generatedAt,
    bosState: {
      manifestStatus: manifest.status ?? null,
      stageCompletionCount: Object.keys(manifest.stage_completions ?? {}).length,
    },
    runArtifacts: {
      packetId: packet.packetId,
      packetPath,
    },
    measurements: {
      metricCount: Object.keys(packet.data.funnelStats as Record<string, number>).length,
      sourceCoverage: measureSnapshot.sourceCoverage,
      fullConnectorCoverage: hasFullConnectorCoverage(measureSnapshot.sourceCoverage),
    },
    contentSources: contentSourcesIndex
      ? {
          sourceCount: contentSourcesIndex.sourceCount,
          quality: contentSourcesIndex.quality,
          collectedAt: contentSourcesIndex.collectedAt,
        }
      : null,
    triggerStatus: {
      schemaVersion: sunsetStatus.schemaVersion,
      consecutiveFullCoverageRuns: sunsetStatus.consecutiveFullCoverageRuns,
      sunsetEffectiveAt: sunsetStatus.sunsetEffectiveAt,
      sunsetActive: sunsetStatus.sunsetActive,
    },
    anomalies: [],
    recommendedActions: [],
    evidenceRefs,
  };

  const packDir = path.join(paths.runRoot, "packs", "s10");
  const packJsonPath = path.join(packDir, "pack.json");
  const packMarkdownPath = path.join(packDir, "pack.md");

  await writeJsonArtifact(packJsonPath, packJson);
  await fs.mkdir(path.dirname(packMarkdownPath), { recursive: true });
  await fs.writeFile(
    packMarkdownPath,
    buildPackMarkdown({
      business: parsed.business,
      runId: parsed.runId,
      generatedAt,
      manifestStatus: manifest.status ?? null,
      stageCompletionCount: Object.keys(manifest.stage_completions ?? {}).length,
      metricCount: Object.keys(packet.data.funnelStats as Record<string, number>).length,
      packetId: packet.packetId,
      contentSourceCount: contentSourcesIndex?.sourceCount ?? 0,
      evidenceRefs,
    }),
    "utf-8"
  );

  const envelope = buildEnvelope({
    schemaVersion: "pack.weekly-s10.v1",
    refreshedAt: generatedAt,
    qualityNotes: [],
    coverage: {
      expectedPoints: 1,
      observedPoints: 1,
      samplingFraction: 1,
    },
    provenance: {
      schemaVersion: "provenance.v1",
      querySignature: `sha256:${hashPayload(packJson)}`,
      generatedAt,
      datasetId: `${parsed.business}-${parsed.runId}-weekly-s10-pack`,
      sourceRef: "pack_weekly_s10_build",
      artifactRefs: evidenceRefs,
      quality: "ok",
    },
  });

  return jsonResult({
    ...envelope,
    business: parsed.business,
    runId: parsed.runId,
    packetId: packet.packetId,
    packJsonPath,
    packMarkdownPath,
    evidenceRefs,
  });
}

async function handleRefreshStatusGet(args: unknown): Promise<ToolCallResult> {
  const parsed = refreshStatusInputSchema.parse(args);
  const paths = resolveLoopArtifactPaths(parsed.business, parsed.runId);
  const queuePath = refreshQueuePath(paths, parsed.collector);
  const statusPath = refreshCollectorStatusPath(paths, parsed.collector);

  const queueRaw = await readJsonFile(queuePath);
  const queue = queueRaw
    ? refreshQueueSchema.parse(queueRaw)
    : {
        schemaVersion: "refresh.queue.v1" as const,
        collector: parsed.collector,
        updatedAt: new Date(0).toISOString(),
        requests: [],
      };

  const collectorRaw = await readJsonFile(statusPath);
  const collector = collectorRaw ? refreshCollectorStatusSchema.parse(collectorRaw) : null;
  const freshness = buildFreshnessEnvelope(
    parseCollectorFreshnessTimestamp(collector),
    Number(process.env.REFRESH_STATUS_STALE_THRESHOLD_SECONDS || 60 * 60)
  );

  const states = queue.requests.reduce<Record<string, number>>((acc, request) => {
    acc[request.state] = (acc[request.state] ?? 0) + 1;
    return acc;
  }, {});
  const contentSourcesIndex =
    parsed.collector === "content_sources" ? await readContentSourcesIndex(paths) : null;

  return jsonResult({
    schemaVersion: "refresh.status.v1",
    business: parsed.business,
    runId: parsed.runId,
    collector: {
      collector: parsed.collector,
      state: collector?.state ?? "failed",
      lastRunAt: collector?.lastRunAt ?? null,
      lastSuccessAt: collector?.lastSuccessAt ?? null,
      updatedAt: collector?.updatedAt ?? null,
      error: collector?.error ?? null,
    },
    freshness,
    lagSeconds: freshness.ageSeconds,
    queue: {
      requestCount: queue.requests.length,
      states,
      latestRequest: queue.requests.slice().sort((a, b) => a.updatedAt.localeCompare(b.updatedAt)).at(-1) ?? null,
    },
    contentSources:
      parsed.collector === "content_sources"
        ? {
            indexPath: paths.contentSourcesIndexPath,
            sourceCount: contentSourcesIndex?.sourceCount ?? 0,
            quality: contentSourcesIndex?.quality ?? "blocked",
            collectedAt: contentSourcesIndex?.collectedAt ?? null,
            artifactRefs: contentSourcesIndex?.artifactRefs ?? [],
          }
        : null,
    queuePath,
    statusPath,
  });
}

async function handleRefreshEnqueueGuarded(args: unknown): Promise<ToolCallResult> {
  const parsed = refreshEnqueueInputSchema.parse(args);
  const paths = resolveLoopArtifactPaths(parsed.business, parsed.runId);
  const queuePath = refreshQueuePath(paths, parsed.collector);
  const queueRaw = await readJsonFile(queuePath);
  const queue = queueRaw
    ? refreshQueueSchema.parse(queueRaw)
    : {
        schemaVersion: "refresh.queue.v1" as const,
        collector: parsed.collector,
        updatedAt: new Date(0).toISOString(),
        requests: [],
      };

  const existingRequest = queue.requests.find((request) => request.requestId === parsed.requestId);
  if (existingRequest && !parsed.transitionTo) {
    return jsonResult({
      schemaVersion: "refresh.enqueue.v1",
      business: parsed.business,
      runId: parsed.runId,
      collector: parsed.collector,
      idempotent: true,
      transitioned: false,
      refreshRequest: existingRequest,
      queuePath,
      lifecycle: ["enqueued", "pending", "running", "complete|failed|expired"],
    });
  }

  const now = new Date().toISOString();

  if (!existingRequest) {
    const initialState = parsed.transitionTo ?? "enqueued";
    if (initialState !== "enqueued") {
      return toolError(
        "CONTRACT_MISMATCH",
        "New refresh requests must start in enqueued state.",
        false,
        { requestId: parsed.requestId, transitionTo: parsed.transitionTo }
      );
    }

    const createdRequest = refreshRequestEntrySchema.parse({
      requestId: parsed.requestId,
      state: "enqueued",
      requestedAt: now,
      updatedAt: now,
      writeReason: parsed.write_reason,
      reason: parsed.reason,
      requestedBy: parsed.requestedBy,
      history: [],
    });

    const updatedQueue = {
      ...queue,
      updatedAt: now,
      requests: [...queue.requests, createdRequest],
    };

    await writeJsonArtifact(queuePath, updatedQueue);

    return jsonResult({
      schemaVersion: "refresh.enqueue.v1",
      business: parsed.business,
      runId: parsed.runId,
      collector: parsed.collector,
      idempotent: false,
      transitioned: false,
      refreshRequest: createdRequest,
      queuePath,
      lifecycle: ["enqueued", "pending", "running", "complete|failed|expired"],
    });
  }

  const targetState = parsed.transitionTo ?? existingRequest.state;
  if (targetState === existingRequest.state) {
    return jsonResult({
      schemaVersion: "refresh.enqueue.v1",
      business: parsed.business,
      runId: parsed.runId,
      collector: parsed.collector,
      idempotent: true,
      transitioned: false,
      refreshRequest: existingRequest,
      queuePath,
      lifecycle: ["enqueued", "pending", "running", "complete|failed|expired"],
    });
  }

  assertRefreshStateTransition(existingRequest.state, targetState);

  const transitionedRequest = refreshRequestEntrySchema.parse({
    ...existingRequest,
    state: targetState,
    updatedAt: now,
    writeReason: parsed.write_reason,
    reason: parsed.reason,
    requestedBy: parsed.requestedBy,
    history: [
      ...existingRequest.history,
      {
        from: existingRequest.state,
        to: targetState,
        at: now,
      },
    ],
  });

  const updatedQueue = {
    ...queue,
    updatedAt: now,
    requests: queue.requests.map((request) =>
      request.requestId === parsed.requestId ? transitionedRequest : request
    ),
  };

  await writeJsonArtifact(queuePath, updatedQueue);

  return jsonResult({
    schemaVersion: "refresh.enqueue.v1",
    business: parsed.business,
    runId: parsed.runId,
    collector: parsed.collector,
    idempotent: false,
    transitioned: true,
    refreshRequest: transitionedRequest,
    queuePath,
    lifecycle: ["enqueued", "pending", "running", "complete|failed|expired"],
  });
}

async function handleAnomalyDetect(
  args: unknown,
  defaults: {
    toolName: string;
    defaultMetric: string;
  }
): Promise<ToolCallResult> {
  const parsed = anomalyDetectInputSchema.parse(args);
  const metricName = parsed.metric ?? defaults.defaultMetric;
  const paths = resolveLoopArtifactPaths(parsed.business, parsed.runId);
  const metricsRaw = await readJsonLines(paths.metricsPath);
  if (!metricsRaw) {
    return buildMissingArtifactError(paths.metricsPath);
  }

  const metricEntries = metricsRaw
    .map((entry) => metricEntrySchema.parse(entry))
    .filter((entry) => entry.metric_name === metricName && typeof entry.value === "number")
    .map((entry) => ({ timestamp: parseMetricTimestamp(entry), value: entry.value as number }));

  const buckets = new Map<string, number>();
  for (const entry of metricEntries) {
    const bucket = bucketTimestamp(entry.timestamp, parsed.grain);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + entry.value);
  }

  const series = [...buckets.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, value]) => value);

  const baseline = evaluateAnomalyBaseline({
    grain: parsed.grain,
    observedPoints: series.length,
  });

  const latestTimestamp = metricEntries.map((entry) => entry.timestamp).sort().at(-1) ?? new Date(0).toISOString();
  if (!baseline.eligible || series.length < 2) {
    const envelope = buildEnvelope({
      schemaVersion: "anomaly.detect.v1",
      refreshedAt: latestTimestamp,
      qualityNotes: ["insufficient-history"],
      coverage: {
        expectedPoints: baseline.minimumPoints,
        observedPoints: series.length,
        samplingFraction: baseline.minimumPoints > 0 ? Math.min(1, series.length / baseline.minimumPoints) : 0,
      },
      provenance: {
        schemaVersion: "provenance.v1",
        querySignature: `sha256:${hashPayload({ metricName, grain: parsed.grain, series })}`,
        generatedAt: latestTimestamp,
        datasetId: `${parsed.business}-${parsed.runId}-anomaly-${metricName}`,
        sourceRef: defaults.toolName,
        artifactRefs: [paths.metricsPath],
        quality: "blocked",
      },
    });

    return jsonResult({
      ...envelope,
      business: parsed.business,
      runId: parsed.runId,
      metric: metricName,
      grain: parsed.grain,
      minimumHistoryPoints: baseline.minimumPoints,
      severity: null,
      detector: {
        schemaVersion: "anomaly.detector.v1",
        primary: "ewma-zscore.v1",
        methods: ["ewma", "zscore"],
        settings: {
          ewmaAlpha: 0.3,
          moderateZ: 2,
          criticalZ: 3,
          minimumHistoryPoints: baseline.minimumPoints,
        },
      },
    });
  }

  const history = series.slice(0, -1);
  const currentValue = series.at(-1) ?? 0;
  const avg = mean(history);
  const std = standardDeviation(history);
  const ewmaAlpha = 0.3;
  let ewma = history[0] ?? 0;
  for (const value of history.slice(1)) {
    ewma = ewmaAlpha * value + (1 - ewmaAlpha) * ewma;
  }

  const zScore =
    std === 0 ? (currentValue === avg ? 0 : Math.sign(currentValue - avg) * 10) : (currentValue - avg) / std;
  const ewmaScore =
    std === 0 ? (currentValue === ewma ? 0 : Math.sign(currentValue - ewma) * 10) : (currentValue - ewma) / std;
  const anomalyScore = Math.max(Math.abs(zScore), Math.abs(ewmaScore));
  const severity =
    anomalyScore >= 3 ? "critical" : anomalyScore >= 2 ? "moderate" : "none";

  const envelope = buildEnvelope({
    schemaVersion: "anomaly.detect.v1",
    refreshedAt: latestTimestamp,
    qualityNotes: baseline.qualityNotes,
    coverage: {
      expectedPoints: baseline.minimumPoints,
      observedPoints: series.length,
      samplingFraction: Math.min(1, series.length / baseline.minimumPoints),
    },
    provenance: {
      schemaVersion: "provenance.v1",
      querySignature: `sha256:${hashPayload({ metricName, grain: parsed.grain, series })}`,
      generatedAt: latestTimestamp,
      datasetId: `${parsed.business}-${parsed.runId}-anomaly-${metricName}`,
      sourceRef: defaults.toolName,
      artifactRefs: [paths.metricsPath],
      quality: baseline.quality,
    },
  });

  return jsonResult({
    ...envelope,
    business: parsed.business,
    runId: parsed.runId,
    metric: metricName,
    grain: parsed.grain,
    minimumHistoryPoints: baseline.minimumPoints,
    detector: {
      schemaVersion: "anomaly.detector.v1",
      primary: "ewma-zscore.v1",
      methods: ["ewma", "zscore"],
      settings: {
        ewmaAlpha,
        moderateZ: 2,
        criticalZ: 3,
        minimumHistoryPoints: baseline.minimumPoints,
      },
    },
    baseline: {
      average: avg,
      stddev: std,
      expectedValue: ewma,
    },
    currentValue,
    zScore,
    ewmaScore,
    anomalyScore,
    severity: severity === "none" ? null : severity,
  });
}

export async function handleLoopTool(name: string, args: unknown): Promise<ToolCallResult> {
  try {
    switch (name) {
      case "loop_manifest_status":
        return handleLoopManifestStatus(args);
      case "loop_learning_ledger_status":
        return handleLoopLearningLedgerStatus(args);
      case "loop_metrics_summary":
        return handleLoopMetricsSummary(args);
      case "measure_snapshot_get":
        return handleMeasureSnapshotGet(args);
      case "app_run_packet_build":
        return handleAppRunPacketBuild(args);
      case "app_run_packet_get":
        return handleAppRunPacketGet(args);
      case "pack_weekly_s10_build":
        return handlePackWeeklyS10Build(args);
      case "refresh_status_get":
        return handleRefreshStatusGet(args);
      case "refresh_enqueue_guarded":
        return handleRefreshEnqueueGuarded(args);
      case "loop_content_sources_collect":
        return handleLoopContentSourcesCollect(args);
      case "loop_content_sources_list":
        return handleLoopContentSourcesList(args);
      case "anomaly_detect_traffic":
        return handleAnomalyDetect(args, {
          toolName: "anomaly_detect_traffic",
          defaultMetric: "traffic_requests",
        });
      case "anomaly_detect_revenue":
        return handleAnomalyDetect(args, {
          toolName: "anomaly_detect_revenue",
          defaultMetric: "revenue_total",
        });
      case "anomaly_detect_errors":
        return handleAnomalyDetect(args, {
          toolName: "anomaly_detect_errors",
          defaultMetric: "error_count",
        });

      default:
        return toolError("NOT_FOUND", `Unknown loop tool: ${name}`, false);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return toolError("CONTRACT_MISMATCH", formatError(error), false);
    }
    return toolError("INTERNAL_ERROR", formatError(error), false);
  }
}
