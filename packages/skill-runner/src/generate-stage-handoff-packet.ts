import path from "node:path";

import {
  extractSection,
  getFrontmatterString,
  getFrontmatterStringList,
  isTaskComplete,
  parseConfidencePercent,
  parseFrontmatter,
  parseTaskBlocks,
  parseTaskIdList,
} from "./markdown.js";
import {
  extractAnalysisProcessTopology,
  extractBullets,
  extractFactFindProcessTopology,
  extractIssueRows,
  extractLabeledNestedBullets,
  extractNamedFields,
  extractPlanProcessTopology,
  extractQuestionPrompts,
  extractSubsection,
  extractSubsectionByPrefix,
  extractSummary,
  limitText,
  nullableString,
  parseMarkdownTable,
} from "./stage-handoff-packet-markdown.js";
import type {
  AnalysisStagePayload,
  EngineeringCoverageRow,
  FactFindStagePayload,
  OutcomeContract,
  PlanStagePayload,
  StageHandoffArtifact,
  StageHandoffPacket,
  StagePayload,
  TaskBrief,
} from "./stage-handoff-packet-types.js";

const MAX_LIST_ITEMS = 12;
const TASK_THRESHOLD: Readonly<Record<string, number>> = {
  IMPLEMENT: 80,
  SPIKE: 80,
  INVESTIGATE: 60,
};

export function detectStageHandoffArtifact(
  artifactPath: string,
): StageHandoffArtifact | null {
  const normalized = artifactPath.replace(/\\/g, "/");
  if (normalized.endsWith("/fact-find.md")) {
    return "fact-find";
  }
  if (normalized.endsWith("/analysis.md")) {
    return "analysis";
  }
  if (normalized.endsWith("/plan.md")) {
    return "plan";
  }
  return null;
}

export function resolveStageHandoffPacketPath(artifactPath: string): string {
  const stage = detectStageHandoffArtifact(artifactPath);
  if (!stage) {
    throw new Error(
      `Unsupported artifact path "${artifactPath}". Expected fact-find.md, analysis.md, or plan.md.`,
    );
  }
  return artifactPath.replace(/\.md$/, ".packet.json");
}

export function generateStageHandoffPacket(
  artifactPath: string,
  markdown: string,
): StageHandoffPacket {
  const stage = detectStageHandoffArtifact(artifactPath);
  if (!stage) {
    throw new Error(
      `Unsupported artifact path "${artifactPath}". Expected fact-find.md, analysis.md, or plan.md.`,
    );
  }

  const normalizedPath = artifactPath.replace(/\\/g, "/");
  const parsed = parseFrontmatter(markdown);
  const frontmatter = parsed.frontmatter;

  return {
    schema_version: "do-stage-handoff.v2",
    stage,
    feature_slug:
      getFrontmatterString(frontmatter, "Feature-Slug") ??
      path.basename(path.dirname(normalizedPath)),
    source_artifact_path: normalizedPath,
    source_artifact_status: getFrontmatterString(frontmatter, "Status"),
    source_last_updated:
      getFrontmatterString(frontmatter, "Last-updated") ??
      getFrontmatterString(frontmatter, "Last-reviewed"),
    execution_track: getFrontmatterString(frontmatter, "Execution-Track"),
    deliverable_type: getFrontmatterString(frontmatter, "Deliverable-Type"),
    primary_execution_skill: getFrontmatterString(
      frontmatter,
      "Primary-Execution-Skill",
    ),
    supporting_skills: getFrontmatterStringList(frontmatter, "Supporting-Skills"),
    related_artifacts: collectRelatedArtifacts(frontmatter),
    outcome_contract: extractOutcomeContract(markdown, stage),
    engineering_coverage: extractEngineeringCoverage(markdown, stage),
    open_operator_questions: extractOpenQuestions(markdown, stage),
    stage_payload: buildStagePayload(stage, markdown),
  } as StageHandoffPacket;
}

export function serializeStageHandoffPacket(packet: StageHandoffPacket): string {
  return `${JSON.stringify(packet, null, 2)}\n`;
}

function buildStagePayload(
  stage: StageHandoffArtifact,
  markdown: string,
): StagePayload {
  switch (stage) {
    case "fact-find":
      return buildFactFindPayload(markdown);
    case "analysis":
      return buildAnalysisPayload(markdown);
    case "plan":
      return buildPlanPayload(markdown);
  }
}

