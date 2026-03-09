import { describe, expect, it } from "@jest/globals";

import { buildLocalizedStaticRedirectRules } from "@/routing/staticExportRedirects";

describe("buildLocalizedStaticRedirectRules", () => {
  it("emits permanent redirects for internal aliases and rewrites for localized rendering", () => {
    const rules = buildLocalizedStaticRedirectRules();
    expect(rules.length).toBeGreaterThan(0);
    expect(rules.some((rule) => rule.status === 301)).toBe(true);
    expect(rules.some((rule) => rule.status === 200)).toBe(true);
  });

  it("includes bidirectional how-to-get-here alias rules", () => {
    const rules = buildLocalizedStaticRedirectRules();

    expect(rules).toEqual(
      expect.arrayContaining([
        { from: "/fr/how-to-get-here", to: "/fr/comment-venir", status: 301 },
        { from: "/fr/how-to-get-here/", to: "/fr/comment-venir/", status: 301 },
        { from: "/fr/how-to-get-here/*", to: "/fr/comment-venir/:splat", status: 301 },
        { from: "/fr/comment-venir", to: "/fr/how-to-get-here", status: 200 },
        { from: "/fr/comment-venir/", to: "/fr/how-to-get-here/", status: 200 },
        { from: "/fr/comment-venir/*", to: "/fr/how-to-get-here/:splat", status: 200 },
      ]),
    );
  });

  it("includes IT locale book redirect and rewrite rules", () => {
    const rules = buildLocalizedStaticRedirectRules();

    expect(rules).toEqual(
      expect.arrayContaining([
        { from: "/it/book", to: "/it/prenota", status: 301 },
        { from: "/it/book/", to: "/it/prenota/", status: 301 },
        { from: "/it/book/*", to: "/it/prenota/:splat", status: 301 },
        { from: "/it/prenota", to: "/it/book", status: 200 },
        { from: "/it/prenota/", to: "/it/book/", status: 200 },
        { from: "/it/prenota/*", to: "/it/book/:splat", status: 200 },
      ]),
    );
  });

  it("avoids redundant guide redirects when canonical localized slugs already match legacy aliases", () => {
    const rules = buildLocalizedStaticRedirectRules();

    expect(
      rules.some(
        (rule) =>
          rule.from === "/ja/akusesu/amalfi-positano-bus" ||
          rule.from === "/ja/how-to-get-here/amalfi-positano-bus",
      ),
    ).toBe(false);
  });
});
