import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { describe, expect, it } from "@jest/globals";

import { compileWebsiteContentPacket } from "../compile-website-content-packet.js";

function writeFile(repoRoot: string, relativePath: string, content: string): void {
  const fullPath = path.join(repoRoot, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, "utf8");
}

function intakeDoc(business: string, profileNote = "Digital service only."): string {
  return `---
Type: Startup-Intake-Packet
Status: Active
Business: ${business}
---

# ${business} Intake

## Notes

${profileNote}
`;
}

function offerDoc(business: string): string {
  return `---
Type: Reference
Status: Active
business: ${business}
---

# Offer

Offer body.
`;
}

function channelsDoc(business: string): string {
  return `---
Type: Reference
Status: Active
business: ${business}
---

# Channels

Channel body.
`;
}

function validLogisticsDoc(business: string): string {
  return `---
artifact: logistics-pack
business: ${business}
producer_stage: LOGISTICS-07
confidence: 0.8
last_updated: 2026-02-24
status: Active
conditional: true
condition: "business_profile includes logistics-heavy OR physical-product"
---

# Logistics Pack

## ICP Summary

summary

## Key Assumptions

- assumption

## Confidence

0.8

## Evidence Sources

- source

## Open Questions

- question

## Change-log

- 2026-02-24 initial
`;
}

describe("compileWebsiteContentPacket", () => {
  it("TC-03-01: compiles packet for non-logistics profile and records logistics skip", () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "website-packet-non-logistics-"));
    const business = "TEST";

    writeFile(
      repoRoot,
      `docs/business-os/startup-baselines/${business}-intake-packet.user.md`,
      intakeDoc(business, "Digital service only."),
    );
    writeFile(repoRoot, `docs/business-os/startup-baselines/${business}-offer.md`, offerDoc(business));
    writeFile(repoRoot, `docs/business-os/startup-baselines/${business}-channels.md`, channelsDoc(business));

    const result = compileWebsiteContentPacket({
      business,
      repoRoot,
      asOfDate: "2026-02-24",
      businessProfile: ["digital-service"],
    });

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);

    const output = fs.readFileSync(result.outputPath, "utf8");
    expect(output).toContain("## Source Ledger");
    expect(output).toContain("## Copy Approval Rules");
    expect(output).not.toContain("## Logistics Policy Inputs");

    const logisticsRow = result.sourceLedger.find((row) => row.domain === "Logistics pack");
    expect(logisticsRow?.status).toBe("skipped");
  });

  it("TC-03-02: fails with deterministic diagnostic when mandatory source is missing", () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "website-packet-missing-mandatory-"));
    const business = "TEST";

    writeFile(
      repoRoot,
      `docs/business-os/startup-baselines/${business}-intake-packet.user.md`,
      intakeDoc(business, "Digital service only."),
    );
    writeFile(repoRoot, `docs/business-os/startup-baselines/${business}-offer.md`, offerDoc(business));

    const result = compileWebsiteContentPacket({
      business,
      repoRoot,
      asOfDate: "2026-02-24",
      businessProfile: ["digital-service"],
    });

    expect(result.ok).toBe(false);
    expect(result.diagnostics.map((d) => d.code)).toContain("missing_mandatory_source");
    expect(result.diagnostics.map((d) => d.sourcePath)).toContain(
      `docs/business-os/startup-baselines/${business}-channels.md`,
    );
  });

  it("TC-03-03 and TC-03-04: logistics profile requires logistics-pack and validates contract", () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "website-packet-logistics-required-"));
    const business = "TEST";

    writeFile(
      repoRoot,
      `docs/business-os/startup-baselines/${business}-intake-packet.user.md`,
      intakeDoc(business, "Physical product exists."),
    );
    writeFile(repoRoot, `docs/business-os/startup-baselines/${business}-offer.md`, offerDoc(business));
    writeFile(repoRoot, `docs/business-os/startup-baselines/${business}-channels.md`, channelsDoc(business));

    const missingLogistics = compileWebsiteContentPacket({
      business,
      repoRoot,
      asOfDate: "2026-02-24",
      businessProfile: ["physical-product"],
    });

    expect(missingLogistics.ok).toBe(false);
    expect(missingLogistics.diagnostics.map((d) => d.code)).toContain(
      "missing_conditional_mandatory_source",
    );

    writeFile(repoRoot, `docs/business-os/strategy/${business}/logistics-pack.user.md`, `---\nartifact: logistics-pack\n---\n\n# bad\n`);

    const invalidContract = compileWebsiteContentPacket({
      business,
      repoRoot,
      asOfDate: "2026-02-24",
      businessProfile: ["physical-product"],
    });

    expect(invalidContract.ok).toBe(false);
    expect(invalidContract.diagnostics.map((d) => d.code)).toContain(
      "logistics_contract_missing_section",
    );
  });

  it("logistics-aware fixture compiles and includes logistics policy block", () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "website-packet-logistics-ok-"));
    const business = "TEST";

    writeFile(
      repoRoot,
      `docs/business-os/startup-baselines/${business}-intake-packet.user.md`,
      intakeDoc(business, "Physical product exists."),
    );
    writeFile(repoRoot, `docs/business-os/startup-baselines/${business}-offer.md`, offerDoc(business));
    writeFile(repoRoot, `docs/business-os/startup-baselines/${business}-channels.md`, channelsDoc(business));
    writeFile(repoRoot, `docs/business-os/strategy/${business}/logistics-pack.user.md`, validLogisticsDoc(business));

    const result = compileWebsiteContentPacket({
      business,
      repoRoot,
      asOfDate: "2026-02-24",
      businessProfile: ["physical-product"],
    });

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);

    const output = fs.readFileSync(result.outputPath, "utf8");
    expect(output).toContain("## Logistics Policy Inputs");
    expect(output).toContain(`docs/business-os/strategy/${business}/logistics-pack.user.md`);
  });
});
