import discoveryPolicyPredicates from "../../.claude/skills/user-testing-audit/scripts/discovery-policy-predicates.cjs";

const {
  evaluatePolicyRoute,
  evaluateLlmsTxtCheck,
  evaluateDiscoveryPolicySet,
  collectDiscoveryPolicyRegressionIssues,
} = discoveryPolicyPredicates;

describe("user-testing-audit discovery policy predicates (unit)", () => {
  it("detects noindex and hreflang alternates for a localized route", () => {
    const route = evaluatePolicyRoute({
      routePath: "/en",
      status: 200,
      lang: "en",
      headers: {
        "x-robots-tag": "noindex",
      },
      html: `
        <html><head>
          <meta name="robots" content="noindex, nofollow" />
          <link rel="alternate" hreflang="en" href="https://preview.pages.dev/en" />
          <link rel="alternate" hreflang="it" href="https://preview.pages.dev/it" />
        </head><body></body></html>
      `,
    });

    expect(route.checks.hasNoindex).toBe(true);
    expect(route.checks.hasNoindexMeta).toBe(true);
    expect(route.checks.hasNoindexHeader).toBe(true);
    expect(route.checks.hasHreflangPolicy).toBe(true);
  });

  it("flags llms.txt HTML fallback as invalid", () => {
    const llmsCheck = evaluateLlmsTxtCheck({
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
      body: "<!doctype html><html><body>Not found</body></html>",
    });

    expect(llmsCheck.checks.hasLlmsTxtStatus).toBe(true);
    expect(llmsCheck.checks.hasMachineReadableText).toBe(false);
    expect(llmsCheck.checks.passes).toBe(false);
  });

  it("collects preview noindex/hreflang/llms issues when checks fail", () => {
    const discoveryPolicy = evaluateDiscoveryPolicySet({
      origin: "https://2d506a9c.brikette-website.pages.dev",
      startPath: "/en",
      routeChecks: [
        evaluatePolicyRoute({
          routePath: "/en",
          status: 200,
          lang: "en",
          headers: {},
          html: "<html><head></head><body></body></html>",
        }),
      ],
      llmsTxtCheck: evaluateLlmsTxtCheck({
        status: 404,
        headers: { "content-type": "text/plain" },
        body: "",
      }),
    });

    const ids = collectDiscoveryPolicyRegressionIssues(discoveryPolicy).map(
      (issue: { id: string }) => issue.id
    );

    expect(ids).toEqual(
      expect.arrayContaining([
        "preview-noindex-missing",
        "hreflang-policy-missing",
        "llms-txt-recommendation-missing",
      ])
    );
  });

  it("returns no policy issues when all checks pass", () => {
    const discoveryPolicy = evaluateDiscoveryPolicySet({
      origin: "https://2d506a9c.brikette-website.pages.dev",
      startPath: "/en",
      routeChecks: [
        evaluatePolicyRoute({
          routePath: "/en",
          status: 200,
          lang: "en",
          headers: { "x-robots-tag": "noindex, nofollow" },
          html: `
            <html><head>
              <link rel="alternate" hreflang="en" href="https://preview.pages.dev/en" />
              <link rel="alternate" hreflang="it" href="https://preview.pages.dev/it" />
            </head><body></body></html>
          `,
        }),
      ],
      llmsTxtCheck: evaluateLlmsTxtCheck({
        status: 200,
        headers: { "content-type": "text/plain; charset=utf-8" },
        body: `
          # Hostel Brikette
          - https://preview.pages.dev/en/rooms
          - https://preview.pages.dev/en/how-to-get-here
          - https://preview.pages.dev/en/help
        `,
      }),
    });

    const issues = collectDiscoveryPolicyRegressionIssues(discoveryPolicy);
    expect(issues).toHaveLength(0);
  });
});
