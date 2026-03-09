import { createHash } from "node:crypto";

export type DataQualityStatus = "ok" | "degraded" | "unknown";
export type ActorType = "operator" | "agent" | "automation";
export type ObservationEvidenceGrade = "exploratory" | "structural" | "measured";
export type MeasurementContractStatus = "none" | "declared" | "verified";
export type CandidateType =
  | "new_skill"
  | "skill_refactor"
  | "deterministic_extraction"
  | "container_update";
export type CandidateState =
  | "draft"
  | "validated"
  | "blocked"
  | "canary"
  | "promoted"
  | "monitored"
  | "kept"
  | "reverted"
  | "rejected"
  | "expired";
export type CandidateScope = "business_only" | "template" | "global_system";
export type ObservationType =
  | "execution_event"
  | "validation_failure"
  | "operator_intervention"
  | "routing_override"
  | "metric_regression"
  | "metric_plateau"
  | "funnel_dropoff_detected"
  | "experiment_result_observed"
  | "customer_feedback_theme_recurring";
export type KpiUnit = "ratio" | "count" | "currency" | "seconds" | "score";
export type KpiAggregation = "mean" | "median" | "sum" | "rate";
export type StartupStage = "prelaunch" | "launched" | "traction";
export type BoundarySignalSource = "measured" | "inferred" | "unknown";
export type ExecutorDomainHint =
  | "website"
  | "offer"
  | "distribution"
  | "activation"
  | "feedback"
  | "experiment"
  | "analytics";
export type ContainerMaturity = "M0" | "M1" | "M2" | "M3";
export type ContainerStepType =
  | "skill_call"
  | "tool_call"
  | "actuator_call"
  | "validator"
  | "human_approval";
export type EffectClass =
  | "read_only"
  | "write_staging"
  | "write_prod"
  | "external_side_effect";
export type EffectReversibility =
  | "reversible"
  | "compensatable"
  | "irreversible";
export type PolicyAuthorityLevel = "shadow" | "advisory" | "guarded_trial";
export type MaturityBucket = "immediate" | "short" | "medium" | "long" | "unknown";
export type PolicyDecisionType =
  | "candidate_route"
  | "portfolio_selection"
  | "exploration_rank"
  | "promotion_gate"
  | "override_record";
export type PolicyDecisionMode = "deterministic" | "stochastic";

export interface ObservationSignalHints {
  recurrence_key?: string | null;
  problem_statement?: string | null;
  candidate_type_hint?: CandidateType | null;
  executor_domain_hint?: ExecutorDomainHint | null;
  executor_path_hint?: string | null;
}

export interface MetaObservation {
  schema_version: string;
  observation_id: string;
  observation_type: ObservationType;
  timestamp: string;
  business: string;
  actor_type: ActorType;
  run_id: string;
  session_id: string;
  skill_id: string | null;
  container_id: string | null;
  artifact_refs: string[];
  context_path: string;
  hard_signature: string;
  soft_cluster_id: string | null;
  fingerprint_version: string;
  repeat_count_window: number;
  operator_minutes_estimate: number;
  quality_impact_estimate: number;
  detector_confidence: number;
  severity: number;
  inputs_hash: string;
  outputs_hash: string;
  toolchain_version: string;
  model_version: string | null;
  kpi_name: string | null;
  kpi_value: number | null;
  kpi_unit: KpiUnit | null;
  aggregation_method: KpiAggregation | null;
  sample_size: number | null;
  data_quality_status: DataQualityStatus | null;
  data_quality_reason_code: string | null;
  baseline_ref: string | null;
  measurement_window: string | null;
  traffic_segment: string | null;
  evidence_refs: string[];
  evidence_grade?: ObservationEvidenceGrade | null;
  measurement_contract_status?: MeasurementContractStatus | null;
  signal_hints?: ObservationSignalHints | null;
}

export interface ImprovementCandidate {
  schema_version: string;
  candidate_id: string;
  candidate_type: CandidateType;
  candidate_state: CandidateState;
  problem_statement: string;
  trigger_observations: string[];
  executor_path: string;
  change_scope: CandidateScope;
  applicability_predicates: string[];
  expected_benefit: string;
  risk_level: "low" | "medium" | "high";
  blast_radius_tag: "small" | "medium" | "large";
  autonomy_level_required: 1 | 2 | 3 | 4;
  estimated_effort: "S" | "M" | "L";
  recommended_action: string;
  owners: string[];
  approvers: string[];
  test_plan: string;
  validation_contract: string;
  rollout_plan: string;
  rollback_contract: string;
  kill_switch: string;
  blocked_reason_code: string | null;
  unblock_requirements: string[];
  blocked_since: string | null;
  expiry_at: string;
}

export interface ImprovementOutcome {
  schema_version: string;
  candidate_id: string;
  dispatch_id?: string | null;
  decision_id?: string | null;
  policy_version?: string | null;
  implementation_status: "success" | "failed" | "reverted";
  promoted_at: string | null;
  maturity_status?: "pending" | "matured";
  measurement_status?:
    | "pending"
    | "verified"
    | "verified_degraded"
    | "missing"
    | "insufficient_sample";
  baseline_window: string;
  post_window: string;
  measured_impact: number;
  impact_confidence: number;
  regressions_detected: number;
  rollback_executed_at: string | null;
  kept_or_reverted: "kept" | "reverted" | "not_kept";
  measurement_observation_ids?: string[];
  outcome_source_path?: string | null;
  root_cause_notes: string;
  follow_up_actions: string[];
}

