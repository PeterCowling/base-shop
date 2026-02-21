/**
 * Process Assignment Validator — Tests
 *
 * Covers TC-05 validation contracts:
 *   TC-05-01: valid matrix input → no errors (exits 0)
 *   TC-05-02: missing process ID → reports missing IDs
 *   TC-05-03: unknown workstream/phase token → field-level error
 *   TC-05-04: duplicate process ID → error
 *   TC-05-05: unsorted phases/process rows → error with normalization guidance
 *   TC-05-06: invalid activation token OR missing activation_condition → error
 *   TC-05-07: taxonomy enum mismatch → error reports taxonomy file path
 *
 * Decision reference:
 *   docs/plans/startup-loop-orchestrated-os-comparison-v2/plan.md (TASK-05)
 */

import { describe, expect, it } from "@jest/globals";

import {
  CANONICAL_PROCESS_IDS,
  type ProcessAssignment,
  type ProcessEntry,
  type Taxonomy,
  validateAssignment,
} from "../validate-process-assignment";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TAXONOMY_REL_PATH =
  "docs/business-os/startup-loop/workstream-workflow-taxonomy-v2.yaml";

function makeTaxonomy(overrides: Partial<Taxonomy> = {}): Taxonomy {
  return {
    schema_version: "2.0",
    workstreams: [
      { id: "CDI", name: "Customer Discovery and Market Intelligence" },
      { id: "OFF", name: "Offering and Pricing" },
      { id: "GTM", name: "Go-to-Market and Growth" },
      { id: "OPS", name: "Operations and Tooling" },
      { id: "CX", name: "Customer Experience and Retention" },
      { id: "FIN", name: "Finance and Sustainability" },
      { id: "DATA", name: "Data Capture and Continuous Improvement" },
    ],
    workflow_phases: [
      { id: "Sense", name: "Sense and Diagnose", order: 1 },
      { id: "Decide/Plan", name: "Decide and Plan", order: 2 },
      { id: "Build/Prepare", name: "Build and Prepare", order: 3 },
      { id: "Sell/Acquire", name: "Sell and Acquire Demand", order: 4 },
      { id: "Deliver/Support", name: "Deliver and Support", order: 5 },
      { id: "Measure/Learn", name: "Measure and Learn", order: 6 },
      { id: "Weekly Review", name: "Weekly Review", order: 7 },
    ],
    activation_tokens: [
      { token: "always", companion_field_required: false },
      { token: "conditional", companion_field_required: true },
      { token: "exception_only", companion_field_required: true },
    ],
    ...overrides,
  };
}

function makeProcess(overrides: Partial<ProcessEntry> = {}): ProcessEntry {
  return {
    process_id: "CDI-1",
    process_name: "Weekly Signal Intake and Insight Synthesis",
    workstream_id: "CDI",
    workflow_phases: ["Sense", "Decide/Plan"],
    primary_workflow_phase: "Sense",
    activation: "always",
    activation_condition: null,
    ...overrides,
  };
}

/** Build a minimal valid assignment with all 28 canonical processes. */
function makeFullAssignment(): ProcessAssignment {
  const workstreamIds = ["CDI", "OFF", "GTM", "OPS", "CX", "FIN", "DATA"];
  const processes: ProcessEntry[] = CANONICAL_PROCESS_IDS.map((pid) => {
    const ws = pid.split("-")[0];
    const num = parseInt(pid.split("-")[1], 10);
    return makeProcess({
      process_id: pid,
      process_name: `Process ${pid}`,
      workstream_id: ws,
      workflow_phases: num % 2 === 0 ? ["Sense"] : ["Sense", "Decide/Plan"],
      primary_workflow_phase: "Sense",
      activation: "always",
      activation_condition: null,
    });
  });
  return {
    schema_version: "2.0",
    taxonomy_ref: TAXONOMY_REL_PATH,
    process_id_source: "docs/business-os/startup-loop/process-registry-v1.md",
    processes,
  };
}

// ---------------------------------------------------------------------------
// TC-05-01: Valid matrix input → no errors
// ---------------------------------------------------------------------------

