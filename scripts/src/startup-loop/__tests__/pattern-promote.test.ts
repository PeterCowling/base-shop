/**
 * pattern-promote.test.ts
 *
 * Tests for lp-do-pattern-promote-loop-update.ts and
 * lp-do-pattern-promote-skill-proposal.ts.
 *
 * TC-01 through TC-15 per plan contract, plus anti-loop integration.
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { afterEach,beforeEach, describe, expect, test } from "@jest/globals";

import {
  filterByRoutingTarget,
  generateLoopUpdateDraft,
  parsePatternReflectionEntries,
  promoteLoopUpdateEntries,
} from "../build/lp-do-pattern-promote-loop-update.js";
import {
  deriveSkillName,
  generateSkillScaffold,
  promoteSkillProposalEntries,
} from "../build/lp-do-pattern-promote-skill-proposal.js";

/* ------------------------------------------------------------------ */
/*  Fixtures                                                           */
/* ------------------------------------------------------------------ */

const YAML_FORMAT_INPUT = `---
schema_version: pattern-reflection.v1
feature_slug: test-slug
generated_at: "2026-03-04T00:00:00Z"
entries:
  - pattern_summary: "Test loop update pattern"
    category: deterministic
    routing_target: loop_update
    occurrence_count: 3
    evidence_refs:
      - "docs/plans/test/fact-find.md"
  - pattern_summary: "Test skill proposal pattern"
    category: ad_hoc
    routing_target: skill_proposal
    occurrence_count: 2
    evidence_refs:
      - "docs/plans/test/results-review.user.md"
  - pattern_summary: "Test defer pattern"
    category: unclassified
    routing_target: defer
    occurrence_count: 1
    evidence_refs: []
---

# Pattern Reflection

## Patterns

- Test entries above

## Access Declarations

None identified.
`;

const BODY_FORMAT_INPUT = `---
Type: Pattern-Reflection
Status: Complete
Feature-Slug: test-body-format
---

# Pattern Reflection: test-body-format

## Patterns

### Entry 1

- **pattern_summary:** Queue pipeline writes processed_by before verifying artifact
- **category:** deterministic
- **routing_target:** loop_update
- **occurrence_count:** 1
- **evidence_refs:**
  - \`docs/plans/test/fact-find.md#root-cause\`
  - \`docs/plans/test/build-record.user.md\`

### Entry 2

- **pattern_summary:** Prose instruction files have no automated coverage
- **category:** ad_hoc
- **routing_target:** defer
- **occurrence_count:** 1
- **evidence_refs:**
  - \`docs/plans/test/results-review.user.md\`

## Access Declarations

None.
`;

const BODY_FORMAT_SKILL_PROPOSAL = `---
Type: Pattern-Reflection
Status: Draft
---

# Pattern Reflection

## Patterns

### Entry 1

- **pattern_summary:** Registry keyword sync gap
- **category:** deterministic
- **routing_target:** skill_proposal
- **occurrence_count:** 2
- **evidence_refs:**
  - \`docs/plans/test/plan.md\`

## Access Declarations

None.
`;

const ALL_DEFER_INPUT = `---
schema_version: pattern-reflection.v1
feature_slug: all-defer
generated_at: "2026-03-04T00:00:00Z"
entries:
  - pattern_summary: "Deferred entry 1"
    category: unclassified
    routing_target: defer
    occurrence_count: 1
    evidence_refs: []
  - pattern_summary: "Deferred entry 2"
    category: access_gap
    routing_target: defer
    occurrence_count: 1
    evidence_refs: []
---

# Pattern Reflection

## Patterns

None promoted.
`;

const MALFORMED_YAML_INPUT = `---
schema_version: pattern-reflection.v1
entries:
  - pattern_summary: "Valid entry"
    category: deterministic
    routing_target: loop_update
    occurrence_count: 3
    this is invalid yaml: [unclosed bracket
---

# Pattern Reflection
`;

const TWO_LOOP_ONE_SKILL = `---
schema_version: pattern-reflection.v1
feature_slug: mixed
generated_at: "2026-03-04T00:00:00Z"
entries:
  - pattern_summary: "First loop update"
    category: deterministic
    routing_target: loop_update
    occurrence_count: 3
    evidence_refs:
      - "docs/plans/test/a.md"
  - pattern_summary: "Second loop update"
    category: deterministic
    routing_target: loop_update
    occurrence_count: 4
    evidence_refs:
      - "docs/plans/test/b.md"
  - pattern_summary: "A skill proposal"
    category: ad_hoc
    routing_target: skill_proposal
    occurrence_count: 2
    evidence_refs: []
---

# Pattern Reflection
`;

