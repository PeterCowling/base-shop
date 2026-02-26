/**
 * lp-do-ideas classifier module.
 *
 * Defines the canonical TypeScript types for the idea prioritization policy
 * (v2, post-expert-review). Implements the advisory-phase (Phase 1) classifier
 * that produces a deterministic `IdeaClassification` record for every dispatched
 * idea without gating or blocking the existing dispatch pipeline.
 *
 * Policy: docs/business-os/startup-loop/2026-02-26-reflection-prioritization-expert-brief.user.md
 * Contract: docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md
 *
 * Design rules:
 * - Pure function: no file I/O. Injectable clock (`options.now: Date`) for `classified_at`.
 * - Classification failure is non-fatal — callers must handle thrown errors.
 * - `classifications.jsonl` persistence is the caller's responsibility
 *   (via `appendClassifications()` from lp-do-ideas-persistence.ts).
 * - All `IdeaClassificationInput` fields are optional: classifier produces P5 default with no input.
 * - Decision tree uses area_anchor regex matching for rules 4–7.
 * - Evidence-gated tiers auto-demote to P4 with RULE_INSUFFICIENT_EVIDENCE.
 *
 * Phase 1 advisory constraints:
 * - `effective_priority_rank` prerequisite inheritance is deferred to Phase 4.
 * - effort is always "M" (no effort estimation from packet fields yet).
 * - U0 leakage threshold gate is disabled by default (`u0_leakage_threshold`
 *   undefined). U0 admission relies only on `incident_id` or `deadline_date`.
 */

// ---------------------------------------------------------------------------
// Section 4.2 — Classification field types
// ---------------------------------------------------------------------------

/**
 * Priority tier — 8-tier classification (Section 4.2, Section 5).
 *
 * Ordered display: P0, P0R, P1, P1M, P2, P3, P4, P5.
 * Within P1 display groups: Direct, Near, Indirect.
 */
export type PriorityTier =
  | "P0"
  | "P0R"
  | "P1"
  | "P1M"
  | "P2"
  | "P3"
  | "P4"
  | "P5";

/**
 * P1 proximity sub-classification (Section 4.2, Section 6.2).
 *
 * Required when `priority_tier == "P1"`. Must be `null` for all other tiers.
 * - `Direct`: short causal chain to sales, with `funnel_step`+`metric_name`+`baseline_value`
 * - `Near`: measurable, one-step removed from direct conversion
 * - `Indirect`: causal link to sales but through multiple steps
 */
export type Proximity = "Direct" | "Near" | "Indirect" | null;

/**
 * Urgency level — evidence-gated admission (Section 4.2, Section 8).
 *
 * - `U0`: incident open/mitigated OR deadline ≤72h OR leakage > threshold
 * - `U1`: recurrence in 7 days OR deadline ≤14 days OR launch blocker linked
 * - `U2`: default (no urgency evidence)
 * - `U3`: speculative
 */
export type Urgency = "U0" | "U1" | "U2" | "U3";

/**
 * Effort estimate (Section 4.2).
 *
 * - `XS`: extra small (< 1 hour)
 * - `S`: small (few hours)
 * - `M`: medium (1–3 days)
 * - `L`: large (1–2 weeks)
 * - `XL`: extra large (> 2 weeks)
 */
export type Effort = "XS" | "S" | "M" | "L" | "XL";

/**
 * Deterministic reason codes for classification decisions (Section 4.2, Section 9).
 *
 * Each code maps to exactly one decision tree rule or auto-demotion path.
 * `RULE_INSUFFICIENT_EVIDENCE` is set on auto-demotion paths (Section 9.2).
 */
export type ReasonCode =
  | "RULE_LEGAL_EXPOSURE" // P0: legal/safety/security/privacy/compliance
  | "RULE_REVENUE_PATH_BROKEN" // P0R: revenue-path/fulfillment broken or data loss
  | "RULE_P1_DIRECT_CAUSAL" // P1+Direct: explicit short causal chain with funnel evidence
  | "RULE_P1_NEAR_CAUSAL" // P1+Near: measurable, one step removed from direct
  | "RULE_P1_INDIRECT_CAUSAL" // P1+Indirect: causal link through multiple steps
  | "RULE_P1M_MARGIN_LEAKAGE" // P1M: per-transaction margin leakage/loss reduction
  | "RULE_P2_OPERATOR_EXCEPTION" // P2: operator intervention/exception volume reduction
  | "RULE_P3_MEASUREMENT" // P3: measurement correctness/attribution/experiment hygiene
  | "RULE_P4_PROCESS_QUALITY" // P4: startup-loop process/throughput/determinism quality
  | "RULE_P5_DEFAULT" // P5: default — no higher-tier rule matched
  | "RULE_INSUFFICIENT_EVIDENCE"; // Auto-demotion: required evidence missing (Section 9.2)

