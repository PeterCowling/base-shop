import { createHash } from "node:crypto";

export type DataQualityStatus = "ok" | "degraded" | "unknown";
export type ActorType = "operator" | "agent" | "automation";
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
  implementation_status: "success" | "failed" | "reverted";
  promoted_at: string | null;
  baseline_window: string;
  post_window: string;
  measured_impact: number;
  impact_confidence: number;
  regressions_detected: number;
  rollback_executed_at: string | null;
  kept_or_reverted: "kept" | "reverted";
  root_cause_notes: string;
  follow_up_actions: string[];
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
