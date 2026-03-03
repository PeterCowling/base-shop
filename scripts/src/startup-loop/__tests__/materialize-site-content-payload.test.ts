import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { describe, expect, it } from "@jest/globals";

import { materializeSiteContentPayload } from "../materialize-site-content-payload.js";

function writeFile(repoRoot: string, relativePath: string, content: string): void {
  const fullPath = path.join(repoRoot, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, "utf8");
}

function basePacket(): string {
  return `---\nType: Startup-Content-Packet\nBusiness-Name: Test Brand\n---\n\n## Source Ledger\n| Input domain | Canonical source path | Last reviewed | Notes |\n|---|---|---|---|\n| Offer | \`docs/business-os/startup-baselines/TEST-offer.md\` | 2026-02-24 | |\n\n## SEO Focus (Launch-Phase)\n### Primary transactional clusters\n- test keyword one\n- test keyword two\n- test keyword three\n\n### Secondary support clusters\n- support keyword\n\n## Page Intent Map\n| Surface | Search/User intent | Required copy blocks | Primary CTA |\n|---|---|---|---|\n| Home | intent | blocks | cta |\n\n## Product Copy Matrix\n| Product ID | Public name | Slug | One-line description | Evidence constraints |\n|---|---|---|---|---|\n| id | name | slug | desc | constraint |\n\n## Product Proof Bullets\n\n### Product Proof Bullets\n\n- Test proof bullet one.\n- Test proof bullet two.\n- Test proof bullet three.\n\n## Copy Approval Rules\n1. Rule\n`;
}

function basePacketWithBullets(bullets: string[]): string {
  const bulletLines = bullets.map((b) => `- ${b}`).join("\n");
  return `---\nType: Startup-Content-Packet\nBusiness-Name: Test Brand\n---\n\n## Source Ledger\n| Input domain | Canonical source path | Last reviewed | Notes |\n|---|---|---|---|\n| Offer | \`docs/business-os/startup-baselines/TEST-offer.md\` | 2026-02-24 | |\n\n## SEO Focus (Launch-Phase)\n### Primary transactional clusters\n- test keyword\n\n## Product Proof Bullets\n\n### Product Proof Bullets\n\n${bulletLines}\n`;
}

function basePacketWithoutBulletsSection(): string {
  return `---\nType: Startup-Content-Packet\nBusiness-Name: Test Brand\n---\n\n## Source Ledger\n| Input domain | Canonical source path | Last reviewed | Notes |\n|---|---|---|---|\n| Offer | \`docs/business-os/startup-baselines/TEST-offer.md\` | 2026-02-24 | |\n\n## SEO Focus (Launch-Phase)\n### Primary transactional clusters\n- test keyword\n`;
}

function basePacketWithEmptyBulletsSection(): string {
  return `---\nType: Startup-Content-Packet\nBusiness-Name: Test Brand\n---\n\n## Source Ledger\n| Input domain | Canonical source path | Last reviewed | Notes |\n|---|---|---|---|\n| Offer | \`docs/business-os/startup-baselines/TEST-offer.md\` | 2026-02-24 | |\n\n## SEO Focus (Launch-Phase)\n### Primary transactional clusters\n- test keyword\n\n## Product Proof Bullets\n\n### Product Proof Bullets\n\nNo bullets here, just prose.\n`;
}

function logisticsPacket(): string {
  // Extends basePacket() which already includes a ### Product Proof Bullets section.
  return `${basePacket()}\n## Logistics Policy Inputs\n- Dispatch SLA source: logistics-pack\n`;
}

function logisticsPack(): string {
  return `---\nartifact: logistics-pack\nbusiness: TEST\nproducer_stage: LOGISTICS-07\nconfidence: 0.8\nlast_updated: 2026-02-24\nstatus: Active\nconditional: true\ncondition: "business_profile includes logistics-heavy OR physical-product"\n---\n\n# Logistics Pack\n\n## Website Policy Rules\n- Dispatch SLA: Dispatch within 48 hours on business days.\n- Return Window Rule: Returns accepted within 30 days from delivery.\n- Return Condition Rule: Items must be unused and include original accessories.\n- Duties/Tax Payer Rule: Buyer pays destination customs duties unless stated otherwise at checkout.\n- Support Response SLA: Support replies within 4 business hours during launch windows.\n`;
}