// ---------------------------------------------------------------------------
// Section 6.2 — Own priority rank mapping (1–10)
// ---------------------------------------------------------------------------

/**
 * Own priority rank values (Section 6.2).
 *
 * Used as `own_priority_rank` and (in Phase 1) as `effective_priority_rank`.
 * Lower integer = higher priority in queue ordering.
 *
 * 1: P0
 * 2: P0R
 * 3: P1 + Direct
 * 4: P1M
 * 5: P1 + Near
 * 6: P1 + Indirect
 * 7: P2
 * 8: P3
 * 9: P4
 * 10: P5
 */
export type OwnPriorityRank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/**
 * Mapping from (priority_tier, proximity) to `own_priority_rank` integer.
 *
 * Keyed by `"<tier>"` or `"<tier>:<proximity>"` for P1 sub-tiers.
 * Also includes underscore-style aliases (P1_Direct, P1_Near, P1_Indirect)
 * as required by the canonical spec (Section 6.2).
 */
export const OWN_PRIORITY_RANK: Record<string, OwnPriorityRank> = {
  P0: 1,
  P0R: 2,
  "P1:Direct": 3,
  P1_Direct: 3,
  P1M: 4,
  "P1:Near": 5,
  P1_Near: 5,
  "P1:Indirect": 6,
  P1_Indirect: 6,
  P2: 7,
  P3: 8,
  P4: 9,
  P5: 10,
} as const;

// ---------------------------------------------------------------------------
// Section 4.4 — Evidence/governance fields
// ---------------------------------------------------------------------------

/**
 * Risk vectors that qualify for P0 classification (Section 4.4, Section 9.1).
 */
export type RiskVector =
  | "legal"
  | "safety"
  | "security"
  | "privacy"
  | "compliance";

/**
 * Funnel steps for P1+Direct evidence admission (Section 4.4, Section 9.1).
 */
export type FunnelStep =
  | "pricing_view"
  | "checkout_start"
  | "payment"
  | "confirmation";

/**
 * Status lifecycle for a classification record (Section 4.4).
 */
export type ClassificationStatus =
  | "open"
  | "queued"
  | "in_progress"
  | "actioned"
  | "deferred"
  | "rejected";

/**
 * Alias for ClassificationStatus — canonical export name per task spec.
 */
export type IdeaStatus = ClassificationStatus;

// ---------------------------------------------------------------------------
// Classifier input type
// ---------------------------------------------------------------------------

/**
 * Input to the classifier function (Section 4.1 identity/source + Section 4.4 evidence fields).
 *
 * All fields are optional — the classifier produces a P5 default when no input is supplied.
 * Absent evidence may trigger auto-demotion (Section 9.2) for high-impact tiers
 * (P0, P0R, P1+Direct) but does not block intake or dispatch in Phase 1 advisory mode.
 *
 * `trigger` and `artifact_id` are passed from the originating dispatch packet.
 * For `operator_idea` trigger dispatches, `artifact_id` is `null`.
 */
export interface IdeaClassificationInput {
  // Identity / source (Section 4.1)
  /** Stable string ID for this idea. */
  idea_id?: string;
  /** Human-readable idea title. */
  title?: string;
  /** Path to the artifact where this idea was found. */
  source_path?: string;
  /** Brief excerpt from the source artifact. */
  source_excerpt?: string;
  /** ISO-8601: when this idea was first created. */
  created_at?: string;

  // Dispatch context
  /** Trigger type from the originating dispatch packet. */
  trigger?: "artifact_delta" | "operator_idea";
  /** Artifact ID from the dispatch packet; null for operator_idea trigger. */
  artifact_id?: string | null;
  /** Evidence references from the dispatch packet. */
  evidence_refs?: string[];
  /** Natural language description of the idea area (used for regex-based rule matching). */
  area_anchor?: string;

