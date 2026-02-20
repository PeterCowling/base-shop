/**
 * Process assignment validator.
 *
 * Reads:
 *   docs/business-os/startup-loop/process-assignment-v2.yaml
 *   docs/business-os/startup-loop/workstream-workflow-taxonomy-v2.yaml
 *
 * Validates:
 *   - Coverage: all 28 canonical process IDs present (TC-05-02)
 *   - No duplicate process IDs (TC-05-04)
 *   - Enum validity against taxonomy: workstream_id, workflow_phases, activation (TC-05-03, TC-05-07)
 *   - Activation semantics: activation_condition required for non-always rows (TC-05-06)
 *   - Phase execution order: workflow_phases in ascending order within each process (TC-05-05)
 *   - Process row order: deterministic (workstream group then ID number) (TC-05-05)
 *
 * Usage:
 *   node --import tsx scripts/src/startup-loop/validate-process-assignment.ts
 *
 * Decision reference:
 *   docs/plans/startup-loop-orchestrated-os-comparison-v2/plan.md (TASK-05)
 */

import { readFileSync } from "node:fs";
import path from "node:path";

import { load as loadYaml } from "js-yaml";

// ---------------------------------------------------------------------------
// Canonical process ID set
// Source: TASK-00 decision — frozen v1 ID set
// docs/plans/startup-loop-orchestrated-os-comparison-v2/decisions/v2-scope-boundary-decision.md
// ---------------------------------------------------------------------------

