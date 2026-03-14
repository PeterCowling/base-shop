/**
 * GATE-UI-SWEEP-01 — Tests
 *
 * Tests verifying gate logic specified in:
 *   .claude/skills/startup-loop/modules/cmd-advance/s9b-gates.md (GATE-UI-SWEEP-01 section)
 *
 * All gate-parsing helpers are defined inline in this file (no separate s9b-gates.ts module).
 * When the Markdown gate spec changes, update these helpers and tests in tandem.
 *
 * 9 test scenarios:
 *   1. No artifact for business → BLOCK (Case A)
 *   2. Artifact exists for wrong business → BLOCK (Case A)
 *   3. Artifact exists, fresh, Business: field missing (legacy) → BLOCK (Case A)
 *   4. Artifact exists, correct Business:, Audit-Date > 30 days ago → BLOCK (Case B)
 *   5. Artifact exists, fresh, Status: In-progress → BLOCK (Case B)
 *   6. Artifact exists, fresh, Status: Complete, Routes-Tested: 0 (auth-blocked) → BLOCK (Case C)
 *   7. Artifact exists, fresh, Status: Complete, Routes-Tested: 5, Modes-Tested: light → BLOCK (Case C)
 *   8. Artifact exists, fresh, Status: Complete, Routes-Tested: 5, Modes-Tested: light,dark, S1-Blockers: 2 → BLOCK (Case C)
 *   9. Artifact exists, fresh, Status: Complete, Routes-Tested: 5, Modes-Tested: light,dark, S1-Blockers: 0 → PASS
 */

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { promises as fs } from "fs";
import * as os from "os";
import * as path from "path";

// ── Inline gate-parsing helpers (private to this file) ──────────────────────

const MAX_AGE_DAYS = 30;
const SWEEP_GLOB_PATTERN = "contrast-uniformity-report.md";
const SWEEPS_DIR_SEGMENT = "docs/audits/contrast-sweeps";

function extractFrontmatter(content: string): string | null {
  if (!content.startsWith("---\n")) return null;
  const end = content.indexOf("\n---\n", 4);
  if (end === -1) return null;
  return content.slice(4, end);
}