describe("TC-05-01: valid matrix input", () => {
  it("returns no errors for a complete valid assignment", () => {
    const errors = validateAssignment(
      makeFullAssignment(),
      makeTaxonomy(),
      TAXONOMY_REL_PATH
    );
    expect(errors).toHaveLength(0);
  });

  it("accepts conditional activation with non-empty activation_condition", () => {
    const assignment: ProcessAssignment = {
      ...makeFullAssignment(),
      processes: [
        makeProcess({
          process_id: "CDI-1",
          activation: "conditional",
          activation_condition: "Weekly pre-PMF; biweekly at PMF/scaling",
        }),
        // Fill remaining 27 as always-null to satisfy coverage check
        ...CANONICAL_PROCESS_IDS.slice(1).map((pid) =>
          makeProcess({ process_id: pid, workstream_id: pid.split("-")[0] })
        ),
      ],
    };
    const errors = validateAssignment(assignment, makeTaxonomy(), TAXONOMY_REL_PATH);
    expect(errors).toHaveLength(0);
  });

  it("accepts exception_only activation with non-empty activation_condition", () => {
    const assignment: ProcessAssignment = {
      ...makeFullAssignment(),
      processes: [
        makeProcess({
          process_id: "CDI-1",
          activation: "exception_only",
          activation_condition: "Triggered by exception state",
        }),
        ...CANONICAL_PROCESS_IDS.slice(1).map((pid) =>
          makeProcess({ process_id: pid, workstream_id: pid.split("-")[0] })
        ),
      ],
    };
    const errors = validateAssignment(assignment, makeTaxonomy(), TAXONOMY_REL_PATH);
    expect(errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// TC-05-02: Missing process ID → reports missing ID list
// ---------------------------------------------------------------------------

describe("TC-05-02: missing process IDs", () => {
  it("reports all missing IDs when processes array is empty", () => {
    const assignment = { ...makeFullAssignment(), processes: [] };
    const errors = validateAssignment(assignment, makeTaxonomy(), TAXONOMY_REL_PATH);
    const coverageError = errors.find(
      (e) => e.process_id === "(root)" && e.field === "processes"
    );
    expect(coverageError).toBeDefined();
    expect(coverageError?.message).toContain("CDI-1");
    expect(coverageError?.message).toContain("DATA-4");
  });

  it("reports specific missing IDs when some are present", () => {
    const assignment: ProcessAssignment = {
      ...makeFullAssignment(),
      processes: CANONICAL_PROCESS_IDS.filter((id) => id !== "GTM-2" && id !== "FIN-3").map(
        (pid) => makeProcess({ process_id: pid, workstream_id: pid.split("-")[0] })
      ),
    };
    const errors = validateAssignment(assignment, makeTaxonomy(), TAXONOMY_REL_PATH);
    const coverageError = errors.find((e) => e.field === "processes" && e.process_id === "(root)");
    expect(coverageError).toBeDefined();
    expect(coverageError?.message).toContain("GTM-2");
    expect(coverageError?.message).toContain("FIN-3");
    expect(coverageError?.message).not.toContain("CDI-1");
  });

  it("reports error when root processes field is missing", () => {
    const errors = validateAssignment({ schema_version: "2.0" }, makeTaxonomy(), TAXONOMY_REL_PATH);
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe("processes");
  });
});

// ---------------------------------------------------------------------------
// TC-05-03: Unknown workstream/phase token → field-level error
// ---------------------------------------------------------------------------

describe("TC-05-03: unknown workstream/phase token", () => {
  it("reports field-level error for unknown workstream_id", () => {
    const assignment: ProcessAssignment = {
      ...makeFullAssignment(),
      processes: [
        makeProcess({ process_id: "CDI-1", workstream_id: "UNKNOWN_WS" }),
        ...CANONICAL_PROCESS_IDS.slice(1).map((pid) =>
          makeProcess({ process_id: pid, workstream_id: pid.split("-")[0] })
        ),
      ],
    };
    const errors = validateAssignment(assignment, makeTaxonomy(), TAXONOMY_REL_PATH);
    const wsError = errors.find(
      (e) => e.process_id === "CDI-1" && e.field === "workstream_id"
    );
    expect(wsError).toBeDefined();
    expect(wsError?.message).toContain("UNKNOWN_WS");
  });

  it("reports field-level error for unknown workflow phase", () => {
    const assignment: ProcessAssignment = {
      ...makeFullAssignment(),
      processes: [
        makeProcess({
          process_id: "CDI-1",
          workflow_phases: ["Sense", "UNKNOWN_PHASE"],
          primary_workflow_phase: "Sense",
        }),
        ...CANONICAL_PROCESS_IDS.slice(1).map((pid) =>
          makeProcess({ process_id: pid, workstream_id: pid.split("-")[0] })
        ),
      ],
    };
    const errors = validateAssignment(assignment, makeTaxonomy(), TAXONOMY_REL_PATH);
    const phaseError = errors.find(
      (e) => e.process_id === "CDI-1" && e.field === "workflow_phases"
    );
    expect(phaseError).toBeDefined();
    expect(phaseError?.message).toContain("UNKNOWN_PHASE");
  });

  it("reports error when primary_workflow_phase is not in workflow_phases", () => {
    const assignment: ProcessAssignment = {
      ...makeFullAssignment(),
      processes: [
        makeProcess({
          process_id: "CDI-1",
          workflow_phases: ["Sense"],
          primary_workflow_phase: "Decide/Plan",
        }),
        ...CANONICAL_PROCESS_IDS.slice(1).map((pid) =>
          makeProcess({ process_id: pid, workstream_id: pid.split("-")[0] })
        ),
      ],
    };
    const errors = validateAssignment(assignment, makeTaxonomy(), TAXONOMY_REL_PATH);
    const primaryError = errors.find(
      (e) => e.process_id === "CDI-1" && e.field === "primary_workflow_phase"
    );
    expect(primaryError).toBeDefined();
    expect(primaryError?.message).toContain("Decide/Plan");
  });
});

// ---------------------------------------------------------------------------
// TC-05-04: Duplicate process ID → error
// ---------------------------------------------------------------------------

describe("TC-05-04: duplicate process ID", () => {
  it("reports duplicate process_id", () => {
    const assignment: ProcessAssignment = {
      ...makeFullAssignment(),
      processes: [
        makeProcess({ process_id: "CDI-1" }),
        makeProcess({ process_id: "CDI-1" }), // duplicate
        ...CANONICAL_PROCESS_IDS.slice(1).map((pid) =>
          makeProcess({ process_id: pid, workstream_id: pid.split("-")[0] })
        ),
      ],
    };
    const errors = validateAssignment(assignment, makeTaxonomy(), TAXONOMY_REL_PATH);
    const dupError = errors.find(
      (e) => e.process_id === "CDI-1" && e.field === "process_id" && e.message.includes("duplicate")
    );
    expect(dupError).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// TC-05-05: Unsorted phases/process rows → error with normalization guidance
// ---------------------------------------------------------------------------

describe("TC-05-05: unsorted phases and process rows", () => {
  it("reports error when workflow_phases are in wrong execution order", () => {
    const assignment: ProcessAssignment = {
      ...makeFullAssignment(),
      processes: [
        makeProcess({
          process_id: "CDI-1",
          // Decide/Plan (order=2) before Sense (order=1) — wrong order
          workflow_phases: ["Decide/Plan", "Sense"],
          primary_workflow_phase: "Decide/Plan",
        }),
        ...CANONICAL_PROCESS_IDS.slice(1).map((pid) =>
          makeProcess({ process_id: pid, workstream_id: pid.split("-")[0] })
        ),
      ],
    };
    const errors = validateAssignment(assignment, makeTaxonomy(), TAXONOMY_REL_PATH);
    const orderError = errors.find(
      (e) => e.process_id === "CDI-1" && e.field === "workflow_phases" &&
        e.message.includes("ascending execution order")
    );
    expect(orderError).toBeDefined();
    expect(orderError?.message).toContain("re-sort");
  });

  it("reports error when process rows are out of canonical order", () => {
    // Put DATA-1 before CDI-1 (out of canonical order)
    const processes = CANONICAL_PROCESS_IDS.map((pid) =>
      makeProcess({ process_id: pid, workstream_id: pid.split("-")[0] })
    );
    // Swap CDI-1 (index 0) and DATA-1 (index 24)
    [processes[0], processes[24]] = [processes[24], processes[0]];
    const assignment = { ...makeFullAssignment(), processes };
    const errors = validateAssignment(assignment, makeTaxonomy(), TAXONOMY_REL_PATH);
    const rowOrderError = errors.find(
      (e) => e.field === "process_id" && e.message.includes("canonical order")
    );
    expect(rowOrderError).toBeDefined();
    expect(rowOrderError?.message).toContain("CDI→OFF→GTM→OPS→CX→FIN→DATA");
  });
});

// ---------------------------------------------------------------------------
// TC-05-06: Invalid activation token or missing activation_condition
// ---------------------------------------------------------------------------

describe("TC-05-06: activation semantics", () => {
  it("reports error for unknown activation token", () => {
    const assignment: ProcessAssignment = {
      ...makeFullAssignment(),
      processes: [
        makeProcess({
          process_id: "CDI-1",
          activation: "weekly" as never,
          activation_condition: null,
        }),
        ...CANONICAL_PROCESS_IDS.slice(1).map((pid) =>
          makeProcess({ process_id: pid, workstream_id: pid.split("-")[0] })
        ),
      ],
    };
    const errors = validateAssignment(assignment, makeTaxonomy(), TAXONOMY_REL_PATH);
    const activationError = errors.find(
      (e) => e.process_id === "CDI-1" && e.field === "activation"
    );
    expect(activationError).toBeDefined();
    expect(activationError?.message).toContain("weekly");
  });

  it("reports error when conditional has null activation_condition", () => {
    const assignment: ProcessAssignment = {
      ...makeFullAssignment(),
      processes: [
        makeProcess({
          process_id: "CDI-1",
          activation: "conditional",
          activation_condition: null,
        }),
        ...CANONICAL_PROCESS_IDS.slice(1).map((pid) =>
          makeProcess({ process_id: pid, workstream_id: pid.split("-")[0] })
        ),
      ],
    };
    const errors = validateAssignment(assignment, makeTaxonomy(), TAXONOMY_REL_PATH);
    const condError = errors.find(
      (e) => e.process_id === "CDI-1" && e.field === "activation_condition"
    );
    expect(condError).toBeDefined();
    expect(condError?.message).toContain("requires a non-empty activation_condition");
  });

  it("reports error when exception_only has empty activation_condition", () => {
    const assignment: ProcessAssignment = {
      ...makeFullAssignment(),
      processes: [
        makeProcess({
          process_id: "CDI-1",
          activation: "exception_only",
          activation_condition: "   ",
        }),
        ...CANONICAL_PROCESS_IDS.slice(1).map((pid) =>
          makeProcess({ process_id: pid, workstream_id: pid.split("-")[0] })
        ),
      ],
    };
    const errors = validateAssignment(assignment, makeTaxonomy(), TAXONOMY_REL_PATH);
    const condError = errors.find(
      (e) => e.process_id === "CDI-1" && e.field === "activation_condition"
    );
    expect(condError).toBeDefined();
  });

  it("reports error when always has non-null activation_condition", () => {
    const assignment: ProcessAssignment = {
      ...makeFullAssignment(),
      processes: [
        makeProcess({
          process_id: "CDI-1",
          activation: "always",
          activation_condition: "should be null",
        }),
        ...CANONICAL_PROCESS_IDS.slice(1).map((pid) =>
          makeProcess({ process_id: pid, workstream_id: pid.split("-")[0] })
        ),
      ],
    };
    const errors = validateAssignment(assignment, makeTaxonomy(), TAXONOMY_REL_PATH);
    const condError = errors.find(
      (e) => e.process_id === "CDI-1" && e.field === "activation_condition"
    );
    expect(condError).toBeDefined();
    expect(condError?.message).toContain("null");
  });
});

// ---------------------------------------------------------------------------
// TC-05-07: Taxonomy enum source mismatch → error reports taxonomy file path
// ---------------------------------------------------------------------------

describe("TC-05-07: taxonomy enum source mismatch", () => {
  it("reports taxonomy file path in error when workstream_id is not in taxonomy", () => {
    const assignment: ProcessAssignment = {
      ...makeFullAssignment(),
      processes: [
        makeProcess({ process_id: "CDI-1", workstream_id: "MYSTERY_WS" }),
        ...CANONICAL_PROCESS_IDS.slice(1).map((pid) =>
          makeProcess({ process_id: pid, workstream_id: pid.split("-")[0] })
        ),
      ],
    };
    const errors = validateAssignment(assignment, makeTaxonomy(), TAXONOMY_REL_PATH);
    const wsError = errors.find(
      (e) => e.process_id === "CDI-1" && e.field === "workstream_id"
    );
    expect(wsError).toBeDefined();
    expect(wsError?.message).toContain(TAXONOMY_REL_PATH);
  });

  it("reports taxonomy file path in error when workflow phase is not in taxonomy", () => {
    const assignment: ProcessAssignment = {
      ...makeFullAssignment(),
      processes: [
        makeProcess({
          process_id: "CDI-1",
          workflow_phases: ["PHANTOM_PHASE"],
          primary_workflow_phase: "PHANTOM_PHASE",
        }),
        ...CANONICAL_PROCESS_IDS.slice(1).map((pid) =>
          makeProcess({ process_id: pid, workstream_id: pid.split("-")[0] })
        ),
      ],
    };
    const errors = validateAssignment(assignment, makeTaxonomy(), TAXONOMY_REL_PATH);
    const phaseError = errors.find(
      (e) => e.process_id === "CDI-1" && e.field === "workflow_phases"
    );
    expect(phaseError).toBeDefined();
    expect(phaseError?.message).toContain(TAXONOMY_REL_PATH);
  });

  it("returns taxonomy error when taxonomy structure is invalid", () => {
    const errors = validateAssignment(
      makeFullAssignment(),
      { schema_version: "2.0" }, // missing workstreams/workflow_phases/activation_tokens
      TAXONOMY_REL_PATH
    );
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].field).toBe("taxonomy");
    expect(errors[0].message).toContain(TAXONOMY_REL_PATH);
  });
});

// ---------------------------------------------------------------------------
// Error determinism: same input produces same ordered error list
// ---------------------------------------------------------------------------

describe("Error determinism", () => {
  it("produces same error list on two calls with identical invalid input", () => {
    const assignment: ProcessAssignment = {
      ...makeFullAssignment(),
      processes: [
        makeProcess({ process_id: "CDI-1", workstream_id: "BAD_WS" }),
        makeProcess({ process_id: "CDI-1" }), // duplicate
        ...CANONICAL_PROCESS_IDS.slice(1).map((pid) =>
          makeProcess({ process_id: pid, workstream_id: pid.split("-")[0] })
        ),
      ],
    };
    const errors1 = validateAssignment(assignment, makeTaxonomy(), TAXONOMY_REL_PATH);
    const errors2 = validateAssignment(assignment, makeTaxonomy(), TAXONOMY_REL_PATH);
    expect(errors1).toEqual(errors2);
  });
});

// ---------------------------------------------------------------------------
// Live fixture: real process-assignment-v2.yaml passes validation
// ---------------------------------------------------------------------------

describe("Live fixture: process-assignment-v2.yaml", () => {
  it("validates the committed assignment matrix with no errors", async () => {
    const { readFileSync } = await import("node:fs");
    const path = await import("node:path");
    const { load: loadYaml } = await import("js-yaml");

    const repoRoot = path.resolve(__dirname, "../../../..");
    const assignmentPath = path.join(
      repoRoot,
      "docs/business-os/startup-loop/process-assignment-v2.yaml"
    );
    const taxonomyPath = path.join(
      repoRoot,
      "docs/business-os/startup-loop/workstream-workflow-taxonomy-v2.yaml"
    );
    const taxonomyRelPath = path.relative(repoRoot, taxonomyPath).replace(/\\/g, "/");

    const assignment = loadYaml(readFileSync(assignmentPath, "utf8"));
    const taxonomy = loadYaml(readFileSync(taxonomyPath, "utf8"));

    const errors = validateAssignment(assignment, taxonomy, taxonomyRelPath);

    if (errors.length > 0) {
      // Fail with a descriptive message listing all errors
      const messages = errors.map((e) => `  ${e.process_id}[${e.field}]: ${e.message}`);
      throw new Error(`process-assignment-v2.yaml has ${errors.length} validation error(s):\n${messages.join("\n")}`);
    }

    expect(errors).toHaveLength(0);
  });
});
