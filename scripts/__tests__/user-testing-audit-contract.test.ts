import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "../..");
const AUDIT_SCRIPT = path.join(
  REPO_ROOT,
  ".claude/skills/user-testing-audit/scripts/run-user-testing-audit.mjs"
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

describe("user-testing-audit expanded contract", () => {
  it("enforces no-JS predicates for key route regressions", () => {
    const source = fs.readFileSync(AUDIT_SCRIPT, "utf8");
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
    expect(source).toContain("Booking Transaction Summary");
    expect(source).toContain("booking CTA fallback");
    expect(source).toContain("SEO/Lighthouse Summary");
    expect(source).toContain("...-seo-summary.json");
  });
});
