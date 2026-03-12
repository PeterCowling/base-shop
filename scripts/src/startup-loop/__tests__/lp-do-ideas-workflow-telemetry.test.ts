import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { describe, expect, it } from "@jest/globals";

import type { CheckResultSummary } from "../ideas/lp-do-ideas-workflow-telemetry.js";
import {
  appendWorkflowStepTelemetry,
  buildWorkflowStepTelemetryRecord,
  readWorkflowStepTelemetry,
  summarizeWorkflowStepTelemetry,
} from "../ideas/lp-do-ideas-workflow-telemetry.js";

function makeTmpDir(): string {
  const dir = join(tmpdir(), `workflow-telemetry-${randomBytes(4).toString("hex")}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function writeFile(rootDir: string, relativePath: string, content: string): string {
  const fullPath = join(rootDir, relativePath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content, "utf-8");
  return fullPath;
}

function writeCodexSessionLog(
  rootDir: string,
  threadId: string,
  lines: string[],
): string {
  const sessionPath = join(
    rootDir,
    ".codex/sessions/2026/03/11",
    `rollout-2026-03-11T09-24-06-${threadId}.jsonl`,
  );
  mkdirSync(dirname(sessionPath), { recursive: true });
  writeFileSync(sessionPath, `${lines.join("\n")}\n`, "utf-8");
  return sessionPath;
}

function writeClaudeTelemetryLog(
  rootDir: string,
  sessionId: string,
  lines: string[],
): string {
  const telemetryPath = join(
    rootDir,
    ".claude/telemetry",
    `1p_failed_events.${sessionId}.fixture.json`,
  );
  mkdirSync(dirname(telemetryPath), { recursive: true });
  writeFileSync(telemetryPath, `${lines.join("\n")}\n`, "utf-8");
  return telemetryPath;
}

describe("lp-do-ideas workflow telemetry", () => {
  it("builds a workflow-step record from canonical stage paths", () => {
    const rootDir = makeTmpDir();
    writeFile(
      rootDir,
      ".claude/skills/lp-do-fact-find/SKILL.md",
      "# Fact-find skill\n",
    );
    writeFile(
      rootDir,
      ".claude/skills/lp-do-fact-find/modules/outcome-a-code.md",
      "# outcome-a-code\n",
    );
    writeFile(
      rootDir,
      "docs/plans/test-telemetry/fact-find.md",
      `---
Type: Fact-Find
Execution-Track: mixed
Deliverable-Type: multi-deliverable
---

# Test Fact Find
`,
    );
    writeFile(rootDir, "docs/notes/source.md", "source context\n");

    const record = buildWorkflowStepTelemetryRecord({
      stage: "lp-do-fact-find",
      featureSlug: "test-telemetry",
      rootDir,
      modules: ["modules/outcome-a-code.md"],
      inputPaths: ["docs/notes/source.md"],
      deterministicChecks: ["scripts/validate-fact-find.sh"],
      now: () => new Date("2026-03-11T10:00:00.000Z"),
    });

    expect(record.record_type).toBe("workflow_step");
    expect(record.stage).toBe("lp-do-fact-find");
    expect(record.feature_slug).toBe("test-telemetry");
    expect(record.artifact_path).toBe("docs/plans/test-telemetry/fact-find.md");
    expect(record.artifact_exists).toBe(true);
    expect(record.execution_track).toBe("mixed");
    expect(record.deliverable_type).toBe("multi-deliverable");
    expect(record.modules_loaded).toEqual(["modules/outcome-a-code.md"]);
    expect(record.module_count).toBe(1);
    expect(record.deterministic_checks).toEqual(["scripts/validate-fact-find.sh"]);
    expect(record.context_paths).toContain(".claude/skills/lp-do-fact-find/SKILL.md");
    expect(record.context_paths).toContain(
      ".claude/skills/lp-do-fact-find/modules/outcome-a-code.md",
    );
    expect(record.context_paths).toContain("docs/notes/source.md");
    expect(record.context_input_bytes).toBeGreaterThan(0);
    expect(record.telemetry_key).toHaveLength(64);
  });

  it("deduplicates identical workflow-step records on append", () => {
    const rootDir = makeTmpDir();
    const telemetryPath = join(rootDir, "telemetry.jsonl");
    const record = buildWorkflowStepTelemetryRecord({
      stage: "lp-do-plan",
      featureSlug: "test-telemetry",
      rootDir,
      notes: "first",
      now: () => new Date("2026-03-11T11:00:00.000Z"),
    });

    expect(appendWorkflowStepTelemetry(telemetryPath, [record])).toBe(1);
    expect(appendWorkflowStepTelemetry(telemetryPath, [record])).toBe(0);

    const stored = readWorkflowStepTelemetry(telemetryPath);
    expect(stored).toHaveLength(1);
    expect(stored[0]?.telemetry_key).toBe(record.telemetry_key);
  });

  it("summarizes per-stage workflow telemetry and ignores non-workflow lines", () => {
    const rootDir = makeTmpDir();
    const telemetryPath = join(rootDir, "telemetry.jsonl");

    const factFindRecord = buildWorkflowStepTelemetryRecord({
      stage: "lp-do-fact-find",
      featureSlug: "test-telemetry",
      rootDir,
      modules: ["modules/outcome-a-code.md"],
      inputPaths: [],
      modelInputTokens: 120,
      modelOutputTokens: 60,
      tokenSource: "operator_provided",
      now: () => new Date("2026-03-11T12:00:00.000Z"),
    });
    const planRecord = buildWorkflowStepTelemetryRecord({
      stage: "lp-do-plan",
      featureSlug: "test-telemetry",
      rootDir,
      modules: ["modules/plan-code.md", "../_shared/engineering-coverage-matrix.md"],
      deterministicChecks: ["scripts/validate-plan.sh", "scripts/validate-engineering-coverage.sh"],
      now: () => new Date("2026-03-11T12:05:00.000Z"),
    });

    appendWorkflowStepTelemetry(telemetryPath, [factFindRecord, planRecord]);
    const raw = readFileSync(telemetryPath, "utf-8");
    writeFileSync(
      telemetryPath,
      `${raw}${JSON.stringify({ recorded_at: "2026-03-11T12:06:00.000Z", kind: "enqueued" })}\n`,
      "utf-8",
    );

    const summary = summarizeWorkflowStepTelemetry(readWorkflowStepTelemetry(telemetryPath), {
      featureSlug: "test-telemetry",
    });

    expect(summary.record_count).toBe(2);
    expect(summary.stages_covered).toEqual(["lp-do-fact-find", "lp-do-plan"]);
    expect(summary.totals.token_measurement_count).toBe(1);
    expect(summary.gaps.stages_missing_records).toContain("lp-do-build");
    expect(summary.by_stage.find((entry) => entry.stage === "lp-do-plan")?.record_count).toBe(1);
  });

  it("captures Codex runtime token usage and upgrades from last-response fallback to delta mode", () => {
    const rootDir = makeTmpDir();
    const telemetryPath = join(rootDir, "telemetry.jsonl");
    const runtimeTokenEnv = { CODEX_THREAD_ID: "thread-123" } as NodeJS.ProcessEnv;

    writeFile(rootDir, ".claude/skills/lp-do-ideas/SKILL.md", "# Ideas skill\n");
    writeFile(rootDir, ".claude/skills/lp-do-fact-find/SKILL.md", "# Fact-find skill\n");
    writeFile(
      rootDir,
      "docs/plans/test-telemetry/fact-find.md",
      `---
Type: Fact-Find
Execution-Track: mixed
Deliverable-Type: multi-deliverable
---

# Test Fact Find
`,
    );

    writeCodexSessionLog(rootDir, "thread-123", [
      JSON.stringify({
        timestamp: "2026-03-11T10:00:00.000Z",
        type: "session_meta",
        payload: { id: "thread-123" },
      }),
      JSON.stringify({
        timestamp: "2026-03-11T10:01:00.000Z",
        type: "event_msg",
        payload: {
          type: "token_count",
          info: {
            total_token_usage: {
              input_tokens: 1000,
              output_tokens: 200,
            },
            last_token_usage: {
              input_tokens: 140,
              output_tokens: 28,
            },
          },
        },
      }),
    ]);

    const ideasRecord = buildWorkflowStepTelemetryRecord({
      stage: "lp-do-ideas",
      featureSlug: "test-telemetry",
      telemetryPath,
      rootDir,
      runtimeTokenEnv,
      codexSessionsRoot: join(rootDir, ".codex/sessions"),
      now: () => new Date("2026-03-11T10:01:05.000Z"),
    });
    appendWorkflowStepTelemetry(telemetryPath, [ideasRecord]);

    expect(ideasRecord.token_source).toBe("api_usage");
    expect(ideasRecord.model_input_tokens).toBe(140);
    expect(ideasRecord.model_output_tokens).toBe(28);
    expect(ideasRecord.runtime_usage_mode).toBe("last_response_fallback");
    expect(ideasRecord.runtime_total_input_tokens).toBe(1000);
    expect(ideasRecord.runtime_total_output_tokens).toBe(200);

    writeCodexSessionLog(rootDir, "thread-123", [
      JSON.stringify({
        timestamp: "2026-03-11T10:00:00.000Z",
        type: "session_meta",
        payload: { id: "thread-123" },
      }),
      JSON.stringify({
        timestamp: "2026-03-11T10:01:00.000Z",
        type: "event_msg",
        payload: {
          type: "token_count",
          info: {
            total_token_usage: {
              input_tokens: 1000,
              output_tokens: 200,
            },
            last_token_usage: {
              input_tokens: 140,
              output_tokens: 28,
            },
          },
        },
      }),
      JSON.stringify({
        timestamp: "2026-03-11T10:05:00.000Z",
        type: "event_msg",
        payload: {
          type: "token_count",
          info: {
            total_token_usage: {
              input_tokens: 1640,
              output_tokens: 320,
            },
            last_token_usage: {
              input_tokens: 310,
              output_tokens: 46,
            },
          },
        },
      }),
    ]);

    const factFindRecord = buildWorkflowStepTelemetryRecord({
      stage: "lp-do-fact-find",
      featureSlug: "test-telemetry",
      telemetryPath,
      rootDir,
      runtimeTokenEnv,
      codexSessionsRoot: join(rootDir, ".codex/sessions"),
      now: () => new Date("2026-03-11T10:05:10.000Z"),
    });

    expect(factFindRecord.token_source).toBe("api_usage");
    expect(factFindRecord.model_input_tokens).toBe(640);
    expect(factFindRecord.model_output_tokens).toBe(120);
    expect(factFindRecord.runtime_usage_mode).toBe("delta_from_previous_feature_record");
    expect(factFindRecord.runtime_total_input_tokens).toBe(1640);
    expect(factFindRecord.runtime_total_output_tokens).toBe(320);
  });

  it("TC-01: populates per_module_bytes with resolved repo-relative paths and correct byte sizes", () => {
    const rootDir = makeTmpDir();
    const moduleContent = "# outcome-a-code module content\nSome details here.\n";
    writeFile(
      rootDir,
      ".claude/skills/lp-do-fact-find/SKILL.md",
      "# Fact-find skill\n",
    );
    writeFile(
      rootDir,
      ".claude/skills/lp-do-fact-find/modules/outcome-a-code.md",
      moduleContent,
    );
    writeFile(
      rootDir,
      "docs/plans/test-per-module/fact-find.md",
      `---
Type: Fact-Find
Execution-Track: code
Deliverable-Type: code-change
---

# Test
`,
    );

    const record = buildWorkflowStepTelemetryRecord({
      stage: "lp-do-fact-find",
      featureSlug: "test-per-module",
      rootDir,
      modules: ["modules/outcome-a-code.md"],
      now: () => new Date("2026-03-12T10:00:00.000Z"),
    });

    expect(record.per_module_bytes).toBeDefined();
    expect(record.per_module_bytes).toEqual({
      ".claude/skills/lp-do-fact-find/modules/outcome-a-code.md":
        Buffer.byteLength(moduleContent, "utf-8"),
    });
  });

  it("TC-02: records per_module_bytes as empty object when zero modules loaded", () => {
    const rootDir = makeTmpDir();
    writeFile(rootDir, ".claude/skills/lp-do-plan/SKILL.md", "# Plan skill\n");

    const record = buildWorkflowStepTelemetryRecord({
      stage: "lp-do-plan",
      featureSlug: "test-zero-modules",
      rootDir,
      modules: [],
      now: () => new Date("2026-03-12T10:00:00.000Z"),
    });

    expect(record.per_module_bytes).toEqual({});
  });

  it("TC-03: dedupe regression — different per-module distributions produce different telemetry keys", () => {
    const rootDir = makeTmpDir();
    const telemetryPath = join(rootDir, "telemetry.jsonl");
    writeFile(rootDir, ".claude/skills/lp-do-plan/SKILL.md", "# Plan skill\n");
    writeFile(
      rootDir,
      ".claude/skills/lp-do-plan/modules/plan-code.md",
      "A".repeat(100),
    );
    writeFile(
      rootDir,
      ".claude/skills/lp-do-plan/modules/plan-business.md",
      "B".repeat(100),
    );

    const recordA = buildWorkflowStepTelemetryRecord({
      stage: "lp-do-plan",
      featureSlug: "test-dedupe",
      rootDir,
      modules: ["modules/plan-code.md"],
      now: () => new Date("2026-03-12T10:00:00.000Z"),
    });
    const recordB = buildWorkflowStepTelemetryRecord({
      stage: "lp-do-plan",
      featureSlug: "test-dedupe",
      rootDir,
      modules: ["modules/plan-business.md"],
      now: () => new Date("2026-03-12T10:00:00.000Z"),
    });

    expect(recordA.telemetry_key).not.toBe(recordB.telemetry_key);

    expect(appendWorkflowStepTelemetry(telemetryPath, [recordA])).toBe(1);
    expect(appendWorkflowStepTelemetry(telemetryPath, [recordB])).toBe(1);

    const stored = readWorkflowStepTelemetry(telemetryPath);
    expect(stored).toHaveLength(2);
  });

  it("captures Claude runtime token usage when an explicit Claude session id is provided", () => {
    const rootDir = makeTmpDir();
    const telemetryPath = join(rootDir, "telemetry.jsonl");
    const claudeSessionId = "claude-session-123";

    writeFile(rootDir, ".claude/skills/lp-do-ideas/SKILL.md", "# Ideas skill\n");
    writeFile(rootDir, ".claude/skills/lp-do-plan/SKILL.md", "# Plan skill\n");
    writeFile(
      rootDir,
      "docs/plans/test-telemetry/plan.md",
      `---
Type: Plan
Execution-Track: mixed
Deliverable-Type: multi-deliverable
---

# Test Plan
`,
    );

    writeClaudeTelemetryLog(rootDir, claudeSessionId, [
      JSON.stringify({
        event_data: {
          event_name: "tengu_api_success",
          client_timestamp: "2026-03-11T10:00:00.000Z",
          session_id: claudeSessionId,
          additional_metadata: JSON.stringify({
            cachedInputTokens: 100,
            uncachedInputTokens: 40,
            inputTokens: 2,
            outputTokens: 20,
          }),
        },
      }),
    ]);

    const ideasRecord = buildWorkflowStepTelemetryRecord({
      stage: "lp-do-ideas",
      featureSlug: "test-telemetry",
      telemetryPath,
      rootDir,
      claudeSessionId,
      claudeTelemetryRoot: join(rootDir, ".claude/telemetry"),
      now: () => new Date("2026-03-11T10:00:05.000Z"),
    });
    appendWorkflowStepTelemetry(telemetryPath, [ideasRecord]);

    expect(ideasRecord.runtime_usage_provider).toBe("claude");
    expect(ideasRecord.token_source).toBe("api_usage");
    expect(ideasRecord.model_input_tokens).toBe(142);
    expect(ideasRecord.model_output_tokens).toBe(20);
    expect(ideasRecord.runtime_usage_mode).toBe("last_response_fallback");
    expect(ideasRecord.runtime_total_input_tokens).toBe(142);
    expect(ideasRecord.runtime_total_output_tokens).toBe(20);

    writeClaudeTelemetryLog(rootDir, claudeSessionId, [
      JSON.stringify({
        event_data: {
          event_name: "tengu_api_success",
          client_timestamp: "2026-03-11T10:00:00.000Z",
          session_id: claudeSessionId,
          additional_metadata: JSON.stringify({
            cachedInputTokens: 100,
            uncachedInputTokens: 40,
            inputTokens: 2,
            outputTokens: 20,
          }),
        },
      }),
      JSON.stringify({
        event_data: {
          event_name: "tengu_api_success",
          client_timestamp: "2026-03-11T10:05:00.000Z",
          session_id: claudeSessionId,
          additional_metadata: JSON.stringify({
            cachedInputTokens: 80,
            uncachedInputTokens: 15,
            inputTokens: 1,
            outputTokens: 18,
          }),
        },
      }),
    ]);

    const planRecord = buildWorkflowStepTelemetryRecord({
      stage: "lp-do-plan",
      featureSlug: "test-telemetry",
      telemetryPath,
      rootDir,
      claudeSessionId,
      claudeTelemetryRoot: join(rootDir, ".claude/telemetry"),
      now: () => new Date("2026-03-11T10:05:05.000Z"),
    });

    expect(planRecord.runtime_usage_provider).toBe("claude");
    expect(planRecord.token_source).toBe("api_usage");
    expect(planRecord.model_input_tokens).toBe(96);
    expect(planRecord.model_output_tokens).toBe(18);
    expect(planRecord.runtime_usage_mode).toBe("delta_from_previous_feature_record");
    expect(planRecord.runtime_total_input_tokens).toBe(238);
    expect(planRecord.runtime_total_output_tokens).toBe(38);
  });

  it("TC-01: populates deterministic_check_results from --check-result flag format", () => {
    const rootDir = makeTmpDir();
    writeFile(rootDir, ".claude/skills/lp-do-fact-find/SKILL.md", "# FF\n");
    writeFile(
      rootDir,
      "docs/plans/test-check-result/fact-find.md",
      "---\nType: Fact-Find\n---\n# Test\n",
    );

    const record = buildWorkflowStepTelemetryRecord({
      stage: "lp-do-fact-find",
      featureSlug: "test-check-result",
      rootDir,
      deterministicChecks: ["scripts/validate-fact-find.sh"],
      checkResults: ["validate-fact-find.sh:pass:0:2"],
      now: () => new Date("2026-03-12T10:00:00.000Z"),
    });

    expect(record.deterministic_check_results).toBeDefined();
    expect(record.deterministic_check_results).toEqual({
      "validate-fact-find.sh": {
        valid: true,
        error_count: 0,
        warning_count: 2,
      } satisfies CheckResultSummary,
    });
  });

  it("TC-02: populates deterministic_check_results from multiple --check-result flags", () => {
    const rootDir = makeTmpDir();
    writeFile(rootDir, ".claude/skills/lp-do-plan/SKILL.md", "# Plan\n");

    const record = buildWorkflowStepTelemetryRecord({
      stage: "lp-do-plan",
      featureSlug: "test-multi-check",
      rootDir,
      checkResults: [
        "validate-plan.sh:pass:0:0",
        "validate-engineering-coverage.sh:fail:3:1",
      ],
      now: () => new Date("2026-03-12T10:00:00.000Z"),
    });

    expect(record.deterministic_check_results).toEqual({
      "validate-plan.sh": { valid: true, error_count: 0, warning_count: 0 },
      "validate-engineering-coverage.sh": { valid: false, error_count: 3, warning_count: 1 },
    });
  });

  it("TC-03: deterministic_check_results is undefined when no --check-result flags provided", () => {
    const rootDir = makeTmpDir();
    writeFile(rootDir, ".claude/skills/lp-do-plan/SKILL.md", "# Plan\n");

    const record = buildWorkflowStepTelemetryRecord({
      stage: "lp-do-plan",
      featureSlug: "test-no-check-result",
      rootDir,
      now: () => new Date("2026-03-12T10:00:00.000Z"),
    });

    expect(record.deterministic_check_results).toBeUndefined();
  });

  it("TC-04: different deterministic_check_results produce different telemetry keys", () => {
    const rootDir = makeTmpDir();
    writeFile(rootDir, ".claude/skills/lp-do-plan/SKILL.md", "# Plan\n");

    const recordA = buildWorkflowStepTelemetryRecord({
      stage: "lp-do-plan",
      featureSlug: "test-dedupe-results",
      rootDir,
      deterministicChecks: ["validate-plan.sh"],
      checkResults: ["validate-plan.sh:pass:0:0"],
      now: () => new Date("2026-03-12T10:00:00.000Z"),
    });
    const recordB = buildWorkflowStepTelemetryRecord({
      stage: "lp-do-plan",
      featureSlug: "test-dedupe-results",
      rootDir,
      deterministicChecks: ["validate-plan.sh"],
      checkResults: ["validate-plan.sh:fail:2:1"],
      now: () => new Date("2026-03-12T10:00:00.000Z"),
    });

    expect(recordA.telemetry_key).not.toBe(recordB.telemetry_key);
  });
});
