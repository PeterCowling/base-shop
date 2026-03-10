/**
 * lp-do-ideas trial orchestrator.
 *
 * Ingests standing-artifact delta events and emits dispatch packets.
 * Primary emission is dispatch.v2; dispatch.v1 is compatibility-only.
 * Operates in mode="trial" only — rejects mode="live" fail-closed.
 * Does not mutate startup-loop stage state.
 *
 * Contract: docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md
 * Schema:   docs/business-os/startup-loop/ideas/schemas/lp-do-ideas-dispatch.v2.schema.json (primary), docs/business-os/startup-loop/ideas/_deprecated/lp-do-ideas-dispatch.schema.json (compat)
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  type GapCase,
  type Prescription,
  validateGapCase,
  validateGapCaseReference,
  validatePrescription,
  validatePrescriptionReference,
} from "../self-evolving/self-evolving-contracts.js";

import {
  classifyIdea,
  type IdeaClassification,
  type IdeaClassificationInput,
} from "./lp-do-ideas-classifier.js";
import { computeClusterFingerprint } from "./lp-do-ideas-fingerprint.js";
import type { KeywordCalibrationPriors } from "./lp-do-ideas-keyword-calibrate.js";
import type { DispatchSelfEvolvingLink } from "./lp-do-ideas-queue-state-file.js";
import type { RegistryV2ArtifactEntry } from "./lp-do-ideas-registry-migrate-v1-v2.js";

// ---------------------------------------------------------------------------
// T1-conservative semantic-delta keywords (case-insensitive substring match)
// ---------------------------------------------------------------------------

export const T1_SEMANTIC_KEYWORDS: readonly string[] = [
  "icp",
  "target customer",
  "segment",
  "persona",
  "job-to-be-done",
  "jtbd",
  "positioning",
  "value proposition",
  "unique",
  "differentiation",
  "key message",
  "pricing",
  "price point",
  "offer",
  "bundle",
  "promotional",
  "channel strategy",
  "launch channel",
  "channel mix",
  "channel priorities",
  "channel selection",
  // Assessment-container section keywords (registered in standing-registry.json)
  "brand identity",
  "brand name",
  "solution decision",
  "naming",
  "distribution plan",
  // Codebase/quality signal bridge keywords
  "critical finding",
  "code quality",
  "api endpoint",
  "route change",
  "schema change",
  "dependency update",
  "component addition",
  "walkthrough finding",
  "testing issue",
  "ux gap",
  "broken flow",
  "missing functionality",
];

// ---------------------------------------------------------------------------
// Keyword scoring configuration
// ---------------------------------------------------------------------------

/** Minimum score for a T1 keyword match to route as actionable work rather than briefing_ready. */
export const T1_ROUTING_THRESHOLD = 0.6;

/** Base score when a keyword matches (before calibration adjustment) */
const T1_BASE_MATCH_SCORE = 0.75;

const DEFAULT_PRIORS_PATH = path.join(
  "docs",
  "business-os",
  "startup-loop",
  "ideas",
  "trial",
  "keyword-calibration-priors.json",
);

const MICRO_BUILD_TRIGGER_SECTIONS = new Set([
  "ux-gap",
  "broken-flow",
  "missing-functionality",
  "component-addition",
  "route-change",
]);

const MICRO_BUILD_BLOCKER_SECTIONS = new Set([
  "api-endpoint",
  "brand-identity",
  "brand-name",
  "bundle",
  "channel-mix",
  "channel-priorities",
  "channel-selection",
  "channel-strategy",
  "code-quality",
  "critical-finding",
  "dependency-update",
  "differentiation",
  "distribution-plan",
  "icp",
  "job-to-be-done",
  "jtbd",
  "key-message",
  "launch-channel",
  "naming",
  "offer",
  "persona",
  "positioning",
  "price-point",
  "pricing",
  "promotional",
  "schema-change",
  "segment",
  "solution-decision",
  "target-customer",
  "unique",
  "value-proposition",
]);

const CODE_LOCATION_ROOT_PATTERN = /^(apps|packages|scripts)\//i;
const CODE_LOCATION_EXTENSION_PATTERN = /\.(c|m)?[jt]sx?$|\.css$|\.s[ac]ss$|\.less$/i;
const UI_SURFACE_PATH_PATTERNS = [
  /\/components?\//i,
  /\/app\//i,
  /\/pages?\//i,
  /\/styles?\//i,
  /\/layout\.(c|m)?[jt]sx?$/i,
  /\/page\.(c|m)?[jt]sx?$/i,
];
const MICRO_BUILD_BLOCKER_PATH_PATTERNS = [
  /\/app\/api\//i,
  /\/api\//i,
  /\/route\.(c|m)?[jt]s$/i,
  /\/route\.(c|m)?tsx$/i,
  /(^|\/)package\.json$/i,
  /(^|\/)pnpm-lock\.yaml$/i,
  /\/prisma\//i,
  /migration/i,
  /\.sql$/i,
];
const GENERIC_AREA_SEGMENTS = new Set([
  "src",
  "app",
  "apps",
  "components",
  "component",
  "lib",
  "client",
  "server",
  "ui",
  "shared",
  "feature",
  "features",
  "index",
]);

// Module-level priors cache
let _priorsCache: KeywordCalibrationPriors | null | undefined;
let _priorsCachePath: string | undefined;

/**
 * Load keyword calibration priors from disk. Returns null if file is missing
 * or invalid (graceful degradation — base scores used).
 */
export function loadKeywordPriors(priorsPath?: string): KeywordCalibrationPriors | null {
  const resolvedPath = priorsPath ?? DEFAULT_PRIORS_PATH;
  if (_priorsCache !== undefined && _priorsCachePath === resolvedPath) {
    return _priorsCache;
  }
  try {
    const raw = readFileSync(resolvedPath, "utf-8");
    const parsed = JSON.parse(raw) as KeywordCalibrationPriors;
    if (parsed && typeof parsed.priors === "object") {
      _priorsCache = parsed;
      _priorsCachePath = resolvedPath;
      return parsed;
    }
  } catch {
    // Missing or corrupt priors file — graceful degradation
  }
  _priorsCache = null;
  _priorsCachePath = resolvedPath;
  return null;
}

