/**
 * SEO Extraction Contract Tests (SEO-10)
 *
 * These tests verify that the Brikette → @acme/seo extraction
 * preserves the existing API surface and behavioral contracts.
 * Converted from test.todo() stubs during build.
 */

import { type AppLanguage, i18nConfig } from "@/i18n.config";
import {
  buildBreadcrumb,
  buildLinks,
  buildMeta,
  ensureTrailingSlash,
  type HtmlLinkDescriptor,
} from "@/utils/seo";
import { serializeJsonLdValue } from "@/utils/seo/jsonld/serialize";

// Set up supported languages for test (same as seo.test.ts)
(i18nConfig.supportedLngs as unknown as string[]) = [
  "de",
  "en",
  "es",
  "fr",
  "it",
  "ja",
  "ko",
  "pt",
  "ru",
  "zh",
];

describe("SEO Extraction: seo.ts re-export contract", () => {
  // TC-01: All seo.ts importers compile without changes (verified via typecheck, not unit test)
  // Validated by: pnpm typecheck (exits 0 with no new errors in apps/brikette/)

  // TC-02: ensureTrailingSlash re-exported from @acme/seo produces identical results
  test("ensureTrailingSlash from seo.ts matches @acme/seo behavior", () => {
    // TC-02: Re-exported ensureTrailingSlash → identical behavior
    expect(ensureTrailingSlash("/en/rooms")).toBe("/en/rooms/");
    expect(ensureTrailingSlash("/en/rooms/")).toBe("/en/rooms/");
    expect(ensureTrailingSlash("/")).toBe("/");
    expect(ensureTrailingSlash("")).toBe("/");
  });

  // TC-02b: buildMeta still produces correct output after extraction
  test("buildMeta produces correct meta tag array", () => {
    const meta = buildMeta({
      lang: "en",
      title: "Test Page",
      description: "Test description",
      url: "https://example.com/en/rooms/",
    });
    expect(meta).toEqual(
      expect.arrayContaining([
        { charSet: "utf-8" },
        { name: "description", content: "Test description" },
        { property: "og:url", content: "https://example.com/en/rooms/" },
      ]),
    );
    expect(meta[0]).toEqual({ charSet: "utf-8" });
  });

  // TC-04: buildLinks() with Brikette slug translation still produces correct hreflang
  test("buildLinks('en', '/en/rooms', origin) produces canonical + 10+ hreflang alternates", () => {
    const origin = "https://example.com";
    const links: HtmlLinkDescriptor[] = buildLinks({
      lang: "en",
      origin,
      path: "/en/rooms",
    });

    // Canonical
    expect(links[0]).toEqual({
      rel: "canonical",
      href: `${origin}/en/rooms`,
    });

    // At least 10 hreflang alternates + x-default
    const alternates = links.filter((l) => l.rel === "alternate");
    expect(alternates.length).toBeGreaterThanOrEqual(10);

    // French alternate uses translated slug
    const fr = alternates.find((l) => l.hrefLang === "fr");
    expect(fr?.href).toContain("/fr/chambres");

    // x-default present
    const xDefault = alternates.find((l) => l.hrefLang === "x-default");
    expect(xDefault).toBeDefined();
  });

  // TC-06: buildBreadcrumb() with localized paths still works
  test("buildBreadcrumb produces correct BreadcrumbList JSON-LD", () => {
    const origin = "https://example.com";
    const breadcrumb = buildBreadcrumb({
      lang: "en",
      origin,
      path: "/en/rooms/",
      title: "Rooms",
      homeLabel: "Home",
    });

    expect(breadcrumb["@context"]).toBe("https://schema.org");
    expect(breadcrumb["@type"]).toBe("BreadcrumbList");
    expect(breadcrumb.inLanguage).toBe("en");
    expect(breadcrumb.itemListElement).toHaveLength(2);
    expect(breadcrumb.itemListElement[0]).toEqual({
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: `${origin}/en`,
    });
    expect(breadcrumb.itemListElement[1]).toEqual({
      "@type": "ListItem",
      position: 2,
      name: "Rooms",
      item: `${origin}/en/rooms`,
    });
  });
});

describe("SEO Extraction: JSON-LD contract", () => {
  // TC-03: All JSON-LD contract tests pass (defer to existing seo-jsonld-contract.test.tsx)
  // Validated by: pnpm --filter brikette test -- --testPathPattern=seo-jsonld-contract

  // TC-05: serializeJsonLdValue resolves via @acme/seo re-export chain
  test("serializeJsonLdValue from Brikette serialize.ts works correctly", () => {
    // Object input → JSON string with XSS escaping
    const result = serializeJsonLdValue({ "@type": "Thing", name: "Test" });
    expect(result).toContain('"@type"');
    expect(result).toContain('"Thing"');
    expect(result).toContain('"name"');

    // String with script-breaking chars → escaped
    const dangerous = serializeJsonLdValue('{"name":"</script>"}');
    expect(dangerous).not.toContain("</script>");
    expect(dangerous).toContain("\\u003c");

    // Null → empty string
    expect(serializeJsonLdValue(null)).toBe("");
    expect(serializeJsonLdValue(undefined)).toBe("");
  });
});

describe("SEO Extraction: full suite regression", () => {
  // TC-07: Full Brikette test suite passes
  // Validated by: pnpm --filter brikette test (all 3 CI shards)
  test.todo("full Brikette test suite passes after extraction");
});