function readField(content: string, key: string): string | null {
  const frontmatter = extractFrontmatter(content);
  if (!frontmatter) return null;
  for (const rawLine of frontmatter.split("\n")) {
    const line = rawLine.trim();
    if (!line.startsWith(`${key}:`)) continue;
    const value = line.slice(key.length + 1).trim();
    // Strip surrounding quotes
    return value ? value.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1") : null;
  }
  return null;
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const normalized = `${value}T00:00:00Z`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseLeadingInt(value: string | null): number {
  if (!value) return 0;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function ageInDays(date: Date, now: Date): number {
  return Math.floor((now.getTime() - date.getTime()) / 86_400_000);
}

export type GateStatus = "PASS" | "BLOCK";
export type BlockCase = "A" | "B" | "C";

export interface GateResult {
  status: GateStatus;
  blockCase?: BlockCase;
  blockMessage?: string;
  passPacket?: {
    ui_sweep_gate: string;
    ui_sweep_gate_status: string;
    ui_sweep_report: string;
  };
}

/**
 * Evaluate GATE-UI-SWEEP-01 against the sweep artifacts directory.
 *
 * @param sweepsDir - Absolute path to the directory containing YYYY-MM-DD-<slug>/contrast-uniformity-report.md artifacts
 * @param biz - Business identifier (e.g. "BRIK")
 * @param now - Optional override for "today" (for deterministic testing of date checks)
 */
async function evaluateUiSweepGate(
  sweepsDir: string,
  biz: string,
  now: Date = new Date(),
): Promise<GateResult> {
  // Step 1: Glob for artifacts and filter by Business: field
  let entries: string[];
  try {
    entries = await fs.readdir(sweepsDir);
  } catch {
    // Directory does not exist — no artifacts
    entries = [];
  }

  const matchingArtifacts: { filePath: string; content: string; auditDate: Date | null }[] = [];

  for (const entry of entries) {
    const reportPath = path.join(sweepsDir, entry, SWEEP_GLOB_PATTERN);
    let content: string;
    try {
      content = await fs.readFile(reportPath, "utf8");
    } catch {
      continue; // Not a valid sweep directory
    }

    const artifactBiz = readField(content, "Business");
    if (!artifactBiz || artifactBiz.toLowerCase() !== biz.toLowerCase()) {
      continue; // Missing Business: field or wrong business — treated as no match
    }

    const auditDate = parseDate(readField(content, "Audit-Date"));
    matchingArtifacts.push({ filePath: reportPath, content, auditDate });
  }

  // Step 1 (cont.): No matching artifact → BLOCK Case A
  if (matchingArtifacts.length === 0) {
    return {
      status: "BLOCK",
      blockCase: "A",
      blockMessage: `GATE-UI-SWEEP-01: No rendered UI sweep artifact found for business ${biz}. Run /tools-ui-contrast-sweep, then manually set 'Business: ${biz}' in the report frontmatter before re-running advance.`,
    };
  }

  // Step 2: Select most recent by Audit-Date:
  matchingArtifacts.sort((a, b) => {
    const aTime = a.auditDate?.getTime() ?? 0;
    const bTime = b.auditDate?.getTime() ?? 0;
    return bTime - aTime; // Descending
  });
  const latest = matchingArtifacts[0];

  // Step 2 (cont.): Staleness check
  if (!latest.auditDate || ageInDays(latest.auditDate, now) > MAX_AGE_DAYS) {
    return {
      status: "BLOCK",
      blockCase: "B",
      blockMessage: `GATE-UI-SWEEP-01: UI sweep artifact is >30 days old or not yet complete (Status must be 'Complete'). Re-run /tools-ui-contrast-sweep with Business: ${biz} in the report frontmatter, then re-run advance.`,
    };
  }

  // Step 3: Status check
  const status = readField(latest.content, "Status");
  if (status !== "Complete") {
    return {
      status: "BLOCK",
      blockCase: "B",
      blockMessage: `GATE-UI-SWEEP-01: UI sweep artifact is >30 days old or not yet complete (Status must be 'Complete'). Re-run /tools-ui-contrast-sweep with Business: ${biz} in the report frontmatter, then re-run advance.`,
    };
  }

  // Step 4: Routes-Tested check
  const routesTested = parseLeadingInt(readField(latest.content, "Routes-Tested"));
  if (routesTested === 0) {
    return {
      status: "BLOCK",
      blockCase: "C",
      blockMessage: `GATE-UI-SWEEP-01: UI sweep artifact for ${biz} is insufficient — either no routes were rendered (Routes-Tested: 0), both light and dark modes were not tested (Modes-Tested must include both), or S1 blocking issues remain. Resolve all S1 blockers, ensure rendered route coverage, and ensure both modes are tested before re-running advance.`,
    };
  }

  // Step 5: Modes-Tested check (substring: handles "light, dark", "light,dark", "dark,light")
  const modesTested = readField(latest.content, "Modes-Tested") ?? "";
  const hasLight = modesTested.toLowerCase().includes("light");
  const hasDark = modesTested.toLowerCase().includes("dark");
  if (!hasLight || !hasDark) {
    return {
      status: "BLOCK",
      blockCase: "C",
      blockMessage: `GATE-UI-SWEEP-01: UI sweep artifact for ${biz} is insufficient — either no routes were rendered (Routes-Tested: 0), both light and dark modes were not tested (Modes-Tested must include both), or S1 blocking issues remain. Resolve all S1 blockers, ensure rendered route coverage, and ensure both modes are tested before re-running advance.`,
    };
  }

  // Step 6: S1-Blockers check
  const s1Blockers = parseLeadingInt(readField(latest.content, "S1-Blockers"));
  if (s1Blockers > 0) {
    return {
      status: "BLOCK",
      blockCase: "C",
      blockMessage: `GATE-UI-SWEEP-01: UI sweep artifact for ${biz} is insufficient — either no routes were rendered (Routes-Tested: 0), both light and dark modes were not tested (Modes-Tested must include both), or S1 blocking issues remain. Resolve all S1 blockers, ensure rendered route coverage, and ensure both modes are tested before re-running advance.`,
    };
  }

  // All checks passed
  return {
    status: "PASS",
    passPacket: {
      ui_sweep_gate: "GATE-UI-SWEEP-01",
      ui_sweep_gate_status: "pass",
      ui_sweep_report: latest.filePath,
    },
  };
}

// ── Fixture helpers ──────────────────────────────────────────────────────────

const BIZ = "TEST-BIZ";

async function writeArtifact(
  sweepsDir: string,
  slug: string,
  content: string,
): Promise<string> {
  const dir = path.join(sweepsDir, slug);
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, "contrast-uniformity-report.md");
  await fs.writeFile(filePath, content, "utf8");
  return filePath;
}

function isoDateDaysAgo(daysAgo: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function buildSweepArtifact(overrides: {
  business?: string | null;
  auditDate?: string;
  status?: string;
  routesTested?: string;
  modesTested?: string;
  s1Blockers?: number;
}): string {
  const {
    business = BIZ,
    auditDate = isoDateDaysAgo(0),
    status = "Complete",
    routesTested = "5",
    modesTested = "light,dark",
    s1Blockers = 0,
  } = overrides;

  const businessLine = business !== null ? `Business: ${business}\n` : "";
  return `---
Type: Contrast-Uniformity-Report
Status: ${status}
${businessLine}Audit-Date: ${auditDate}
Target-URL: https://example.com
Standard: WCAG-2.1-AA
Breakpoints-Tested: 375,1280
Modes-Tested: ${modesTested}
Routes-Tested: ${routesTested}
Issues-Total: 0
S1-Blockers: ${s1Blockers}
S2-Major: 0
S3-Minor: 0
---

# Contrast + Uniformity Report — test

## Scope

Test scope.
`;
}

// ── Test suite ───────────────────────────────────────────────────────────────

describe("GATE-UI-SWEEP-01 — UI sweep advance gate", () => {
  let sweepsDir: string;

  beforeEach(async () => {
    sweepsDir = await fs.mkdtemp(path.join(os.tmpdir(), "s9b-gate-test-"));
  });

  afterEach(async () => {
    await fs.rm(sweepsDir, { recursive: true, force: true });
  });

  // ── Scenario 1: No artifact for business ─────────────────────────────────

  it("Scenario 1: no artifact in sweepsDir → BLOCK (Case A)", async () => {
    // Empty directory — no artifacts at all
    const result = await evaluateUiSweepGate(sweepsDir, BIZ);

    expect(result.status).toBe("BLOCK");
    expect(result.blockCase).toBe("A");
    expect(result.blockMessage).toContain("GATE-UI-SWEEP-01");
    expect(result.blockMessage).toContain(BIZ);
    expect(result.blockMessage).toContain("/tools-ui-contrast-sweep");
  });

  // ── Scenario 2: Artifact exists for wrong business ────────────────────────

  it("Scenario 2: artifact exists with wrong Business: field → BLOCK (Case A)", async () => {
    await writeArtifact(
      sweepsDir,
      "2026-03-14-wrong-biz",
      buildSweepArtifact({ business: "WRONG-BIZ" }),
    );

    const result = await evaluateUiSweepGate(sweepsDir, BIZ);

    expect(result.status).toBe("BLOCK");
    expect(result.blockCase).toBe("A");
    expect(result.blockMessage).toContain(BIZ);
  });

  // ── Scenario 3: Business: field missing (legacy artifact) ─────────────────

  it("Scenario 3: artifact exists but Business: field missing (legacy) → BLOCK (Case A)", async () => {
    await writeArtifact(
      sweepsDir,
      "2026-03-14-legacy",
      buildSweepArtifact({ business: null }),
    );

    const result = await evaluateUiSweepGate(sweepsDir, BIZ);

    expect(result.status).toBe("BLOCK");
    expect(result.blockCase).toBe("A");
  });

  // ── Scenario 4: Artifact stale (Audit-Date > 30 days ago) ─────────────────

  it("Scenario 4: correct Business:, Audit-Date > 30 days ago → BLOCK (Case B)", async () => {
    await writeArtifact(
      sweepsDir,
      "2026-01-01-stale",
      buildSweepArtifact({ auditDate: isoDateDaysAgo(31) }),
    );

    const result = await evaluateUiSweepGate(sweepsDir, BIZ);

    expect(result.status).toBe("BLOCK");
    expect(result.blockCase).toBe("B");
    expect(result.blockMessage).toContain(">30 days old");
  });

  // ── Scenario 5: Status: In-progress ──────────────────────────────────────

  it("Scenario 5: fresh artifact, Status: In-progress → BLOCK (Case B)", async () => {
    await writeArtifact(
      sweepsDir,
      "2026-03-14-in-progress",
      buildSweepArtifact({ status: "In-progress" }),
    );

    const result = await evaluateUiSweepGate(sweepsDir, BIZ);

    expect(result.status).toBe("BLOCK");
    expect(result.blockCase).toBe("B");
    expect(result.blockMessage).toContain("Status must be 'Complete'");
  });

  // ── Scenario 6: Routes-Tested: 0 (degraded/auth-blocked sweep) ───────────

  it("Scenario 6: Routes-Tested: 0 (auth-blocked) → BLOCK (Case C), leading-int parse verified", async () => {
    await writeArtifact(
      sweepsDir,
      "2026-03-14-auth-blocked",
      buildSweepArtifact({ routesTested: "0 (auth-blocked — token-level only)" }),
    );

    const result = await evaluateUiSweepGate(sweepsDir, BIZ);

    expect(result.status).toBe("BLOCK");
    expect(result.blockCase).toBe("C");
    expect(result.blockMessage).toContain("Routes-Tested: 0");
  });

  // ── Scenario 7: Modes-Tested missing dark ────────────────────────────────

  it("Scenario 7: Routes-Tested: 5, Modes-Tested: light (dark missing) → BLOCK (Case C)", async () => {
    await writeArtifact(
      sweepsDir,
      "2026-03-14-light-only",
      buildSweepArtifact({ modesTested: "light" }),
    );

    const result = await evaluateUiSweepGate(sweepsDir, BIZ);

    expect(result.status).toBe("BLOCK");
    expect(result.blockCase).toBe("C");
    expect(result.blockMessage).toContain("Modes-Tested must include both");
  });

  // ── Scenario 8: S1-Blockers > 0 ──────────────────────────────────────────

  it("Scenario 8: Modes-Tested: light,dark, S1-Blockers: 2 → BLOCK (Case C)", async () => {
    await writeArtifact(
      sweepsDir,
      "2026-03-14-s1-blockers",
      buildSweepArtifact({ s1Blockers: 2 }),
    );

    const result = await evaluateUiSweepGate(sweepsDir, BIZ);

    expect(result.status).toBe("BLOCK");
    expect(result.blockCase).toBe("C");
    expect(result.blockMessage).toContain("S1 blocking issues remain");
  });

  // ── Scenario 9: Full pass ─────────────────────────────────────────────────

  it("Scenario 9: all checks pass → PASS with ui_sweep_gate fields", async () => {
    const filePath = await writeArtifact(
      sweepsDir,
      "2026-03-14-clean",
      buildSweepArtifact({}),
    );

    const result = await evaluateUiSweepGate(sweepsDir, BIZ);

    expect(result.status).toBe("PASS");
    expect(result.blockCase).toBeUndefined();
    expect(result.blockMessage).toBeUndefined();
    expect(result.passPacket).toBeDefined();
    expect(result.passPacket?.ui_sweep_gate).toBe("GATE-UI-SWEEP-01");
    expect(result.passPacket?.ui_sweep_gate_status).toBe("pass");
    expect(result.passPacket?.ui_sweep_report).toBe(filePath);
  });

  // ── Additional: Modes-Tested with space variant ───────────────────────────

  it("Modes-Tested: 'light, dark' (with space) passes check 5", async () => {
    await writeArtifact(
      sweepsDir,
      "2026-03-14-space-variant",
      buildSweepArtifact({ modesTested: "light, dark" }),
    );

    const result = await evaluateUiSweepGate(sweepsDir, BIZ);

    expect(result.status).toBe("PASS");
  });

  // ── Additional: Most recent artifact selected ─────────────────────────────

  it("Most recent artifact by Audit-Date is selected when multiple exist", async () => {
    // Write a stale artifact (would block if selected)
    await writeArtifact(
      sweepsDir,
      "2026-01-01-old",
      buildSweepArtifact({ auditDate: isoDateDaysAgo(60) }),
    );
    // Write a fresh artifact (should be selected — passes all checks)
    await writeArtifact(
      sweepsDir,
      "2026-03-14-fresh",
      buildSweepArtifact({ auditDate: isoDateDaysAgo(0) }),
    );

    const result = await evaluateUiSweepGate(sweepsDir, BIZ);

    expect(result.status).toBe("PASS");
  });
});
