/**
 * S6B Gate Evaluation
 *
 * Implements the two-gate S6B model (loop-spec v1.5.0):
 *   GATE-S6B-STRAT-01 — strategy design gate (DEP-gated)
 *   GATE-S6B-ACT-01   — spend activation gate (measurement-gated)
 *
 * Canonical gate definition: .claude/skills/startup-loop/SKILL.md §GATE-S6B-STRAT-01 + GATE-S6B-ACT-01
 * Canonical decision: TASK-02 (startup-loop-marketing-sales-capability-gap-audit)
 * Task: TASK-12 (startup-loop-marketing-sales-capability-gap-audit)
 */

import { promises as fs } from "fs";
import * as path from "path";

export type GateId = "GATE-S6B-STRAT-01" | "GATE-S6B-ACT-01";
export type GateStatus = "PASS" | "FAIL" | "NOT_EVALUATED";

export interface GateResult {
  gateId: GateId;
  status: GateStatus;
  /** Empty when status is PASS. Contains one message per failing check when FAIL. */
  reasons: string[];
}

// ── GATE-S6B-STRAT-01 ──────────────────────────────────────────────────────

/**
 * GATE-S6B-STRAT-01 (Hard) — Strategy design gate.
 *
 * Pass condition: A valid Demand Evidence Pack (DEP) artifact exists at the
 * canonical path: docs/business-os/startup-baselines/<BIZ>/demand-evidence-pack.md
 *
 * On pass: S6B strategy design (channel selection, GTM plan) may begin.
 * On fail: S6B is fully blocked until DEP capture is complete.
 */
export async function checkStratGate(
  repoRoot: string,
  business: string,
): Promise<GateResult> {
  const depPath = path.join(
    repoRoot,
    "docs",
    "business-os",
    "startup-baselines",
    business,
    "demand-evidence-pack.md",
  );

  try {
    await fs.access(depPath);
    return { gateId: "GATE-S6B-STRAT-01", status: "PASS", reasons: [] };
  } catch {
    const relPath = path.posix.join(
      "docs/business-os/startup-baselines",
      business,
      "demand-evidence-pack.md",
    );
    return {
      gateId: "GATE-S6B-STRAT-01",
      status: "FAIL",
      reasons: [
        `GATE-S6B-STRAT-01: No valid DEP artifact at canonical path: ${relPath}`,
      ],
    };
  }
}

// ── GATE-S6B-ACT-01 ────────────────────────────────────────────────────────

/**
 * GATE-S6B-ACT-01 (Hard) — Spend activation gate.
 *
 * All three checks must pass (inherits GATE-MEAS-01 conditions, loop-spec v1.2.0):
 *   Check 1: A measurement-verification artifact exists with Status: Active.
 *   Check 2: No active measurement risks at Severity: High or Critical in plan.user.md.
 *   Check 3: Key conversion-intent events are verified non-zero in the baseline.
 *
 * Evaluated only after GATE-S6B-STRAT-01 passes.
 */
export async function checkActGate(
  repoRoot: string,
  business: string,
): Promise<GateResult> {
  const strategyDir = path.join(
    repoRoot,
    "docs",
    "business-os",
    "strategy",
    business,
  );
  const reasons: string[] = [];

  // ── Check 1: measurement-verification doc with Status: Active ─────────────
  let check1Pass = false;
  try {
    const entries = await fs.readdir(strategyDir);
    const measFiles = entries.filter(
      (e) => e.includes("measurement-verification") && e.endsWith(".user.md"),
    );
    for (const filename of measFiles) {
      const content = await fs.readFile(
        path.join(strategyDir, filename),
        "utf8",
      );
      if (/^Status:\s*Active\s*$/m.test(content)) {
        check1Pass = true;
        break;
      }
    }
  } catch {
    // strategy directory does not exist — check 1 cannot pass
  }
  if (!check1Pass) {
    reasons.push(
      "GATE-S6B-ACT-01 [check-1]: No measurement-verification artifact with Status: Active found in " +
        `docs/business-os/strategy/${business}/`,
    );
  }

  // ── Check 2: no High/Critical measurement risks in plan.user.md ───────────
  const planPath = path.join(strategyDir, "plan.user.md");
  try {
    const planContent = await fs.readFile(planPath, "utf8");
    if (/measurement.*severity:\s*(high|critical)/i.test(planContent)) {
      reasons.push(
        "GATE-S6B-ACT-01 [check-2]: Active measurement risks at High or Critical severity found in plan.user.md",
      );
    }
  } catch {
    // plan.user.md missing — check 2 passes (no risks can be found)
  }

  // ── Check 3: conversion events non-zero in production baseline ────────────
  try {
    const planContent = await fs.readFile(planPath, "utf8");
    const hasConversionMentions =
      /begin_checkout|add_to_cart|conversion/i.test(planContent);
    const allZero = /\|\s*0\s*\||\|\s*0\.00%/.test(planContent);
    if (!hasConversionMentions || allZero) {
      reasons.push(
        "GATE-S6B-ACT-01 [check-3]: Conversion events not verified non-zero in production baseline (plan.user.md)",
      );
    }
  } catch {
    reasons.push(
      "GATE-S6B-ACT-01 [check-3]: plan.user.md not found — conversion events cannot be verified",
    );
  }

  return {
    gateId: "GATE-S6B-ACT-01",
    status: reasons.length === 0 ? "PASS" : "FAIL",
    reasons,
  };
}

// ── Entry point ─────────────────────────────────────────────────────────────

/**
 * Evaluate both S6B gates in order.
 *
 * GATE-S6B-STRAT-01 is always evaluated first.
 * GATE-S6B-ACT-01 is only evaluated when STRAT-01 passes.
 * Returns results for every gate (including NOT_EVALUATED for skipped gates).
 */
export async function evaluateS6bGates(
  repoRoot: string,
  business: string,
): Promise<GateResult[]> {
  const stratResult = await checkStratGate(repoRoot, business);
  const results: GateResult[] = [stratResult];

  if (stratResult.status === "FAIL") {
    results.push({
      gateId: "GATE-S6B-ACT-01",
      status: "NOT_EVALUATED",
      reasons: [
        "GATE-S6B-STRAT-01 must pass before GATE-S6B-ACT-01 is evaluated",
      ],
    });
    return results;
  }

  results.push(await checkActGate(repoRoot, business));
  return results;
}
