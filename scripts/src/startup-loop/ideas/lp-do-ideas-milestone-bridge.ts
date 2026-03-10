import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { growthLedgerPath, readGrowthLedger } from "@acme/lib/server";

import {
  detectRepoRoot,
  toRepoRelativePath,
} from "../build/build-origin-signal.js";
import {
  buildCanonicalGapCase,
  buildCanonicalPrescription,
  buildCompiledCandidateId,
  expectedArtifactsForRoute,
  normalizeCanonicalToken,
} from "../self-evolving/self-evolving-prescription-normalization.js";

import {
  classifyIdea,
  type IdeaClassification,
  type IdeaClassificationInput,
} from "./lp-do-ideas-classifier.js";
import { computeClusterFingerprint } from "./lp-do-ideas-fingerprint.js";
import {
  IDEAS_TRIAL_QUEUE_STATE_PATH,
  IDEAS_TRIAL_TELEMETRY_PATH,
} from "./lp-do-ideas-paths.js";
import { enqueueQueueDispatches } from "./lp-do-ideas-queue-admission.js";
import { routeDispatchV2 } from "./lp-do-ideas-routing-adapter.js";
import {
  buildDispatchId,
  type DispatchMilestoneProvenance,
  type MilestoneRootId,
  type RecommendedRoute,
  statusForRecommendedRoute,
  type TrialDispatchPacketV2,
  validateDispatchV2,
} from "./lp-do-ideas-trial.js";

type SupportedMilestoneRootId =
  | "qualified_lead_or_enquiry_flow_present"
  | "transaction_data_available"
  | "repeat_signal_present";

type MilestoneProducerKind = "metric" | "artifact";

interface MilestoneProducerEvent {
  root_id: SupportedMilestoneRootId;
  producer_kind: MilestoneProducerKind;
  source_ref: string;
  observed_at: string;
  evidence_refs: string[];
  current_truth: string;
}

interface MilestoneBundleRule {
  bundle_key: string;
  bundle_title: string;
  area_anchor: string;
  recommended_route: RecommendedRoute;
  requirement_posture: "relative_required" | "optional_improvement";
  blocking_scope: "degrades_quality" | "improves_if_time_allows";
  capability_id: string | null;
  stage_id: string | null;
  expected_signal_change: string;
  why: string;
}

interface MilestoneBundleSignal {
  business: string;
  event: MilestoneProducerEvent;
  rule: MilestoneBundleRule;
}

export interface MilestoneSignalsBridgeOptions {
  business: string;
  rootDir?: string;
  dataRoot?: string;
  queueStatePath?: string;
  telemetryPath?: string;
  clock?: () => Date;
}

export interface MilestoneSignalsBridgeResult {
  ok: boolean;
  roots_considered: number;
  roots_detected: number;
  dispatches_enqueued: number;
  suppressed: number;
  noop: number;
  warnings: string[];
  error?: string;
}

export interface MilestoneDispatchValidationResult {
  ok: boolean;
  code?: string;
  error?: string;
}

const DEFAULT_QUEUE_STATE_PATH = IDEAS_TRIAL_QUEUE_STATE_PATH;
const DEFAULT_TELEMETRY_PATH = IDEAS_TRIAL_TELEMETRY_PATH;
const MILESTONE_ROOT_COUNT = 3;

