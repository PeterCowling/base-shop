export type StageHandoffArtifact = "fact-find" | "analysis" | "plan";
export type StageHandoffSchemaVersion = "do-stage-handoff.v2";

export interface OutcomeContract {
  why: string | null;
  intended_outcome_type: string | null;
  intended_outcome_statement: string | null;
  source: string | null;
}

export interface EngineeringCoverageRow {
  coverage_area: string;
  applicable: string | null;
  current_or_option_state: string | null;
  gap_or_implication: string | null;
  carry_forward_or_notes: string | null;
}

export interface TaskBrief {
  task_id: string;
  title: string;
  type: string | null;
  status: string | null;
  confidence: number | null;
  effort: string | null;
  depends_on: string[];
  blocks: string[];
  execution_skill: string | null;
  deliverable: string | null;
  affects: string | null;
}

export interface BaseProcessTopology<Area> {
  changed: boolean;
  note: string | null;
  areas: Area[];
}

export interface FactFindProcessArea {
  id: string | null;
  label: string | null;
  flow: string | null;
  owners: string | null;
  evidence: string | null;
  issues: string | null;
}

export interface AnalysisProcessArea {
  id: string | null;
  label: string | null;
  current: string | null;
  trigger: string | null;
  future: string | null;
  steady: string | null;
  seams: string | null;
}

export interface PlanProcessArea {
  id: string | null;
  label: string | null;
  trigger: string | null;
  flow: string | null;
  task_ids: string[];
  dependency_note: string | null;
  seams: string | null;
}

export interface FactFindProcessTopology
  extends BaseProcessTopology<FactFindProcessArea> {
  trigger: string | null;
  end_condition: string | null;
}

export type AnalysisProcessTopology = BaseProcessTopology<AnalysisProcessArea>;

export type PlanProcessTopology = BaseProcessTopology<PlanProcessArea>;

export interface FactFindStagePayload {
  scope_summary: string | null;
  goals: string[];
  non_goals: string[];
  constraints: string[];
  assumptions: string[];
  key_entry_points: string[];
  key_findings: string[];
  analysis_readiness: Record<string, string>;
  rehearsal_issues: Array<Record<string, string>>;
  process_topology: FactFindProcessTopology;
}

export interface AnalysisStagePayload {
  decision_summary: string | null;
  goals: string[];
  non_goals: string[];
  constraints: string[];
  assumptions: string[];
  evaluation_criteria: Array<Record<string, string>>;
  options_considered: Array<Record<string, string>>;
  chosen_approach: Record<string, string>;
  rejected_approaches: string[];
  planning_handoff: {
    planning_focus: string[];
    validation_implications: string[];
    sequencing_constraints: string[];
    risks_to_carry_forward: string[];
  };
  process_topology: AnalysisProcessTopology;
}

export interface PlanStagePayload {
  summary: string | null;
  goals: string[];
  non_goals: string[];
  constraints: string[];
  assumptions: string[];
  selected_approach: string[];
  plan_gates: Record<string, string>;
  task_briefs: TaskBrief[];
  next_runnable_task_ids: string[];
  validation_contracts: string[];
  open_decisions: string[];
  process_topology: PlanProcessTopology;
}

export type StagePayload =
  | FactFindStagePayload
  | AnalysisStagePayload
  | PlanStagePayload;

export interface StageHandoffPacketBase<
  TStage extends StageHandoffArtifact,
  TPayload extends StagePayload,
> {
  schema_version: StageHandoffSchemaVersion;
  stage: TStage;
  feature_slug: string | null;
  source_artifact_path: string;
  source_artifact_status: string | null;
  source_last_updated: string | null;
  execution_track: string | null;
  deliverable_type: string | null;
  primary_execution_skill: string | null;
  supporting_skills: string[];
  related_artifacts: Record<string, string>;
  outcome_contract: OutcomeContract;
  engineering_coverage: EngineeringCoverageRow[];
  open_operator_questions: string[];
  stage_payload: TPayload;
}

export type StageHandoffPacket =
  | StageHandoffPacketBase<"fact-find", FactFindStagePayload>
  | StageHandoffPacketBase<"analysis", AnalysisStagePayload>
  | StageHandoffPacketBase<"plan", PlanStagePayload>;