export interface ConstraintProfile {
  schema_version: "constraint-profile.v1";
  wip_cap: number;
  max_candidates_per_route: Partial<
    Record<"lp-do-fact-find" | "lp-do-plan" | "lp-do-build", number>
  >;
  max_guarded_trial_blast_radius: "small" | "medium" | "large";
  minimum_evidence_floor: "instrumented" | "measured";
  hold_window_days: number;
}

export interface MaturityWindowProfile {
  schema_version: "maturity-window-profile.v1";
  immediate_days: number;
  short_days: number;
  medium_days: number;
  long_days: number;
}

export interface StructuralFeatureSnapshot {
  snapshot_id: string;
  candidate_id: string;
  business_id: string;
  captured_at: string;
  startup_stage: StartupStage;
  candidate_type: CandidateType;
  recommended_route_hint: "lp-do-fact-find" | "lp-do-plan" | "lp-do-build";
  recurrence_count_window: number;
  operator_minutes_estimate: number;
  quality_impact_estimate: number;
  evidence_grade: ObservationEvidenceGrade | null;
  evidence_classification: "measured" | "instrumented" | "structural_only" | "insufficient";
  blast_radius_tag: ImprovementCandidate["blast_radius_tag"];
  risk_level: ImprovementCandidate["risk_level"];
  estimated_effort: ImprovementCandidate["estimated_effort"];
  constraint_refs: string[];
}

export interface BetaPosterior {
  family: "beta_binomial";
  prior_alpha: number;
  prior_beta: number;
  alpha: number;
  beta: number;
  successes: number;
  failures: number;
  updated_through_event_id: string | null;
}

export interface BucketPosterior {
  family: "dirichlet_categorical";
  buckets: [MaturityBucket, MaturityBucket, MaturityBucket, MaturityBucket, MaturityBucket];
  prior_alpha: [number, number, number, number, number];
  alpha: [number, number, number, number, number];
  counts: [number, number, number, number, number];
  updated_through_event_id: string | null;
}

export interface CandidateBeliefState {
  schema_version: "candidate-belief.v1";
  candidate_id: string;
  structural_snapshot_id: string;
  success_if_attempted: BetaPosterior;
  positive_impact_if_attempted: BetaPosterior;
  guardrail_breach_if_attempted: BetaPosterior;
  time_to_effect: BucketPosterior;
  evidence_weight: number;
  evidence_floor_met: boolean;
  last_verified_outcome_at: string | null;
  last_outcome_event_id: string | null;
  last_decision_id: string | null;
  last_override_id: string | null;
  updated_at: string;
}

export interface UtilityBreakdown {
  expected_reward: number;
  downside_penalty: number;
  effort_penalty: number;
  evidence_penalty: number;
  instability_penalty: number;
  exploration_bonus: number;
  net_utility: number;
}

export interface PortfolioConstraintBinding {
  key: string;
  min?: number;
  max?: number;
  equal?: number;
  observed_value: number;
  binding: boolean;
}

export interface PortfolioSelectionSignalSnapshot {
  graph_bottleneck_score: number;
  shared_executor_candidate_count: number;
  shared_constraint_candidate_count: number;
  structural_penalty: number;
  survival_status: "empty" | "insufficient_data" | "estimated";
  median_verified_days: number | null;
  unresolved_after_hold_probability: number | null;
  missing_outcome_rate: number | null;
  survival_penalty: number;
  adjusted_utility: number;
}

export interface PortfolioSelectionContext {
  schema_version: "portfolio-selection.v1";
  portfolio_id: string;
  candidate_set_hash: string;
  candidate_count: number;
  selected_candidate_ids: string[];
  solver_status: string;
  objective_value: number | null;
  constraint_bindings: PortfolioConstraintBinding[];
  graph_snapshot_id: string | null;
  survival_snapshot_id: string | null;
  signal_snapshot: PortfolioSelectionSignalSnapshot;
}

export interface PolicyDecisionRecord {
  schema_version: "policy-decision.v1";
  decision_id: string;
  business_id: string;
  candidate_id: string;
  decision_type: PolicyDecisionType;
  decision_mode: PolicyDecisionMode;
  policy_version: string;
  utility_version: string;
  prior_family_version: string;
  decision_context_id: string;
  structural_snapshot: StructuralFeatureSnapshot;
  belief_state_id: string;
  eligible_actions: string[];
  chosen_action: string;
  action_probability: number | null;
  utility: UtilityBreakdown;
  portfolio_selection?: PortfolioSelectionContext | null;
  created_at: string;
}

export interface SelfEvolvingPolicyState {
  schema_version: "policy-state.v1";
  business_id: string;
  policy_state_id: string;
  policy_version: string;
  utility_version: string;
  prior_family_version: string;
  authority_level: PolicyAuthorityLevel;
  active_constraint_profile: ConstraintProfile;
  maturity_windows: MaturityWindowProfile;
  candidate_beliefs: Record<string, CandidateBeliefState>;
  last_decision_id: string | null;
  updated_at: string;
  updated_by: string;
}

