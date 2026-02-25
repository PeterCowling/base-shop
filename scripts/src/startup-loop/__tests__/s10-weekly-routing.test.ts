/**
 * SIGNALS Weekly Routing — Compatibility Regression Checks
 *
 * TC-06-01: Stage contract stability — SIGNALS stage order/ID/skill unchanged
 * TC-06-02: Authority boundary — prompt authority references preserved;
 *           /lp-weekly dispatch present with Phase 0 fallback; no conflicting authority text
 *
 * TASK-06: startup-loop-s10-weekly-orchestration plan
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { describe, expect, it } from "@jest/globals";

const REPO_ROOT = path.resolve(__dirname, "../../../../");

// ── TC-06-01: Stage contract stability ───────────────────────────────────────

describe("TC-06-01: SIGNALS stage contract stability (loop-spec.yaml)", () => {
  const loopSpecPath = path.join(REPO_ROOT, "docs/business-os/startup-loop/loop-spec.yaml");
  const signalsStageBlock = (raw: string): string | null => {
    const lines = raw.split("\n");
    const start = lines.findIndex((line) => line.trim() === "- id: SIGNALS");
    if (start === -1) {
      return null;
    }

    let end = lines.length;
    for (let i = start + 1; i < lines.length; i += 1) {
      if (lines[i].startsWith("  - id: ")) {
        end = i;
        break;
      }
      if (lines[i].startsWith("dag:")) {
        end = i;
        break;
      }
    }

    return lines.slice(start, end).join("\n");
  };

  it("loop-spec.yaml is readable", () => {
    expect(() => fs.readFileSync(loopSpecPath, "utf8")).not.toThrow();
  });

  it("SIGNALS stage ID is present and unchanged", () => {
    const raw = fs.readFileSync(loopSpecPath, "utf8");
    expect(raw).toContain("id: SIGNALS");
  });

  it("SIGNALS skill remains /lp-experiment (no Phase 2 remap applied)", () => {
    const raw = fs.readFileSync(loopSpecPath, "utf8");
    const block = signalsStageBlock(raw);
    expect(block).not.toBeNull();
    expect(block).toContain("skill: /lp-experiment");
  });

  it("SIGNALS prompt_template remains weekly-kpcs-decision-prompt.md", () => {
    const raw = fs.readFileSync(loopSpecPath, "utf8");
    const block = signalsStageBlock(raw);
    expect(block).not.toBeNull();
    expect(block).toContain("prompt_template: weekly-kpcs-decision-prompt.md");
  });

  it("S9B→SIGNALS DAG edge is preserved", () => {
    const raw = fs.readFileSync(loopSpecPath, "utf8");
    // DAG edge is represented as [S9B, SIGNALS] in the edges list
    expect(raw).toContain("[S9B, SIGNALS]");
  });

  it("total stage count is 69 (matches current loop-spec contract)", () => {
    const raw = fs.readFileSync(loopSpecPath, "utf8");
    const idMatches = raw.match(/^\s+- id: [A-Z][A-Z0-9-]*/gm);
    expect(idMatches).not.toBeNull();
    expect(idMatches!.length).toBe(69); // Includes ASSESSMENT, IDEAS, MEASURE, PRODUCT, PRODUCTS, LOGISTICS, MARKET, SELL, WEBSITE, and downstream stages.
  });
});

// ── TC-06-02: Authority boundary ─────────────────────────────────────────────

describe("TC-06-02: authority boundary (cmd-advance.md + startup-loop SKILL.md)", () => {
  const cmdAdvancePath = path.join(REPO_ROOT, ".claude/skills/startup-loop/modules/cmd-advance.md");
  const skillPath = path.join(REPO_ROOT, ".claude/skills/startup-loop/SKILL.md");

  it("cmd-advance.md is readable", () => {
    expect(() => fs.readFileSync(cmdAdvancePath, "utf8")).not.toThrow();
  });

  it("cmd-advance.md references /lp-weekly as Phase 1 SIGNALS dispatch", () => {
    const raw = fs.readFileSync(cmdAdvancePath, "utf8");
    expect(raw).toContain("/lp-weekly");
  });

  it("cmd-advance.md retains explicit Phase 0 fallback path language", () => {
    const raw = fs.readFileSync(cmdAdvancePath, "utf8");
    // The Phase 0 fallback ensures authority separation is preserved
    expect(raw).toContain("Phase 0 fallback");
  });

  it("cmd-advance.md preserves GATE-BD-08 reference (existing gate unchanged)", () => {
    const raw = fs.readFileSync(cmdAdvancePath, "utf8");
    expect(raw).toContain("GATE-BD-08");
  });

  it("cmd-advance.md preserves weekly-kpcs prompt authority reference", () => {
    const raw = fs.readFileSync(cmdAdvancePath, "utf8");
    // cmd-advance.md refers to KPCS authority via "weekly-kpcs prompt" (GATE-LOOP-GAP-03)
    // and "KPCS decision" (S10 Phase 1 dispatch block). Either phrasing confirms authority preservation.
    expect(raw).toContain("weekly-kpcs");
  });

  it("SKILL.md still references /lp-experiment for SIGNALS (sub-flow not removed)", () => {
    const raw = fs.readFileSync(skillPath, "utf8");
    expect(raw).toContain("/lp-experiment");
  });

  it("SKILL.md references /lp-weekly as Phase 1 default for SIGNALS", () => {
    const raw = fs.readFileSync(skillPath, "utf8");
    expect(raw).toContain("/lp-weekly");
  });

  it("SIGNALS row in SKILL.md includes both /lp-experiment and /lp-weekly (dual reference)", () => {
    const raw = fs.readFileSync(skillPath, "utf8");
    // Match the full SIGNALS table row to end of line (no newlines in a markdown table row)
    const s10RowMatch = raw.match(/\|\s*SIGNALS\s*\|[^\n]*/);
    expect(s10RowMatch).not.toBeNull();
    const s10Row = s10RowMatch![0];
    expect(s10Row).toContain("lp-experiment");
    expect(s10Row).toContain("lp-weekly");
  });
});

describe("TC-08-01: weekly learning payload contract (weekly-kpcs prompt)", () => {
  const promptPath = path.join(
    REPO_ROOT,
    "docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md",
  );

  it("weekly-kpcs prompt is readable", () => {
    expect(() => fs.readFileSync(promptPath, "utf8")).not.toThrow();
  });

  it("output format still includes Sections A-H and adds mandatory Section I", () => {
    const raw = fs.readFileSync(promptPath, "utf8");
    expect(raw).toContain("A) KPI Denominator Validity");
    expect(raw).toContain("H) Weekly Audit Compliance");
    expect(raw).toContain("I) Weekly Learning Payload (mandatory)");
  });

  it("Section I requires tested/learned/changed/stop-next-week/no-test reason fields", () => {
    const raw = fs.readFileSync(promptPath, "utf8");
    expect(raw).toContain("Section I — Weekly Learning Payload (mandatory)");
    expect(raw).toContain("`tested`");
    expect(raw).toContain("`learned`");
    expect(raw).toContain("`changed`");
    expect(raw).toContain("`stop-next-week`");
    expect(raw).toContain("`no-test reason`");
  });
});