export const CANONICAL_PROCESS_IDS: readonly string[] = [
  "CDI-1", "CDI-2", "CDI-3", "CDI-4",
  "OFF-1", "OFF-2", "OFF-3", "OFF-4",
  "GTM-1", "GTM-2", "GTM-3", "GTM-4",
  "OPS-1", "OPS-2", "OPS-3", "OPS-4",
  "CX-1",  "CX-2",  "CX-3",  "CX-4",
  "FIN-1", "FIN-2", "FIN-3", "FIN-4",
  "DATA-1","DATA-2","DATA-3","DATA-4",
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProcessEntry {
  process_id: string;
  process_name: string;
  workstream_id: string;
  workflow_phases: string[];
  primary_workflow_phase: string;
  activation: "always" | "conditional" | "exception_only";
  activation_condition: string | null;
}

export interface ProcessAssignment {
  schema_version: string;
  taxonomy_ref: string;
  process_id_source: string;
  processes: ProcessEntry[];
}

export interface TaxonomyWorkstream {
  id: string;
  name: string;
}

export interface TaxonomyPhase {
  id: string;
  name: string;
  order: number;
}

export interface TaxonomyToken {
  token: string;
  companion_field_required: boolean;
}

export interface Taxonomy {
  schema_version: string;
  workstreams: TaxonomyWorkstream[];
  workflow_phases: TaxonomyPhase[];
  activation_tokens: TaxonomyToken[];
}

export interface ValidationError {
  process_id: string;
  field: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function validateAssignment(
  assignment: unknown,
  taxonomy: unknown,
  taxonomyRelPath: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  // ── Root structure checks ─────────────────────────────────────────────────

  if (
    !assignment ||
    typeof assignment !== "object" ||
    !Array.isArray((assignment as ProcessAssignment).processes)
  ) {
    return [
      { process_id: "(root)", field: "processes", message: "missing or non-array processes field" },
    ];
  }

  if (
    !taxonomy ||
    typeof taxonomy !== "object" ||
    !Array.isArray((taxonomy as Taxonomy).workstreams) ||
    !Array.isArray((taxonomy as Taxonomy).workflow_phases) ||
    !Array.isArray((taxonomy as Taxonomy).activation_tokens)
  ) {
    return [
      { process_id: "(root)", field: "taxonomy", message: `taxonomy file is invalid or missing required arrays: ${taxonomyRelPath}` },
    ];
  }

  const asgn = assignment as ProcessAssignment;
  const tax = taxonomy as Taxonomy;

  // ── Build enum sets from taxonomy ─────────────────────────────────────────

  const validWorkstreamIds = new Set(tax.workstreams.map((w) => w.id));
  const phaseOrderMap = new Map<string, number>(
    tax.workflow_phases.map((p) => [p.id, p.order])
  );
  const validPhaseIds = new Set(phaseOrderMap.keys());
  const validActivationTokens = new Set(tax.activation_tokens.map((t) => t.token));
  const companionRequired = new Set(
    tax.activation_tokens
      .filter((t) => t.companion_field_required)
      .map((t) => t.token)
  );

  const processes = asgn.processes;

  // ── TC-05-04: Duplicate process IDs ──────────────────────────────────────

  const seenIds = new Map<string, number>(); // id → first index
  for (let i = 0; i < processes.length; i++) {
    const pid = processes[i]?.process_id ?? "(unknown)";
    if (seenIds.has(pid)) {
      errors.push({
        process_id: pid,
        field: "process_id",
        message: `duplicate process_id '${pid}' at index ${i} (first seen at index ${seenIds.get(pid)})`,
      });
    } else {
      seenIds.set(pid, i);
    }
  }

  // ── TC-05-02: Coverage — all 28 canonical IDs present ───────────────────

  const presentIds = new Set(processes.map((p) => p?.process_id).filter(Boolean));
  const missingIds = CANONICAL_PROCESS_IDS.filter((id) => !presentIds.has(id));
  const extraIds = [...presentIds].filter(
    (id) => !CANONICAL_PROCESS_IDS.includes(id) && !seenIds.has(id + "__dup")
  );

  if (missingIds.length > 0) {
    errors.push({
      process_id: "(root)",
      field: "processes",
      message: `missing canonical process IDs: ${missingIds.join(", ")}`,
    });
  }

  // ── TC-05-05: Process row order ───────────────────────────────────────────
  // Expected order: canonical sequence (CDI-1..DATA-4)

  const canonicalOrder = new Map(
    CANONICAL_PROCESS_IDS.map((id, i) => [id, i])
  );
  let lastOrder = -1;
  for (const proc of processes) {
    if (!proc?.process_id) continue;
    const currentOrder = canonicalOrder.get(proc.process_id) ?? -1;
    if (currentOrder !== -1) {
      if (currentOrder < lastOrder) {
        errors.push({
          process_id: proc.process_id,
          field: "process_id",
          message: `process row is out of canonical order — expected workstream group order (CDI→OFF→GTM→OPS→CX→FIN→DATA) then ID number; re-sort processes[] accordingly`,
        });
      }
      lastOrder = currentOrder;
    }
  }

  // ── Per-process field validation ─────────────────────────────────────────

  for (const proc of processes) {
    const pid = proc?.process_id ?? "(unknown)";
    if (!proc || typeof proc !== "object") {
      errors.push({ process_id: pid, field: "(entry)", message: "process entry is not an object" });
      continue;
    }

    // Required fields
    for (const field of ["process_id", "process_name", "workstream_id", "workflow_phases", "primary_workflow_phase", "activation"] as const) {
      if (proc[field] === undefined || proc[field] === null) {
        errors.push({ process_id: pid, field, message: `required field '${field}' is missing` });
      }
    }

    // TC-05-03 / TC-05-07: workstream_id enum check
    if (proc.workstream_id !== undefined && !validWorkstreamIds.has(proc.workstream_id)) {
      errors.push({
        process_id: pid,
        field: "workstream_id",
        message: `unknown workstream_id '${proc.workstream_id}'; valid values: ${[...validWorkstreamIds].join(", ")} (source: ${taxonomyRelPath})`,
      });
    }

    // TC-05-03 / TC-05-07: workflow_phases enum + TC-05-05 phase execution order
    if (Array.isArray(proc.workflow_phases)) {
      for (const phase of proc.workflow_phases) {
        if (!validPhaseIds.has(phase)) {
          errors.push({
            process_id: pid,
            field: "workflow_phases",
            message: `unknown workflow phase '${phase}'; valid values: ${[...validPhaseIds].join(", ")} (source: ${taxonomyRelPath})`,
          });
        }
      }

      // Phases must be in ascending execution order (by phase.order from taxonomy)
      const knownPhases = proc.workflow_phases.filter((p) => phaseOrderMap.has(p));
      const phaseOrders = knownPhases.map((p) => phaseOrderMap.get(p)!);
      for (let i = 1; i < phaseOrders.length; i++) {
        if (phaseOrders[i] <= phaseOrders[i - 1]) {
          errors.push({
            process_id: pid,
            field: "workflow_phases",
            message: `workflow_phases must be in ascending execution order (phase order numbers must increase); got [${knownPhases.join(", ")}] — re-sort in execution order`,
          });
          break;
        }
      }

      // primary_workflow_phase must be in workflow_phases
      if (
        proc.primary_workflow_phase &&
        !proc.workflow_phases.includes(proc.primary_workflow_phase)
      ) {
        errors.push({
          process_id: pid,
          field: "primary_workflow_phase",
          message: `primary_workflow_phase '${proc.primary_workflow_phase}' is not in workflow_phases [${proc.workflow_phases.join(", ")}]`,
        });
      }
    }

    // TC-05-03 / TC-05-07: activation enum check
    if (proc.activation !== undefined && !validActivationTokens.has(proc.activation)) {
      errors.push({
        process_id: pid,
        field: "activation",
        message: `unknown activation token '${proc.activation}'; valid values: ${[...validActivationTokens].join(", ")} (source: ${taxonomyRelPath})`,
      });
    }

    // TC-05-06: activation_condition required for non-always rows
    if (proc.activation !== undefined && companionRequired.has(proc.activation)) {
      if (!proc.activation_condition || typeof proc.activation_condition !== "string" || proc.activation_condition.trim() === "") {
        errors.push({
          process_id: pid,
          field: "activation_condition",
          message: `activation '${proc.activation}' requires a non-empty activation_condition field`,
        });
      }
    }

    // activation_condition should be null for 'always' rows
    if (proc.activation === "always" && proc.activation_condition !== null && proc.activation_condition !== undefined) {
      errors.push({
        process_id: pid,
        field: "activation_condition",
        message: `activation 'always' must have activation_condition: null (got: '${proc.activation_condition}')`,
      });
    }
  }

  // Sort errors deterministically: by process_id canonical order, then field
  errors.sort((a, b) => {
    const aOrder = canonicalOrder.get(a.process_id) ?? 999;
    const bOrder = canonicalOrder.get(b.process_id) ?? 999;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.field.localeCompare(b.field);
  });

  return errors;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function run(opts: { repoRoot: string }): void {
  const { repoRoot } = opts;

  const assignmentPath = path.join(
    repoRoot,
    "docs/business-os/startup-loop/process-assignment-v2.yaml"
  );
  const taxonomyPath = path.join(
    repoRoot,
    "docs/business-os/startup-loop/workstream-workflow-taxonomy-v2.yaml"
  );
  const taxonomyRelPath = path
    .relative(repoRoot, taxonomyPath)
    .replace(/\\/g, "/");

  const assignmentRaw = readFileSync(assignmentPath, "utf8");
  const taxonomyRaw = readFileSync(taxonomyPath, "utf8");

  const assignment = loadYaml(assignmentRaw);
  const taxonomy = loadYaml(taxonomyRaw);

  const errors = validateAssignment(assignment, taxonomy, taxonomyRelPath);

  if (errors.length > 0) {
    for (const e of errors) {
      process.stderr.write(
        `[validate-process-assignment] ERROR process=${e.process_id} field=${e.field}: ${e.message}\n`
      );
    }
    process.stderr.write(
      `[validate-process-assignment] FAIL — ${errors.length} error(s) found\n`
    );
    process.exit(1);
  }

  process.stdout.write(
    `[validate-process-assignment] OK — ${CANONICAL_PROCESS_IDS.length}/${CANONICAL_PROCESS_IDS.length} processes valid\n`
  );
}

// CLI entry point
if (process.argv[1]?.includes("validate-process-assignment")) {
  const repoRoot = path.resolve(__dirname, "../../..");
  run({ repoRoot });
}
