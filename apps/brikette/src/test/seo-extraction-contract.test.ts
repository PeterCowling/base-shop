/**
 * SEO Extraction Contract Tests (SEO-10)
 *
 * These test stubs verify that the Brikette → @acme/seo extraction
 * preserves the existing API surface and behavioral contracts.
 * Written as test.todo() during planning; converted to active tests during build.
 */

describe("SEO Extraction: seo.ts re-export contract", () => {
  // TC-01: All 32 seo.ts importers compile without changes (verified via typecheck, not unit test)
  // Validated by: pnpm typecheck (exits 0 with no new errors in apps/brikette/)

  // TC-02: buildAppMetadata() output is identical before/after extraction
  test.todo(
    "buildAppMetadata() with fixture returns identical Metadata output after extraction"
  );

  // TC-04: buildLinks() with Brikette slug translation still produces correct hreflang
  test.todo(
    "buildLinks('en', '/rooms', origin) produces canonical + 10+ hreflang alternates"
  );

  // TC-06: buildBreadcrumb() with localized paths still works
  test.todo(
    "buildBreadcrumb('en', [{name, url}]) produces correct BreadcrumbList JSON-LD"
  );
});

describe("SEO Extraction: JSON-LD contract", () => {
  // TC-03: All JSON-LD contract tests pass (defer to existing seo-jsonld-contract.test.tsx)
  // Validated by: pnpm --filter brikette test -- --testPathPattern=seo-jsonld-contract

  // TC-05: @acme/ui/lib/seo importers resolve via @acme/seo re-export chain
  test.todo(
    "import { serializeJsonLd } from @acme/ui/lib/seo resolves to @acme/seo implementation"
  );
});

describe("SEO Extraction: full suite regression", () => {
  // TC-07: Full Brikette test suite passes
  // Validated by: pnpm --filter brikette test (all 3 CI shards)
  test.todo("full Brikette test suite passes after extraction");
});