const MILESTONE_BUNDLE_RULES: Record<SupportedMilestoneRootId, MilestoneBundleRule[]> = {
  qualified_lead_or_enquiry_flow_present: [
    {
      bundle_key: "cap05-sales-ops-activation",
      bundle_title: "Shape sales-ops follow-through for live qualified lead flow",
      area_anchor: "sales-ops",
      recommended_route: "lp-do-plan",
      requirement_posture: "relative_required",
      blocking_scope: "degrades_quality",
      capability_id: "CAP-05",
      stage_id: null,
      expected_signal_change:
        "Sales-ops pipeline, SLA, and follow-up loop become plan-ready for live qualified lead flow.",
      why:
        "Qualified lead or enquiry flow is now present, so CAP-05 sales ops is no longer purely deferred and needs a bounded follow-through path.",
    },
  ],
  transaction_data_available: [
    {
      bundle_key: "gtm4-lifecycle-readiness",
      bundle_title: "Assess lifecycle automation readiness from first transaction data",
      area_anchor: "lifecycle-automation",
      recommended_route: "lp-do-fact-find",
      requirement_posture: "relative_required",
      blocking_scope: "degrades_quality",
      capability_id: null,
      stage_id: "S10",
      expected_signal_change:
        "Lifecycle automation readiness is grounded in real transaction data instead of assumptions.",
      why:
        "Transaction data now exists, so lifecycle automation and retention follow-through can be assessed against real signal instead of pre-launch assumptions.",
    },
  ],
  repeat_signal_present: [
    {
      bundle_key: "cap06-retention-loop-plan",
      bundle_title: "Plan retention and loyalty follow-through for live repeat signal",
      area_anchor: "retention-lifecycle",
      recommended_route: "lp-do-plan",
      requirement_posture: "relative_required",
      blocking_scope: "degrades_quality",
      capability_id: "CAP-06",
      stage_id: "S10",
      expected_signal_change:
        "Retention and loyalty work becomes structured against observed repeat behavior.",
      why:
        "A real repeat or re-booking signal is present, so CAP-06 retention work should move from abstract capability language into a bounded plan.",
    },
    {
      bundle_key: "gtm4-lifecycle-automation-followthrough",
      bundle_title: "Assess lifecycle automation now that repeat signal exists",
      area_anchor: "lifecycle-automation",
      recommended_route: "lp-do-fact-find",
      requirement_posture: "optional_improvement",
      blocking_scope: "improves_if_time_allows",
      capability_id: "CAP-06",
      stage_id: "S10",
      expected_signal_change:
        "Lifecycle automation candidates are evaluated against observed repeat behavior.",
      why:
        "Repeat signal makes lifecycle automation newly testable, but it is still a bounded follow-on rather than an unconditional immediate build.",
    },
  ],
};

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function readMarkdownFile(filePath: string): string | null {
  if (!existsSync(filePath)) {
    return null;
  }
  return readFileSync(filePath, "utf8");
}

function extractSection(markdown: string, heading: string): string | null {
  const lines = markdown.split(/\r?\n/);
  const normalizedHeading = normalizeText(heading).toLowerCase();
  const startIndex = lines.findIndex((line) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith("## ")) {
      return false;
    }
    return normalizeText(trimmed.slice(3)).toLowerCase() === normalizedHeading;
  });
  if (startIndex < 0) {
    return null;
  }

  const sectionLines: string[] = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (/^##\s+/.test(line.trim())) {
      break;
    }
    sectionLines.push(line);
  }
  return sectionLines.join("\n");
}

function splitMarkdownRow(line: string): string[] {
  return line
    .split("|")
    .slice(1, -1)
    .map((value) => normalizeText(value));
}

function parseMarkdownTable(section: string | null): Array<Record<string, string>> {
  if (!section) {
    return [];
  }

  const lines = section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const rows: Array<Record<string, string>> = [];

  for (let index = 0; index < lines.length; index += 1) {
    const headerLine = lines[index];
    const separatorLine = lines[index + 1];
    if (!headerLine?.startsWith("|") || !separatorLine?.startsWith("|")) {
      continue;
    }
    const headers = splitMarkdownRow(headerLine);
    const separatorCells = splitMarkdownRow(separatorLine);
    if (
      headers.length === 0 ||
      headers.length !== separatorCells.length ||
      !separatorCells.every((cell) => /^:?-{3,}:?$/.test(cell))
    ) {
      continue;
    }

    let rowIndex = index + 2;
    while (rowIndex < lines.length && lines[rowIndex]?.startsWith("|")) {
      const cells = splitMarkdownRow(lines[rowIndex] ?? "");
      if (cells.length === headers.length) {
        rows.push(
          Object.fromEntries(headers.map((header, cellIndex) => [header, cells[cellIndex] ?? ""])),
        );
      }
      rowIndex += 1;
    }
    break;
  }

  return rows;
}

