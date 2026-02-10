import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "../..");
const AUDIT_SCRIPT = path.join(
  REPO_ROOT,
  ".claude/skills/user-testing-audit/scripts/run-user-testing-audit.mjs",
);
const AUDIT_SKILL = path.join(REPO_ROOT, ".claude/skills/user-testing-audit/SKILL.md");

describe("user-testing-audit expanded contract", () => {
  it("enforces no-JS predicates for key route regressions", () => {
    const source = fs.readFileSync(AUDIT_SCRIPT, "utf8");

    expect(source).toContain("runNoJsChecks");
    expect(source).toContain("NO_JS_BAILOUT_MARKER");
    expect(source).toContain("hasNoI18nKeyLeak");
    expect(source).toContain("hasMetadataBodyParity");
    expect(source).toContain("hasSocialProofSnapshotDate");
  });

  it("emits SEO summary and raw artifact paths", () => {
    const source = fs.readFileSync(AUDIT_SCRIPT, "utf8");

    expect(source).toContain("-seo-summary.json");
    expect(source).toContain("-seo-artifacts");
    expect(source).toContain("runSeoChecks");
  });

  it("documents that automated audit includes no-JS and SEO outputs", () => {
    const source = fs.readFileSync(AUDIT_SKILL, "utf8");

    expect(source).toContain("includes no-JS + SEO by default");
    expect(source).toContain("No-JS Predicate Summary");
    expect(source).toContain("SEO/Lighthouse Summary");
    expect(source).toContain("...-seo-summary.json");
  });
});
