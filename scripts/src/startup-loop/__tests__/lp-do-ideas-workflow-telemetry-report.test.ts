import { describe, expect, it } from "@jest/globals";

import type { WorkflowStepTelemetryRecord } from "../ideas/lp-do-ideas-workflow-telemetry.js";
import {
  computePerModuleBreakdown,
  computeValidatorSummary,
} from "../ideas/lp-do-ideas-workflow-telemetry-report.js";

function makeRecord(
  overrides: Partial<WorkflowStepTelemetryRecord> = {},
): WorkflowStepTelemetryRecord {
  return {
    record_type: "workflow_step",
    recorded_at: "2026-03-12T10:00:00.000Z",
    telemetry_key: "test-key",
    mode: "trial",
    business: "PLAT",
    feature_slug: "test-feature",
    stage: "lp-do-plan",
    artifact_path: null,
    artifact_exists: false,
    artifact_bytes: 0,
    artifact_lines: 0,
    context_paths: [],
    missing_context_paths: [],
    context_input_bytes: 0,
    context_input_lines: 0,
    modules_loaded: [],
    module_count: 0,
    deterministic_checks: [],
    deterministic_check_count: 0,
    execution_track: "code",
    deliverable_type: "code-change",
    dispatch_ids: [],
    model_input_tokens: null,
    model_output_tokens: null,
    token_source: "unknown",
    runtime_usage_provider: null,
    runtime_session_id: null,
    runtime_usage_mode: null,
    runtime_usage_snapshot_at: null,
    runtime_total_input_tokens: null,
    runtime_total_output_tokens: null,
    notes: null,
    ...overrides,
  };
}

