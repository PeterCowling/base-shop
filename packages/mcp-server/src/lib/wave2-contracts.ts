import { z } from "zod";

export const wave2QualitySchema = z.enum(["ok", "partial", "blocked"]);
export type Wave2Quality = z.infer<typeof wave2QualitySchema>;

export const wave2CoverageSchema = z.object({
  expectedPoints: z.number().int().positive(),
  observedPoints: z.number().int().nonnegative(),
  samplingFraction: z.number().min(0).max(1),
});
export type Wave2Coverage = z.infer<typeof wave2CoverageSchema>;

export const wave2ProvenanceSchema = z.object({
  schemaVersion: z.literal("provenance.v1"),
  querySignature: z.string().min(1),
  generatedAt: z.string().datetime({ offset: true }),
  datasetId: z.string().min(1),
  sourceRef: z.string().min(1),
  artifactRefs: z.array(z.string().min(1)).min(1),
  commitSha: z.string().min(1).optional(),
  quality: wave2QualitySchema,
});
export type Wave2Provenance = z.infer<typeof wave2ProvenanceSchema>;

export const wave2EnvelopeSchema = z.object({
  schemaVersion: z.string().min(1),
  refreshedAt: z.string().datetime({ offset: true }),
  quality: wave2QualitySchema,
  qualityNotes: z.array(z.string()).default([]),
  coverage: wave2CoverageSchema,
  provenance: wave2ProvenanceSchema,
});
export type Wave2Envelope = z.infer<typeof wave2EnvelopeSchema>;

export function parseWave2Envelope(input: unknown): Wave2Envelope {
  return wave2EnvelopeSchema.parse(input);
}

export const metricDefinitionSchema = z.object({
  metric: z.string().min(1),
  valueType: z.enum(["currency", "count", "ratio", "duration"]),
  unit: z.string().min(1),
  preferredGrains: z.array(z.enum(["day", "week", "month"]).or(z.string().min(1))).min(1),
  defaultWindow: z.string().min(1),
  allowedDimensions: z.array(z.string().min(1)).default([]),
  aggregationMethod: z.enum(["sum", "avg", "median", "count", "ratio"]).or(z.string().min(1)),
  sourcePriority: z.array(z.string().min(1)).min(1),
  piiRisk: z.enum(["low", "medium", "high"]),
});

export const metricsRegistrySchema = z.object({
  schemaVersion: z.literal("metrics-registry.v1"),
  metrics: z.array(metricDefinitionSchema).min(1),
});

export type MetricDefinition = z.infer<typeof metricDefinitionSchema>;
export type MetricsRegistry = z.infer<typeof metricsRegistrySchema>;

export function parseMetricsRegistry(input: unknown): MetricsRegistry {
  return metricsRegistrySchema.parse(input);
}

export const wave2MetricRecordSchema = z.object({
  schemaVersion: z.literal("measure.record.v1"),
  business: z.string().min(1),
  source: z.string().min(1),
  metric: z.string().min(1),
  window: z.object({
    startAt: z.string().datetime({ offset: true }),
    endAt: z.string().datetime({ offset: true }),
    grain: z.enum(["day", "week", "month"]),
    timezone: z.string().min(1),
  }),
  segmentSchemaVersion: z.string().min(1),
  segments: z.record(z.string(), z.string().or(z.number()).or(z.boolean())),
  valueType: z.enum(["currency", "count", "ratio", "duration"]),
  value: z.number(),
  unit: z.string().min(1),
  quality: wave2QualitySchema,
  qualityNotes: z.array(z.string()).default([]),
  coverage: wave2CoverageSchema,
  refreshedAt: z.string().datetime({ offset: true }),
  provenance: wave2ProvenanceSchema,
});

export type Wave2MetricRecord = z.infer<typeof wave2MetricRecordSchema>;

export function parseWave2MetricRecord(input: unknown): Wave2MetricRecord {
  return wave2MetricRecordSchema.parse(input);
}

export const contentSourceRecordSchema = z.object({
  schemaVersion: z.literal("content.source.v1"),
  sourceId: z.string().min(1),
  url: z.string().url(),
  requestUrl: z.string().url(),
  finalUrl: z.string().url(),
  fetchedAt: z.string().datetime({ offset: true }),
  status: z.number().int().nonnegative(),
  contentType: z.string().nullable(),
  markdownPath: z.string().min(1),
  checksum: z.string().min(1),
  charCount: z.number().int().nonnegative(),
  truncated: z.boolean(),
  quality: wave2QualitySchema,
  qualityNotes: z.array(z.string()).default([]),
  coverage: wave2CoverageSchema,
  provenance: wave2ProvenanceSchema,
});

