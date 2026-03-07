import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import type { PatternReflectionSidecar } from "../build/lp-do-build-pattern-reflection-extract";
import { extractPatternReflectionSignals } from "../build/lp-do-build-pattern-reflection-extract";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tmpDir: string;

function writeMd(filename: string, content: string): void {
  fs.writeFileSync(path.join(tmpDir, filename), content, "utf8");
}

function readSidecar(): PatternReflectionSidecar {
  const raw = fs.readFileSync(path.join(tmpDir, "pattern-reflection.entries.json"), "utf8");
  return JSON.parse(raw) as PatternReflectionSidecar;
}

function sidecarExists(): boolean {
  return fs.existsSync(path.join(tmpDir, "pattern-reflection.entries.json"));
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pattern-reflect-extract-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// TC-01: YAML frontmatter with 2 entries
// ---------------------------------------------------------------------------

describe("lp-do-build-pattern-reflection-extract", () => {
  it("TC-01: extracts 2 YAML frontmatter entries and writes correct sidecar", async () => {
    writeMd(
      "pattern-reflection.user.md",
      [
        "---",
        "entries:",
        "  - pattern_summary: Shared parse modules reduce duplication",
        "    category: ai-to-mechanistic",
        "    routing_target: loop_update",
        "    occurrence_count: 2",
        "    evidence_refs: []",
        "  - pattern_summary: Post-authoring extraction pattern",
        "    category: new-loop-process",
        "    routing_target: skill_proposal",
        "    occurrence_count: 1",
        "    evidence_refs: []",
        "---",
        "",
        "## Patterns",
        "See YAML frontmatter.",
      ].join("\n"),
    );

    await extractPatternReflectionSignals(tmpDir);

    expect(sidecarExists()).toBe(true);
    const sidecar = readSidecar();
    expect(sidecar.schema_version).toBe("pattern-reflection.entries.v1");
    expect(typeof sidecar.generated_at).toBe("string");
    expect(new Date(sidecar.generated_at).toISOString()).toBe(sidecar.generated_at);
    expect(sidecar.entries).toHaveLength(2);
    expect(sidecar.entries[0]?.pattern_summary).toBe("Shared parse modules reduce duplication");
    expect(sidecar.entries[0]?.routing_target).toBe("loop_update");
    expect(sidecar.entries[1]?.pattern_summary).toBe("Post-authoring extraction pattern");
    expect(sidecar.entries[1]?.routing_target).toBe("skill_proposal");
  });

  // ---------------------------------------------------------------------------
  // TC-02: empty entries array in YAML
  // ---------------------------------------------------------------------------

  it("TC-02: empty YAML entries produces sidecar with empty array", async () => {
    writeMd(
      "pattern-reflection.user.md",
      ["---", "entries: []", "---", "", "## Patterns", "None identified."].join("\n"),
    );

    await extractPatternReflectionSignals(tmpDir);

    expect(sidecarExists()).toBe(true);
    const sidecar = readSidecar();
    expect(sidecar.entries).toEqual([]);
    expect(sidecar.schema_version).toBe("pattern-reflection.entries.v1");
  });

  // ---------------------------------------------------------------------------
  // TC-03: missing .user.md exits cleanly without writing sidecar
  // ---------------------------------------------------------------------------

  it("TC-03: missing pattern-reflection.user.md exits cleanly with no sidecar written", async () => {
    // No file written to tmpDir.
    await expect(extractPatternReflectionSignals(tmpDir)).resolves.toBeUndefined();
    expect(sidecarExists()).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // TC-04: body-format fallback (no YAML frontmatter)
  // ---------------------------------------------------------------------------

  it("TC-04: body-format markdown (no YAML frontmatter) falls back to body-format parse", async () => {
    writeMd(
      "pattern-reflection.user.md",
      [
        "## Patterns",
        "",
        "### Entry 1",
        "**pattern_summary:** Body format pattern",
        "**category:** new-skill",
        "**routing_target:** skill_proposal",
        "**occurrence_count:** 1",
        "**evidence_refs:**",
        "  - `docs/plans/some-plan/plan.md`",
      ].join("\n"),
    );

    await extractPatternReflectionSignals(tmpDir);

    expect(sidecarExists()).toBe(true);
    const sidecar = readSidecar();
    expect(sidecar.entries).toHaveLength(1);
    expect(sidecar.entries[0]?.pattern_summary).toBe("Body format pattern");
    expect(sidecar.entries[0]?.routing_target).toBe("skill_proposal");
  });

  // ---------------------------------------------------------------------------
  // TC-05: schema_version present in all produced sidecars
  // ---------------------------------------------------------------------------

  it("TC-05: schema_version is pattern-reflection.entries.v1 in all produced sidecars", async () => {
    writeMd(
      "pattern-reflection.user.md",
      ["---", "entries:", "  - pattern_summary: Version check", "    category: unclassified", "    routing_target: defer", "    occurrence_count: 1", "    evidence_refs: []", "---"].join("\n"),
    );

    await extractPatternReflectionSignals(tmpDir);

    const sidecar = readSidecar();
    expect(sidecar.schema_version).toBe("pattern-reflection.entries.v1");
  });
});