  // Classification content signals
  /** Tags from the idea content (supplementary signals for P1 Near/Indirect). */
  content_tags?: string[];

  // Evidence fields (Section 4.4) — all nullable/optional
  /** Open or mitigated incident ID (admission gate for P0R and U0). */
  incident_id?: string | null;
  /** ISO date: deadline for resolution or action (admission gate for U0/U1). */
  deadline_date?: string | null;
  /** Reproduction reference: logs, test steps, or trace (P0R evidence). */
  repro_ref?: string | null;
  /** Numeric estimate of leakage value (U0 threshold gate). */
  leakage_estimate_value?: number | null;
  /** Unit for leakage estimate, e.g. "USD/day", "failures/day". */
  leakage_estimate_unit?: string | null;
  /** ISO datetime: when this issue was first observed (recurrence gate for U1). */
  first_observed_at?: string | null;
  /** Risk classification vector (admission gate for P0). */
  risk_vector?: RiskVector | string | null;
  /** Reference supporting the risk claim (required for P0 — see Section 9.1). */
  risk_ref?: string | null;
  /** Metric that is failing (admission gate for P0R). */
  failure_metric?: string | null;
  /** Baseline value before the issue (admission gate for P0R and P1+Direct). */
  baseline_value?: number | null;
  /** Conversion funnel step affected (admission gate for P1+Direct). */
  funnel_step?: FunnelStep | string | null;
  /** Metric name for the funnel impact (admission gate for P1+Direct). */
  metric_name?: string | null;

  // Prerequisite fields (Section 4.3)
  /**
   * Parent idea ID, for prerequisite ordering (Section 4.3).
   * Always null in Phase 1 advisory mode.
   */
  parent_idea_id?: string | null;
  /**
   * Whether this idea is a prerequisite for another (Section 4.3).
   * Always false in Phase 1 advisory mode.
   */
  is_prerequisite?: boolean;
}

// ---------------------------------------------------------------------------
// Classifier output type
// ---------------------------------------------------------------------------

/**
 * A complete canonical classification record (Sections 4.1–4.4).
 *
 * Produced by `classifyIdea()` and persisted to
 * `docs/business-os/startup-loop/ideas/trial/classifications.jsonl`
 * via `appendClassifications()` in lp-do-ideas-persistence.ts.
 *
 * Deduplication key: `idea_id + classified_at`.
 */
export interface IdeaClassification {
  // Section 4.1 — Identity / source (optional — carried through from input; absent when input fields absent)
  idea_id?: string;
  title?: string;
  source_path?: string;
  source_excerpt?: string;
  created_at?: string;

  // Section 4.2 — Classification fields
  /** 8-tier priority (Section 4.2, Section 5 decision tree). */
  priority_tier: PriorityTier;
  /**
   * Proximity sub-classification (Section 4.2).
   * Required when `priority_tier == "P1"`. Null for all other tiers.
   */
  proximity: Proximity;
  /** Evidence-gated urgency level (Section 4.2, Section 8). */
  urgency: Urgency;
  /** Effort estimate (Section 4.2). */
  effort: Effort;
  /** Deterministic rule code for this classification (Section 4.2, Section 9). */
  reason_code: ReasonCode;

  // Section 4.3 — Prerequisite fields
  /**
   * Parent idea ID for prerequisite ordering (Section 4.3).
   * Always null in Phase 1 (prerequisite inheritance deferred to Phase 4).
   */
  parent_idea_id: string | null;
  /**
   * Whether this idea is a prerequisite for another (Section 4.3).
   * Always false in Phase 1 (deferred to Phase 4).
   */
  is_prerequisite: boolean;
  /**
   * Computed rank for queue ordering (Section 4.3, Section 6.2).
   *
   * Phase 1: always equals `own_priority_rank`.
   * Phase 4: equals parent's `effective_priority_rank` when `is_prerequisite == true`.
   * See: Phase 4 prerequisite inheritance — deferred.
   */
  effective_priority_rank: OwnPriorityRank;
  /**
   * Base rank from this idea's own priority tier and proximity (Section 6.2).
   *
   * 1=P0, 2=P0R, 3=P1+Direct, 4=P1M, 5=P1+Near, 6=P1+Indirect,
   * 7=P2, 8=P3, 9=P4, 10=P5.
   */
  own_priority_rank: OwnPriorityRank;