export type ContentSourceRecord = z.infer<typeof contentSourceRecordSchema>;

export function parseContentSourceRecord(input: unknown): ContentSourceRecord {
  return contentSourceRecordSchema.parse(input);
}

function coverageRatio(coverage: Wave2Coverage): number {
  if (coverage.expectedPoints <= 0) {
    return 0;
  }
  return coverage.observedPoints / coverage.expectedPoints;
}

export function determineWave2Quality(input: {
  expectedPoints: number;
  observedPoints: number;
  hasBlockingValidationError?: boolean;
  missingCriticalDimensions?: boolean;
}): Wave2Quality {
  if (input.hasBlockingValidationError || input.missingCriticalDimensions) {
    return "blocked";
  }

  if (input.expectedPoints <= 0) {
    return "blocked";
  }

  const ratio = input.observedPoints / input.expectedPoints;

  if (ratio >= 0.95) {
    return "ok";
  }

  if (ratio >= 0.5) {
    return "partial";
  }

  return "blocked";
}

export function validateMetricRecordAgainstRegistry(
  record: Wave2MetricRecord,
  registry: MetricsRegistry
): Wave2MetricRecord {
  const definition = registry.metrics.find((entry) => entry.metric === record.metric);
  if (!definition) {
    throw new Error(`Metric ${record.metric} is not defined in registry.`);
  }

  if (record.unit !== definition.unit) {
    throw new Error(
      `Metric ${record.metric} uses unit ${record.unit}; expected ${definition.unit}.`
    );
  }

  if (record.valueType !== definition.valueType) {
    throw new Error(
      `Metric ${record.metric} uses valueType ${record.valueType}; expected ${definition.valueType}.`
    );
  }

  if (!definition.preferredGrains.includes(record.window.grain)) {
    throw new Error(
      `Metric ${record.metric} does not allow grain ${record.window.grain}.`
    );
  }

  const invalidDimensions = Object.keys(record.segments).filter(
    (key) => !definition.allowedDimensions.includes(key)
  );

  if (invalidDimensions.length > 0) {
    throw new Error(
      `Metric ${record.metric} includes invalid dimension(s): ${invalidDimensions.join(", ")}.`
    );
  }

  const expectedQuality = determineWave2Quality({
    expectedPoints: record.coverage.expectedPoints,
    observedPoints: record.coverage.observedPoints,
  });

  if (record.quality !== expectedQuality) {
    throw new Error(
      `Metric ${record.metric} quality mismatch: expected ${expectedQuality}, got ${record.quality}.`
    );
  }

  return record;
}

export const runPacketSchema = z.object({
  schemaVersion: z.literal("run.packet.v1"),
  packetId: z.string().min(1),
  source: z.string().min(1),
  timeWindow: z.object({
    start: z.string().min(1),
    end: z.string().min(1),
  }),
  segments: z.record(z.string(), z.string().or(z.number()).or(z.boolean())),
  sizeBytes: z.number().int().nonnegative(),
  sizeBudgetBytes: z.number().int().positive(),
  redactionApplied: z.boolean(),
  redactionRulesVersion: z.literal("packet-redaction.v1"),
  data: z.object({
    bookingsSummary: z.unknown(),
    funnelStats: z.unknown(),
    inventoryDeltas: z.unknown(),
    pricingTables: z.unknown(),
    topPages: z.array(z.string()),
    topQueries: z.array(z.string()),
    topSupportIssues: z.array(z.string()),
  }),
  sourceRefs: z.record(z.string(), z.array(z.string()).default([])).default({}),
  refreshedAt: z.string().datetime({ offset: true }),
  quality: wave2QualitySchema,
  qualityNotes: z.array(z.string()).default([]),
  coverage: wave2CoverageSchema,
  provenance: wave2ProvenanceSchema,
});

export type RunPacket = z.infer<typeof runPacketSchema>;

export const DEFAULT_PACKET_REDACTION_POLICY = {
  maxPacketSizeBytes: 262144,
  maxTopPages: 50,
  maxTopQueries: 50,
  maxTopSupportIssues: 25,
  forbiddenPatterns: [
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
    /\+?\d[\d\s().-]{7,}\d/,
  ],
} as const;

function valueContainsForbiddenPatterns(
  value: unknown,
  forbiddenPatterns: readonly RegExp[]
): boolean {
  if (typeof value === "string") {
    return forbiddenPatterns.some((pattern) => pattern.test(value));
  }

  if (Array.isArray(value)) {
    return value.some((item) => valueContainsForbiddenPatterns(item, forbiddenPatterns));
  }

  if (value !== null && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some((item) =>
      valueContainsForbiddenPatterns(item, forbiddenPatterns)
    );
  }

  return false;
}