export type LifecycleReviewDecision = "approved" | "rejected" | "deferred";

export interface LifecycleReviewRecord {
  decision: LifecycleReviewDecision;
  rationale: string;
  reviewer_type: ActorType;
  reviewer_id: string | null;
  reviewed_at: string;
}

export interface OutcomeMissingRecord {
  reason_code: string;
  detail: string | null;
  expected_artifact_ref: string | null;
}

export interface SelfEvolvingLifecyclePayload {
  candidate_id: string;
  dispatch_id?: string | null;
  plan_slug?: string | null;
  review?: LifecycleReviewRecord | null;
  outcome?: ImprovementOutcome | null;
  outcome_missing?: OutcomeMissingRecord | null;
}

export interface StartupState {
  schema_version: string;
  startup_state_id: string;
  business_id: string;
  stage: StartupStage;
  current_website_generation: number;
  offer: Record<string, unknown>;
  icp: Record<string, unknown>;
  positioning: Record<string, unknown>;
  brand: {
    voice_tone: string;
    do_rules: string[];
    dont_rules: string[];
  };
  stack: {
    website_platform: string;
    repo_ref: string;
    deploy_target: string;
  };
  analytics_stack: {
    provider: string;
    workspace_id: string;
    event_schema_ref: string;
  };
  channels_enabled: Array<{
    channel: string;
    automation_allowed: boolean;
  }>;
  credential_refs: string[];
  kpi_definitions: Array<{
    name: string;
    unit: KpiUnit;
    aggregation_method: KpiAggregation;
    kind: "primary" | "guardrail";
  }>;
  asset_refs: string[];
  constraints: string[];
  mature_boundary_signals?: Partial<{
    monthly_revenue: number;
    headcount: number;
    support_ticket_volume_per_week: number;
    multi_region_compliance_flag: boolean;
    operational_complexity_score: number;
  }>;
  mature_boundary_signal_sources?: Partial<{
    monthly_revenue: BoundarySignalSource;
    headcount: BoundarySignalSource;
    support_ticket_volume_per_week: BoundarySignalSource;
    multi_region_compliance_flag: BoundarySignalSource;
    operational_complexity_score: BoundarySignalSource;
  }>;
  updated_at: string;
  updated_by: string;
}

export interface ContainerStep {
  step_id: string;
  step_type: ContainerStepType;
  description: string;
  required: boolean;
  actor: "human" | "system";
}

export interface ContainerContract {
  container_name: string;
  container_version: string;
  maturity_level: ContainerMaturity;
  idempotency_key_strategy: string;
  startup_state_ref: string;
  required_inputs: string[];
  preflight_checks: string[];
  steps: ContainerStep[];
  state_store_contract: string;
  outputs: string[];
  acceptance_checks: string[];
  blocked_reason_enum: string[];
  rollback_plan: string;
  kpi_contract: string;
  experiment_hook_contract: string;
  actuator_refs: string[];
}

function isIsoDate(input: string | null | undefined): boolean {
  if (!input) {
    return false;
  }
  return !Number.isNaN(Date.parse(input));
}

function nonEmptyArray(input: unknown): boolean {
  return Array.isArray(input) && input.length > 0;
}

function nonEmptyString(input: unknown): boolean {
  return typeof input === "string" && input.trim().length > 0;
}

export function stableHash(input: string): string {
  return createHash("sha256").update(input, "utf-8").digest("hex");
}

export function validateMetaObservation(observation: MetaObservation): string[] {
  const errors: string[] = [];
  const isV2 = observation.schema_version === "meta-observation.v2";
  if (!nonEmptyString(observation.schema_version)) errors.push("schema_version");
  if (!nonEmptyString(observation.observation_id)) errors.push("observation_id");
  if (!isIsoDate(observation.timestamp)) errors.push("timestamp");
  if (!nonEmptyString(observation.business)) errors.push("business");
  if (!nonEmptyString(observation.run_id)) errors.push("run_id");
  if (!nonEmptyString(observation.session_id)) errors.push("session_id");
  if (!nonEmptyArray(observation.artifact_refs)) errors.push("artifact_refs");
  if (!nonEmptyString(observation.context_path)) errors.push("context_path");
  if (!nonEmptyString(observation.hard_signature)) errors.push("hard_signature");
  if (!nonEmptyString(observation.fingerprint_version)) {
    errors.push("fingerprint_version");
  }
  if (observation.detector_confidence < 0 || observation.detector_confidence > 1) {
    errors.push("detector_confidence_range");
  }
  if (observation.severity < 0 || observation.severity > 1) {
    errors.push("severity_range");
  }
  if (observation.kpi_name && observation.kpi_value === null) {
    errors.push("kpi_value_required_with_name");
  }
  if (observation.kpi_name && observation.data_quality_status === null) {
    errors.push("data_quality_status_required_with_kpi");
  }
  if (isV2) {
    if (
      observation.evidence_grade !== "exploratory" &&
      observation.evidence_grade !== "structural" &&
      observation.evidence_grade !== "measured"
    ) {
      errors.push("evidence_grade_required_v2");
    }
    if (
      observation.measurement_contract_status !== "none" &&
      observation.measurement_contract_status !== "declared" &&
      observation.measurement_contract_status !== "verified"
    ) {
      errors.push("measurement_contract_status_required_v2");
    }
    if (
      observation.measurement_contract_status === "declared" &&
      !nonEmptyString(observation.measurement_window)
    ) {
      errors.push("measurement_window_required_with_declared_contract");
    }
    if (observation.measurement_contract_status === "verified") {
      if (!nonEmptyString(observation.measurement_window)) {
        errors.push("measurement_window_required_with_verified_contract");
      }
      if (!nonEmptyString(observation.baseline_ref)) {
        errors.push("baseline_ref_required_with_verified_contract");
      }
      if (observation.data_quality_status === null) {
        errors.push("data_quality_status_required_with_verified_contract");
      }
      if (
        typeof observation.sample_size !== "number" ||
        Number.isNaN(observation.sample_size) ||
        observation.sample_size <= 0
      ) {
        errors.push("sample_size_required_with_verified_contract");
      }
    }
    if (
      observation.evidence_grade === "exploratory" &&
      observation.measurement_contract_status !== "none"
    ) {
      errors.push("exploratory_requires_no_measurement_contract");
    }
    if (
      observation.evidence_grade === "structural" &&
      observation.measurement_contract_status !== "declared"
    ) {
      errors.push("structural_requires_declared_measurement_contract");
    }
    if (
      observation.evidence_grade === "measured" &&
      observation.measurement_contract_status !== "verified"
    ) {
      errors.push("measured_requires_verified_measurement_contract");
    }
  }
  return errors;
}