  // Section 4.4 — Evidence/governance fields (carried through from input)
  /** Open or mitigated incident ID (null if absent). */
  incident_id: string | null;
  /** ISO date: deadline (null if absent). */
  deadline_date: string | null;
  /** Reproduction reference (null if absent). */
  repro_ref: string | null;
  /** Numeric leakage estimate (null if absent). */
  leakage_estimate_value: number | null;
  /** Leakage estimate unit (null if absent). */
  leakage_estimate_unit: string | null;
  /** ISO datetime: first observed (null if absent). */
  first_observed_at: string | null;
  /** Risk vector (null if absent). */
  risk_vector: RiskVector | string | null;
  /** Risk reference (null if absent). */
  risk_ref: string | null;
  /** Failing metric (null if absent). */
  failure_metric: string | null;
  /** Baseline value (null if absent). */
  baseline_value: number | null;
  /** Funnel step (null if absent). */
  funnel_step: FunnelStep | string | null;
  /** Metric name (null if absent). */
  metric_name: string | null;

  // Section 4.4 — Anti-gaming controls (always set)
  /**
   * Identifier for the classifier version that produced this record (Section 4.4, Section 11).
   * Always `"lp-do-ideas-classifier-v1"` for Phase 1.
   */
  classified_by: string;
  /**
   * ISO-8601 timestamp when classification was computed (Section 4.4, Section 11).
   * Sourced from injectable clock in `ClassifierOptions.now`.
   */
  classified_at: string;
  /**
   * Lifecycle status of this classification (Section 4.4).
   * Always `"open"` at classification time.
   */
  status: ClassificationStatus;

  // Auto-demotion (Section 9.2)
  /**
   * True when the decision tree fired a higher-tier rule but required evidence was absent,
   * causing automatic demotion to a lower tier (Section 9.2).
   */
  auto_demoted: boolean;
  /**
   * Human-readable explanation of the auto-demotion (Section 9.2).
   * Present only when `auto_demoted == true`.
   */
  auto_demotion_reason?: string;

  // Dispatch context (carried through)
  trigger?: "artifact_delta" | "operator_idea";
  artifact_id?: string | null;
  evidence_refs?: string[];
}

// ---------------------------------------------------------------------------
// Classifier options
// ---------------------------------------------------------------------------

/**
 * Options for `classifyIdea()` — all injectable for testing and Phase 1
 * advisory configuration.
 */
export interface ClassifierOptions {
  /**
   * Injectable clock for `classified_at` and deadline comparisons.
   * Pass a `Date` instance for deterministic tests.
   * Defaults to `new Date()` at call time.
   */
  now?: Date;
  /**
   * U0 leakage threshold (Section 8.1, gate 3).
   *
   * If `undefined` (default for Phase 1), the leakage gate is disabled.
   * U0 admission relies only on `incident_id` or `deadline_date` until
   * the operator defines a threshold.
   */
  u0_leakage_threshold?: number;
  /**
   * Classifier version identifier.
   * Defaults to `"lp-do-ideas-classifier-v1"`.
   */
  classifier_version?: string;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * Resolve `risk_vector` to a valid `RiskVector` enum value, or null if absent
 * or not in the allowed set (treat unknown values as absent — auto-demotion).
 */
function resolveRiskVector(value: unknown): RiskVector | null {
  const allowed: RiskVector[] = [
    "legal",
    "safety",
    "security",
    "privacy",
    "compliance",
  ];
  if (typeof value === "string" && (allowed as string[]).includes(value)) {
    return value as RiskVector;
  }
  return null;
}

/**
 * Resolve `funnel_step` to a valid `FunnelStep` value, or null if absent/unknown.
 */
function resolveFunnelStep(value: unknown): FunnelStep | null {
  const allowed: FunnelStep[] = [
    "pricing_view",
    "checkout_start",
    "payment",
    "confirmation",
  ];
  if (typeof value === "string" && (allowed as string[]).includes(value)) {
    return value as FunnelStep;
  }
  return null;
}

/**
 * Parse a nullable ISO date string as a Date, returning null on failure.
 * Used for deadline_date and first_observed_at comparisons.
 */
function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const ms = Date.parse(value);
  if (isNaN(ms)) return null;
  return new Date(ms);
}