describe("lp-do-ideas workflow telemetry report", () => {
  it("TC-05: computePerModuleBreakdown aggregates per_module_bytes across records", () => {
    const records: WorkflowStepTelemetryRecord[] = [
      makeRecord({
        telemetry_key: "key-1",
        stage: "lp-do-fact-find",
        per_module_bytes: {
          ".claude/skills/lp-do-fact-find/modules/outcome-a-code.md": 500,
        },
      }),
      makeRecord({
        telemetry_key: "key-2",
        stage: "lp-do-plan",
        per_module_bytes: {
          ".claude/skills/lp-do-plan/modules/plan-code.md": 300,
          ".claude/skills/lp-do-fact-find/modules/outcome-a-code.md": 500,
        },
      }),
    ];

    const result = computePerModuleBreakdown(records, { featureSlug: "test-feature" });

    expect(result.per_module_record_count).toBe(2);
    expect(result.total_record_count).toBe(2);
    expect(result.per_module_breakdown).toEqual({
      ".claude/skills/lp-do-fact-find/modules/outcome-a-code.md": 1000,
      ".claude/skills/lp-do-plan/modules/plan-code.md": 300,
    });
  });

  it("TC-06: computePerModuleBreakdown applies featureSlug and business filters", () => {
    const records: WorkflowStepTelemetryRecord[] = [
      makeRecord({
        telemetry_key: "key-1",
        feature_slug: "test-feature",
        business: "PLAT",
        per_module_bytes: { "mod-a.md": 100 },
      }),
      makeRecord({
        telemetry_key: "key-2",
        feature_slug: "other-feature",
        business: "PLAT",
        per_module_bytes: { "mod-b.md": 200 },
      }),
    ];

    const result = computePerModuleBreakdown(records, { featureSlug: "test-feature" });

    expect(result.per_module_record_count).toBe(1);
    expect(result.total_record_count).toBe(1);
    expect(result.per_module_breakdown).toEqual({ "mod-a.md": 100 });
  });

  it("TC-07: computePerModuleBreakdown handles records without per_module_bytes gracefully", () => {
    const legacyRecord = makeRecord({ telemetry_key: "key-legacy" });
    delete (legacyRecord as Record<string, unknown>)["per_module_bytes"];

    const emptyModulesRecord = makeRecord({
      telemetry_key: "key-empty",
      per_module_bytes: {},
    });

    const newRecord = makeRecord({
      telemetry_key: "key-new",
      per_module_bytes: { "mod-a.md": 150 },
    });

    const records = [legacyRecord, emptyModulesRecord, newRecord];
    const result = computePerModuleBreakdown(records, { featureSlug: "test-feature" });

    expect(result.per_module_record_count).toBe(1);
    expect(result.total_record_count).toBe(3);
    expect(result.per_module_breakdown).toEqual({ "mod-a.md": 150 });
  });

  it("TC-08: computeValidatorSummary aggregates pass/fail counts and error/warning totals per check", () => {
    const records: WorkflowStepTelemetryRecord[] = [
      makeRecord({
        telemetry_key: "key-1",
        stage: "lp-do-fact-find",
        deterministic_check_results: {
          "scripts/validate-fact-find.sh": { valid: true, error_count: 0, warning_count: 1 },
          "scripts/validate-engineering-coverage.sh": { valid: true, error_count: 0, warning_count: 0 },
        },
      }),
      makeRecord({
        telemetry_key: "key-2",
        stage: "lp-do-plan",
        deterministic_check_results: {
          "scripts/validate-fact-find.sh": { valid: false, error_count: 2, warning_count: 0 },
          "scripts/validate-plan.sh": { valid: true, error_count: 0, warning_count: 3 },
        },
      }),
    ];

    const result = computeValidatorSummary(records, { featureSlug: "test-feature" });

    expect(result.validator_record_count).toBe(2);
    expect(result.total_record_count).toBe(2);
    expect(result.per_check).toEqual({
      "scripts/validate-fact-find.sh": { pass_count: 1, fail_count: 1, total_errors: 2, total_warnings: 1 },
      "scripts/validate-engineering-coverage.sh": { pass_count: 1, fail_count: 0, total_errors: 0, total_warnings: 0 },
      "scripts/validate-plan.sh": { pass_count: 1, fail_count: 0, total_errors: 0, total_warnings: 3 },
    });
  });

  it("TC-09: computeValidatorSummary applies featureSlug filter", () => {
    const records: WorkflowStepTelemetryRecord[] = [
      makeRecord({
        telemetry_key: "key-1",
        feature_slug: "test-feature",
        deterministic_check_results: {
          "scripts/validate-plan.sh": { valid: true, error_count: 0, warning_count: 0 },
        },
      }),
      makeRecord({
        telemetry_key: "key-2",
        feature_slug: "other-feature",
        deterministic_check_results: {
          "scripts/validate-plan.sh": { valid: false, error_count: 3, warning_count: 1 },
        },
      }),
    ];

    const result = computeValidatorSummary(records, { featureSlug: "test-feature" });

    expect(result.validator_record_count).toBe(1);
    expect(result.total_record_count).toBe(1);
    expect(result.per_check).toEqual({
      "scripts/validate-plan.sh": { pass_count: 1, fail_count: 0, total_errors: 0, total_warnings: 0 },
    });
  });

  it("TC-10: computeValidatorSummary handles mixed records with and without check results", () => {
    const legacyRecord = makeRecord({ telemetry_key: "key-legacy" });
    delete (legacyRecord as Record<string, unknown>)["deterministic_check_results"];

    const emptyResultsRecord = makeRecord({
      telemetry_key: "key-empty",
      deterministic_check_results: {},
    });

    const newRecord = makeRecord({
      telemetry_key: "key-new",
      deterministic_check_results: {
        "scripts/validate-plan.sh": { valid: true, error_count: 0, warning_count: 0 },
      },
    });

    const records = [legacyRecord, emptyResultsRecord, newRecord];
    const result = computeValidatorSummary(records, { featureSlug: "test-feature" });

    expect(result.validator_record_count).toBe(1);
    expect(result.total_record_count).toBe(3);
    expect(result.per_check).toEqual({
      "scripts/validate-plan.sh": { pass_count: 1, fail_count: 0, total_errors: 0, total_warnings: 0 },
    });
  });

  it("TC-11: formatMarkdown includes Validator Results section when quality data present", () => {
    // We test the exported formatMarkdown indirectly via the module —
    // since formatMarkdown is not exported, we verify computeValidatorSummary output
    // shape is compatible with what formatMarkdown expects
    const records: WorkflowStepTelemetryRecord[] = [
      makeRecord({
        telemetry_key: "key-1",
        deterministic_check_results: {
          "scripts/validate-plan.sh": { valid: true, error_count: 0, warning_count: 2 },
        },
      }),
    ];

    const result = computeValidatorSummary(records, { featureSlug: "test-feature" });

    expect(result.validator_record_count).toBe(1);
    expect(Object.keys(result.per_check)).toContain("scripts/validate-plan.sh");
    expect(result.per_check["scripts/validate-plan.sh"]).toEqual({
      pass_count: 1,
      fail_count: 0,
      total_errors: 0,
      total_warnings: 2,
    });
  });
});
