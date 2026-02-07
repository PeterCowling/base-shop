import { describe, expect, it } from "@jest/globals";

import { buildLocalizedStaticRedirectRules } from "@/routing/staticExportRedirects";

describe("buildLocalizedStaticRedirectRules", () => {
  it("uses URL-preserving rewrites for localized aliases", () => {
    const rules = buildLocalizedStaticRedirectRules();
    expect(rules.length).toBeGreaterThan(0);
    expect(rules.every((rule) => rule.status === 200)).toBe(true);
  });

  it("includes localized top-level and nested how-to-get-here rules", () => {
    const rules = buildLocalizedStaticRedirectRules();

    expect(rules).toEqual(
      expect.arrayContaining([
        { from: "/fr/comment-venir", to: "/fr/how-to-get-here", status: 200 },
        { from: "/fr/comment-venir/", to: "/fr/how-to-get-here/", status: 200 },
        { from: "/fr/comment-venir/*", to: "/fr/how-to-get-here/:splat", status: 200 },
      ]),
    );
  });
});
