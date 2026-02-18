/**
 * S10 Weekly Routing — Compatibility Regression Checks
 *
 * TC-06-01: Stage contract stability — S10 stage order/ID/skill unchanged
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

describe("TC-06-01: S10 stage contract stability (loop-spec.yaml)", () => {
  const loopSpecPath = path.join(REPO_ROOT, "docs/business-os/startup-loop/loop-spec.yaml");

  it("loop-spec.yaml is readable", () => {
    expect(() => fs.readFileSync(loopSpecPath, "utf8")).not.toThrow();
  });

  it("S10 stage ID is present and unchanged", () => {
    const raw = fs.readFileSync(loopSpecPath, "utf8");
    expect(raw).toContain("id: S10");
  });

  it("S10 skill remains /lp-experiment (no Phase 2 remap applied)", () => {
    const raw = fs.readFileSync(loopSpecPath, "utf8");
    // Extract the S10 block to verify its specific skill field
    const s10BlockMatch = raw.match(/id: S10[\s\S]*?(?=\n  - id:|\ndag:|$)/);
    expect(s10BlockMatch).not.toBeNull();
    const s10Block = s10BlockMatch![0];
    expect(s10Block).toContain("skill: /lp-experiment");
  });

  it("S10 prompt_template remains weekly-kpcs-decision-prompt.md", () => {
    const raw = fs.readFileSync(loopSpecPath, "utf8");
    const s10BlockMatch = raw.match(/id: S10[\s\S]*?(?=\n  - id:|\ndag:|$)/);
    expect(s10BlockMatch).not.toBeNull();
    const s10Block = s10BlockMatch![0];
    expect(s10Block).toContain("prompt_template: weekly-kpcs-decision-prompt.md");
  });

  it("S9B→S10 DAG edge is preserved", () => {
    const raw = fs.readFileSync(loopSpecPath, "utf8");
    // DAG edge is represented as [S9B, S10] in the edges list
    expect(raw).toContain("[S9B, S10]");
  });

  it("total stage count is 17 (no new stages added or removed)", () => {
    const raw = fs.readFileSync(loopSpecPath, "utf8");
    const idMatches = raw.match(/^\s+- id: S\w+/gm);
    expect(idMatches).not.toBeNull();
    expect(idMatches!.length).toBe(17);
  });
});

// ── TC-06-02: Authority boundary ─────────────────────────────────────────────

describe("TC-06-02: authority boundary (cmd-advance.md + startup-loop SKILL.md)", () => {
  const cmdAdvancePath = path.join(REPO_ROOT, ".claude/skills/startup-loop/modules/cmd-advance.md");
  const skillPath = path.join(REPO_ROOT, ".claude/skills/startup-loop/SKILL.md");

  it("cmd-advance.md is readable", () => {
    expect(() => fs.readFileSync(cmdAdvancePath, "utf8")).not.toThrow();
  });

  it("cmd-advance.md references /lp-weekly as Phase 1 S10 dispatch", () => {
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

  it("SKILL.md still references /lp-experiment for S10 (sub-flow not removed)", () => {
    const raw = fs.readFileSync(skillPath, "utf8");
    expect(raw).toContain("/lp-experiment");
  });

  it("SKILL.md references /lp-weekly as Phase 1 default for S10", () => {
    const raw = fs.readFileSync(skillPath, "utf8");
    expect(raw).toContain("/lp-weekly");
  });

  it("S10 row in SKILL.md includes both /lp-experiment and /lp-weekly (dual reference)", () => {
    const raw = fs.readFileSync(skillPath, "utf8");
    // Match the full S10 table row to end of line (no newlines in a markdown table row)
    const s10RowMatch = raw.match(/\|\s*S10\s*\|[^\n]*/);
    expect(s10RowMatch).not.toBeNull();
    const s10Row = s10RowMatch![0];
    expect(s10Row).toContain("lp-experiment");
    expect(s10Row).toContain("lp-weekly");
  });
});