/** Invalidate the in-process priors cache (for testing or after recalibration). */
export function invalidateKeywordPriorsCache(): void {
  _priorsCache = undefined;
  _priorsCachePath = undefined;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PacketMode = "trial" | "live";

export type DeliverableFamily =
  | "code-change"
  | "doc"
  | "multi"
  | "business-artifact"
  | "design"
  | "infra";

export type DispatchStatus =
  | "fact_find_ready"
  | "plan_ready"
  | "micro_build_ready"
  | "briefing_ready"
  | "auto_executed"
  | "logged_no_action";

export type RecommendedRoute =
  | "lp-do-fact-find"
  | "lp-do-plan"
  | "lp-do-build"
  | "lp-do-briefing";

export const ROUTABLE_DISPATCH_STATUS_ROUTE_MAP = {
  fact_find_ready: "lp-do-fact-find",
  plan_ready: "lp-do-plan",
  micro_build_ready: "lp-do-build",
  briefing_ready: "lp-do-briefing",
} as const satisfies Record<string, RecommendedRoute>;

export type RoutableDispatchStatus = keyof typeof ROUTABLE_DISPATCH_STATUS_ROUTE_MAP;

export function isRoutableDispatchStatus(status: DispatchStatus): status is RoutableDispatchStatus {
  return Object.hasOwn(ROUTABLE_DISPATCH_STATUS_ROUTE_MAP, status);
}

export function routeForDispatchStatus(status: RoutableDispatchStatus): RecommendedRoute {
  return ROUTABLE_DISPATCH_STATUS_ROUTE_MAP[status];
}

export function statusForRecommendedRoute(route: RecommendedRoute): RoutableDispatchStatus {
  switch (route) {
    case "lp-do-fact-find":
      return "fact_find_ready";
    case "lp-do-plan":
      return "plan_ready";
    case "lp-do-build":
      return "micro_build_ready";
    case "lp-do-briefing":
      return "briefing_ready";
  }
}

export type QueueState = "enqueued" | "processed" | "skipped" | "error";

export type ArtifactDomain =
  | "ASSESSMENT"
  | "MARKET"
  | "SELL"
  | "PRODUCTS"
  | "LOGISTICS"
  | "LEGAL"
  | "STRATEGY"
  | "BOS";

export type CutoverPhase = "P0" | "P1" | "P2" | "P3";

export type SuppressionReason =
  | "empty_after_sha"
  | "duplicate_event"
  | "first_registration"
  | "missing_changed_sections"
  | "anti_self_trigger_non_material"
  | "lineage_depth_cap_exceeded"
  | "cooldown_non_material"
  | "non_material_delta"
  | "unknown_artifact"
  | "inactive_artifact"
  | "projection_immunity"
  | "trigger_policy_blocked"
  | "missing_registry_for_source_primary"
  | "pack_without_source_delta";

export interface ArtifactDeltaEvent {
  artifact_id: string;
  business: string;
  before_sha: string | null;
  after_sha: string;
  path: string;
  location_anchors?: string[];
  domain?: ArtifactDomain;
  changed_sections?: string[];
  updated_by_process?: string;
  normalized_semantic_diff_hash?: string;
  root_event_id?: string;
  anchor_key?: string;
  cluster_key?: string;
  cluster_fingerprint?: string;
  lineage_depth?: number;
  evidence_refs?: string[];
  before_truth_fingerprint?: string;
  after_truth_fingerprint?: string;
  material_delta?: boolean;
  area_anchor_hint?: string;
  current_truth_hint?: string;
  next_scope_now_hint?: string;
  why_hint?: string;
  intended_outcome_hint?: IntendedOutcomeV2;
}

export interface TrialDispatchPacket {
  schema_version: "dispatch.v1" | "dispatch.v2";
  dispatch_id: string;
  mode: PacketMode;
  business: string;
  trigger: "artifact_delta";
  artifact_id: string;
  before_sha: string | null;
  after_sha: string;
  root_event_id: string;
  anchor_key: string;
  cluster_key: string;
  cluster_fingerprint: string;
  lineage_depth: number;
  area_anchor: string;
  location_anchors: [string, ...string[]];
  provisional_deliverable_family: DeliverableFamily;
  current_truth: string;
  next_scope_now: string;
  adjacent_later: string[];
  recommended_route: RecommendedRoute;
  status: DispatchStatus;
  priority: "P1" | "P2" | "P3";
  confidence: number;
  evidence_refs: [string, ...string[]];
  created_at: string;
  queue_state: QueueState;
  /** dispatch.v2 field (required in v2, optional in compat typing) */
  why?: string;
  /** dispatch.v2 field (required in v2, optional in compat typing) */
  intended_outcome?: IntendedOutcomeV2;
}

export interface ShadowTelemetrySnapshot {
  phase: CutoverPhase;
  root_event_count: number;
  candidate_count: number;
  admitted_count: number;
  suppression_reason_counts: Record<SuppressionReason, number>;
}

export interface TrialOrchestratorOptions {
  mode: string;
  events: ArtifactDeltaEvent[];
  seenDedupeKeys?: Set<string>;
  clock?: () => Date;
  cutoverPhase?: CutoverPhase;
  standingRegistry?: { artifacts: RegistryV2ArtifactEntry[] };
  manualOverrideArtifactIds?: readonly string[];
  lineageDepthCap?: number;
  lineageOverrideRootEventIds?: readonly string[];
  cooldownWindowHours?: number;
  cooldownState?: Map<string, ClusterCooldownStateEntry>;
}

export interface ClusterCooldownStateEntry {
  last_admitted_at: string;
  cluster_fingerprint: string;
}

// ---------------------------------------------------------------------------
// dispatch.v2 types
// ---------------------------------------------------------------------------

/**
 * Typed intended outcome for dispatch.v2 packets.
 *
 * `type: "measurable"` — outcome has a quantifiable KPI target.
 * `type: "operational"` — outcome is process/documentation work; no KPI required,
 *   but `statement` must still be non-empty and not a template placeholder.
 *
 * `source: "operator"` — value was authored by the operator at Option B confirmation.
 * `source: "auto"` — value was auto-generated (e.g. artifact_delta fallback text).
 *   Auto-sourced values pass schema validation but are excluded from quality metrics.
 *
 * Changelog: introduced in dispatch.v2 to distinguish operator-authored content from
 * auto-generated fallback strings (e.g. `"ARTIFACT changed (sha → sha)"`).
 */
export interface IntendedOutcomeV2 {
  type: "measurable" | "operational";
  statement: string;
  source: "operator" | "auto";
}

export interface DispatchBuildOriginProvenance {
  schema_version: "dispatch-build-origin.v1";
  build_signal_id: string;
  recurrence_key: string;
  review_cycle_key: string;
  plan_slug: string;
  canonical_title: string;
  primary_source: "pattern-reflection.entries.json" | "results-review.signals.json";
  merge_state: "single_source" | "merged_cross_sidecar";
  source_presence: {
    results_review_signal: boolean;
    pattern_reflection_entry: boolean;
  };
  results_review_path: string | null;
  results_review_sidecar_path: string | null;
  pattern_reflection_path: string | null;
  pattern_reflection_sidecar_path: string | null;
  gap_case?: GapCase;
  prescription?: Prescription;
  reflection_fields?: {
    category: string | null;
    routing_target: string | null;
    occurrence_count: number | null;
  };
}

export interface DispatchHistoricalCarryoverProvenance {
  schema_version: "dispatch-historical-carryover.v1";
  manifest_path: string;
  historical_candidate_id: string;
  source_audit_path: string;
  source_plan_slugs: string[];
  source_paths: string[];
  backfilled_at: string;
}

/**
 * dispatch.v2 packet type.
 *
 * Extends dispatch.v1 fields with required `why` and `intended_outcome`.
 * `schema_version` is `"dispatch.v2"` — used by the routing adapter to
 * discriminate v1 vs v2 packets.
 *
 * Migration: v1 packets are handled by a compatibility reader in the routing
 * adapter (TASK-08) that maps `current_truth` → `why` with `source: "auto"`
 * and sets `intended_outcome: null` to avoid fabrication.
 *
 * Changelog: dispatch.v2 introduced in startup-loop-why-intended-outcome-automation
 * to address 98.9%/100% missing rates for `why`/`intended_outcome` in Build Summary.
 */
export interface TrialDispatchPacketV2 {
  schema_version: "dispatch.v2";
  dispatch_id: string;
  mode: PacketMode;
  business: string;
  trigger: "artifact_delta" | "operator_idea";
  artifact_id: string | null;
  before_sha: string | null;
  after_sha: string;
  root_event_id: string;
  anchor_key: string;
  cluster_key: string;
  cluster_fingerprint: string;
  lineage_depth: number;
  area_anchor: string;
  location_anchors: [string, ...string[]];
  provisional_deliverable_family: DeliverableFamily;
  current_truth: string;
  next_scope_now: string;
  adjacent_later: string[];
  recommended_route: RecommendedRoute;
  status: DispatchStatus;
  priority: "P1" | "P2" | "P3";
  confidence: number;
  evidence_refs: [string, ...string[]];
  created_at: string;
  queue_state: QueueState;
  self_evolving?: DispatchSelfEvolvingLink;
  build_origin?: DispatchBuildOriginProvenance;
  historical_carryover?: DispatchHistoricalCarryoverProvenance;
  /**
   * Why this work is happening now.
   * Required, non-empty string.
   * At Option B confirmation: operator must author a real explanation, not a generated string.
   */
  why: string;
  /**
   * The intended outcome of this build.
   * Required object with `type`, `statement`, and `source`.
   * `source: "auto"` values pass schema but are excluded from quality metrics.
   */
  intended_outcome: IntendedOutcomeV2;
}

// ---------------------------------------------------------------------------
// dispatch.v2 validation
// ---------------------------------------------------------------------------

export interface DispatchV2ValidationResult {
  /** True if all required fields are present and valid. */
  valid: boolean;
  /** Actionable error messages for schema failures. */
  errors: string[];
  /**
   * Non-blocking quality warnings (e.g. `source: "auto"` values).
   * Packet is still valid when warnings are present.
   * These values are excluded from operator-quality metrics.
   */
  quality_warnings?: string[];
}

/**
 * Validates a dispatch.v2 packet against the v2 contract.
 *
 * Checks:
 * - `schema_version` must be `"dispatch.v2"`
 * - `why` must be a non-empty, non-whitespace-only string
 * - `intended_outcome` must be present with valid `type`, non-empty `statement`, and valid `source`
 * - Empty `statement` strings are rejected (minLength: 1)
 *
 * Quality warnings (non-blocking):
 * - `intended_outcome.source: "auto"` triggers a quality warning
 *
 * @param packet - The dispatch.v2 packet to validate. May contain wrong schema_version.
 * @returns DispatchV2ValidationResult with `valid`, `errors`, and optional `quality_warnings`.
 */
export function validateDispatchV2(
  packet: Partial<TrialDispatchPacketV2> & Record<string, unknown>,
): DispatchV2ValidationResult {
  const errors: string[] = [];
  const quality_warnings: string[] = [];

  // schema_version must be "dispatch.v2"
  if (packet.schema_version !== "dispatch.v2") {
    errors.push(
      `[dispatch.v2] schema_version must be "dispatch.v2" but got "${String(packet.schema_version ?? "(missing)")}". ` +
        `Use validateDispatchV2 only for dispatch.v2 packets.`,
    );
  }

  // why: required, non-empty string
  const why = packet.why;
  if (why === undefined || why === null) {
    errors.push(
      `[dispatch.v2] "why" is required but missing. ` +
        `Operator must author a real explanation of why this work is happening now. ` +
        `Auto-generated fallback strings are permitted only with source: "auto".`,
    );
  } else if (typeof why !== "string" || why.trim().length === 0) {
    errors.push(
      `[dispatch.v2] "why" must be a non-empty string (minLength: 1 after trim). ` +
        `Got: ${JSON.stringify(why)}.`,
    );
  }

  // intended_outcome: required object
  const io = packet.intended_outcome as IntendedOutcomeV2 | undefined | null;
  if (io === undefined || io === null) {
    errors.push(
      `[dispatch.v2] "intended_outcome" is required but missing. ` +
        `Must be an object with fields: type ("measurable"|"operational"), statement (string, minLength: 1), source ("operator"|"auto").`,
    );
  } else {
    // type must be "measurable" or "operational"
    if (io.type !== "measurable" && io.type !== "operational") {
      errors.push(
        `[dispatch.v2] "intended_outcome.type" must be "measurable" or "operational" but got "${String(io.type ?? "(missing)")}".`,
      );
    }

    // statement must be non-empty
    if (
      io.statement === undefined ||
      io.statement === null ||
      typeof io.statement !== "string" ||
      io.statement.trim().length === 0
    ) {
      errors.push(
        `[dispatch.v2] "intended_outcome.statement" must be a non-empty string (minLength: 1). ` +
          `Got: ${JSON.stringify(io.statement ?? "(missing)")}.`,
      );
    }

    // source must be "operator" or "auto"
    if (io.source !== "operator" && io.source !== "auto") {
      errors.push(
        `[dispatch.v2] "intended_outcome.source" must be "operator" or "auto" but got "${String(io.source ?? "(missing)")}".`,
      );
    }

    // Quality warning: auto-sourced values are excluded from quality metrics
    if (errors.length === 0 && io.source === "auto") {
      quality_warnings.push(
        `[dispatch.v2] intended_outcome.source is "auto" — this value was auto-generated and will be ` +
          `excluded from operator-quality metrics. Operator should review and update at Option B confirmation.`,
      );
    }
  }

  const selfEvolving = packet.self_evolving;
  if (selfEvolving && typeof selfEvolving === "object") {
    const link = selfEvolving as DispatchSelfEvolvingLink;
    if (link.gap_case) {
      errors.push(
        ...validateGapCaseReference(link.gap_case).map(
          (error) => `[dispatch.v2] self_evolving.gap_case.${error}`,
        ),
      );
      if (link.gap_case.candidate_id !== link.candidate_id) {
        errors.push(
          `[dispatch.v2] self_evolving.gap_case.candidate_id must match self_evolving.candidate_id.`,
        );
      }
    }
    if (link.prescription) {
      errors.push(
        ...validatePrescriptionReference(link.prescription).map(
          (error) => `[dispatch.v2] self_evolving.prescription.${error}`,
        ),
      );
    }
  }

  const buildOrigin = packet.build_origin;
  if (buildOrigin && typeof buildOrigin === "object") {
    if (buildOrigin.gap_case) {
      errors.push(
        ...validateGapCase(buildOrigin.gap_case).map(
          (error) => `[dispatch.v2] build_origin.gap_case.${error}`,
        ),
      );
    }
    if (buildOrigin.prescription) {
      errors.push(
        ...validatePrescription(buildOrigin.prescription).map(
          (error) => `[dispatch.v2] build_origin.prescription.${error}`,
        ),
      );
      if (buildOrigin.prescription.required_route !== packet.recommended_route) {
        errors.push(
          `[dispatch.v2] build_origin.prescription.required_route must match packet.recommended_route.`,
        );
      }
      if (
        buildOrigin.gap_case &&
        !buildOrigin.prescription.gap_types_supported.includes(buildOrigin.gap_case.gap_type)
      ) {
        errors.push(
          `[dispatch.v2] build_origin.prescription.gap_types_supported must include build_origin.gap_case.gap_type.`,
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    quality_warnings: quality_warnings.length > 0 ? quality_warnings : undefined,
  };
}

export interface TrialOrchestratorResult {
  ok: true;
  dispatched: TrialDispatchPacket[];
  suppressed: number;
  noop: number;
  warnings: string[];
  shadow_telemetry: ShadowTelemetrySnapshot;
  /**
   * Advisory-phase classification records for each dispatched packet.
   * Produced by lp-do-ideas-classifier-v1. One entry per dispatched packet.
   * Empty array on classification failure (non-fatal).
   *
   * Callers should persist via appendClassifications() from lp-do-ideas-persistence.ts
   * after the orchestrator returns.
   */
  classifications: IdeaClassification[];
}

export interface TrialOrchestratorError {
  ok: false;
  error: string;
}

type PhaseBehavior = {
  requiresSourcePrimary: boolean;
  emitShadowTelemetry: boolean;
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const DOMAIN_TO_AREA: Readonly<Record<ArtifactDomain, string>> = {
  ASSESSMENT: "assessment",
  MARKET: "market-intelligence",
  SELL: "channel-strategy",
  PRODUCTS: "product-catalogue",
  LOGISTICS: "logistics-policy",
  LEGAL: "legal-compliance",
  STRATEGY: "business-strategy",
  BOS: "business-operating-system",
};

const PACK_ARTIFACT_PATTERNS: ReadonlyArray<RegExp> = [
  /-(MARKET|SELL|PRODUCTS|LOGISTICS)-PACK$/,
  /-(MARKET|SELL|PRODUCTS|LOGISTICS)-AGGREGATE-PACK$/,
];

const PACK_PATH_PATTERNS: ReadonlyArray<RegExp> = [
  /\/market-pack\.user\.md$/i,
  /\/sell-pack\.user\.md$/i,
  /\/(product-pack|products-aggregate-pack)\.user\.md$/i,
  /\/logistics-pack\.user\.md$/i,
];

const SOURCE_CLASSES = new Set(["source_process", "source_reference"]);
const PROJECTION_IMMUNE_CLASSES = new Set([
  "projection_summary",
  "system_telemetry",
  "execution_output",
  "reflection",
]);

const SELF_TRIGGER_PROCESSES = new Set([
  "projection_auto",
  "reflection_emit",
  "reflection_emit_minimum",
  "standing-write-back",
  "pattern-promote-loop-update",
  "pattern-promote-skill-proposal",
  "self-evolving-from-build-failure",
  "ideas-keyword-calibrate",
]);

const METADATA_ONLY_SECTION_PATTERNS: ReadonlyArray<RegExp> = [
  /last[-_ ]?updated/i,
  /last[-_ ]?reviewed/i,
  /updated at/i,
  /frontmatter/i,
  /metadata/i,
  /format(ting)?/i,
  /whitespace/i,
  /index/i,
];

const DEFAULT_LINEAGE_DEPTH_CAP = 2;
const DEFAULT_COOLDOWN_HOURS = 72;

function sha256(input: string): string {
  return createHash("sha256").update(input, "utf-8").digest("hex");
}

function normalizeKeyToken(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized.length > 0 ? normalized : "unknown";
}

function buildRootEventId(event: ArtifactDeltaEvent): string {
  if (event.root_event_id && event.root_event_id.trim().length > 0) {
    return event.root_event_id.trim();
  }
  return `${normalizeArtifactId(event.artifact_id)}:${event.after_sha}`;
}

const ANCHOR_KEY_MAX_LENGTH = 80;

function buildAnchorKey(
  event: ArtifactDeltaEvent,
  areaAnchor: string,
): string {
  if (event.anchor_key && event.anchor_key.trim().length > 0) {
    return normalizeKeyToken(event.anchor_key).slice(0, ANCHOR_KEY_MAX_LENGTH);
  }
  return normalizeKeyToken(areaAnchor).slice(0, ANCHOR_KEY_MAX_LENGTH);
}

function buildDomainKey(event: ArtifactDeltaEvent): string {
  if (event.domain) {
    return normalizeKeyToken(event.domain);
  }
  return "unknown";
}

function buildClusterKey(
  event: ArtifactDeltaEvent,
  rootEventId: string,
  anchorKey: string,
): string {
  if (event.cluster_key && event.cluster_key.trim().length > 0) {
    return event.cluster_key.trim();
  }
  const businessKey = normalizeKeyToken(event.business);
  const domainKey = buildDomainKey(event);
  return `${businessKey}:${domainKey}:${anchorKey}:${rootEventId}`;
}

function buildFallbackNormalizedSemanticDiffHash(
  event: ArtifactDeltaEvent,
  sections: readonly string[],
): string {
  const normalizedSections = [...sections]
    .map((section) => normalizeKeyToken(section))
    .sort((left, right) => left.localeCompare(right));

  return sha256(
    [
      normalizeArtifactId(event.artifact_id),
      event.before_sha ?? "null",
      event.after_sha,
      normalizedSections.join("|"),
    ].join("\n"),
  );
}

function buildEvidenceRefs(event: ArtifactDeltaEvent): [string, ...string[]] {
  const refs = (event.evidence_refs ?? [event.path])
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  if (refs.length === 0) {
    return [event.path];
  }
  return refs as [string, ...string[]];
}

function normalizeLocationAnchor(value: string): string {
  return value.trim().replaceAll("\\", "/");
}

function extractLocationAnchorsFromEvidenceRefs(
  evidenceRefs: readonly string[],
): string[] {
  const anchors = new Set<string>();

  for (const ref of evidenceRefs) {
    const trimmed = ref.trim();
    const gitDiffMatch = /^git-diff:[A-Z?]+:(.+)$/i.exec(trimmed);
    if (gitDiffMatch?.[1]) {
      anchors.add(normalizeLocationAnchor(gitDiffMatch[1]));
      continue;
    }

    const bugScanMatch = /^bug-scan:[^:]+:(.+):\d+$/i.exec(trimmed);
    if (bugScanMatch?.[1]) {
      anchors.add(normalizeLocationAnchor(bugScanMatch[1]));
    }
  }

  return Array.from(anchors);
}

function buildLocationAnchors(
  event: ArtifactDeltaEvent,
  evidenceRefs: readonly string[],
): [string, ...string[]] {
  const preferredAnchors = [
    ...(event.location_anchors ?? []),
    ...extractLocationAnchorsFromEvidenceRefs(evidenceRefs),
  ]
    .map(normalizeLocationAnchor)
    .filter((entry) => entry.length > 0);

  const uniquePreferred = Array.from(new Set(preferredAnchors));
  if (uniquePreferred.length > 0) {
    return uniquePreferred.slice(0, 8) as [string, ...string[]];
  }

  const fallback = normalizeLocationAnchor(event.path);
  return [fallback.length > 0 ? fallback : event.artifact_id];
}

function buildSuppressionCounter(): Record<SuppressionReason, number> {
  return {
    empty_after_sha: 0,
    duplicate_event: 0,
    first_registration: 0,
    missing_changed_sections: 0,
    anti_self_trigger_non_material: 0,
    lineage_depth_cap_exceeded: 0,
    cooldown_non_material: 0,
    non_material_delta: 0,
    unknown_artifact: 0,
    inactive_artifact: 0,
    projection_immunity: 0,
    trigger_policy_blocked: 0,
    missing_registry_for_source_primary: 0,
    pack_without_source_delta: 0,
  };
}

function phaseBehavior(phase: CutoverPhase): PhaseBehavior {
  if (phase === "P2" || phase === "P3") {
    return {
      requiresSourcePrimary: true,
      emitShadowTelemetry: phase === "P2",
    };
  }
  return {
    requiresSourcePrimary: false,
    emitShadowTelemetry: phase === "P1",
  };
}

function isCodeLocationAnchor(value: string): boolean {
  const normalized = normalizeLocationAnchor(value);
  return (
    CODE_LOCATION_ROOT_PATTERN.test(normalized) &&
    CODE_LOCATION_EXTENSION_PATTERN.test(normalized)
  );
}

function deriveAreaAnchorFromLocationAnchor(locationAnchor: string): string | null {
  const normalized = normalizeLocationAnchor(locationAnchor);
  if (!isCodeLocationAnchor(normalized)) {
    return null;
  }

  const segments = normalized
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
  if (segments.length === 0) {
    return null;
  }

  const stem = segments.at(-1)?.replace(/\.(c|m)?[jt]sx?$|\.css$|\.s[ac]ss$|\.less$/i, "") ?? "";
  const stemTokens = stem
    .split(/[^a-zA-Z0-9]+|(?=[A-Z])/)
    .map((token) => token.trim().toLowerCase())
    .filter(
      (token) =>
        token.length > 0 &&
        token !== "page" &&
        token !== "layout" &&
        token !== "route" &&
        token !== "client" &&
        token !== "server",
    );

  const contextTokens = segments
    .slice(0, -1)
    .filter((segment) => !GENERIC_AREA_SEGMENTS.has(segment.toLowerCase()))
    .slice(-3)
    .flatMap((segment) => segment.split(/[^a-zA-Z0-9]+/))
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token.length > 0);

  const combined = Array.from(new Set([...contextTokens, ...stemTokens])).slice(0, 6);
  if (combined.length === 0) {
    return null;
  }

  return combined.join(" ");
}

function deriveAreaAnchor(
  event: ArtifactDeltaEvent,
  locationAnchors: readonly string[],
): string {
  const hintedArea = event.area_anchor_hint?.trim();
  if (hintedArea && hintedArea.length > 0) {
    return hintedArea;
  }

  for (const anchor of locationAnchors) {
    const fromLocation = deriveAreaAnchorFromLocationAnchor(anchor);
    if (fromLocation) {
      return fromLocation;
    }
  }

  if (event.domain && event.domain in DOMAIN_TO_AREA) {
    return DOMAIN_TO_AREA[event.domain];
  }
  return event.artifact_id
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/^[a-z0-9]+-/, "");
}

/**
 * Score T1 keyword match. Returns 0-1 score incorporating calibration priors.
 * Base score = 0.75 for any keyword match, adjusted by calibration delta/100.
 * No match = 0.0. Multiple matches: highest-scoring keyword wins.
 */
export function scoreT1Match(changedSections: string[], priorsPath?: string): number {
  const lowered = changedSections.map((section) => section.toLowerCase());
  const priors = loadKeywordPriors(priorsPath);

  let bestScore = 0.0;

  for (const keyword of T1_SEMANTIC_KEYWORDS) {
    const matches = lowered.some((section) => section.includes(keyword));
    if (!matches) continue;

    let score = T1_BASE_MATCH_SCORE;

    // Apply calibration prior if available
    if (priors?.priors[keyword] !== undefined) {
      score += priors.priors[keyword] / 100;
    }

    // Clamp to [0, 1]
    score = Math.max(0.0, Math.min(1.0, score));

    if (score > bestScore) {
      bestScore = score;
    }
  }

  return bestScore;
}

function deriveDeliverableFamily(
  event: ArtifactDeltaEvent,
  locationAnchors: readonly string[],
): DeliverableFamily {
  if (locationAnchors.some((anchor) => isCodeLocationAnchor(anchor))) {
    return "code-change";
  }
  if (event.path.startsWith("docs/")) {
    return "business-artifact";
  }
  return "business-artifact";
}

function isMicroBuildCandidate(
  changedSections: readonly string[],
  locationAnchors: readonly string[],
  deliverableFamily: DeliverableFamily,
): boolean {
  if (deliverableFamily !== "code-change") {
    return false;
  }

  if (locationAnchors.length === 0 || locationAnchors.length > 6) {
    return false;
  }

  const normalizedSections = changedSections.map((section) => normalizeKeyToken(section));
  const hasTriggerSignal = normalizedSections.some((section) =>
    MICRO_BUILD_TRIGGER_SECTIONS.has(section),
  );
  const hasBlockingSignal = normalizedSections.some((section) =>
    MICRO_BUILD_BLOCKER_SECTIONS.has(section),
  );

  if (!hasTriggerSignal || hasBlockingSignal) {
    return false;
  }

  const uiAnchors = locationAnchors.filter((anchor) => {
    const normalized = normalizeLocationAnchor(anchor);
    return (
      isCodeLocationAnchor(normalized) &&
      UI_SURFACE_PATH_PATTERNS.some((pattern) => pattern.test(normalized))
    );
  });
  if (uiAnchors.length === 0) {
    return false;
  }

  return !uiAnchors.some((anchor) =>
    MICRO_BUILD_BLOCKER_PATH_PATTERNS.some((pattern) => pattern.test(anchor)),
  );
}

function sectionsAreMetadataOnly(changedSections: readonly string[]): boolean {
  if (changedSections.length === 0) {
    return false;
  }
  return changedSections.every((section) =>
    METADATA_ONLY_SECTION_PATTERNS.some((pattern) => pattern.test(section)),
  );
}

function isMaterialDeltaEvent(
  event: ArtifactDeltaEvent,
  changedSections: readonly string[],
): boolean {
  if (typeof event.material_delta === "boolean") {
    return event.material_delta;
  }

  if (
    typeof event.before_truth_fingerprint === "string" &&
    event.before_truth_fingerprint.trim().length > 0 &&
    typeof event.after_truth_fingerprint === "string" &&
    event.after_truth_fingerprint.trim().length > 0
  ) {
    return (
      event.before_truth_fingerprint.trim() !==
      event.after_truth_fingerprint.trim()
    );
  }

  return !sectionsAreMetadataOnly(changedSections);
}

function parseIsoTimestamp(value: string): number | null {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return parsed;
}

function normalizeArtifactId(value: string): string {
  return value.trim().toUpperCase();
}

function isPackLike(event: ArtifactDeltaEvent): boolean {
  const artifactId = normalizeArtifactId(event.artifact_id);
  if (PACK_ARTIFACT_PATTERNS.some((pattern) => pattern.test(artifactId))) {
    return true;
  }
  const eventPath = event.path.replaceAll("\\", "/");
  return PACK_PATH_PATTERNS.some((pattern) => pattern.test(eventPath));
}

function isSourceClass(artifactClass: string): boolean {
  return SOURCE_CLASSES.has(artifactClass);
}

function isProjectionImmuneClass(artifactClass: string): boolean {
  return PROJECTION_IMMUNE_CLASSES.has(artifactClass);
}

/**
 * Builds the deduplication key for an event.
 * Format: "<artifact_id>:<before_sha|null>:<after_sha>"
 */
export function buildDedupeKey(event: ArtifactDeltaEvent): string {
  return `${event.artifact_id}:${event.before_sha ?? "null"}:${event.after_sha}`;
}

/** Formats a dispatch_id from a Date and sequence number (1-based). Uses UTC. */
export function buildDispatchId(now: Date, seq: number): string {
  const pad = (value: number, length: number) => String(value).padStart(length, "0");
  const timestamp =
    `${now.getUTCFullYear()}` +
    `${pad(now.getUTCMonth() + 1, 2)}` +
    `${pad(now.getUTCDate(), 2)}` +
    `${pad(now.getUTCHours(), 2)}` +
    `${pad(now.getUTCMinutes(), 2)}` +
    `${pad(now.getUTCSeconds(), 2)}`;
  return `IDEA-DISPATCH-${timestamp}-${pad(seq, 4)}`;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Runs the lp-do-ideas trial orchestrator.
 *
 * Pure function — no file I/O. Queue/telemetry writes are handled by
 * lp-do-ideas-trial-queue.ts.
 */
export function runTrialOrchestrator(
  options: TrialOrchestratorOptions,
): TrialOrchestratorResult | TrialOrchestratorError {
  if (options.mode !== "trial") {
    return {
      ok: false,
      error:
        `[lp-do-ideas-trial] mode "${options.mode}" is not permitted in this tranche. ` +
        `Only mode="trial" is supported. mode="live" is reserved for the go-live integration phase.`,
    };
  }

  const phase = options.cutoverPhase ?? "P0";
  const behavior = phaseBehavior(phase);
  const seenKeys = options.seenDedupeKeys ?? new Set<string>();
  const now = options.clock ? options.clock() : new Date();
  const warnings: string[] = [];
  const warningSet = new Set<string>();

  const registryById = new Map<string, RegistryV2ArtifactEntry>();
  for (const entry of options.standingRegistry?.artifacts ?? []) {
    registryById.set(normalizeArtifactId(entry.artifact_id), entry);
  }

  const manualOverrideIds = new Set(
    (options.manualOverrideArtifactIds ?? []).map((item) => normalizeArtifactId(item)),
  );
  const lineageDepthCap = Math.max(
    0,
    options.lineageDepthCap ?? DEFAULT_LINEAGE_DEPTH_CAP,
  );
  const lineageOverrideRootEventIds = new Set(
    (options.lineageOverrideRootEventIds ?? [])
      .map((value) => value.trim())
      .filter((value) => value.length > 0),
  );
  const cooldownWindowHours = Math.max(
    0,
    options.cooldownWindowHours ?? DEFAULT_COOLDOWN_HOURS,
  );
  const cooldownWindowMs = cooldownWindowHours * 60 * 60 * 1000;
  const cooldownState = options.cooldownState ?? new Map<string, ClusterCooldownStateEntry>();

  const dispatched: TrialDispatchPacket[] = [];
  const classifications: IdeaClassification[] = [];
  let suppressed = 0;
  let noop = 0;
  const suppressionCounters = buildSuppressionCounter();
  const uniqueRootEventIds = new Set<string>();

  const sortedEvents = [...options.events].sort((left, right) => {
    const leftKey = `${left.artifact_id}:${left.after_sha}`;
    const rightKey = `${right.artifact_id}:${right.after_sha}`;
    return leftKey.localeCompare(rightKey);
  });

  let candidateCount = 0;
  // Seed sequence from milliseconds to reduce same-second cross-run collisions
  // while preserving deterministic outputs under a fixed clock.
  let sequence = now.getUTCMilliseconds() + 1;

  const pushWarning = (message: string): void => {
    if (warningSet.has(message)) {
      return;
    }
    warningSet.add(message);
    warnings.push(message);
  };

  const suppressAsNoop = (reason: SuppressionReason): void => {
    suppressionCounters[reason] += 1;
    noop += 1;
  };

  const suppressAsDuplicate = (): void => {
    suppressionCounters.duplicate_event += 1;
    suppressed += 1;
  };

  for (const event of sortedEvents) {
    if (!event.after_sha) {
      suppressAsNoop("empty_after_sha");
      continue;
    }

    if (!event.before_sha) {
      suppressAsNoop("first_registration");
      continue;
    }

    const rootEventId = buildRootEventId(event);

    const dedupeKey = buildDedupeKey(event);
    if (seenKeys.has(dedupeKey)) {
      suppressAsDuplicate();
      continue;
    }
    seenKeys.add(dedupeKey);
    uniqueRootEventIds.add(rootEventId);

    const sections = event.changed_sections ?? [];
    if (!Array.isArray(event.changed_sections) || sections.length === 0) {
      suppressAsNoop("missing_changed_sections");
      continue;
    }
    candidateCount += 1;

    const evidenceRefs = buildEvidenceRefs(event);
    const locationAnchors = buildLocationAnchors(event, evidenceRefs);
    const areaAnchor = deriveAreaAnchor(event, locationAnchors);
    const anchorKey = buildAnchorKey(event, areaAnchor);
    const clusterKey = buildClusterKey(event, rootEventId, anchorKey);
    const normalizedSemanticDiffHash =
      event.normalized_semantic_diff_hash?.trim() &&
      event.normalized_semantic_diff_hash.trim().length > 0
        ? event.normalized_semantic_diff_hash.trim()
        : buildFallbackNormalizedSemanticDiffHash(event, sections);
    const clusterFingerprint =
      event.cluster_fingerprint && event.cluster_fingerprint.trim().length > 0
        ? event.cluster_fingerprint.trim()
        : computeClusterFingerprint({
            root_event_id: rootEventId,
            anchor_key: anchorKey,
            evidence_ref_ids: evidenceRefs,
            normalized_semantic_diff_hash: normalizedSemanticDiffHash,
          });
    const lineageDepth =
      Number.isInteger(event.lineage_depth) && (event.lineage_depth ?? 0) >= 0
        ? (event.lineage_depth as number)
        : 0;
    const materialDelta = isMaterialDeltaEvent(event, sections);

    if (
      lineageDepth > lineageDepthCap &&
      !lineageOverrideRootEventIds.has(rootEventId)
    ) {
      suppressAsNoop("lineage_depth_cap_exceeded");
      continue;
    }

    if (
      event.updated_by_process &&
      SELF_TRIGGER_PROCESSES.has(event.updated_by_process) &&
      event.material_delta !== true
    ) {
      suppressAsNoop("anti_self_trigger_non_material");
      continue;
    }

    const existingCooldown = cooldownState.get(clusterKey);
    if (existingCooldown && !materialDelta) {
      const lastAdmittedMs = parseIsoTimestamp(existingCooldown.last_admitted_at);
      const sameFingerprint =
        existingCooldown.cluster_fingerprint === clusterFingerprint;
      const withinCooldown =
        lastAdmittedMs !== null && now.getTime() - lastAdmittedMs < cooldownWindowMs;
      if (sameFingerprint && withinCooldown) {
        suppressAsNoop("cooldown_non_material");
        continue;
      }
    }

    if (!materialDelta) {
      suppressAsNoop("non_material_delta");
      continue;
    }

    const registryEntry = options.standingRegistry
      ? registryById.get(normalizeArtifactId(event.artifact_id))
      : undefined;

    if (behavior.requiresSourcePrimary && !options.standingRegistry) {
      suppressAsNoop("missing_registry_for_source_primary");
      pushWarning(
        `[lp-do-ideas-trial] phase ${phase} requires standing registry input. Event ${event.artifact_id} skipped.`,
      );
      continue;
    }

    if (options.standingRegistry) {
      if (!registryEntry) {
        suppressAsNoop("unknown_artifact");
        pushWarning(
          `[lp-do-ideas-trial] unknown artifact ${event.artifact_id}; suppressing admission by fail-closed policy.`,
        );
        continue;
      }

      if (!registryEntry.active) {
        suppressAsNoop("inactive_artifact");
        continue;
      }

      const hasManualOverride = manualOverrideIds.has(
        normalizeArtifactId(registryEntry.artifact_id),
      );
      const isPackEvent = isPackLike(event);

      if (behavior.requiresSourcePrimary && isPackEvent && !hasManualOverride) {
        suppressAsNoop("pack_without_source_delta");
        continue;
      }

      if (isProjectionImmuneClass(registryEntry.artifact_class)) {
        if (!(behavior.requiresSourcePrimary && hasManualOverride)) {
          suppressAsNoop("projection_immunity");
          continue;
        }
      }

      if (behavior.requiresSourcePrimary && !isSourceClass(registryEntry.artifact_class)) {
        if (!hasManualOverride) {
          suppressAsNoop("trigger_policy_blocked");
          continue;
        }
      }

      if (!hasManualOverride) {
        if (registryEntry.trigger_policy !== "eligible") {
          suppressAsNoop("trigger_policy_blocked");
          continue;
        }
      } else if (registryEntry.trigger_policy === "never") {
        suppressAsNoop("trigger_policy_blocked");
        continue;
      }
    }

    const t1Score = scoreT1Match(sections);
    const t1Match = t1Score >= T1_ROUTING_THRESHOLD;
    const provisionalDeliverableFamily = deriveDeliverableFamily(event, locationAnchors);
    const directBuildReady =
      t1Match &&
      isMicroBuildCandidate(sections, locationAnchors, provisionalDeliverableFamily);
    const status: DispatchStatus = !t1Match
      ? "briefing_ready"
      : directBuildReady
        ? "micro_build_ready"
        : "fact_find_ready";
    const recommendedRoute = isRoutableDispatchStatus(status)
      ? routeForDispatchStatus(status)
      : "lp-do-fact-find";

    const dispatchId = buildDispatchId(now, sequence++);
    const beforeShort = event.before_sha.slice(0, 7);
    const afterShort = event.after_sha.slice(0, 7);
    const currentTruth =
      event.current_truth_hint?.trim() && event.current_truth_hint.trim().length > 0
        ? event.current_truth_hint.trim()
        : `${event.artifact_id} changed (${beforeShort} → ${afterShort})`;
    const nextScopeNow =
      event.next_scope_now_hint?.trim() && event.next_scope_now_hint.trim().length > 0
        ? event.next_scope_now_hint.trim()
        : directBuildReady
          ? `Implement the bounded ${areaAnchor} change for ${event.business} and validate it locally`
          : `Investigate implications of ${areaAnchor} delta for ${event.business}`;
    const why =
      event.why_hint?.trim() && event.why_hint.trim().length > 0
        ? event.why_hint.trim()
        : directBuildReady
          ? `Implement the bounded ${areaAnchor} change signalled by ${event.artifact_id} for ${event.business}.`
          : `Assess ${areaAnchor} implications from ${event.artifact_id} delta for ${event.business}.`;
    const intendedOutcome =
      event.intended_outcome_hint ?? {
        type: "operational" as const,
        statement: directBuildReady
          ? `Ship a validated micro-build for ${areaAnchor} through direct lp-do-build intake.`
          : `Produce a validated routing outcome and scoped next action for ${areaAnchor}.`,
        source: "auto" as const,
      };

    const packet: TrialDispatchPacket = {
      schema_version: "dispatch.v2",
      dispatch_id: dispatchId,
      mode: "trial",
      business: event.business,
      trigger: "artifact_delta",
      artifact_id: event.artifact_id,
      before_sha: event.before_sha,
      after_sha: event.after_sha,
      root_event_id: rootEventId,
      anchor_key: anchorKey,
      cluster_key: clusterKey,
      cluster_fingerprint: clusterFingerprint,
      lineage_depth: lineageDepth,
      area_anchor: areaAnchor,
      location_anchors: locationAnchors,
      provisional_deliverable_family: provisionalDeliverableFamily,
      current_truth: currentTruth,
      next_scope_now: nextScopeNow,
      adjacent_later: [],
      recommended_route: recommendedRoute,
      status,
      priority: "P2",
      confidence: directBuildReady ? Math.max(t1Score, 0.85) : t1Score > 0 ? t1Score : 0.5,
      evidence_refs: evidenceRefs,
      created_at: now.toISOString(),
      queue_state: "enqueued",
      why,
      intended_outcome: intendedOutcome,
    };
    dispatched.push(packet);

    // Advisory-phase classification (Phase 1) — non-fatal; does not block dispatch
    try {
      const classificationInput: IdeaClassificationInput = {
        trigger: packet.trigger,
        artifact_id: "artifact_id" in packet ? (packet as { artifact_id?: string | null }).artifact_id : null,
        area_anchor: packet.area_anchor,
        evidence_refs: packet.evidence_refs,
      };
      classifications.push(classifyIdea(classificationInput));
    } catch (classifyErr) {
      process.stderr.write(
        `[lp-do-ideas-trial] Classification failed for ${packet.dispatch_id}: ${String(classifyErr)}\n`,
      );
    }

    cooldownState.set(clusterKey, {
      last_admitted_at: now.toISOString(),
      cluster_fingerprint: clusterFingerprint,
    });
  }

  const shadowTelemetry: ShadowTelemetrySnapshot = {
    phase,
    root_event_count: uniqueRootEventIds.size,
    candidate_count: candidateCount,
    admitted_count: dispatched.length,
    suppression_reason_counts: suppressionCounters,
  };

  if (behavior.emitShadowTelemetry) {
    pushWarning(
      `[lp-do-ideas-trial] ${phase} shadow telemetry active: root_event_count=${shadowTelemetry.root_event_count}, candidate_count=${shadowTelemetry.candidate_count}, admitted_count=${shadowTelemetry.admitted_count}.`,
    );
  }

  return {
    ok: true,
    dispatched,
    suppressed,
    noop,
    warnings,
    shadow_telemetry: shadowTelemetry,
    classifications,
  };
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

type CliOptions = {
  mode: string;
  phase: CutoverPhase;
  business: string;
  artifactId: string;
  beforeSha: string | null;
  afterSha: string;
  path: string;
  domain: ArtifactDomain | undefined;
  changedSections: string[];
};

function parseCliArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    mode: "trial",
    phase: "P0",
    business: "",
    artifactId: "",
    beforeSha: null,
    afterSha: "",
    path: "",
    domain: undefined,
    changedSections: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    switch (token) {
      case "--mode":
        options.mode = String(argv[index + 1] ?? "").trim();
        index += 1;
        continue;
      case "--phase": {
        const value = String(argv[index + 1] ?? "").trim().toUpperCase();
        if (value === "P0" || value === "P1" || value === "P2" || value === "P3") {
          options.phase = value;
        }
        index += 1;
        continue;
      }
      case "--business":
        options.business = String(argv[index + 1] ?? "").trim();
        index += 1;
        continue;
      case "--artifact-id":
        options.artifactId = String(argv[index + 1] ?? "").trim();
        index += 1;
        continue;
      case "--before":
        options.beforeSha = String(argv[index + 1] ?? "").trim() || null;
        index += 1;
        continue;
      case "--after":
        options.afterSha = String(argv[index + 1] ?? "").trim();
        index += 1;
        continue;
      case "--path":
        options.path = String(argv[index + 1] ?? "").trim();
        index += 1;
        continue;
      case "--domain": {
        const value = String(argv[index + 1] ?? "").trim().toUpperCase();
        if (value in DOMAIN_TO_AREA) {
          options.domain = value as ArtifactDomain;
        }
        index += 1;
        continue;
      }
      case "--changed-section": {
        const section = String(argv[index + 1] ?? "").trim();
        if (section.length > 0) {
          options.changedSections.push(section);
        }
        index += 1;
        continue;
      }
      default:
        break;
    }
  }

  return options;
}

function runCli(): void {
  const args = parseCliArgs(process.argv.slice(2));
  if (
    !args.business ||
    !args.artifactId ||
    !args.afterSha ||
    !args.path
  ) {
    console.error(
      "[lp-do-ideas-trial] Usage: pnpm --filter scripts startup-loop:lp-do-ideas-trial -- --mode trial [--phase P0|P1|P2|P3] --business <BIZ> --artifact-id <ID> --before <sha|null> --after <sha> --path <relative-path> [--domain <DOMAIN>] [--changed-section <heading> ...]",
    );
    process.exitCode = 2;
    return;
  }

  const result = runTrialOrchestrator({
    mode: args.mode,
    cutoverPhase: args.phase,
    events: [
      {
        artifact_id: args.artifactId,
        business: args.business,
        before_sha: args.beforeSha,
        after_sha: args.afterSha,
        path: args.path,
        domain: args.domain,
        changed_sections: args.changedSections,
      },
    ],
  });

  if (!result.ok) {
    console.error(result.error);
    process.exitCode = 1;
    return;
  }

  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1]?.includes("lp-do-ideas-trial")) {
  runCli();
}