export function validateImprovementCandidate(candidate: ImprovementCandidate): string[] {
  const errors: string[] = [];
  if (!nonEmptyString(candidate.schema_version)) errors.push("schema_version");
  if (!nonEmptyString(candidate.candidate_id)) errors.push("candidate_id");
  if (!nonEmptyString(candidate.problem_statement)) {
    errors.push("problem_statement");
  }
  if (!nonEmptyArray(candidate.trigger_observations)) {
    errors.push("trigger_observations");
  }
  if (!nonEmptyString(candidate.executor_path)) errors.push("executor_path");
  if (!nonEmptyString(candidate.validation_contract)) {
    errors.push("validation_contract");
  }
  if (!nonEmptyString(candidate.rollout_plan)) errors.push("rollout_plan");
  if (!nonEmptyString(candidate.rollback_contract)) {
    errors.push("rollback_contract");
  }
  if (!isIsoDate(candidate.expiry_at)) errors.push("expiry_at");
  if (
    candidate.candidate_state === "blocked" &&
    !nonEmptyString(candidate.blocked_reason_code)
  ) {
    errors.push("blocked_reason_code_required");
  }
  if (
    candidate.candidate_state === "blocked" &&
    !nonEmptyArray(candidate.unblock_requirements)
  ) {
    errors.push("unblock_requirements_required");
  }
  return errors;
}

export function validateImprovementOutcome(outcome: ImprovementOutcome): string[] {
  const errors: string[] = [];
  const isV2 = outcome.schema_version === "outcome.v2";
  if (!nonEmptyString(outcome.schema_version)) errors.push("schema_version");
  if (outcome.schema_version !== "outcome.v1" && outcome.schema_version !== "outcome.v2") {
    errors.push("unsupported_schema_version");
  }
  if (!nonEmptyString(outcome.candidate_id)) errors.push("candidate_id");
  if (
    outcome.implementation_status !== "success" &&
    outcome.implementation_status !== "failed" &&
    outcome.implementation_status !== "reverted"
  ) {
    errors.push("implementation_status");
  }
  if (!nonEmptyString(outcome.baseline_window)) errors.push("baseline_window");
  if (!nonEmptyString(outcome.post_window)) errors.push("post_window");
  if (
    typeof outcome.measured_impact !== "number" ||
    Number.isNaN(outcome.measured_impact)
  ) {
    errors.push("measured_impact");
  }
  if (
    typeof outcome.impact_confidence !== "number" ||
    Number.isNaN(outcome.impact_confidence) ||
    outcome.impact_confidence < 0 ||
    outcome.impact_confidence > 1
  ) {
    errors.push("impact_confidence_range");
  }
  if (
    !Number.isInteger(outcome.regressions_detected) ||
    outcome.regressions_detected < 0
  ) {
    errors.push("regressions_detected");
  }
  if (
    outcome.rollback_executed_at !== null &&
    !isIsoDate(outcome.rollback_executed_at)
  ) {
    errors.push("rollback_executed_at");
  }
  if (
    outcome.promoted_at !== null &&
    !isIsoDate(outcome.promoted_at)
  ) {
    errors.push("promoted_at");
  }
  if (
    outcome.kept_or_reverted !== "kept" &&
    outcome.kept_or_reverted !== "reverted" &&
    outcome.kept_or_reverted !== "not_kept"
  ) {
    errors.push("kept_or_reverted");
  }
  if (!nonEmptyString(outcome.root_cause_notes)) {
    errors.push("root_cause_notes");
  }
  if (!Array.isArray(outcome.follow_up_actions)) {
    errors.push("follow_up_actions");
  }
  if (
    outcome.implementation_status === "reverted" &&
    outcome.rollback_executed_at === null
  ) {
    errors.push("rollback_executed_at_required_for_reverted_status");
  }
  if (
    outcome.kept_or_reverted === "reverted" &&
    outcome.rollback_executed_at === null
  ) {
    errors.push("rollback_executed_at_required_for_reverted_outcome");
  }
  if (isV2) {
    if (
      outcome.measurement_status !== "pending" &&
      outcome.measurement_status !== "verified" &&
      outcome.measurement_status !== "verified_degraded" &&
      outcome.measurement_status !== "missing" &&
      outcome.measurement_status !== "insufficient_sample"
    ) {
      errors.push("measurement_status_required_v2");
    }
    if (
      outcome.maturity_status !== "pending" &&
      outcome.maturity_status !== "matured"
    ) {
      errors.push("maturity_status_required_v2");
    }
    if (outcome.dispatch_id !== null && outcome.dispatch_id !== undefined && !nonEmptyString(outcome.dispatch_id)) {
      errors.push("dispatch_id");
    }
    if (outcome.decision_id !== null && outcome.decision_id !== undefined && !nonEmptyString(outcome.decision_id)) {
      errors.push("decision_id");
    }
    if (
      outcome.policy_version !== null &&
      outcome.policy_version !== undefined &&
      !nonEmptyString(outcome.policy_version)
    ) {
      errors.push("policy_version");
    }
    if (!Array.isArray(outcome.measurement_observation_ids)) {
      errors.push("measurement_observation_ids_required_v2");
    }
    if (
      outcome.outcome_source_path !== undefined &&
      outcome.outcome_source_path !== null &&
      !nonEmptyString(outcome.outcome_source_path)
    ) {
      errors.push("outcome_source_path");
    }
  }
  return errors;
}