function buildFactFindPayload(markdown: string): FactFindStagePayload {
  const scope = extractSection(markdown, "Scope") ?? "";
  const processMap = extractSection(markdown, "Current Process Map") ?? "";
  const evidenceAudit =
    extractSection(markdown, "Evidence Audit") ??
    extractSection(markdown, "Evidence Audit (Current State)") ??
    "";
  const readiness = extractSection(markdown, "Analysis Readiness") ?? "";
  const rehearsalTrace = extractSection(markdown, "Rehearsal Trace") ?? "";

  return {
    scope_summary: extractSummary(scope),
    goals: extractBullets(extractSubsection(scope, "Goals")),
    non_goals: extractBullets(extractSubsection(scope, "Non-goals")),
    constraints: extractLabeledNestedBullets(scope, "Constraints"),
    assumptions: extractLabeledNestedBullets(scope, "Assumptions"),
    key_entry_points: extractBullets(extractSubsection(evidenceAudit, "Entry Points")),
    key_findings: extractBullets(extractSubsection(evidenceAudit, "Key Findings")),
    analysis_readiness: extractNamedFields(readiness),
    rehearsal_issues: extractIssueRows(rehearsalTrace),
    process_topology: extractFactFindProcessTopology(processMap),
  } satisfies FactFindStagePayload;
}

function buildAnalysisPayload(markdown: string): AnalysisStagePayload {
  const decisionFrame = extractSection(markdown, "Decision Frame") ?? "";
  const planningHandoff = extractSection(markdown, "Planning Handoff") ?? "";
  const chosenApproach = extractSection(markdown, "Chosen Approach") ?? "";
  const operatingModel = extractSection(markdown, "End-State Operating Model") ?? "";

  return {
    decision_summary: extractSummary(decisionFrame),
    goals: extractBullets(extractSubsection(decisionFrame, "Goals")),
    non_goals: extractBullets(extractSubsection(decisionFrame, "Non-goals")),
    constraints: extractLabeledNestedBullets(decisionFrame, "Constraints"),
    assumptions: extractLabeledNestedBullets(decisionFrame, "Assumptions"),
    evaluation_criteria: parseMarkdownTable(
      extractSection(markdown, "Evaluation Criteria") ?? "",
    ),
    options_considered: parseMarkdownTable(
      extractSection(markdown, "Options Considered") ?? "",
    ),
    chosen_approach: extractNamedFields(chosenApproach),
    rejected_approaches: extractBullets(extractSubsection(chosenApproach, "Rejected Approaches")),
    planning_handoff: {
      planning_focus: extractLabeledNestedBullets(planningHandoff, "Planning focus"),
      validation_implications: extractLabeledNestedBullets(
        planningHandoff,
        "Validation implications",
      ),
      sequencing_constraints: extractLabeledNestedBullets(
        planningHandoff,
        "Sequencing constraints",
      ),
      risks_to_carry_forward: extractLabeledNestedBullets(
        planningHandoff,
        "Risks to carry into planning",
      ),
    },
    process_topology: extractAnalysisProcessTopology(operatingModel),
  } satisfies AnalysisStagePayload;
}

function buildPlanPayload(markdown: string): PlanStagePayload {
  const tasks = parseTaskBlocks(markdown);
  const deliveredProcesses = extractSection(markdown, "Delivered Processes") ?? "";
  const taskBriefs = tasks.map((task) => {
    const type = (task.fields["type"] ?? "").trim().toUpperCase() || null;
    return {
      task_id: task.id,
      title: limitText(task.title) ?? "",
      type,
      status: nullableString(task.fields["status"]),
      confidence: parseConfidencePercent(task.fields["confidence"]),
      effort: nullableString(task.fields["effort"]),
      depends_on: parseTaskIdList(task.fields["depends-on"] ?? "-"),
      blocks: parseTaskIdList(task.fields["blocks"] ?? "-"),
      execution_skill: nullableString(task.fields["execution-skill"]),
      deliverable: limitText(task.fields["deliverable"] ?? ""),
      affects: limitText(task.fields["affects"] ?? ""),
    } satisfies TaskBrief;
  });

  return {
    summary: limitText(extractSection(markdown, "Summary") ?? ""),
    goals: extractBullets(extractSection(markdown, "Goals") ?? ""),
    non_goals: extractBullets(extractSection(markdown, "Non-goals") ?? ""),
    constraints: extractLabeledNestedBullets(
      extractSection(markdown, "Constraints & Assumptions") ?? "",
      "Constraints",
    ),
    assumptions: extractLabeledNestedBullets(
      extractSection(markdown, "Constraints & Assumptions") ?? "",
      "Assumptions",
    ),
    selected_approach: extractBullets(
      extractSection(markdown, "Selected Approach Summary") ?? "",
    ),
    plan_gates: extractNamedFields(extractSection(markdown, "Plan Gates") ?? ""),
    task_briefs: taskBriefs,
    next_runnable_task_ids: taskBriefs
      .filter((task) => isTaskRunnable(task, taskBriefs))
      .map((task) => task.task_id),
    validation_contracts: extractBullets(
      extractSection(markdown, "Validation Contracts") ?? "",
    ),
    open_decisions: extractBullets(extractSection(markdown, "Open Decisions") ?? ""),
    process_topology: extractPlanProcessTopology(deliveredProcesses),
  } satisfies PlanStagePayload;
}