function parseFirstPositiveInteger(value: string | undefined): number | null {
  if (!value) {
    return null;
  }
  const match = value.match(/\b\d+\b/);
  if (!match) {
    return null;
  }
  const parsed = Number.parseInt(match[0], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function findPositiveTableValue(
  rows: Array<Record<string, string>>,
  rowPredicate: (row: Record<string, string>) => boolean,
  countColumns: readonly string[],
): number | null {
  for (const row of rows) {
    if (!rowPredicate(row)) {
      continue;
    }
    for (const column of countColumns) {
      const positive = parseFirstPositiveInteger(row[column]);
      if (positive !== null) {
        return positive;
      }
    }
  }
  return null;
}

function resolveRepoPath(rootDir: string, relativePath: string): string {
  return path.isAbsolute(relativePath) ? relativePath : path.join(rootDir, relativePath);
}

function buildMilestoneEventId(
  business: string,
  rootId: MilestoneRootId,
  sourceRef: string,
): string {
  return `milestone-${normalizeCanonicalToken(`${business}-${rootId}-${sourceRef}`)}`;
}

async function detectTransactionDataAvailable(
  business: string,
  rootDir: string,
  dataRoot: string,
): Promise<MilestoneProducerEvent | null> {
  const ledger = await readGrowthLedger(business, { dataRoot });
  if (!ledger) {
    return null;
  }
  const activationOrders = ledger.stages.activation.metrics.orders_count;
  const revenueOrders = ledger.stages.revenue.metrics.orders_count;
  const ordersCount =
    typeof activationOrders === "number" && activationOrders > 0
      ? activationOrders
      : typeof revenueOrders === "number" && revenueOrders > 0
        ? revenueOrders
        : null;
  if (ordersCount === null) {
    return null;
  }

  const absoluteSourceRef = growthLedgerPath(business, dataRoot);
  return {
    root_id: "transaction_data_available",
    producer_kind: "metric",
    source_ref: toRepoRelativePath(rootDir, absoluteSourceRef),
    observed_at: ledger.updated_at,
    evidence_refs: [toRepoRelativePath(rootDir, absoluteSourceRef)],
    current_truth: `Transaction data is now available with ${ordersCount} recorded orders in the current growth ledger.`,
  };
}

function detectQualifiedLeadFlowFromArtifact(
  business: string,
  rootDir: string,
): MilestoneProducerEvent | null {
  const artifactPath = resolveRepoPath(
    rootDir,
    path.join("docs", "business-os", "strategy", business, "sales-ops.user.md"),
  );
  const markdown = readMarkdownFile(artifactPath);
  if (!markdown) {
    return null;
  }
  if (/not-yet-active/i.test(markdown) || /not-applicable/i.test(markdown)) {
    return null;
  }

  const weeklyRows = parseMarkdownTable(extractSection(markdown, "Weekly Denominator Check"));
  const weeklyCount = findPositiveTableValue(
    weeklyRows,
    (row) => /lead response rate/i.test(row.Metric ?? ""),
    ["Current denominator"],
  );
  const stageRows = parseMarkdownTable(extractSection(markdown, "Stage Conversion Denominators"));
  const stageCount = findPositiveTableValue(
    stageRows,
    (row) => /lead/i.test(row["Stage transition"] ?? ""),
    ["Current sample"],
  );
  const observedCount = weeklyCount ?? stageCount;
  if (observedCount === null) {
    return null;
  }

  return {
    root_id: "qualified_lead_or_enquiry_flow_present",
    producer_kind: "artifact",
    source_ref: toRepoRelativePath(rootDir, artifactPath),
    observed_at: new Date().toISOString(),
    evidence_refs: [toRepoRelativePath(rootDir, artifactPath)],
    current_truth:
      `Qualified lead or enquiry flow is now present with at least ${observedCount} observed pipeline entries in the sales-ops artifact.`,
  };
}

function detectRepeatSignalFromArtifact(
  business: string,
  rootDir: string,
): MilestoneProducerEvent | null {
  const artifactPath = resolveRepoPath(
    rootDir,
    path.join("docs", "business-os", "strategy", business, "retention.user.md"),
  );
  const markdown = readMarkdownFile(artifactPath);
  if (!markdown) {
    return null;
  }
  if (/cap-06-not-yet-active/i.test(markdown) || /not-yet-active/i.test(markdown)) {
    return null;
  }

  const rows = parseMarkdownTable(extractSection(markdown, "Retention Metrics Denominators"));
  const repeatCount = findPositiveTableValue(
    rows,
    (row) => /repeat rate|re-booking rate/i.test(row.Metric ?? ""),
    ["Current denominator"],
  );
  if (repeatCount === null) {
    return null;
  }

  return {
    root_id: "repeat_signal_present",
    producer_kind: "artifact",
    source_ref: toRepoRelativePath(rootDir, artifactPath),
    observed_at: new Date().toISOString(),
    evidence_refs: [toRepoRelativePath(rootDir, artifactPath)],
    current_truth:
      `A repeat or re-booking signal is now present with at least ${repeatCount} observed denominator-bearing retention records.`,
  };
}

export async function collectMilestoneProducerEvents(input: {
  business: string;
  rootDir?: string;
  dataRoot?: string;
}): Promise<{ events: MilestoneProducerEvent[]; warnings: string[] }> {
  const rootDir = input.rootDir ? path.resolve(input.rootDir) : detectRepoRoot(process.cwd());
  const dataRoot = input.dataRoot
    ? resolveRepoPath(rootDir, input.dataRoot)
    : path.join(rootDir, "data", "shops");
  const warnings: string[] = [];

  const events: MilestoneProducerEvent[] = [];

  try {
    const transactionEvent = await detectTransactionDataAvailable(input.business, rootDir, dataRoot);
    if (transactionEvent) {
      events.push(transactionEvent);
    }
  } catch (error) {
    warnings.push(
      `transaction_data_available producer failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const leadEvent = detectQualifiedLeadFlowFromArtifact(input.business, rootDir);
  if (leadEvent) {
    events.push(leadEvent);
  }

  const repeatEvent = detectRepeatSignalFromArtifact(input.business, rootDir);
  if (repeatEvent) {
    events.push(repeatEvent);
  }

  return {
    events,
    warnings,
  };
}

function buildClassificationInput(signal: MilestoneBundleSignal): IdeaClassificationInput {
  return {
    idea_id: buildMilestoneEventId(
      signal.business,
      signal.event.root_id,
      signal.event.source_ref,
    ),
    title: signal.rule.bundle_title,
    source_path: signal.event.source_ref,
    source_excerpt: signal.rule.why,
    created_at: signal.event.observed_at,
    trigger: "milestone_event",
    artifact_id: null,
    evidence_refs: signal.event.evidence_refs,
    area_anchor: signal.rule.area_anchor,
    content_tags: [
      "milestone",
      signal.event.root_id,
      signal.rule.bundle_key,
      signal.rule.capability_id ?? "no-capability",
    ],
  };
}

function dispatchPriorityFromClassification(classification: IdeaClassification): "P1" | "P2" | "P3" {
  if (
    classification.priority_tier === "P0" ||
    classification.priority_tier === "P0R" ||
    classification.priority_tier === "P1" ||
    classification.priority_tier === "P1M"
  ) {
    return "P1";
  }
  if (classification.priority_tier === "P2" || classification.priority_tier === "P3") {
    return "P2";
  }
  return "P3";
}

function dispatchConfidenceFromClassification(
  classification: IdeaClassification,
  signal: MilestoneBundleSignal,
): number {
  let base =
    classification.priority_tier === "P1" || classification.priority_tier === "P1M"
      ? 0.82
      : classification.priority_tier === "P2"
        ? 0.74
        : 0.66;
  if (signal.event.producer_kind === "metric") {
    base += 0.06;
  }
  if (signal.rule.requirement_posture === "relative_required") {
    base += 0.04;
  }
  return Math.max(0.45, Math.min(0.95, base));
}

function buildMilestoneProvenance(
  signal: MilestoneBundleSignal,
  bundleSize: number,
  bundleIndex: number,
): DispatchMilestoneProvenance {
  const gapType = `milestone_${normalizeCanonicalToken(
    `${signal.event.root_id}_${signal.rule.bundle_key}`,
  )}`;
  const recurrenceKey = `${signal.event.root_id}:${signal.rule.bundle_key}`;
  const candidateId = buildCompiledCandidateId({
    business_id: signal.business,
    source_kind: "milestone",
    recurrence_key: recurrenceKey,
    gap_type: gapType,
    stage_id: signal.rule.stage_id,
    capability_id: signal.rule.capability_id,
  });
  const milestoneEventId = buildMilestoneEventId(
    signal.business,
    signal.event.root_id,
    signal.event.source_ref,
  );

  return {
    schema_version: "dispatch-milestone.v1",
    milestone_event_id: milestoneEventId,
    root_id: signal.event.root_id,
    producer_kind: signal.event.producer_kind,
    source_ref: signal.event.source_ref,
    observed_at: signal.event.observed_at,
    bundle_key: signal.rule.bundle_key,
    bundle_title: signal.rule.bundle_title,
    bundle_size: bundleSize,
    bundle_index: bundleIndex,
    gap_case: buildCanonicalGapCase({
      business_id: signal.business,
      source_kind: "milestone",
      stage_id: signal.rule.stage_id,
      capability_id: signal.rule.capability_id,
      gap_type: gapType,
      reason_code: normalizeCanonicalToken(signal.event.root_id),
      severity: signal.rule.requirement_posture === "relative_required" ? 0.7 : 0.45,
      evidence_refs: signal.event.evidence_refs,
      recurrence_key: recurrenceKey,
      requirement_posture: signal.rule.requirement_posture,
      blocking_scope: signal.rule.blocking_scope,
      structural_context: {
        milestone_root_id: signal.event.root_id,
        producer_kind: signal.event.producer_kind,
        source_ref: signal.event.source_ref,
        observed_at: signal.event.observed_at,
        bundle_key: signal.rule.bundle_key,
        bundle_title: signal.rule.bundle_title,
      },
      candidate_id: candidateId,
    }),
    prescription: buildCanonicalPrescription({
      prescription_family: `milestone_${normalizeCanonicalToken(
        `${signal.event.root_id}_${signal.rule.bundle_key}`,
      )}`,
      source: "milestone_bundle",
      gap_types_supported: [gapType],
      required_route: signal.rule.recommended_route,
      required_inputs: [signal.event.source_ref],
      expected_artifacts: expectedArtifactsForRoute(signal.rule.recommended_route),
      expected_signal_change: signal.rule.expected_signal_change,
      risk_class: signal.rule.recommended_route === "lp-do-plan" ? "medium" : "low",
      maturity: "structured",
    }),
  };
}

function buildDispatchPackets(
  rootDir: string,
  business: string,
  signals: MilestoneBundleSignal[],
  clock: () => Date,
): TrialDispatchPacketV2[] {
  const packets: TrialDispatchPacketV2[] = [];
  const bundleGroups = new Map<SupportedMilestoneRootId, MilestoneBundleSignal[]>();
  for (const signal of signals) {
    const current = bundleGroups.get(signal.event.root_id) ?? [];
    current.push(signal);
    bundleGroups.set(signal.event.root_id, current);
  }

  for (const [rootId, bundleSignals] of bundleGroups.entries()) {
    const bundleSize = bundleSignals.length;
    for (const [bundleIndex, signal] of bundleSignals.entries()) {
      const classification = classifyIdea(buildClassificationInput(signal));
      const milestoneOrigin = buildMilestoneProvenance(signal, bundleSize, bundleIndex);
      const clusterKey = `milestone:${business}:${rootId}:${signal.rule.bundle_key}`;
      const locationAnchors = [signal.event.source_ref] as [string, ...string[]];
      const evidenceRefs = signal.event.evidence_refs.length > 0
        ? ([...signal.event.evidence_refs] as [string, ...string[]])
        : ([signal.event.source_ref] as [string, ...string[]]);
      const normalizedSemanticDiffHash = normalizeCanonicalToken(
        `${rootId}-${signal.rule.bundle_key}-${signal.event.source_ref}`,
      );
      const adjacentLater = bundleSignals
        .filter((_, index) => index !== bundleIndex)
        .map((bundleSignal) => bundleSignal.rule.bundle_title);
      const createdAt = clock().toISOString();
      const packet: TrialDispatchPacketV2 = {
        schema_version: "dispatch.v2",
        dispatch_id: buildDispatchId(clock(), packets.length + 1),
        mode: "trial",
        business,
        trigger: "milestone_event",
        artifact_id: null,
        before_sha: null,
        after_sha: milestoneOrigin.milestone_event_id,
        root_event_id: `milestone:${business}:${milestoneOrigin.milestone_event_id}`,
        anchor_key: signal.rule.bundle_key,
        cluster_key: clusterKey,
        cluster_fingerprint: computeClusterFingerprint({
          anchor_key: signal.rule.bundle_key,
          evidence_ref_ids: evidenceRefs,
          normalized_semantic_diff_hash: normalizedSemanticDiffHash,
          root_event_id: `milestone:${business}:${milestoneOrigin.milestone_event_id}`,
        }),
        lineage_depth: 0,
        area_anchor: signal.rule.area_anchor,
        location_anchors: locationAnchors,
        provisional_deliverable_family: "business-artifact",
        current_truth: signal.event.current_truth,
        next_scope_now:
          signal.rule.recommended_route === "lp-do-plan"
            ? `Run lp-do-plan to turn ${signal.rule.bundle_title.toLowerCase()} into a bounded execution path.`
            : `Run lp-do-fact-find to test ${signal.rule.bundle_title.toLowerCase()} before wider rollout.`,
        adjacent_later: adjacentLater,
        recommended_route: signal.rule.recommended_route,
        status: statusForRecommendedRoute(signal.rule.recommended_route),
        priority: dispatchPriorityFromClassification(classification),
        confidence: dispatchConfidenceFromClassification(classification, signal),
        evidence_refs: evidenceRefs,
        created_at: createdAt,
        queue_state: "enqueued",
        milestone_origin: milestoneOrigin,
        why: signal.rule.why,
        intended_outcome: {
          type: "operational",
          statement: signal.rule.expected_signal_change,
          source: "auto",
        },
      };
      packets.push(packet);
    }
  }

  return packets;
}

export function validateMilestoneDispatchPacket(
  packet: TrialDispatchPacketV2,
): MilestoneDispatchValidationResult {
  const validation = validateDispatchV2(packet as Partial<TrialDispatchPacketV2> & Record<string, unknown>);
  if (!validation.valid) {
    return {
      ok: false,
      code: "INVALID_DISPATCH_V2",
      error: validation.errors.join(" | "),
    };
  }

  const routeResult = routeDispatchV2(packet);
  if (!routeResult.ok) {
    return {
      ok: false,
      code: "ROUTE_REJECTION",
      error: routeResult.error,
    };
  }
  if (routeResult.route !== packet.recommended_route) {
    return {
      ok: false,
      code: "ROUTE_STATUS_MISMATCH",
      error: `Route adapter resolved ${routeResult.route} but packet recommends ${packet.recommended_route}.`,
    };
  }
  return { ok: true };
}

export async function runMilestoneSignalsBridge(
  options: MilestoneSignalsBridgeOptions,
): Promise<MilestoneSignalsBridgeResult> {
  const rootDir = options.rootDir ? path.resolve(options.rootDir) : detectRepoRoot(process.cwd());
  const queueStatePath = options.queueStatePath
    ? resolveRepoPath(rootDir, options.queueStatePath)
    : resolveRepoPath(rootDir, DEFAULT_QUEUE_STATE_PATH);
  const telemetryPath = options.telemetryPath
    ? resolveRepoPath(rootDir, options.telemetryPath)
    : resolveRepoPath(rootDir, DEFAULT_TELEMETRY_PATH);
  const clock = options.clock ?? (() => new Date());

  try {
    const producerResult = await collectMilestoneProducerEvents({
      business: options.business,
      rootDir,
      dataRoot: options.dataRoot,
    });
    const bundleSignals = producerResult.events.flatMap((event) =>
      MILESTONE_BUNDLE_RULES[event.root_id].map((rule) => ({
        business: options.business,
        event,
        rule,
      })),
    );
    if (bundleSignals.length === 0) {
      return {
        ok: true,
        roots_considered: MILESTONE_ROOT_COUNT,
        roots_detected: 0,
        dispatches_enqueued: 0,
        suppressed: 0,
        noop: 1,
        warnings: producerResult.warnings,
      };
    }

    const packets = buildDispatchPackets(rootDir, options.business, bundleSignals, clock);
    const validationErrors = packets
      .map((packet) => validateMilestoneDispatchPacket(packet))
      .filter((result) => !result.ok);
    if (validationErrors.length > 0) {
      return {
        ok: false,
        roots_considered: MILESTONE_ROOT_COUNT,
        roots_detected: producerResult.events.length,
        dispatches_enqueued: 0,
        suppressed: 0,
        noop: 0,
        warnings: producerResult.warnings,
        error: validationErrors.map((result) => result.error ?? result.code ?? "invalid").join(" | "),
      };
    }

    const enqueueResult = enqueueQueueDispatches({
      queueStatePath,
      telemetryPath,
      telemetryReason: "milestone-root-admission",
      packets,
      clock,
    });

    return {
      ok: true,
      roots_considered: MILESTONE_ROOT_COUNT,
      roots_detected: producerResult.events.length,
      dispatches_enqueued: enqueueResult.appended,
      suppressed: enqueueResult.suppressed,
      noop: enqueueResult.appended === 0 ? 1 : 0,
      warnings: producerResult.warnings,
    };
  } catch (error) {
    return {
      ok: false,
      roots_considered: MILESTONE_ROOT_COUNT,
      roots_detected: 0,
      dispatches_enqueued: 0,
      suppressed: 0,
      noop: 0,
      warnings: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