function validateBetaPosterior(posterior: BetaPosterior): string[] {
  const errors: string[] = [];
  if (posterior.family !== "beta_binomial") {
    errors.push("family");
  }
  for (const [label, value] of Object.entries({
    prior_alpha: posterior.prior_alpha,
    prior_beta: posterior.prior_beta,
    alpha: posterior.alpha,
    beta: posterior.beta,
  })) {
    if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
      errors.push(label);
    }
  }
  if (!Number.isInteger(posterior.successes) || posterior.successes < 0) {
    errors.push("successes");
  }
  if (!Number.isInteger(posterior.failures) || posterior.failures < 0) {
    errors.push("failures");
  }
  if (
    posterior.updated_through_event_id !== null &&
    !nonEmptyString(posterior.updated_through_event_id)
  ) {
    errors.push("updated_through_event_id");
  }
  return errors;
}

function validateBucketPosterior(posterior: BucketPosterior): string[] {
  const errors: string[] = [];
  if (posterior.family !== "dirichlet_categorical") {
    errors.push("family");
  }
  const buckets = posterior.buckets;
  if (!Array.isArray(buckets) || buckets.length !== 5) {
    errors.push("buckets");
  }
  for (const [label, values] of [
    ["prior_alpha", posterior.prior_alpha],
    ["alpha", posterior.alpha],
    ["counts", posterior.counts],
  ] as const) {
    if (!Array.isArray(values) || values.length !== 5) {
      errors.push(label);
      continue;
    }
    for (const value of values) {
      if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
        errors.push(label);
        break;
      }
    }
  }
  if (
    posterior.updated_through_event_id !== null &&
    !nonEmptyString(posterior.updated_through_event_id)
  ) {
    errors.push("updated_through_event_id");
  }
  return errors;
}

export function validateConstraintProfile(profile: ConstraintProfile): string[] {
  const errors: string[] = [];
  if (profile.schema_version !== "constraint-profile.v1") {
    errors.push("schema_version");
  }
  if (!Number.isInteger(profile.wip_cap) || profile.wip_cap <= 0) {
    errors.push("wip_cap");
  }
  if (!Number.isInteger(profile.hold_window_days) || profile.hold_window_days < 0) {
    errors.push("hold_window_days");
  }
  if (
    profile.max_guarded_trial_blast_radius !== "small" &&
    profile.max_guarded_trial_blast_radius !== "medium" &&
    profile.max_guarded_trial_blast_radius !== "large"
  ) {
    errors.push("max_guarded_trial_blast_radius");
  }
  if (
    profile.minimum_evidence_floor !== "instrumented" &&
    profile.minimum_evidence_floor !== "measured"
  ) {
    errors.push("minimum_evidence_floor");
  }
  return errors;
}

export function validateMaturityWindowProfile(profile: MaturityWindowProfile): string[] {
  const errors: string[] = [];
  if (profile.schema_version !== "maturity-window-profile.v1") {
    errors.push("schema_version");
  }
  for (const [label, value] of Object.entries({
    immediate_days: profile.immediate_days,
    short_days: profile.short_days,
    medium_days: profile.medium_days,
    long_days: profile.long_days,
  })) {
    if (!Number.isInteger(value) || value < 0) {
      errors.push(label);
    }
  }
  return errors;
}