function extractOutcomeContract(
  markdown: string,
  stage: StageHandoffArtifact,
): OutcomeContract {
  const heading =
    stage === "fact-find" ? "Outcome Contract" : "Inherited Outcome Contract";
  const fields = extractNamedFields(extractSection(markdown, heading) ?? "");
  return {
    why: fields["Why"] ?? null,
    intended_outcome_type: fields["Intended Outcome Type"] ?? null,
    intended_outcome_statement: fields["Intended Outcome Statement"] ?? null,
    source: fields["Source"] ?? null,
  };
}

function extractEngineeringCoverage(
  markdown: string,
  stage: StageHandoffArtifact,
): EngineeringCoverageRow[] {
  const sectionName =
    stage === "fact-find"
      ? "Engineering Coverage Matrix"
      : stage === "analysis"
        ? "Engineering Coverage Comparison"
        : "Engineering Coverage";
  return parseMarkdownTable(extractSection(markdown, sectionName) ?? "")
    .slice(0, MAX_LIST_ITEMS)
    .map((row) => {
      const cells = Object.values(row).map((value) => limitText(value));
      return {
        coverage_area: cells[0] ?? "",
        applicable: cells[1] ?? null,
        current_or_option_state: cells[2] ?? null,
        gap_or_implication: cells[3] ?? null,
        carry_forward_or_notes: cells[4] ?? null,
      };
    });
}

function extractOpenQuestions(
  markdown: string,
  stage: StageHandoffArtifact,
): string[] {
  if (stage === "plan") {
    return extractBullets(extractSection(markdown, "Open Decisions") ?? "");
  }

  if (stage === "fact-find") {
    const section = extractSection(markdown, "Questions") ?? "";
    return extractQuestionPrompts(
      extractSubsectionByPrefix(section, "Open") ?? section,
    );
  }

  const section = extractSection(markdown, "Chosen Approach") ?? "";
  return extractQuestionPrompts(section);
}

function collectRelatedArtifacts(
  frontmatter: Record<string, unknown>,
): Record<string, string> {
  const entries: Array<[string, string | null]> = [
    ["fact_find", getFrontmatterString(frontmatter, "Related-Fact-Find")],
    ["analysis", getFrontmatterString(frontmatter, "Related-Analysis")],
    ["plan", getFrontmatterString(frontmatter, "Related-Plan")],
  ];

  const relatedArtifacts: Record<string, string> = {};
  for (const [key, value] of entries) {
    if (value) {
      relatedArtifacts[key] = value;
    }
  }
  return relatedArtifacts;
}

function isTaskRunnable(task: TaskBrief, tasks: readonly TaskBrief[]): boolean {
  const type = (task.type ?? "").toUpperCase();
  if (type === "DECISION") {
    return false;
  }
  if (task.status && isTaskComplete(task.status)) {
    return false;
  }
  if (task.status && /blocked|deferred|infeasible/i.test(task.status)) {
    return false;
  }
  if (task.depends_on.some((taskId) => !isCompletedTask(taskId, tasks))) {
    return false;
  }
  const threshold = TASK_THRESHOLD[type];
  if (!threshold) {
    return true;
  }
  return (task.confidence ?? 0) >= threshold;
}

function isCompletedTask(taskId: string, tasks: readonly TaskBrief[]): boolean {
  const task = tasks.find((candidate) => candidate.task_id === taskId);
  return Boolean(task?.status && isTaskComplete(task.status));
}