describe("materializeSiteContentPayload", () => {
  it("TC-04-01: writes deterministic payload JSON from packet source", () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "materializer-pass-"));
    const sourcePath = "docs/business-os/startup-baselines/TEST-content-packet.md";

    writeFile(repoRoot, sourcePath, basePacket());

    const result = materializeSiteContentPayload({
      business: "TEST",
      shop: "test-shop",
      repoRoot,
      asOfDate: "2026-02-24",
      sourcePacketPath: sourcePath,
    });

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(fs.existsSync(result.outputPath)).toBe(true);

    const payload = JSON.parse(fs.readFileSync(result.outputPath, "utf8")) as {
      sourcePaths: string[];
      seoKeywords: string[];
      generatedAt: string;
    };

    expect(payload.generatedAt).toBe("2026-02-24");
    expect(payload.sourcePaths).toContain(
      "docs/business-os/startup-baselines/TEST-offer.md",
    );
    expect(payload.seoKeywords.slice(0, 3)).toEqual([
      "test keyword one",
      "test keyword two",
      "test keyword three",
    ]);
  });

  it("TC-04-02: fails closed when source packet is missing", () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "materializer-missing-"));
    const result = materializeSiteContentPayload({
      business: "TEST",
      shop: "test-shop",
      repoRoot,
      sourcePacketPath: "docs/business-os/startup-baselines/TEST-content-packet.md",
      write: false,
    });

    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]).toContain("Missing source packet");
  });

  it("TC-07 integration: logistics-required packet fails when logistics fields are missing", () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "materializer-logistics-missing-"));
    const sourcePath = "docs/business-os/startup-baselines/TEST-content-packet.md";

    writeFile(repoRoot, sourcePath, logisticsPacket());

    const result = materializeSiteContentPayload({
      business: "TEST",
      shop: "test-shop",
      repoRoot,
      sourcePacketPath: sourcePath,
      write: false,
    });

    expect(result.ok).toBe(false);
    expect(result.diagnostics.join("\n")).toContain("missing_logistics_pack");
  });

  it("TC-07 integration: logistics-required packet maps policy blocks from logistics pack", () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "materializer-logistics-pass-"));
    const sourcePath = "docs/business-os/startup-baselines/TEST-content-packet.md";

    writeFile(repoRoot, sourcePath, logisticsPacket());
    writeFile(
      repoRoot,
      "docs/business-os/strategy/TEST/logistics-pack.user.md",
      logisticsPack(),
    );

    const result = materializeSiteContentPayload({
      business: "TEST",
      shop: "test-shop",
      repoRoot,
      sourcePacketPath: sourcePath,
    });

    expect(result.ok).toBe(true);
    const payload = JSON.parse(fs.readFileSync(result.outputPath, "utf8")) as {
      sourcePaths: string[];
      policies: { shipping: { bullets: Array<{ en: string }> } };
      support: { responseSla: { en: string } };
    };

    expect(payload.sourcePaths).toContain(
      "docs/business-os/strategy/TEST/logistics-pack.user.md",
    );
    expect(payload.policies.shipping.bullets[0]?.en ?? "").toContain("Dispatch within 48 hours");
    expect(payload.support.responseSla.en).toContain("4 business hours");
  });

  // Proof bullets test suite (TASK-03: TC-proof-bullets-01 through TC-proof-bullets-04)

  it("TC-proof-bullets-01: packet with 5 proof bullets produces ok:true and correct proofBullets array", () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "materializer-bullets-pass-"));
    const sourcePath = "docs/business-os/startup-baselines/TEST-content-packet.md";
    const bullets = [
      "Bullet one.",
      "Bullet two.",
      "Bullet three.",
      "Bullet four.",
      "Bullet five.",
    ];

    writeFile(repoRoot, sourcePath, basePacketWithBullets(bullets));

    const result = materializeSiteContentPayload({
      business: "TEST",
      shop: "test-shop",
      repoRoot,
      sourcePacketPath: sourcePath,
    });

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);

    const payload = JSON.parse(fs.readFileSync(result.outputPath, "utf8")) as {
      productPage: { proofBullets: Array<{ en: string }> };
    };

    expect(payload.productPage.proofBullets).toHaveLength(5);
    // None of the bullets should contain placeholder strings
    for (const bullet of payload.productPage.proofBullets) {
      expect(bullet.en).not.toContain("Generated from canonical packet");
      expect(bullet.en).not.toContain("constrained by packet");
      expect(bullet.en).not.toContain("remain deterministic");
    }
  });

  it("TC-proof-bullets-02: packet missing ### Product Proof Bullets section entirely produces ok:false", () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "materializer-bullets-missing-"));
    const sourcePath = "docs/business-os/startup-baselines/TEST-content-packet.md";

    writeFile(repoRoot, sourcePath, basePacketWithoutBulletsSection());

    const result = materializeSiteContentPayload({
      business: "TEST",
      shop: "test-shop",
      repoRoot,
      sourcePacketPath: sourcePath,
      write: false,
    });

    expect(result.ok).toBe(false);
    expect(result.diagnostics.join("\n")).toContain("Product Proof Bullets");
  });

  it("TC-proof-bullets-03: packet with empty ### Product Proof Bullets section (no - lines) produces ok:false", () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "materializer-bullets-empty-"));
    const sourcePath = "docs/business-os/startup-baselines/TEST-content-packet.md";

    writeFile(repoRoot, sourcePath, basePacketWithEmptyBulletsSection());

    const result = materializeSiteContentPayload({
      business: "TEST",
      shop: "test-shop",
      repoRoot,
      sourcePacketPath: sourcePath,
      write: false,
    });

    expect(result.ok).toBe(false);
    expect(result.diagnostics.join("\n")).toContain("Product Proof Bullets");
  });

  it("TC-proof-bullets-04: each proofBullets[i].en is a non-empty string", () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "materializer-bullets-content-"));
    const sourcePath = "docs/business-os/startup-baselines/TEST-content-packet.md";
    const bullets = ["First real bullet.", "Second real bullet.", "Third real bullet."];

    writeFile(repoRoot, sourcePath, basePacketWithBullets(bullets));

    const result = materializeSiteContentPayload({
      business: "TEST",
      shop: "test-shop",
      repoRoot,
      sourcePacketPath: sourcePath,
    });

    expect(result.ok).toBe(true);
    const payload = JSON.parse(fs.readFileSync(result.outputPath, "utf8")) as {
      productPage: { proofBullets: Array<{ en: string }> };
    };

    for (const bullet of payload.productPage.proofBullets) {
      expect(typeof bullet.en).toBe("string");
      expect(bullet.en.length).toBeGreaterThan(0);
    }
  });
});
