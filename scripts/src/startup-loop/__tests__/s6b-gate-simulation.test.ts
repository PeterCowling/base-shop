/**
 * S6B Gate Simulation — Tests
 *
 * Covers VC-12 validation contracts:
 *   VC-02: Gate simulation check — 4 scenario fixtures produce expected gate states exactly.
 *
 * Scenarios (using fs.mkdtemp isolated repo root):
 *   1. pre-website-low-signal:       No DEP → STRAT FAIL, ACT NOT_EVALUATED
 *   2. pre-website-valid-demand:     DEP ✓, no measurement doc → STRAT PASS, ACT FAIL (check-1)
 *   3. website-live-partial-meas:    DEP ✓, measurement Draft, risks present → STRAT PASS, ACT FAIL
 *   4. website-live-decision-grade:  DEP ✓, measurement Active, no risks, events ✓ → both PASS
 *
 * Task: TASK-12 (startup-loop-marketing-sales-capability-gap-audit)
 */

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { promises as fs } from "fs";
import * as os from "os";
import * as path from "path";

import {
  evaluateS6bGates,
  type GateResult,
  type GateStatus,
} from "../s6b-gates.js";

// ── Fixture helpers ───────────────────────────────────────────────────────────

const BIZ = "TEST-BIZ";

async function writeFile(filePath: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

function depPath(repoRoot: string): string {
  return path.join(
    repoRoot,
    "docs",
    "business-os",
    "startup-baselines",
    BIZ,
    "demand-evidence-pack.md",
  );
}

function measPath(repoRoot: string, filename: string): string {
  return path.join(
    repoRoot,
    "docs",
    "business-os",
    "strategy",
    BIZ,
    filename,
  );
}

function planPath(repoRoot: string): string {
  return path.join(
    repoRoot,
    "docs",
    "business-os",
    "strategy",
    BIZ,
    "plan.user.md",
  );
}

const DEP_CONTENT = `---
Type: DEP
Status: Active
Business: ${BIZ}
---

# Demand Evidence Pack

Demand signal confirmed.
`;

const MEAS_ACTIVE = `---
Type: Reference
Status: Active
Business: ${BIZ}
---

# Measurement Verification

Measurement setup verified in production.
`;

const MEAS_DRAFT = `---
Type: Reference
Status: Draft
Business: ${BIZ}
---

# Measurement Verification

Setup incomplete.
`;

const PLAN_CLEAN = `---
Type: Business-Plan
Status: Active
Business: ${BIZ}
Last-reviewed: 2026-02-18
---

# Plan

## Conversion Baseline

| Event | Count |
|---|---|
| begin_checkout | 42 |
| add_to_cart | 87 |
`;

const PLAN_WITH_RISKS = `---
Type: Business-Plan
Status: Active
Business: ${BIZ}
Last-reviewed: 2026-02-18
---

# Plan

## Risks

- Measurement tag unreliable. Severity: High
- Measurement conversion tracking absent. Severity: Critical

## Conversion Baseline

| Event | Count |
|---|---|
| begin_checkout | 0 |
`;

// ── Helpers ──────────────────────────────────────────────────────────────────

function gateState(results: GateResult[], gateId: string): GateStatus {
  const r = results.find((g) => g.gateId === gateId);
  if (!r) throw new Error(`Gate ${gateId} not in results`);
  return r.status;
}

function gateReasons(results: GateResult[], gateId: string): string[] {
  const r = results.find((g) => g.gateId === gateId);
  if (!r) throw new Error(`Gate ${gateId} not in results`);
  return r.reasons;
}

// ── Test suite ───────────────────────────────────────────────────────────────

describe("S6B Gate Simulation (VC-02)", () => {
  let repoRoot: string;

  beforeEach(async () => {
    repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "s6b-gate-sim-"));
  });

  afterEach(async () => {
    await fs.rm(repoRoot, { recursive: true, force: true });
  });

  // ── Scenario 1: pre-website-low-signal ──────────────────────────────────

  it("VC-02 Scenario 1 (pre-website-low-signal): no DEP → STRAT FAIL, ACT NOT_EVALUATED", async () => {
    // No DEP artifact written — empty repo root
    const results = await evaluateS6bGates(repoRoot, BIZ);

    expect(results).toHaveLength(2);
    expect(gateState(results, "GATE-S6B-STRAT-01")).toBe("FAIL");
    expect(gateState(results, "GATE-S6B-ACT-01")).toBe("NOT_EVALUATED");
  });

  it("VC-02 Scenario 1: STRAT FAIL reason references canonical DEP path", async () => {
    const results = await evaluateS6bGates(repoRoot, BIZ);
    const reasons = gateReasons(results, "GATE-S6B-STRAT-01");
    expect(reasons.length).toBeGreaterThan(0);
    expect(reasons[0]).toContain("GATE-S6B-STRAT-01");
    expect(reasons[0]).toContain("demand-evidence-pack.md");
  });

  // ── Scenario 2: pre-website-valid-demand ────────────────────────────────

  it("VC-02 Scenario 2 (pre-website-valid-demand): DEP ✓, no measurement doc → STRAT PASS, ACT FAIL", async () => {
    await writeFile(depPath(repoRoot), DEP_CONTENT);
    // No measurement verification doc written

    const results = await evaluateS6bGates(repoRoot, BIZ);

    expect(gateState(results, "GATE-S6B-STRAT-01")).toBe("PASS");
    expect(gateState(results, "GATE-S6B-ACT-01")).toBe("FAIL");
  });

  it("VC-02 Scenario 2: ACT failure reason mentions check-1 (measurement-verification)", async () => {
    await writeFile(depPath(repoRoot), DEP_CONTENT);
    const results = await evaluateS6bGates(repoRoot, BIZ);
    const reasons = gateReasons(results, "GATE-S6B-ACT-01");
    expect(reasons.some((r) => r.includes("[check-1]"))).toBe(true);
    expect(reasons.some((r) => r.includes("measurement-verification"))).toBe(true);
  });

  // ── Scenario 3: website-live-partial-measurement ─────────────────────────

  it("VC-02 Scenario 3 (website-live-partial-meas): DEP ✓, measurement Draft, risks → STRAT PASS, ACT FAIL", async () => {
    await writeFile(depPath(repoRoot), DEP_CONTENT);
    // Measurement doc exists but Status: Draft (not Active)
    await writeFile(
      measPath(repoRoot, "2026-01-15-measurement-verification.user.md"),
      MEAS_DRAFT,
    );
    // Plan has measurement risks at Severity: High and zero conversion events
    await writeFile(planPath(repoRoot), PLAN_WITH_RISKS);

    const results = await evaluateS6bGates(repoRoot, BIZ);

    expect(gateState(results, "GATE-S6B-STRAT-01")).toBe("PASS");
    expect(gateState(results, "GATE-S6B-ACT-01")).toBe("FAIL");
  });

  it("VC-02 Scenario 3: ACT failure includes check-1 (not Active) and check-2 (risks) failures", async () => {
    await writeFile(depPath(repoRoot), DEP_CONTENT);
    await writeFile(
      measPath(repoRoot, "2026-01-15-measurement-verification.user.md"),
      MEAS_DRAFT,
    );
    await writeFile(planPath(repoRoot), PLAN_WITH_RISKS);

    const results = await evaluateS6bGates(repoRoot, BIZ);
    const reasons = gateReasons(results, "GATE-S6B-ACT-01");

    expect(reasons.some((r) => r.includes("[check-1]"))).toBe(true);
    expect(reasons.some((r) => r.includes("[check-2]"))).toBe(true);
  });

  // ── Scenario 4: website-live-decision-grade ──────────────────────────────

  it("VC-02 Scenario 4 (website-live-decision-grade): all present and valid → STRAT PASS, ACT PASS", async () => {
    await writeFile(depPath(repoRoot), DEP_CONTENT);
    // Measurement doc with Status: Active
    await writeFile(
      measPath(repoRoot, "2026-02-01-measurement-verification.user.md"),
      MEAS_ACTIVE,
    );
    // Clean plan: no measurement risks, non-zero conversion events
    await writeFile(planPath(repoRoot), PLAN_CLEAN);

    const results = await evaluateS6bGates(repoRoot, BIZ);

    expect(results).toHaveLength(2);
    expect(gateState(results, "GATE-S6B-STRAT-01")).toBe("PASS");
    expect(gateState(results, "GATE-S6B-ACT-01")).toBe("PASS");
  });

  it("VC-02 Scenario 4: PASS results have empty reasons arrays", async () => {
    await writeFile(depPath(repoRoot), DEP_CONTENT);
    await writeFile(
      measPath(repoRoot, "2026-02-01-measurement-verification.user.md"),
      MEAS_ACTIVE,
    );
    await writeFile(planPath(repoRoot), PLAN_CLEAN);

    const results = await evaluateS6bGates(repoRoot, BIZ);

    for (const result of results) {
      expect(result.reasons).toHaveLength(0);
    }
  });

  // ── Cross-scenario: determinism ──────────────────────────────────────────

  it("VC-02: gate evaluation is deterministic (same inputs → same outputs)", async () => {
    await writeFile(depPath(repoRoot), DEP_CONTENT);
    await writeFile(
      measPath(repoRoot, "2026-02-01-measurement-verification.user.md"),
      MEAS_ACTIVE,
    );
    await writeFile(planPath(repoRoot), PLAN_CLEAN);

    const run1 = await evaluateS6bGates(repoRoot, BIZ);
    const run2 = await evaluateS6bGates(repoRoot, BIZ);

    expect(JSON.stringify(run1)).toBe(JSON.stringify(run2));
  });
});
