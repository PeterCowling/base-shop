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
  buildEnvelope,
  determineWave2Quality,
  parseWave2MetricRecord,
  validateRunPacketBounds,
} from "../lib/wave2-contracts.js";
import { formatError, jsonResult } from "../utils/validation.js";

import type { ToolCallResult, ToolErrorCode } from "./policy.js";

const STARTUP_LOOP_STAGES = [
  "S0",
  "S1",
  "S1B",
  "S2A",
  "S2",
  "S2B",
  "S3",
  "S4",
  "S5A",
  "S5B",
  "S6",
  "S6B",
  "S7",
  "S8",
  "S9",
  "S9B",
  "S10",
] as const;

const loopStatusInputSchema = z.object({
  business: z.string().min(1),
  runId: z.string().min(1),
  current_stage: z.string().min(1),
});

const measureSnapshotInputSchema = loopStatusInputSchema.extend({
  metric: z.string().min(1).optional(),
});

const packetBuildInputSchema = loopStatusInputSchema;

const packetGetInputSchema = loopStatusInputSchema.extend({
  packetId: z.string().min(1).optional(),
});

const packBuildInputSchema = loopStatusInputSchema.extend({
  packetId: z.string().min(1).optional(),
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
  const paths = resolveLoopArtifactPaths(parsed.business, parsed.runId);
  const metricsRaw = await readJsonLines(paths.metricsPath);
  if (!metricsRaw) {
    return buildMissingArtifactError(paths.metricsPath);
  }

  const parsedEntries = metricsRaw.map((entry) => metricEntrySchema.parse(entry));
  const filteredEntries = parsed.metric
    ? parsedEntries.filter((entry) => entry.metric_name === parsed.metric)
    : parsedEntries;

  const records = filteredEntries.map((entry, index) =>
    mapMetricEntryToRecord(parsed.business, entry, `${paths.metricsPath}#${index}`)
  );

  const latest =
    filteredEntries.map(parseMetricTimestamp).sort().at(-1) ?? new Date(0).toISOString();
  const expectedPoints = Math.max(filteredEntries.length, 1);
  const observedPoints = filteredEntries.length;
  const quality = determineWave2Quality({ expectedPoints, observedPoints });

  const envelope = buildEnvelope({
    schemaVersion: "measure.snapshot.v1",
    refreshedAt: latest,
    qualityNotes: quality === "blocked" ? ["insufficient-coverage"] : [],
    coverage: {
      expectedPoints,
      observedPoints,
      samplingFraction: expectedPoints > 0 ? observedPoints / expectedPoints : 0,
    },
    provenance: {
      schemaVersion: "provenance.v1",
      querySignature: `sha256:${hashPayload(filteredEntries)}`,
      generatedAt: latest,
      datasetId: `${parsed.business}-${parsed.runId}-measure-snapshot`,
      sourceRef: paths.metricsPath,
      artifactRefs: [paths.metricsPath],
      quality,
    },
  });

  return jsonResult({
    ...envelope,
    business: parsed.business,
    runId: parsed.runId,
    metric: parsed.metric ?? null,
    recordCount: records.length,
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

  const metricsRaw = await readJsonLines(paths.metricsPath);
  if (!metricsRaw) {
    return buildMissingArtifactError(paths.metricsPath);
  }

  const entries = metricsRaw.map((entry) => metricEntrySchema.parse(entry));
  const totals = metricsToTotals(entries);
  const packetId = packetIdFor(parsed.business, parsed.runId);
  const latest = entries.map(parseMetricTimestamp).sort().at(-1) ?? new Date(0).toISOString();

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
    },
    refreshedAt: latest,
    quality: determineWave2Quality({
      expectedPoints: Math.max(entries.length, 1),
      observedPoints: entries.length,
    }),
    qualityNotes: entries.length === 0 ? ["insufficient-coverage"] : [],
    coverage: {
      expectedPoints: Math.max(entries.length, 1),
      observedPoints: entries.length,
      samplingFraction: 1,
    },
    provenance: {
      schemaVersion: "provenance.v1" as const,
      querySignature: `sha256:${hashPayload({ manifest, totals })}`,
      generatedAt: latest,
      datasetId: `${parsed.business}-${parsed.runId}-run-packet`,
      sourceRef: "app_run_packet_build",
      artifactRefs: [paths.manifestPath, paths.metricsPath],
      quality: entries.length === 0 ? "blocked" : "ok",
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

  const generatedAt = packet.refreshedAt;
  const evidenceRefs = [paths.manifestPath, packetPath, paths.metricsPath];

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
