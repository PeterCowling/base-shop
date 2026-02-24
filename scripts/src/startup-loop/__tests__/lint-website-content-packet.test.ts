import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { describe, expect, it } from "@jest/globals";

import { lintWebsiteContentPacket } from "../lint-website-content-packet.js";

function writeFile(repoRoot: string, relativePath: string, content: string): void {
  const fullPath = path.join(repoRoot, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, "utf8");
}

function validPacket(): string {
  return `---\nType: Startup-Content-Packet\n---\n\n## SEO Focus\n### Primary transactional terms\n- keyword one\n- keyword two\n- keyword three\n\n### Secondary support terms\n- support keyword\n\n## Page Intent Map\n| Surface | Search/User intent | Required copy blocks | Primary CTA |\n|---|---|---|---|\n| Home | intent | blocks | cta |\n\n## Product Copy Matrix\n| Product ID | Public name | Slug | One-line description | Evidence constraints |\n|---|---|---|---|---|\n| id-1 | name | slug | desc | source-constraint |\n\n## Copy Approval Rules\n1. No unverified claims\n`;
}

describe("lintWebsiteContentPacket", () => {
  it("TC-05-01: passes a compliant packet", () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "lint-packet-pass-"));
    const packetPath = "docs/business-os/startup-baselines/TEST-content-packet.md";
    writeFile(repoRoot, packetPath, validPacket());

    const result = lintWebsiteContentPacket({
      business: "TEST",
      repoRoot,
    });

    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("TC-05-02: fails deterministically when SEO section is missing", () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "lint-packet-missing-seo-"));
    const packetPath = "docs/business-os/startup-baselines/TEST-content-packet.md";
    writeFile(
      repoRoot,
      packetPath,
      validPacket().replace("## SEO Focus", "## Launch Focus"),
    );

    const result = lintWebsiteContentPacket({
      business: "TEST",
      repoRoot,
    });

    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain("missing_required_section");
    expect(result.issues.map((issue) => issue.message).join("\n")).toContain("## SEO Focus");
  });

  it("TC-05-03: fails deterministically when a forbidden claim appears", () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "lint-packet-forbidden-"));
    const packetPath = "docs/business-os/startup-baselines/TEST-content-packet.md";
    writeFile(
      repoRoot,
      packetPath,
      `${validPacket()}\nTrust line: made in italy\n`,
    );

    const result = lintWebsiteContentPacket({
      business: "TEST",
      repoRoot,
      forbiddenClaims: ["made in italy"],
    });

    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain("forbidden_claim");
    expect(result.issues.map((issue) => issue.message).join("\n")).toContain("made in italy");
  });
});