export function validateCandidateBeliefState(state: CandidateBeliefState): string[] {
  const errors: string[] = [];
  if (state.schema_version !== "candidate-belief.v1") {
    errors.push("schema_version");
  }
  if (!nonEmptyString(state.candidate_id)) errors.push("candidate_id");
  if (!nonEmptyString(state.structural_snapshot_id)) {
    errors.push("structural_snapshot_id");
  }
  if (typeof state.evidence_weight !== "number" || state.evidence_weight < 0 || state.evidence_weight > 1) {
    errors.push("evidence_weight");
  }
  if (typeof state.evidence_floor_met !== "boolean") {
    errors.push("evidence_floor_met");
  }
  if (
    state.last_verified_outcome_at !== null &&
    !isIsoDate(state.last_verified_outcome_at)
  ) {
    errors.push("last_verified_outcome_at");
  }
  for (const [label, value] of Object.entries({
    last_outcome_event_id: state.last_outcome_event_id,
    last_decision_id: state.last_decision_id,
    last_override_id: state.last_override_id,
  })) {
    if (value !== null && !nonEmptyString(value)) {
      errors.push(label);
    }
  }
  if (!isIsoDate(state.updated_at)) {
    errors.push("updated_at");
  }
  errors.push(
    ...validateBetaPosterior(state.success_if_attempted).map((error) => `success_if_attempted.${error}`),
  );
  errors.push(
    ...validateBetaPosterior(state.positive_impact_if_attempted).map(
      (error) => `positive_impact_if_attempted.${error}`,
    ),
  );
  errors.push(
    ...validateBetaPosterior(state.guardrail_breach_if_attempted).map(
      (error) => `guardrail_breach_if_attempted.${error}`,
    ),
  );
  errors.push(
    ...validateBucketPosterior(state.time_to_effect).map((error) => `time_to_effect.${error}`),
  );
  return errors;
}

export function validateUtilityBreakdown(utility: UtilityBreakdown): string[] {
  const errors: string[] = [];
  for (const [label, value] of Object.entries(utility)) {
    if (typeof value !== "number" || Number.isNaN(value)) {
      errors.push(label);
    }
  }
  return errors;
}

function validatePortfolioConstraintBinding(
  binding: PortfolioConstraintBinding,
): string[] {
  const errors: string[] = [];
  if (!nonEmptyString(binding.key)) {
    errors.push("key");
  }
  if (
    typeof binding.observed_value !== "number" ||
    Number.isNaN(binding.observed_value)
  ) {
    errors.push("observed_value");
  }
  if (typeof binding.binding !== "boolean") {
    errors.push("binding");
  }
  for (const [label, value] of Object.entries({
    min: binding.min,
    max: binding.max,
    equal: binding.equal,
  })) {
    if (
      value !== undefined &&
      (typeof value !== "number" || Number.isNaN(value))
    ) {
      errors.push(label);
    }
  }
  return errors;
}

function validatePortfolioSelectionSignalSnapshot(
  snapshot: PortfolioSelectionSignalSnapshot,
): string[] {
  const errors: string[] = [];
  for (const [label, value] of Object.entries({
    graph_bottleneck_score: snapshot.graph_bottleneck_score,
    shared_executor_candidate_count: snapshot.shared_executor_candidate_count,
    shared_constraint_candidate_count: snapshot.shared_constraint_candidate_count,
    structural_penalty: snapshot.structural_penalty,
    survival_penalty: snapshot.survival_penalty,
    adjusted_utility: snapshot.adjusted_utility,
  })) {
    if (typeof value !== "number" || Number.isNaN(value)) {
      errors.push(label);
    }
  }
  if (
    snapshot.survival_status !== "empty" &&
    snapshot.survival_status !== "insufficient_data" &&
    snapshot.survival_status !== "estimated"
  ) {
    errors.push("survival_status");
  }
  for (const [label, value] of Object.entries({
    median_verified_days: snapshot.median_verified_days,
    unresolved_after_hold_probability: snapshot.unresolved_after_hold_probability,
    missing_outcome_rate: snapshot.missing_outcome_rate,
  })) {
    if (
      value !== null &&
      (typeof value !== "number" || Number.isNaN(value))
    ) {
      errors.push(label);
    }
  }
  return errors;
}

function validatePortfolioSelectionContext(
  context: PortfolioSelectionContext,
): string[] {
  const errors: string[] = [];
  if (context.schema_version !== "portfolio-selection.v1") {
    errors.push("schema_version");
  }
  for (const [label, value] of Object.entries({
    portfolio_id: context.portfolio_id,
    candidate_set_hash: context.candidate_set_hash,
    solver_status: context.solver_status,
  })) {
    if (!nonEmptyString(value)) {
      errors.push(label);
    }
  }
  if (!Number.isInteger(context.candidate_count) || context.candidate_count < 0) {
    errors.push("candidate_count");
  }
  if (
    context.objective_value !== null &&
    (typeof context.objective_value !== "number" || Number.isNaN(context.objective_value))
  ) {
    errors.push("objective_value");
  }
  if (!Array.isArray(context.selected_candidate_ids)) {
    errors.push("selected_candidate_ids");
  }
  if (
    context.graph_snapshot_id !== null &&
    !nonEmptyString(context.graph_snapshot_id)
  ) {
    errors.push("graph_snapshot_id");
  }
  if (
    context.survival_snapshot_id !== null &&
    !nonEmptyString(context.survival_snapshot_id)
  ) {
    errors.push("survival_snapshot_id");
  }
  for (const [index, selectedCandidateId] of context.selected_candidate_ids.entries()) {
    if (!nonEmptyString(selectedCandidateId)) {
      errors.push(`selected_candidate_ids.${index}`);
    }
  }
  if (!Array.isArray(context.constraint_bindings)) {
    errors.push("constraint_bindings");
  } else {
    for (const [index, binding] of context.constraint_bindings.entries()) {
      errors.push(
        ...validatePortfolioConstraintBinding(binding).map(
          (error) => `constraint_bindings.${index}.${error}`,
        ),
      );
    }
  }
  errors.push(
    ...validatePortfolioSelectionSignalSnapshot(context.signal_snapshot).map(
      (error) => `signal_snapshot.${error}`,
    ),
  );
  return errors;
}