/**
 * Compute the own_priority_rank from tier and proximity.
 *
 * Throws if tier is P1 and proximity is null (internal invariant error —
 * indicates a decision tree bug, never expected in production).
 */
function computeOwnPriorityRank(
  tier: PriorityTier,
  proximity: Proximity,
): OwnPriorityRank {
  if (tier === "P1") {
    if (!proximity) {
      throw new Error(
        `[lp-do-ideas-classifier] Internal invariant violation: P1 tier produced without proximity. ` +
          `Every P1 classification must include a proximity value (Direct/Near/Indirect).`,
      );
    }
    const key = `P1:${proximity}`;
    const rank = OWN_PRIORITY_RANK[key];
    if (rank === undefined) {
      throw new Error(
        `[lp-do-ideas-classifier] Unknown P1 proximity key: "${key}".`,
      );
    }
    return rank;
  }
  const rank = OWN_PRIORITY_RANK[tier];
  if (rank === undefined) {
    throw new Error(
      `[lp-do-ideas-classifier] Unknown priority tier: "${tier}".`,
    );
  }
  return rank;
}

/**
 * Returns true when no evidence is present at all (speculative items → U3).
 */
function hasAnyEvidence(input: IdeaClassificationInput): boolean {
  if ((input.evidence_refs ?? []).length > 0) return true;
  return (
    input.incident_id != null ||
    input.deadline_date != null ||
    input.repro_ref != null ||
    input.leakage_estimate_value != null ||
    input.leakage_estimate_unit != null ||
    input.first_observed_at != null ||
    input.risk_vector != null ||
    input.risk_ref != null ||
    input.failure_metric != null ||
    input.baseline_value != null ||
    input.funnel_step != null ||
    input.metric_name != null
  );
}

/**
 * Determine urgency level from evidence fields (Section 8).
 *
 * @param input - Evidence fields from the classification input.
 * @param now - Current timestamp for deadline comparisons.
 * @param u0_leakage_threshold - Optional leakage threshold (Section 8.1 gate 3).
 *   If `undefined`, the leakage gate is disabled.
 */
function admitUrgency(
  input: IdeaClassificationInput,
  now: Date,
  u0_leakage_threshold: number | undefined,
): Urgency {
  const deadline = parseDate(input.deadline_date);
  const MS_72H = 72 * 60 * 60 * 1000;
  const MS_14D = 14 * 24 * 60 * 60 * 1000;
  const MS_7D = 7 * 24 * 60 * 60 * 1000;

  // U0 gates (Section 8.1)
  // Gate 1: incident_id present
  if (input.incident_id != null && input.incident_id !== "") {
    return "U0";
  }
  // Gate 2: deadline within 72 hours (from now, inclusive of same-day)
  if (deadline !== null && deadline.getTime() - now.getTime() <= MS_72H) {
    return "U0";
  }
  // Gate 3: leakage >= threshold (disabled by default in Phase 1)
  if (
    u0_leakage_threshold !== undefined &&
    input.leakage_estimate_value != null &&
    input.leakage_estimate_value >= u0_leakage_threshold
  ) {
    return "U0";
  }

  // U1 gates (Section 8.2)
  // Gate 1: recurrence in last 7 days (first_observed_at within 7 days of now)
  const firstObserved = parseDate(input.first_observed_at);
  if (
    firstObserved !== null &&
    now.getTime() - firstObserved.getTime() <= MS_7D
  ) {
    return "U1";
  }
  // Gate 2: deadline within 14 days
  if (deadline !== null && deadline.getTime() - now.getTime() <= MS_14D) {
    return "U1";
  }

  // U3: speculative — no evidence at all (empty evidence_refs AND all evidence fields null)
  if (!hasAnyEvidence(input)) {
    return "U3";
  }

  // Default urgency (Section 8.3): evidence present but no urgency gates fired
  return "U2";
}

