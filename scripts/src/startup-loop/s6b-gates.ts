/**
 * SELL gate evaluation
 *
 * Implements the two-gate SELL model:
 *   GATE-SELL-STRAT-01 — strategy design gate (DEP-gated)
 *   GATE-SELL-ACT-01   — spend activation gate (measurement-gated)
 */

import { promises as fs } from "fs";
import * as path from "path";

export type GateId = "GATE-SELL-STRAT-01" | "GATE-SELL-ACT-01";
export type GateStatus = "PASS" | "FAIL" | "NOT_EVALUATED";

export interface GateResult {
  gateId: GateId;
  status: GateStatus;
  /** Empty when status is PASS. Contains one message per failing check when FAIL. */
  reasons: string[];
}

const SALES_AUDIT_MAX_AGE_DAYS = 30;

function stripQuotes(value: string): string {
  return value.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
}

function extractFrontmatter(content: string): string | null {
  if (!content.startsWith("---\n")) return null;
  const end = content.indexOf("\n---\n", 4);
  if (end === -1) return null;
  return content.slice(4, end);
}

function readFrontmatterValue(content: string, key: string): string | null {
  const frontmatter = extractFrontmatter(content);
  if (!frontmatter) return null;
  for (const rawLine of frontmatter.split("\n")) {
    const line = rawLine.trim();
    if (!line.startsWith(`${key}:`)) continue;
    const value = line.slice(key.length + 1).trim();
    return value ? stripQuotes(value) : null;
  }
  return null;
}

function parseAuditDate(value: string | null): Date | null {
  if (!value) return null;
  const normalized = `${value}T00:00:00Z`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function ageInDays(date: Date, now: Date): number {
  return Math.floor((now.getTime() - date.getTime()) / 86_400_000);
}

async function findLatestSalesFunnelAudit(
  strategyDir: string,
): Promise<{ filePath: string; content: string } | null> {
  const salesDir = path.join(strategyDir, "sales");
  try {
    const entries = await fs.readdir(salesDir);
    const auditFiles = entries
      .filter(
        (entry) =>
          /sales-funnel.*audit.*\.user\.md$/i.test(entry),
      )
      .sort((a, b) => b.localeCompare(a));

    const latest = auditFiles[0];
    if (!latest) return null;

    const filePath = path.join(salesDir, latest);
    const content = await fs.readFile(filePath, "utf8");
    return { filePath, content };
  } catch {
    return null;
  }
}

// ── GATE-SELL-STRAT-01 ──────────────────────────────────────────────────────

/**
 * GATE-SELL-STRAT-01 (Hard) — Strategy design gate.
 *
 * Pass condition: A valid Demand Evidence Pack (DEP) artifact exists at the
 * canonical path: docs/business-os/startup-baselines/<BIZ>/demand-evidence-pack.md
 *
 * On pass: SELL-01 strategy design (channel selection, GTM plan) may begin.
 * On fail: SELL-01 is fully blocked until DEP capture is complete.
 */
export async function checkSellStratGate(
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
    return { gateId: "GATE-SELL-STRAT-01", status: "PASS", reasons: [] };
  } catch {
    const relPath = path.posix.join(
      "docs/business-os/startup-baselines",
      business,
      "demand-evidence-pack.md",
    );
    return {
      gateId: "GATE-SELL-STRAT-01",
      status: "FAIL",
      reasons: [
        `GATE-SELL-STRAT-01: No valid DEP artifact at canonical path: ${relPath}`,
      ],
    };
  }
}

// ── GATE-SELL-ACT-01 ────────────────────────────────────────────────────────

/**
 * GATE-SELL-ACT-01 (Hard) — Spend activation gate.
 *
 * All four checks must pass:
 *   Check 1: A measurement-verification artifact exists with Status: Active.
 *   Check 2: No active measurement risks at Severity: High or Critical in plan.user.md.
 *   Check 3: Key conversion-intent events are verified non-zero in the baseline.
 *   Check 4: A recent rendered sales-funnel audit for this business passes on
 *            mobile + fullscreen.
 *
 * Evaluated only after GATE-SELL-STRAT-01 passes.
 */