export function validatePolicyDecisionRecord(record: PolicyDecisionRecord): string[] {
  const errors: string[] = [];
  if (record.schema_version !== "policy-decision.v1") {
    errors.push("schema_version");
  }
  for (const [label, value] of Object.entries({
    decision_id: record.decision_id,
    business_id: record.business_id,
    candidate_id: record.candidate_id,
    policy_version: record.policy_version,
    utility_version: record.utility_version,
    prior_family_version: record.prior_family_version,
    decision_context_id: record.decision_context_id,
    belief_state_id: record.belief_state_id,
    chosen_action: record.chosen_action,
  })) {
    if (!nonEmptyString(value)) {
      errors.push(label);
    }
  }
  if (
    record.decision_type !== "candidate_route" &&
    record.decision_type !== "portfolio_selection" &&
    record.decision_type !== "exploration_rank" &&
    record.decision_type !== "promotion_gate" &&
    record.decision_type !== "override_record"
  ) {
    errors.push("decision_type");
  }
  if (record.decision_mode !== "deterministic" && record.decision_mode !== "stochastic") {
    errors.push("decision_mode");
  }
  if (!Array.isArray(record.eligible_actions) || record.eligible_actions.length === 0) {
    errors.push("eligible_actions");
  }
  if (
    record.action_probability !== null &&
    (typeof record.action_probability !== "number" ||
      Number.isNaN(record.action_probability) ||
      record.action_probability < 0 ||
      record.action_probability > 1)
  ) {
    errors.push("action_probability");
  }
  if (!isIsoDate(record.created_at)) {
    errors.push("created_at");
  }
  errors.push(
    ...validateUtilityBreakdown(record.utility).map((error) => `utility.${error}`),
  );
  if (record.decision_type === "portfolio_selection" && !record.portfolio_selection) {
    errors.push("portfolio_selection");
  }
  if (record.portfolio_selection) {
    errors.push(
      ...validatePortfolioSelectionContext(record.portfolio_selection).map(
        (error) => `portfolio_selection.${error}`,
      ),
    );
  }
  return errors;
}

export function validatePolicyState(state: SelfEvolvingPolicyState): string[] {
  const errors: string[] = [];
  if (state.schema_version !== "policy-state.v1") {
    errors.push("schema_version");
  }
  for (const [label, value] of Object.entries({
    business_id: state.business_id,
    policy_state_id: state.policy_state_id,
    policy_version: state.policy_version,
    utility_version: state.utility_version,
    prior_family_version: state.prior_family_version,
    updated_by: state.updated_by,
  })) {
    if (!nonEmptyString(value)) {
      errors.push(label);
    }
  }
  if (
    state.authority_level !== "shadow" &&
    state.authority_level !== "advisory" &&
    state.authority_level !== "guarded_trial"
  ) {
    errors.push("authority_level");
  }
  if (
    state.last_decision_id !== null &&
    !nonEmptyString(state.last_decision_id)
  ) {
    errors.push("last_decision_id");
  }
  if (!isIsoDate(state.updated_at)) {
    errors.push("updated_at");
  }
  errors.push(
    ...validateConstraintProfile(state.active_constraint_profile).map(
      (error) => `active_constraint_profile.${error}`,
    ),
  );
  errors.push(
    ...validateMaturityWindowProfile(state.maturity_windows).map(
      (error) => `maturity_windows.${error}`,
    ),
  );
  for (const [candidateId, belief] of Object.entries(state.candidate_beliefs)) {
    errors.push(
      ...validateCandidateBeliefState(belief).map((error) => `candidate_beliefs.${candidateId}.${error}`),
    );
  }
  return errors;
}

function validateLifecycleReviewRecord(review: LifecycleReviewRecord): string[] {
  const errors: string[] = [];
  if (
    review.decision !== "approved" &&
    review.decision !== "rejected" &&
    review.decision !== "deferred"
  ) {
    errors.push("decision");
  }
  if (!nonEmptyString(review.rationale)) {
    errors.push("rationale");
  }
  if (
    review.reviewer_type !== "operator" &&
    review.reviewer_type !== "agent" &&
    review.reviewer_type !== "automation"
  ) {
    errors.push("reviewer_type");
  }
  if (
    review.reviewer_id !== null &&
    !nonEmptyString(review.reviewer_id)
  ) {
    errors.push("reviewer_id");
  }
  if (!isIsoDate(review.reviewed_at)) {
    errors.push("reviewed_at");
  }
  return errors;
}