/**
 * Classify an idea according to the canonical prioritization policy (v2).
 *
 * Pure function — no file I/O. Callers are responsible for persisting the
 * returned `IdeaClassification` via `appendClassifications()`.
 *
 * Phase 1 advisory: classification failure is non-fatal to the dispatch
 * pipeline. Callers should catch errors, log to stderr, and continue.
 *
 * Decision tree uses area_anchor regex matching (rules 4–7). content_tags
 * can supplement for P1 Near/Indirect sub-tiers not covered by evidence gates.
 *
 * @param input - Idea identity, source, dispatch context, and evidence fields. All optional.
 * @param options - Injectable clock (Date) and configuration for Phase 1.
 * @returns A complete `IdeaClassification` record.
 */
export function classifyIdea(
  input: IdeaClassificationInput = {},
  options: ClassifierOptions = {},
): IdeaClassification {
  const {
    now: nowOption,
    u0_leakage_threshold,
    classifier_version = "lp-do-ideas-classifier-v1",
  } = options;

  const nowDate = nowOption ?? new Date();

  // Normalize evidence fields — coerce absent/undefined to null
  const risk_vector = resolveRiskVector(input.risk_vector);
  const risk_ref = input.risk_ref ?? null;
  const incident_id = input.incident_id ?? null;
  const failure_metric = input.failure_metric ?? null;
  const baseline_value = input.baseline_value ?? null;
  const funnel_step_resolved = resolveFunnelStep(input.funnel_step);
  const metric_name = input.metric_name ?? null;
  const deadline_date = input.deadline_date ?? null;
  const repro_ref = input.repro_ref ?? null;
  const leakage_estimate_value = input.leakage_estimate_value ?? null;
  const leakage_estimate_unit = input.leakage_estimate_unit ?? null;
  const first_observed_at = input.first_observed_at ?? null;
  const areaAnchor = input.area_anchor ?? "";
  const evidenceRefs = input.evidence_refs ?? [];

  // Area-anchor regex patterns (Section 5, rules 4–7)
  const MARGIN_LEAKAGE_RE = /margin|leakage|per-transaction|cost.?reduction/i;
  const OPERATOR_EXCEPTION_RE =
    /\boperator\b.*(exception|intervention|manual)|exception.*volume|manual.*intervention/i;
  const MEASUREMENT_RE = /measurement|attribution|experiment|tracking|analytics/i;
  const PROCESS_QUALITY_RE =
    /process|throughput|determinism|startup.?loop|pipeline|queue|classifier|prioriti/i;

  // --- Decision tree (Section 5) — first match wins ---

  let priority_tier: PriorityTier;
  let proximity: Proximity = null;
  let reason_code: ReasonCode;
  let auto_demoted = false;
  let auto_demotion_reason: string | undefined;

  // Rule 1: P0 — legal/safety/security/privacy/compliance exposure
  if (risk_vector !== null) {
    // Evidence gate (Section 9.1): P0 requires risk_vector + risk_ref
    if (risk_ref !== null && risk_ref !== "") {
      priority_tier = "P0";
      reason_code = "RULE_LEGAL_EXPOSURE";
    } else {
      // Auto-demotion: missing risk_ref → P4 (Section 9.2)
      priority_tier = "P4";
      reason_code = "RULE_INSUFFICIENT_EVIDENCE";
      auto_demoted = true;
      auto_demotion_reason =
        "P0 (RULE_LEGAL_EXPOSURE) requires risk_ref; auto-demoted to P4 (RULE_INSUFFICIENT_EVIDENCE)";
    }
  }
  // Rule 2: P0R — revenue-path or fulfillment broken, or data loss
  else if (
    (incident_id !== null && incident_id !== "") ||
    (failure_metric !== null && baseline_value !== null)
  ) {
    priority_tier = "P0R";
    reason_code = "RULE_REVENUE_PATH_BROKEN";
  }
  // Rule 3: P1+Direct — short causal chain with funnel evidence
  // Evidence gate (Section 9.1): P1+Direct requires funnel_step + metric_name + baseline_value
  else if (
    funnel_step_resolved !== null &&
    metric_name !== null &&
    baseline_value !== null
  ) {
    priority_tier = "P1";
    proximity = "Direct";
    reason_code = "RULE_P1_DIRECT_CAUSAL";
  }
  // P1 Near/Indirect — supplementary content_tag signals (no spec regex for these)
  else if (
    input.content_tags?.includes("p1_near") ||
    areaAnchor.toLowerCase().includes("conversion")
  ) {
    priority_tier = "P1";
    proximity = "Near";
    reason_code = "RULE_P1_NEAR_CAUSAL";
  } else if (input.content_tags?.includes("p1_indirect")) {
    priority_tier = "P1";
    proximity = "Indirect";
    reason_code = "RULE_P1_INDIRECT_CAUSAL";
  }
  // Rule 4: P1M — per-transaction margin leakage/loss reduction (area_anchor regex or evidence_refs)
  else if (
    MARGIN_LEAKAGE_RE.test(areaAnchor) ||
    evidenceRefs.some((ref) => MARGIN_LEAKAGE_RE.test(ref))
  ) {
    priority_tier = "P1M";
    reason_code = "RULE_P1M_MARGIN_LEAKAGE";
  }
  // Rule 5: P2 — operator intervention/exception volume reduction (area_anchor regex)
  else if (OPERATOR_EXCEPTION_RE.test(areaAnchor)) {
    priority_tier = "P2";
    reason_code = "RULE_P2_OPERATOR_EXCEPTION";
  }
  // Rule 6: P3 — measurement correctness/attribution/experiment hygiene (area_anchor regex)
  else if (MEASUREMENT_RE.test(areaAnchor)) {
    priority_tier = "P3";
    reason_code = "RULE_P3_MEASUREMENT";
  }
  // Rule 7: P4 — startup-loop process/throughput/determinism quality (area_anchor regex)
  else if (PROCESS_QUALITY_RE.test(areaAnchor)) {
    priority_tier = "P4";
    reason_code = "RULE_P4_PROCESS_QUALITY";
  }
  // Rule 8: P5 — default
  else {
    priority_tier = "P5";
    reason_code = "RULE_P5_DEFAULT";
  }

  // P1 proximity invariant (Section 4.2): P1 must always have proximity
  if (priority_tier === "P1" && proximity === null) {
    throw new Error(
      "Invariant violation: P1 tier requires proximity — decision tree bug detected",
    );
  }

  // Urgency admission (Section 8)
  const urgency = admitUrgency(input, nowDate, u0_leakage_threshold);

  // Effort — Phase 1: always "M" (no effort estimation from packet fields yet)
  const effort: Effort = "M";

  // Own priority rank (Section 6.2)
  const own_priority_rank = computeOwnPriorityRank(priority_tier, proximity);

  // Phase 1: effective_priority_rank = own_priority_rank
  // Phase 4: prerequisite inheritance — when is_prerequisite=true, inherit parent_idea_id's effective_priority_rank
  const effective_priority_rank: OwnPriorityRank = own_priority_rank;

  const result: IdeaClassification = {
    // Section 4.1 — Identity / source (optional fields carried through)
    ...(input.idea_id !== undefined ? { idea_id: input.idea_id } : {}),
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.source_path !== undefined ? { source_path: input.source_path } : {}),
    ...(input.source_excerpt !== undefined ? { source_excerpt: input.source_excerpt } : {}),
    ...(input.created_at !== undefined ? { created_at: input.created_at } : {}),

    // Section 4.2 — Classification fields
    priority_tier,
    proximity,
    urgency,
    effort,
    reason_code,

    // Section 4.3 — Prerequisite fields (Phase 1 advisory defaults)
    parent_idea_id: input.parent_idea_id ?? null,
    is_prerequisite: input.is_prerequisite ?? false,
    effective_priority_rank,
    own_priority_rank,

    // Section 4.4 — Evidence/governance fields (normalized)
    incident_id,
    deadline_date,
    repro_ref,
    leakage_estimate_value,
    leakage_estimate_unit,
    first_observed_at,
    risk_vector,
    risk_ref,
    failure_metric,
    baseline_value,
    funnel_step: funnel_step_resolved,
    metric_name,

    // Section 4.4 — Anti-gaming controls (always set)
    classified_by: classifier_version,
    classified_at: nowDate.toISOString(),
    status: "open",

    // Auto-demotion
    auto_demoted,
    ...(auto_demotion_reason !== undefined ? { auto_demotion_reason } : {}),

    // Dispatch context (optional, carried through)
    ...(input.trigger !== undefined ? { trigger: input.trigger } : {}),
    ...(input.artifact_id !== undefined ? { artifact_id: input.artifact_id } : {}),
    ...(input.evidence_refs !== undefined ? { evidence_refs: input.evidence_refs } : {}),
  };

  return result;
}