export function validateRunPacketBounds(
  input: unknown,
  policy = DEFAULT_PACKET_REDACTION_POLICY
): RunPacket {
  const packet = runPacketSchema.parse(input);

  if (packet.sizeBytes > policy.maxPacketSizeBytes) {
    throw new Error(
      `Packet size ${packet.sizeBytes} exceeds maxPacketSizeBytes ${policy.maxPacketSizeBytes}.`
    );
  }

  if (packet.data.topPages.length > policy.maxTopPages) {
    throw new Error(
      `Packet topPages length ${packet.data.topPages.length} exceeds max ${policy.maxTopPages}.`
    );
  }

  if (packet.data.topQueries.length > policy.maxTopQueries) {
    throw new Error(
      `Packet topQueries length ${packet.data.topQueries.length} exceeds max ${policy.maxTopQueries}.`
    );
  }

  if (packet.data.topSupportIssues.length > policy.maxTopSupportIssues) {
    throw new Error(
      `Packet topSupportIssues length ${packet.data.topSupportIssues.length} exceeds max ${policy.maxTopSupportIssues}.`
    );
  }

  if (valueContainsForbiddenPatterns(packet.data, policy.forbiddenPatterns)) {
    throw new Error("Packet data contains forbidden PII-like patterns.");
  }

  const expectedQuality = determineWave2Quality({
    expectedPoints: packet.coverage.expectedPoints,
    observedPoints: packet.coverage.observedPoints,
  });

  if (packet.quality !== expectedQuality) {
    throw new Error(
      `Packet quality mismatch: expected ${expectedQuality}, got ${packet.quality}.`
    );
  }

  return packet;
}

export const refreshEnqueueRequestSchema = z.object({
  schemaVersion: z.literal("refresh-enqueue.v1"),
  requestId: z.string().min(1),
  business: z.string().min(1),
  collector: z.string().min(1),
  reason: z.string().min(1),
  requestedBy: z.string().min(1),
});

export const refreshEnqueueStateSchema = z.enum([
  "enqueued",
  "pending",
  "running",
  "complete",
  "failed",
  "expired",
]);

export type RefreshEnqueueState = z.infer<typeof refreshEnqueueStateSchema>;

const REFRESH_STATE_TRANSITIONS: Readonly<Record<RefreshEnqueueState, readonly RefreshEnqueueState[]>> = {
  enqueued: ["pending", "expired"],
  pending: ["running", "failed", "expired"],
  running: ["complete", "failed", "expired"],
  complete: [],
  failed: [],
  expired: [],
};

export function assertRefreshStateTransition(
  from: RefreshEnqueueState,
  to: RefreshEnqueueState
): void {
  const allowed = REFRESH_STATE_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new Error(`Invalid refresh state transition: ${from} -> ${to}.`);
  }
}

export const anomalyGrainSchema = z.enum(["day", "week", "month"]);

export function evaluateAnomalyBaseline(input: {
  grain: z.infer<typeof anomalyGrainSchema>;
  observedPoints: number;
}): {
  eligible: boolean;
  minimumPoints: number;
  quality: Wave2Quality;
  qualityNotes: string[];
} {
  const minimumPoints =
    input.grain === "day" ? 28 : input.grain === "week" ? 8 : 6;

  const eligible = input.observedPoints >= minimumPoints;

  if (!eligible) {
    return {
      eligible: false,
      minimumPoints,
      quality: "blocked",
      qualityNotes: ["insufficient-history"],
    };
  }

  return {
    eligible: true,
    minimumPoints,
    quality: "ok",
    qualityNotes: [],
  };
}

export function buildCoverage(input: Wave2Coverage): Wave2Coverage {
  return {
    expectedPoints: input.expectedPoints,
    observedPoints: input.observedPoints,
    samplingFraction: input.samplingFraction,
  };
}

export function buildEnvelope(input: {
  schemaVersion: string;
  refreshedAt: string;
  qualityNotes?: string[];
  coverage: Wave2Coverage;
  provenance: Wave2Provenance;
}): Wave2Envelope {
  const quality = determineWave2Quality({
    expectedPoints: input.coverage.expectedPoints,
    observedPoints: input.coverage.observedPoints,
  });

  return parseWave2Envelope({
    schemaVersion: input.schemaVersion,
    refreshedAt: input.refreshedAt,
    quality,
    qualityNotes: input.qualityNotes ?? [],
    coverage: input.coverage,
    provenance: {
      ...input.provenance,
      quality,
    },
  });
}

export function envelopeCoverageRatio(envelope: Wave2Envelope): number {
  return coverageRatio(envelope.coverage);
}