function validateOutcomeMissingRecord(outcomeMissing: OutcomeMissingRecord): string[] {
  const errors: string[] = [];
  if (!nonEmptyString(outcomeMissing.reason_code)) {
    errors.push("reason_code");
  }
  if (
    outcomeMissing.detail !== null &&
    !nonEmptyString(outcomeMissing.detail)
  ) {
    errors.push("detail");
  }
  if (
    outcomeMissing.expected_artifact_ref !== null &&
    !nonEmptyString(outcomeMissing.expected_artifact_ref)
  ) {
    errors.push("expected_artifact_ref");
  }
  return errors;
}

export function validateLifecyclePayload(
  lifecycle: SelfEvolvingLifecyclePayload,
): string[] {
  const errors: string[] = [];
  if (!nonEmptyString(lifecycle.candidate_id)) {
    errors.push("candidate_id");
  }
  if (
    lifecycle.dispatch_id !== undefined &&
    lifecycle.dispatch_id !== null &&
    !nonEmptyString(lifecycle.dispatch_id)
  ) {
    errors.push("dispatch_id");
  }
  if (
    lifecycle.plan_slug !== undefined &&
    lifecycle.plan_slug !== null &&
    !nonEmptyString(lifecycle.plan_slug)
  ) {
    errors.push("plan_slug");
  }
  if (lifecycle.review) {
    errors.push(
      ...validateLifecycleReviewRecord(lifecycle.review).map(
        (error) => `review.${error}`,
      ),
    );
  }
  if (lifecycle.outcome) {
    errors.push(
      ...validateImprovementOutcome(lifecycle.outcome).map(
        (error) => `outcome.${error}`,
      ),
    );
    if (lifecycle.outcome.candidate_id !== lifecycle.candidate_id) {
      errors.push("outcome.candidate_id_mismatch");
    }
  }
  if (lifecycle.outcome_missing) {
    errors.push(
      ...validateOutcomeMissingRecord(lifecycle.outcome_missing).map(
        (error) => `outcome_missing.${error}`,
      ),
    );
  }
  if (lifecycle.outcome && lifecycle.outcome_missing) {
    errors.push("outcome_and_outcome_missing_mutually_exclusive");
  }
  return errors;
}

export function validateStartupState(state: StartupState): string[] {
  const errors: string[] = [];
  if (!nonEmptyString(state.schema_version)) errors.push("schema_version");
  if (!nonEmptyString(state.startup_state_id)) errors.push("startup_state_id");
  if (!nonEmptyString(state.business_id)) errors.push("business_id");
  if (
    !Number.isInteger(state.current_website_generation) ||
    state.current_website_generation < 1
  ) {
    errors.push("current_website_generation");
  }
  if (!nonEmptyString(state.brand.voice_tone)) errors.push("brand.voice_tone");
  if (!nonEmptyArray(state.brand.do_rules)) errors.push("brand.do_rules");
  if (!nonEmptyArray(state.brand.dont_rules)) errors.push("brand.dont_rules");
  if (!nonEmptyString(state.stack.website_platform)) {
    errors.push("stack.website_platform");
  }
  if (!nonEmptyString(state.stack.repo_ref)) errors.push("stack.repo_ref");
  if (!nonEmptyString(state.stack.deploy_target)) {
    errors.push("stack.deploy_target");
  }
  if (!nonEmptyString(state.analytics_stack.provider)) {
    errors.push("analytics_stack.provider");
  }
  if (!nonEmptyString(state.analytics_stack.workspace_id)) {
    errors.push("analytics_stack.workspace_id");
  }
  if (!nonEmptyString(state.analytics_stack.event_schema_ref)) {
    errors.push("analytics_stack.event_schema_ref");
  }
  if (!nonEmptyArray(state.kpi_definitions)) errors.push("kpi_definitions");
  if (!isIsoDate(state.updated_at)) errors.push("updated_at");
  if (!nonEmptyString(state.updated_by)) errors.push("updated_by");
  return errors;
}

export function validateContainerContract(container: ContainerContract): string[] {
  const errors: string[] = [];
  if (!nonEmptyString(container.container_name)) errors.push("container_name");
  if (!nonEmptyString(container.container_version)) {
    errors.push("container_version");
  }
  if (!nonEmptyString(container.startup_state_ref)) {
    errors.push("startup_state_ref");
  }
  if (!nonEmptyString(container.idempotency_key_strategy)) {
    errors.push("idempotency_key_strategy");
  }
  if (!nonEmptyArray(container.preflight_checks)) {
    errors.push("preflight_checks");
  }
  if (!nonEmptyArray(container.steps)) errors.push("steps");
  if (!nonEmptyArray(container.outputs)) errors.push("outputs");
  if (!nonEmptyArray(container.acceptance_checks)) {
    errors.push("acceptance_checks");
  }
  if (!nonEmptyArray(container.blocked_reason_enum)) {
    errors.push("blocked_reason_enum");
  }
  if (!nonEmptyString(container.rollback_plan)) errors.push("rollback_plan");
  if (!nonEmptyString(container.kpi_contract)) errors.push("kpi_contract");
  if (!nonEmptyString(container.experiment_hook_contract)) {
    errors.push("experiment_hook_contract");
  }
  if (!Array.isArray(container.actuator_refs)) errors.push("actuator_refs");
  return errors;
}

export function throwOnContractErrors(
  contractName: string,
  errors: string[],
): void {
  if (errors.length === 0) return;
  throw new Error(`${contractName}_invalid:${errors.join(",")}`);
}
