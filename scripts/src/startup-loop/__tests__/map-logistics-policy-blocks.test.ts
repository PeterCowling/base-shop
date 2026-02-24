import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { describe, expect, it } from "@jest/globals";

import { mapLogisticsPolicyBlocks } from "../map-logistics-policy-blocks.js";

function writeFile(repoRoot: string, relativePath: string, content: string): void {
  const fullPath = path.join(repoRoot, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, "utf8");
}

function logisticsPack(fields: Partial<Record<string, string>> = {}): string {
  return `---\nartifact: logistics-pack\nbusiness: TEST\nproducer_stage: LOGISTICS-07\nconfidence: 0.8\nlast_updated: 2026-02-24\nstatus: Active\nconditional: true\ncondition: "business_profile includes logistics-heavy OR physical-product"\n---\n\n# Logistics Pack\n\n## Website Policy Rules\n- Dispatch SLA: ${fields.dispatchSla ?? "Dispatch within 48 hours on business days."}\n- Return Window Rule: ${fields.returnWindowRule ?? "Returns accepted within 30 days from delivery."}\n- Return Condition Rule: ${fields.returnConditionRule ?? "Items must be unused and include original accessories."}\n- Duties/Tax Payer Rule: ${fields.dutiesTaxPayerRule ?? "Buyer pays destination customs duties unless stated otherwise at checkout."}\n- Support Response SLA: ${fields.supportResponseSla ?? "Support replies within 4 business hours during launch windows."}\n`;
}

describe("mapLogisticsPolicyBlocks", () => {
  it("TC-07-01: maps required logistics policy fields for logistics profiles", () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "logistics-policy-pass-"));
    writeFile(
      repoRoot,
      "docs/business-os/strategy/TEST/logistics-pack.user.md",
      logisticsPack(),
    );

    const result = mapLogisticsPolicyBlocks({
      business: "TEST",
      repoRoot,
      logisticsRequired: true,
    });

    expect(result.ok).toBe(true);
    expect(result.skipped).toBe(false);
    expect(result.blocks?.shippingBullets[0]).toContain("Dispatch within 48 hours");
    expect(result.blocks?.returnsBullets[0]).toContain("30 days");
    expect(result.blocks?.supportResponseSla).toContain("4 business hours");
  });

  it("TC-07-02: fails deterministically when required policy fields are missing", () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "logistics-policy-missing-"));
    writeFile(
      repoRoot,
      "docs/business-os/strategy/TEST/logistics-pack.user.md",
      logisticsPack({ supportResponseSla: "" }),
    );

    const result = mapLogisticsPolicyBlocks({
      business: "TEST",
      repoRoot,
      logisticsRequired: true,
    });

    expect(result.ok).toBe(false);
    expect(result.diagnostics.map((issue) => issue.code)).toContain("missing_policy_field");
    expect(result.diagnostics.map((issue) => issue.message).join("\n")).toContain(
      "Support Response SLA",
    );
  });

  it("TC-07-03: skips cleanly for non-logistics profiles", () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "logistics-policy-skip-"));
    const result = mapLogisticsPolicyBlocks({
      business: "TEST",
      repoRoot,
      logisticsRequired: false,
    });

    expect(result.ok).toBe(true);
    expect(result.skipped).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
  });
});