export async function checkSellActGate(
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
  // After domain-container migration, measurement-verification lives under
  // <BIZ>/assessment/. Try the new path first, fall back to root for compat.
  let check1Pass = false;
  const searchDirs = [
    path.join(strategyDir, "assessment"), // new: <BIZ>/assessment/
    strategyDir,                          // legacy: <BIZ>/
  ];
  for (const dir of searchDirs) {
    if (check1Pass) break;
    try {
      const entries = await fs.readdir(dir);
      const measFiles = entries.filter(
        (e) =>
          e.includes("measurement-verification") && e.endsWith(".user.md"),
      );
      for (const filename of measFiles) {
        const content = await fs.readFile(
          path.join(dir, filename),
          "utf8",
        );
        if (/^Status:\s*Active\s*$/m.test(content)) {
          check1Pass = true;
          break;
        }
      }
    } catch {
      // directory does not exist — continue to next candidate
    }
  }
  if (!check1Pass) {
    reasons.push(
      "GATE-SELL-ACT-01 [check-1]: No measurement-verification artifact with Status: Active found in " +
        `docs/business-os/strategy/${business}/assessment/ or the legacy root strategy directory`,
    );
  }

  // ── Check 2: no High/Critical measurement risks in plan.user.md ───────────
  const planPath = path.join(strategyDir, "plan.user.md");
  try {
    const planContent = await fs.readFile(planPath, "utf8");
    if (/measurement.*severity:\s*(high|critical)/i.test(planContent)) {
      reasons.push(
        "GATE-SELL-ACT-01 [check-2]: Active measurement risks at High or Critical severity found in plan.user.md",
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
        "GATE-SELL-ACT-01 [check-3]: Conversion events not verified non-zero in production baseline (plan.user.md)",
      );
    }
  } catch {
    reasons.push(
      "GATE-SELL-ACT-01 [check-3]: plan.user.md not found - conversion events cannot be verified",
    );
  }

  // ── Check 4: rendered sales-funnel audit passes activation readiness ─────
  const audit = await findLatestSalesFunnelAudit(strategyDir);
  if (!audit) {
    reasons.push(
      "GATE-SELL-ACT-01 [check-4]: No rendered sales-funnel audit artifact found in " +
        `docs/business-os/strategy/${business}/sales/ matching *sales-funnel*audit*.user.md`,
    );
  } else {
    const type = readFrontmatterValue(audit.content, "Type");
    const auditBusiness = readFrontmatterValue(audit.content, "Business");
    const status = readFrontmatterValue(audit.content, "Status");
    const viewportScope = readFrontmatterValue(audit.content, "Viewport-Scope");
    const renderedEvidence = readFrontmatterValue(audit.content, "Rendered-Evidence");
    const activationDecision = readFrontmatterValue(audit.content, "Activation-Decision");
    const highBlockersRaw = readFrontmatterValue(
      audit.content,
      "Activation-Blockers-High",
    );
    const criticalBlockersRaw = readFrontmatterValue(
      audit.content,
      "Activation-Blockers-Critical",
    );
    const auditDate = parseAuditDate(readFrontmatterValue(audit.content, "Date"));
    const now = new Date();

    const highBlockers = Number.parseInt(highBlockersRaw ?? "", 10);
    const criticalBlockers = Number.parseInt(criticalBlockersRaw ?? "", 10);

    if (type !== "Sales-Funnel-Audit") {
      reasons.push(
        "GATE-SELL-ACT-01 [check-4]: Latest rendered sales-funnel artifact does not declare Type: Sales-Funnel-Audit",
      );
    } else if (auditBusiness !== business) {
      reasons.push(
        `GATE-SELL-ACT-01 [check-4]: Latest rendered sales-funnel audit declares Business: ${auditBusiness ?? "(missing)"} instead of ${business}`,
      );
    } else if (status !== "Active") {
      reasons.push(
        "GATE-SELL-ACT-01 [check-4]: Latest rendered sales-funnel audit is not Status: Active",
      );
    } else if (!auditDate) {
      reasons.push(
        "GATE-SELL-ACT-01 [check-4]: Latest rendered sales-funnel audit is missing a valid Date frontmatter field",
      );
    } else if (ageInDays(auditDate, now) > SALES_AUDIT_MAX_AGE_DAYS) {
      reasons.push(
        `GATE-SELL-ACT-01 [check-4]: Latest rendered sales-funnel audit is older than ${SALES_AUDIT_MAX_AGE_DAYS} days`,
      );
    } else if (
      !viewportScope ||
      !viewportScope.toLowerCase().includes("mobile") ||
      !viewportScope.toLowerCase().includes("fullscreen")
    ) {
      reasons.push(
        "GATE-SELL-ACT-01 [check-4]: Latest rendered sales-funnel audit does not cover both mobile and fullscreen viewports",
      );
    } else if (renderedEvidence !== "required") {
      reasons.push(
        "GATE-SELL-ACT-01 [check-4]: Latest rendered sales-funnel audit does not declare Rendered-Evidence: required",
      );
    } else if (activationDecision !== "Pass") {
      reasons.push(
        "GATE-SELL-ACT-01 [check-4]: Latest rendered sales-funnel audit is not activation-ready (Activation-Decision is not Pass)",
      );
    } else if (
      Number.isNaN(highBlockers) ||
      Number.isNaN(criticalBlockers) ||
      highBlockers !== 0 ||
      criticalBlockers !== 0
    ) {
      reasons.push(
        "GATE-SELL-ACT-01 [check-4]: Latest rendered sales-funnel audit does not confirm zero High/Critical activation blockers",
      );
    }
  }

  return {
    gateId: "GATE-SELL-ACT-01",
    status: reasons.length === 0 ? "PASS" : "FAIL",
    reasons,
  };
}

// ── Entry point ─────────────────────────────────────────────────────────────

/**
 * Evaluate both SELL gates in order.
 *
 * GATE-SELL-STRAT-01 is always evaluated first.
 * GATE-SELL-ACT-01 is only evaluated when STRAT-01 passes.
 * Returns results for every gate (including NOT_EVALUATED for skipped gates).
 */
export async function evaluateSellGates(
  repoRoot: string,
  business: string,
): Promise<GateResult[]> {
  const stratResult = await checkSellStratGate(repoRoot, business);
  const results: GateResult[] = [stratResult];

  if (stratResult.status === "FAIL") {
    results.push({
      gateId: "GATE-SELL-ACT-01",
      status: "NOT_EVALUATED",
      reasons: [
        "GATE-SELL-STRAT-01 must pass before GATE-SELL-ACT-01 is evaluated",
      ],
    });
    return results;
  }

  results.push(await checkSellActGate(repoRoot, business));
  return results;
}
