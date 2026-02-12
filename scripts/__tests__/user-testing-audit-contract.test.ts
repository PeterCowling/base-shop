import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "../..");
const FOCUSED_AUDIT_SCRIPT = path.join(
  REPO_ROOT,
  ".claude/skills/user-testing-audit/scripts/run-user-testing-audit.mjs"
);
const FULL_CRAWL_AUDIT_SCRIPT = path.join(
  REPO_ROOT,
  ".claude/skills/user-testing-audit/scripts/run-full-js-off-sitemap-crawl.mjs"
);
const AUDIT_NO_JS_MODULE = path.join(
  REPO_ROOT,
  ".claude/skills/user-testing-audit/scripts/no-js-predicates.cjs"
);
const AUDIT_BOOKING_MODULE = path.join(
  REPO_ROOT,
  ".claude/skills/user-testing-audit/scripts/booking-transaction-predicates.cjs"
);
const AUDIT_DISCOVERY_POLICY_MODULE = path.join(
  REPO_ROOT,
  ".claude/skills/user-testing-audit/scripts/discovery-policy-predicates.cjs"
);
const AUDIT_SKILL = path.join(
  REPO_ROOT,
  ".claude/skills/user-testing-audit/SKILL.md"
);
const AUDIT_REPORT_TEMPLATE = path.join(
  REPO_ROOT,
  ".claude/skills/user-testing-audit/references/report-template.md"
);

describe("user-testing-audit expanded contract", () => {
  it("enforces focused no-JS + booking + discovery policy checks", () => {
    const source = fs.readFileSync(FOCUSED_AUDIT_SCRIPT, "utf8");
    const moduleSource = fs.readFileSync(AUDIT_NO_JS_MODULE, "utf8");
    const bookingModuleSource = fs.readFileSync(AUDIT_BOOKING_MODULE, "utf8");
    const discoveryPolicyModuleSource = fs.readFileSync(
      AUDIT_DISCOVERY_POLICY_MODULE,
      "utf8"
    );

    expect(source).toContain("runNoJsChecks");
    expect(source).toContain("runBookingTransactionChecks");
    expect(source).toContain("evaluateNoJsRoute");
    expect(source).toContain("collectNoJsRegressionIssues");
    expect(source).toContain("evaluateBookingTransactionCheck");
    expect(source).toContain("collectBookingTransactionRegressionIssues");
    expect(source).toContain("runDiscoveryPolicyChecks");
    expect(source).toContain("collectDiscoveryPolicyRegressionIssues");
    expect(source).toContain("hasNoI18nKeyLeak");
    expect(source).toContain("hasNoBookingFunnelI18nLeak");
    expect(source).toContain("hasBookingCtaFallback");
    expect(source).toContain("hasVisibleBookingCtaLabel");
    expect(source).toContain("hasCrawlableGuideLinks");
    expect(source).toContain("hasRoomInventoryCrawlability");
    expect(source).toContain("hasMailtoContactLink");
    expect(source).toContain("hasNamedSocialLinks");
    expect(source).toContain("hasMetadataBodyParity");
    expect(source).toContain("hasSocialProofSnapshotDate");
    expect(moduleSource).toContain("booking-cta-no-js-fallback");
    expect(moduleSource).toContain("booking-cta-visible-label-missing");
    expect(moduleSource).toContain("experiences-guide-text-links-missing");
    expect(moduleSource).toContain("room-inventory-crawlability-missing");
    expect(moduleSource).toContain("contact-email-mailto-missing");
    expect(moduleSource).toContain("social-links-accessible-name-missing");
    expect(moduleSource).toContain("no-js-booking-funnel-key-leakage");
    expect(discoveryPolicyModuleSource).toContain("preview-noindex-missing");
    expect(discoveryPolicyModuleSource).toContain("hreflang-policy-missing");
    expect(discoveryPolicyModuleSource).toContain(
      "llms-txt-recommendation-missing"
    );
    expect(bookingModuleSource).toContain("booking-transaction-provider-handoff");
    expect(source).toContain("Booking Transaction Summary");
    expect(source).toContain("Discovery Policy Summary");
  });

  it("enforces full sitemap JS-off crawl contract", () => {
    const source = fs.readFileSync(FULL_CRAWL_AUDIT_SCRIPT, "utf8");

    expect(source).toContain("collectSitemapLocs");
    expect(source).toContain("evaluateNoJsRoute");
    expect(source).toContain("new URL(\"/sitemap.xml\", origin)");
    expect(source).toContain("new URL(\"/robots.txt\", parsed.origin)");
    expect(source).toContain("new URL(\"/llms.txt\", parsed.origin)");
    expect(source).toContain("--max-sitemaps");
    expect(source).toContain("aggregateFindings");
    expect(source).toContain("-full-js-off-crawl");
  });

  it("emits focused SEO summary and raw artifact paths", () => {
    const source = fs.readFileSync(FOCUSED_AUDIT_SCRIPT, "utf8");

    expect(source).toContain("-seo-summary.json");
    expect(source).toContain("-seo-artifacts");
    expect(source).toContain("runSeoChecks");
  });

  it("documents two-layer workflow and artifacts in skill + template", () => {
    const skillSource = fs.readFileSync(AUDIT_SKILL, "utf8");
    const templateSource = fs.readFileSync(AUDIT_REPORT_TEMPLATE, "utf8");

    expect(skillSource).toContain("two-layer by default");
    expect(skillSource).toContain("run-full-js-off-sitemap-crawl.mjs");
    expect(skillSource).toContain("full-js-off-crawl.md");
    expect(skillSource).toContain("full-js-off-crawl.json");
    expect(skillSource).toContain("No-JS Predicate Summary");
    expect(skillSource).toContain("Booking Transaction Summary");
    expect(skillSource).toMatch(/discovery policy summary/i);

    expect(templateSource).toContain("Artifacts-Full-Crawl-Markdown");
    expect(templateSource).toContain("Artifacts-Full-Crawl-JSON");
    expect(templateSource).toContain("Artifacts-Focused-Markdown");
    expect(templateSource).toContain("Artifacts-Focused-JSON");
    expect(templateSource).toContain("## Audit Layers");
    expect(templateSource).toContain("## Layer A Summary (Full JS-off Crawl)");
    expect(templateSource).toContain("## Booking Transaction Summary (Focused)");
  });
});