const NO_EVIDENCE_ENTRY = `---
schema_version: pattern-reflection.v1
feature_slug: no-evidence
generated_at: "2026-03-04T00:00:00Z"
entries:
  - pattern_summary: "Entry without evidence"
    category: deterministic
    routing_target: loop_update
    occurrence_count: 3
---

# Pattern Reflection
`;

/* ------------------------------------------------------------------ */
/*  Tmpdir helpers                                                     */
/* ------------------------------------------------------------------ */

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pattern-promote-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writeFixture(name: string, content: string): string {
  const p = path.join(tmpDir, name);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, "utf-8");
  return p;
}

/* ------------------------------------------------------------------ */
/*  parsePatternReflectionEntries                                      */
/* ------------------------------------------------------------------ */

describe("parsePatternReflectionEntries", () => {
  test("TC-07b: parses YAML frontmatter format entries", () => {
    const entries = parsePatternReflectionEntries(YAML_FORMAT_INPUT);
    expect(entries).toHaveLength(3);
    expect(entries[0].routing_target).toBe("loop_update");
    expect(entries[0].pattern_summary).toBe("Test loop update pattern");
    expect(entries[0].category).toBe("deterministic");
    expect(entries[0].occurrence_count).toBe(3);
    expect(entries[0].evidence_refs).toEqual(["docs/plans/test/fact-find.md"]);
  });

  test("TC-07a: parses body-format entries with **field:** bullets", () => {
    const entries = parsePatternReflectionEntries(BODY_FORMAT_INPUT);
    expect(entries).toHaveLength(2);
    expect(entries[0].routing_target).toBe("loop_update");
    expect(entries[0].pattern_summary).toBe(
      "Queue pipeline writes processed_by before verifying artifact",
    );
    expect(entries[0].evidence_refs).toHaveLength(2);
    expect(entries[1].routing_target).toBe("defer");
  });

  test("TC-04: malformed YAML frontmatter → graceful fallback", () => {
    const entries = parsePatternReflectionEntries(MALFORMED_YAML_INPUT);
    // YAML parse fails, body-format fallback finds nothing (no ### Entry sections)
    expect(entries).toHaveLength(0);
  });

  test("TC-05: empty file → returns empty array", () => {
    expect(parsePatternReflectionEntries("")).toHaveLength(0);
    expect(parsePatternReflectionEntries("   \n\n  ")).toHaveLength(0);
  });

  test("TC-07: entry with no evidence_refs → still parses", () => {
    const entries = parsePatternReflectionEntries(NO_EVIDENCE_ENTRY);
    expect(entries).toHaveLength(1);
    expect(entries[0].evidence_refs).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/*  promoteLoopUpdateEntries                                           */
/* ------------------------------------------------------------------ */

describe("promoteLoopUpdateEntries", () => {
  test("TC-01: 1 loop_update entry → 1 draft file", () => {
    const reflPath = writeFixture("reflection.md", YAML_FORMAT_INPUT);
    const outDir = path.join(tmpDir, "output");

    const result = promoteLoopUpdateEntries({
      reflectionPath: reflPath,
      outputDir: outDir,
      dryRun: false,
    });

    expect(result.processed).toBe(3);
    expect(result.matched).toBe(1);
    expect(result.drafted).toBe(1);
    expect(result.skipped).toBe(0);

    const files = fs.readdirSync(outDir);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/^loop-update-draft-/);

    const content = fs.readFileSync(path.join(outDir, files[0]), "utf-8");
    expect(content).toContain("Test loop update pattern");
    expect(content).toContain("docs/plans/test/fact-find.md");
  });

  test("TC-02: all defer entries → 0 draft files", () => {
    const reflPath = writeFixture("all-defer.md", ALL_DEFER_INPUT);
    const outDir = path.join(tmpDir, "output");

    const result = promoteLoopUpdateEntries({
      reflectionPath: reflPath,
      outputDir: outDir,
      dryRun: false,
    });

    expect(result.matched).toBe(0);
    expect(result.drafted).toBe(0);
    expect(fs.existsSync(outDir)).toBe(false);
  });

  test("TC-03: 2 loop_update + 1 skill_proposal → 2 draft files", () => {
    const reflPath = writeFixture("mixed.md", TWO_LOOP_ONE_SKILL);
    const outDir = path.join(tmpDir, "output");

    const result = promoteLoopUpdateEntries({
      reflectionPath: reflPath,
      outputDir: outDir,
      dryRun: false,
    });

    expect(result.matched).toBe(2);
    expect(result.drafted).toBe(2);

    const files = fs.readdirSync(outDir);
    expect(files).toHaveLength(2);
  });

  test("TC-06: --dry-run mode → no files written", () => {
    const reflPath = writeFixture("reflection.md", YAML_FORMAT_INPUT);
    const outDir = path.join(tmpDir, "output");

    const result = promoteLoopUpdateEntries({
      reflectionPath: reflPath,
      outputDir: outDir,
      dryRun: true,
    });

    expect(result.matched).toBe(1);
    expect(result.drafted).toBe(0);
    expect(fs.existsSync(outDir)).toBe(false);
  });

  test("TC-07: entry without evidence_refs → draft with target_doc unknown", () => {
    const reflPath = writeFixture("no-evidence.md", NO_EVIDENCE_ENTRY);
    const outDir = path.join(tmpDir, "output");

    const result = promoteLoopUpdateEntries({
      reflectionPath: reflPath,
      outputDir: outDir,
      dryRun: false,
    });

    expect(result.drafted).toBe(1);
    const files = fs.readdirSync(outDir);
    const content = fs.readFileSync(path.join(outDir, files[0]), "utf-8");
    expect(content).toContain("unknown");
  });

  test("body-format loop_update entries are correctly promoted", () => {
    const reflPath = writeFixture("body.md", BODY_FORMAT_INPUT);
    const outDir = path.join(tmpDir, "output");

    const result = promoteLoopUpdateEntries({
      reflectionPath: reflPath,
      outputDir: outDir,
      dryRun: false,
    });

    expect(result.matched).toBe(1);
    expect(result.drafted).toBe(1);
  });
});

/* ------------------------------------------------------------------ */
/*  generateLoopUpdateDraft                                            */
/* ------------------------------------------------------------------ */

describe("generateLoopUpdateDraft", () => {
  test("draft contains all required sections", () => {
    const draft = generateLoopUpdateDraft({
      pattern_summary: "Test pattern",
      category: "deterministic",
      routing_target: "loop_update",
      occurrence_count: 3,
      evidence_refs: ["docs/test.md"],
    });

    expect(draft.filename).toMatch(/^loop-update-draft-/);
    expect(draft.content).toContain("## Pattern Summary");
    expect(draft.content).toContain("## Classification");
    expect(draft.content).toContain("## Target Standing Document");
    expect(draft.content).toContain("## Evidence References");
    expect(draft.content).toContain("## Proposed Patch");
    expect(draft.content).toContain("Test pattern");
    expect(draft.content).toContain("docs/test.md");
  });

  test("infers process-registry target from evidence", () => {
    const draft = generateLoopUpdateDraft({
      pattern_summary: "Process improvement",
      category: "deterministic",
      routing_target: "loop_update",
      occurrence_count: 3,
      evidence_refs: ["docs/business-os/startup-loop/process-registry-v2.md"],
    });

    expect(draft.targetDoc).toContain("process-registry");
  });
});

/* ------------------------------------------------------------------ */
/*  promoteSkillProposalEntries                                        */
/* ------------------------------------------------------------------ */

describe("promoteSkillProposalEntries", () => {
  test("TC-08: 1 skill_proposal entry → 1 SKILL.md scaffold", () => {
    const reflPath = writeFixture("skill.md", BODY_FORMAT_SKILL_PROPOSAL);
    const outDir = path.join(tmpDir, "output");

    const result = promoteSkillProposalEntries({
      reflectionPath: reflPath,
      outputDir: outDir,
      dryRun: false,
    });

    expect(result.matched).toBe(1);
    expect(result.drafted).toBe(1);

    const skillDirs = fs.readdirSync(outDir);
    expect(skillDirs).toHaveLength(1);

    const skillMd = fs.readFileSync(
      path.join(outDir, skillDirs[0], "SKILL.md"),
      "utf-8",
    );
    expect(skillMd).toContain("Registry keyword sync gap");
  });

  test("TC-09: 0 skill_proposal entries → 0 scaffolds", () => {
    const reflPath = writeFixture("no-skill.md", ALL_DEFER_INPUT);
    const outDir = path.join(tmpDir, "output");

    const result = promoteSkillProposalEntries({
      reflectionPath: reflPath,
      outputDir: outDir,
      dryRun: false,
    });

    expect(result.matched).toBe(0);
    expect(result.drafted).toBe(0);
  });

  test("TC-10: scaffold contains required SKILL.md sections", () => {
    const scaffold = generateSkillScaffold({
      pattern_summary: "Test skill pattern",
      category: "ad_hoc",
      routing_target: "skill_proposal",
      occurrence_count: 2,
      evidence_refs: ["docs/test.md"],
    });

    expect(scaffold).toContain("---"); // frontmatter
    expect(scaffold).toContain("name:");
    expect(scaffold).toContain("description:");
    expect(scaffold).toContain("## Quick Description");
    expect(scaffold).toContain("## Invocation");
    expect(scaffold).toContain("## Operating Mode");
    expect(scaffold).toContain("## Workflow");
  });

  test("TC-11: skill name kebab-casing", () => {
    expect(deriveSkillName("Hello World Pattern")).toBe("hello-world-pattern");
    expect(deriveSkillName("Special Ch@rs! Are Removed")).toBe(
      "special-chrs-are-removed",
    );
    expect(deriveSkillName("   Spaces   Trimmed   ")).toBe("spaces-trimmed");
    expect(deriveSkillName("A".repeat(60))).toHaveLength(40);
    expect(deriveSkillName("")).toBe("unnamed-skill");
    // trailing hyphen after truncation is stripped
    expect(deriveSkillName("a-b-c-d-e-f-g-h-i-j-k-l-m-n-o-p-q-r-s-t")).not.toMatch(/-$/);
  });

  test("TC-12: --dry-run mode → no files written", () => {
    const reflPath = writeFixture("skill.md", BODY_FORMAT_SKILL_PROPOSAL);
    const outDir = path.join(tmpDir, "output");

    const result = promoteSkillProposalEntries({
      reflectionPath: reflPath,
      outputDir: outDir,
      dryRun: true,
    });

    expect(result.matched).toBe(1);
    expect(result.drafted).toBe(0);
    expect(fs.existsSync(outDir)).toBe(false);
  });

  test("duplicate skill names get suffix", () => {
    // Two skill_proposal entries with same summary → different filenames
    const input = `---
schema_version: pattern-reflection.v1
feature_slug: dup
generated_at: "2026-03-04T00:00:00Z"
entries:
  - pattern_summary: "Same pattern"
    category: ad_hoc
    routing_target: skill_proposal
    occurrence_count: 2
    evidence_refs: []
  - pattern_summary: "Same pattern"
    category: ad_hoc
    routing_target: skill_proposal
    occurrence_count: 2
    evidence_refs: []
---
`;
    const reflPath = writeFixture("dup.md", input);
    const outDir = path.join(tmpDir, "output");

    const result = promoteSkillProposalEntries({
      reflectionPath: reflPath,
      outputDir: outDir,
      dryRun: false,
    });

    expect(result.drafted).toBe(2);
    const dirs = fs.readdirSync(outDir);
    expect(dirs).toHaveLength(2);
    expect(dirs.sort()).toEqual(["same-pattern", "same-pattern-2"]);
  });
});

/* ------------------------------------------------------------------ */
/*  Anti-loop integration (TASK-03)                                    */
/* ------------------------------------------------------------------ */

describe("anti-loop integration", () => {
  const trialPath = path.resolve(
    __dirname,
    "../ideas/lp-do-ideas-trial.ts",
  );

  let trialContent: string;
  beforeEach(() => {
    trialContent = fs.readFileSync(trialPath, "utf-8");
  });

  test("TC-13: SELF_TRIGGER_PROCESSES contains pattern-promote-loop-update", () => {
    expect(trialContent).toContain('"pattern-promote-loop-update"');
  });

  test("TC-14: SELF_TRIGGER_PROCESSES contains pattern-promote-skill-proposal", () => {
    expect(trialContent).toContain('"pattern-promote-skill-proposal"');
  });

  test("TC-15: both entries are members of SELF_TRIGGER_PROCESSES Set", () => {
    const setMatch = trialContent.match(
      /SELF_TRIGGER_PROCESSES\s*=\s*new\s+Set\(\[([\s\S]*?)\]\)/,
    );
    expect(setMatch).not.toBeNull();
    const setBody = setMatch![1];
    expect(setBody).toContain('"pattern-promote-loop-update"');
    expect(setBody).toContain('"pattern-promote-skill-proposal"');
  });
});
