---
Type: Plan
Status: In-progress
Domain: SEO
Created: 2026-01-28
Last-reviewed: 2026-01-28
Last-updated: 2026-01-28
Relates-to charter: SEO + machine-readership correctness
---

# Brikette SEO + Machine-Readership Fixes

## Executive Summary

Fix critical SEO and machine-readership issues identified in production audit. P0 issues:
- Incorrect hreflang alternates (causes duplicate content risk)
- Deep localization gap (150+ English-slug duplicates in non-English locales)
- Machine-layer drift (broken refs in OpenAPI, ai-plugin.json, llms.txt)
- Draft routes are indexable (SEO leak)

**Current state (2026-01-28 post-re-planning + corrections):** 9 of 10 tasks ≥80% confidence. TASK-SEO-4 partially complete but tests failing (dropped to 65%).

**Re-planning complete (2nd pass):** Investigated all 5 below-threshold tasks, raised confidence through evidence gathering and decision-making. Post-build correction: TASK-SEO-4 incomplete (tests broken, metadata.ts not updated).

**Fact-find:** `docs/plans/brikette-seo-and-machine-readership-fact-finding.md`

### Reality Count

- **Total localizable routes:** ~30 top-level routes (per `apps/brikette/src/routing/routeInventory.ts`)
- **Languages:** 18 (i18n.config.ts:7-26)
- **Duplicate URL pairs identified:** 150+ (30 routes × 5 major locales where English slugs serve content)
- **Pages affected by hreflang bug:** 500+ (30 routes × 18 languages, minus a few non-localized routes)
- **Machine-layer documents:** 3 (openapi.yaml, ai-plugin.json, llms.txt)
- **Schema files:** 6+ .jsonld files (in src/schema/hostel-brikette/)

---

## Active tasks

### TASK-SEO-1: Fix hreflang alternates in buildAppMetadata()

**Status:** Ready
**Confidence:** 88% (min: Implementation 92%, Approach 88%, Impact 88%)
**Effort:** M (4-6 hours)
**Owner:** Unassigned
**Dependencies:** None
**Priority:** P0

**Problem (code-grounded):**
- `apps/brikette/src/app/_lib/metadata.ts:56-60` uses naive string replacement:
  ```typescript
  const alternatePath = path.replace(`/${lang}`, `/${supportedLang}`);
  ```
- Cannot translate localized slugs (e.g., `/en/rooms` → `/de/rooms` instead of `/de/zimmer`)
- Affects all pages using `generateMetadata()` (500+ pages across 18 languages; i18n.config.ts:7-26)

**Solution:**
- Call `buildLinks()` from `apps/brikette/src/utils/seo.ts:90-186` (proven correct, 23 tests in seo.test.ts)
- Convert `HtmlLinkDescriptor[]` → Next.js `alternates.languages` Record<string, string>

**Acceptance criteria:**
- [ ] `buildAppMetadata()` calls `buildLinks()` to generate alternates
- [ ] `alternates.languages` map uses localized slugs (verified against SLUGS map)
- [ ] x-default alternate preserved
- [ ] Unit tests for `buildAppMetadata()` wrapper (currently untested)
- [ ] Spot-check 10 URLs × 3 locales via curl post-deployment

**Why not 80%+:**
- **Implementation (80%):** Need to validate Next.js `alternates.languages` merging behavior (does it override root layout?)
- **Approach (78%):** x-default handling needs confirmation (Next.js vs our buildLinks convention)
- **Impact (76%):** Large blast radius (500+ pages); no integration test harness exists for App Router metadata

**Evidence:**
- Bug location: `metadata.ts:56-60`
- Correct logic: `seo.ts:90-186` (`buildLinks()`)
- Test coverage: `seo.test.ts` (23 total tests, 20 currently passing after TASK-SEO-4 changes; zero tests for metadata.ts wrapper)

#### Re-plan Update (2026-01-28)

**Investigation performed:**
- Verified integration seam: `buildAppLinks()` function (metadata.ts:111-129) already shows pattern for calling `seo.buildLinks()`
- Confirmed Next.js metadata merging: TASK-SEO-9 investigation proves page metadata overrides root layout (doesn't merge)
- Enumerated call sites: 20-30 pages using `buildAppMetadata()` (grep confirmed)
- Verified test coverage: 23 tests for `buildLinks()` in seo.test.ts (20 passing, 3 failing after TASK-SEO-4 changes)

**Decision:**
- Use `buildLinks()` and convert HtmlLinkDescriptor[] → Record<string, string>
- Filter `rel="alternate"` items, map to `{[hrefLang]: href}`
- x-default is already included in buildLinks() output (seo.ts:173-183)

**Confidence raised:** 78% → 88%
- Implementation: 80% → 92% (integration pattern exists, conversion trivial, types compatible)
- Approach: 78% → 88% (Next.js merging behavior confirmed, buildLinks() proven correct)
- Impact: 76% → 88% (call sites enumerated, no breaking changes, TASK-SEO-2 adds tests, simple rollback)

**Changes to task:**
- Updated acceptance criteria: Verified TASK-SEO-2 will add regression tests
- No dependency changes

---

### TASK-SEO-2: Add metadata output tests

**Status:** Ready
**Confidence:** 80% (min: Implementation 82%, Approach 80%, Impact 78%)
**Effort:** M (3-4 hours)
**Owner:** Unassigned
**Dependencies:** TASK-SEO-1
**Priority:** P1

**Problem (code-grounded):**
- No tests for `buildAppMetadata()` wrapper (existing tests only cover `buildLinks()`)
- No precedent in repo for testing App Router metadata
- Need regression prevention for TASK-SEO-1 fix

**Solution (unit-first approach):**
- **Primary:** Unit tests for `buildAppMetadata()` output object
- **Secondary (optional):** Integration tests calling page `generateMetadata()` functions
- **Start simple:** Test the wrapper, not every page

**Implementation plan:**
1. Create `apps/brikette/src/test/lib/metadata.test.ts`
2. Test `buildAppMetadata()` with various inputs:
   - Home page (`path: "/en"`)
   - Localized route (`path: "/en/rooms"`)
   - Nested localized route (`path: "/en/experiences/ferry-schedules"`)
3. Assert output Metadata structure:
   - `alternates.canonical` matches expected URL
   - `alternates.languages` has all supported locales
   - `alternates.languages` uses localized slugs (NOT string replacement)
   - `openGraph.title` and `openGraph.description` are present
   - Note: Social metadata fields (siteName, twitter.site) added by TASK-SEO-9
4. Integration tests (optional): Import `generateMetadata` from 2-3 pages, call with mock params, assert output

**Test pattern (concrete example):**
```typescript
import { buildAppMetadata } from "@/app/_lib/metadata";

describe("buildAppMetadata", () => {
  it("generates correct alternates for rooms page", () => {
    const metadata = buildAppMetadata({
      lang: "en",
      title: "Rooms",
      description: "Our rooms",
      path: "/en/rooms",
    });

    expect(metadata.alternates?.canonical).toBe("https://hostel-positano.com/en/rooms/");
    expect(metadata.alternates?.languages?.de).toBe("https://hostel-positano.com/de/zimmer/");
    expect(metadata.alternates?.languages?.fr).toBe("https://hostel-positano.com/fr/chambres/");
    expect(metadata.openGraph?.title).toBe("Rooms");
    expect(metadata.openGraph?.description).toBe("Our rooms");
  });
});
```

**Acceptance criteria:**
- [ ] Unit tests for `buildAppMetadata()` output structure
- [ ] Tests cover 3 route patterns (home, simple localized, nested localized)
- [ ] Tests verify localized slugs in `alternates.languages` (rooms → zimmer/chambres)
- [ ] Tests verify basic openGraph fields (title, description) are present
- [ ] Tests prevent regression of TASK-SEO-1 fixes (hreflang/canonical)

**Why 80%:**
- **Implementation (82%):** Clear test pattern provided; standard Jest approach
- **Approach (80%):** Unit-first is pragmatic (test the wrapper, not every page)
- **Impact (78%):** Tests only; low risk; but adds valuable regression prevention

#### Re-plan Update (2026-01-28)

**Investigation performed:**
- Confirmed no existing metadata tests: `rg "generateMetadata" apps/brikette/src/test` → zero
- Researched approach: Unit tests for wrapper are sufficient (don't need to test every page)
- Pattern: Follow existing test structure in `seo.test.ts` (assert output object properties)

**Decision:**
- **Approach:** Unit tests for `buildAppMetadata()` (not integration tests for every page)
- **Why:** Simpler, faster, provides regression prevention for TASK-SEO-1 and TASK-SEO-9

**Confidence raised:** 62% → 80%
- Implementation: 65% → 82% (concrete test pattern provided)
- Approach: 62% → 80% (unit-first decision made)
- Impact: 75% → 78% (scope clarified: wrapper only, not every page)

**Evidence:**
- No existing pattern: `rg "generateMetadata" apps/brikette/src/test` → zero hits
- Test file location: Create `apps/brikette/src/test/lib/metadata.test.ts`
- Reference pattern: `apps/brikette/src/test/utils/seo.test.ts` (similar assertions)

---

### TASK-SEO-3: Enforce deep localization redirects in middleware

**Status:** Ready
**Confidence:** 80% (min: Implementation 84%, Approach 82%, Impact 80%)
**Effort:** L (8-10 hours)
**Owner:** Unassigned
**Dependencies:** TASK-SEO-4 (trailing-slash policy - now resolved)
**Priority:** P0

**Problem (code-grounded):**
- `apps/brikette/src/middleware.ts:88-92` only rewrites localized slugs → internal segments
- Does NOT redirect English slugs in wrong locale (e.g., `/de/rooms/` renders instead of redirecting)
- **Complexity:** Internal segments ≠ English slugs in all cases:
  - `assistance` (internal) vs `help` (English slug) — both must redirect in non-English locales
  - Room IDs like `double_room` must NOT redirect (language-agnostic by design)
- **Coordination:** Must handle trailing-slash redirects in same hop (avoid 3-hop chains)

**Current middleware behavior (code truth):**
```typescript
const key = resolveTopLevelKey(appLang, nextParts[1] ?? "");
if (key) {
  nextParts[1] = INTERNAL_SEGMENT_BY_KEY[key];  // rewrite only
}
// If key is null (English slug), just pass through → duplicate content
```

**Solution requirements:**
1. Detect when first segment after `/:lang/` is an English slug OR internal segment that doesn't match locale
2. Redirect (301) to localized slug + preserve trailing slash in one hop
3. Whitelist language-agnostic child segments (room IDs, guide slugs handled separately)
4. Add comprehensive tests (none exist today: `rg middleware apps/brikette/src/test` → no hits)

**Acceptance criteria:**
- [ ] `/de/rooms` → 301 → `/de/zimmer/` (not `/de/zimmer` then `/de/zimmer/`)
- [ ] `/fr/help` → 301 → `/fr/aide/` (English slug for assistance)
- [ ] `/fr/assistance` → 301 → `/fr/aide/` (internal segment in wrong locale)
- [ ] `/en/rooms/double_room` → NO redirect (room ID is language-agnostic)
- [ ] Query params preserved in redirect
- [ ] Middleware tests for all slug keys × all locales (150+ test cases or parameterized)
- [ ] No redirect loops (max 1 redirect hop)

**Why 76%:**
- **Implementation (78%):** Redirect logic pattern clear; trailing-slash resolution complete
- **Approach (76%):** Strategy defined (whitelist top-level slugs, include trailing slash in redirect)
- **Impact (74%):** High blast radius but mitigated by testing plan; no test precedent is main risk

#### Re-plan Update (2026-01-28)

**Investigation performed:**
- TASK-SEO-4 resolved: Keep trailing slashes (Cloudflare Pages enforces)
- Redirect strategy: Include trailing slash in redirect target (one-hop redirect)
- Test approach: Create `apps/brikette/src/test/middleware.test.ts` with NextRequest/NextResponse mocks

**Decision:**
- **Redirect format:** `/de/rooms` → 301 → `/de/zimmer/` (include trailing slash)
- **Scope:** Only redirect first segment after `/:lang/` (whitelist SLUGS map keys)
- **Testing:** Use Next.js test utilities for NextRequest/NextResponse (or minimal mocks)

**Implementation clarification:**
```typescript
// In middleware.ts after line 89:
const key = resolveTopLevelKey(appLang, nextParts[1] ?? "");
if (key) {
  nextParts[1] = INTERNAL_SEGMENT_BY_KEY[key];
  return NextResponse.rewrite(url); // existing behavior
} else {
  // NEW: Check if this is English slug or internal segment in wrong locale
  const wrongSlug = detectWrongLocaleSlug(nextParts[1], appLang);
  if (wrongSlug) {
    const correctSlug = SLUGS[wrongSlug][appLang];
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${appLang}/${correctSlug}${remainingPath}/`;
    return NextResponse.redirect(redirectUrl, 301);
  }
}
```

**Remaining unknowns (acceptable at 76%):**
- Performance impact of 301 redirects (should be minimal; CDN caching helps)
- Edge cases with query params and hash fragments (preserve in redirect, test coverage needed)

**Confidence raised:** 58% → 76%
- Implementation: 60% → 78% (redirect format clear, trailing-slash decision made)
- Approach: 58% → 76% (strategy defined with TASK-SEO-4 resolution)
- Impact: 56% → 74% (testing approach identified, but still highest-risk task)

**Evidence:**
- Current middleware: `middleware.ts:71-111` (rewrite only, no redirects)
- Slug maps: `slug-map.ts` (SLUGS), `middleware.ts:18-36` (INTERNAL_SEGMENT_BY_KEY)
- No tests: `rg middleware apps/brikette/src/test` → zero results
- Duplicate content observed: `/de/rooms/` and `/de/zimmer/` both serve (fact-find evidence)
- Trailing-slash decision: TASK-SEO-4 re-plan (keep slashes)

#### Re-plan Update (2026-01-28)

**Investigation performed:**
- Verified middleware implementation (middleware.ts:71-111): rewrites only, no redirect logic
- Confirmed test gap: zero middleware tests exist (grep confirmed)
- Clarified detection logic: need reverse maps for English slug + internal segment lookups
- Confirmed TASK-SEO-4 resolution: include trailing slash in redirect (one-hop redirect)

**Decision:**
- Detect wrong locale (English slug OR internal segment) → 301 redirect with trailing slash
- Build reverse lookup maps to identify mismatches
- Whitelist top-level slugs only (child segments pass through)
- Test approach: Create middleware.test.ts with NextRequest/NextResponse mocks

**Confidence raised:** 76% → 80%
- Implementation: 78% → 84% (detection logic clarified, test approach defined, integration seam identified)
- Approach: 76% → 82% (strategy locked in, TASK-SEO-4 resolved trailing-slash coordination)
- Impact: 74% → 80% (blast radius quantified: 150+ redirects, test plan detailed: 270 combinations)

**Remaining unknowns at 80%:**
- API route exclusion completeness (can verify during implementation)
- Performance impact validation (needs preview deployment)

**Changes to task:**
- Updated acceptance criteria: Added test matrix (keys × locales, parameterized tests)
- No dependency changes

---

### TASK-SEO-4: Align canonical/trailing-slash policy

**Status:** Partially Complete (tests failing, needs fix)
**Confidence:** 65% (min: Implementation 70%, Approach 82%, Impact 65%)
**Effort:** M (4-5 hours; ~2-3 hours remaining to fix tests)
**Owner:** Unassigned
**Dependencies:** None (but affects TASK-SEO-3, TASK-SEO-7)
**Priority:** P0

**Problem (code-grounded):**
- Canonical URLs strip trailing slashes but server enforces them (HTTP 308 redirects)
- **Multi-surface issue** (not "one-line"):
  - `seo.ts:66-67`: `trimTrailingSlash()` removes slashes
  - `routeHead.ts:142`: Fallback canonical also strips slashes
  - `seo-jsonld-contract.test.tsx:63-80`: Tests ASSERT canonicals without slashes
  - `generate-public-seo.ts:22`: Sitemap normalizer strips slashes

**Decision made:** Keep trailing slashes (align with server behavior)

**Rationale for decision:**
1. **Production evidence:** `curl -sI https://hostel-positano.com/en/rooms` → `location: /en/rooms/` (Cloudflare Pages enforces)
2. **Precedent in repo:** `apps/prime/next.config.mjs` sets `trailingSlash: true`
3. **Lower risk:** Updating repo code is easier than changing Cloudflare Pages config (external)
4. **Future-proof:** Aligns with server reality; prevents redirect hops

**Implementation plan:**
1. Update `seo.ts:66-67`: Modify `trimTrailingSlash()` → `ensureTrailingSlash()` that adds slash for non-root paths
2. Update `routeHead.ts:142`: Remove slash-stripping in fallback canonical
3. Update `metadata.ts`: Ensure canonicals include trailing slash
4. Update `generate-public-seo.ts:22`: Change normalizer to preserve/add slashes
5. **Optional:** Add `trailingSlash: true` to `apps/brikette/next.config.mjs` (matches apps/prime precedent; makes Next.js link behavior consistent)
6. **Fix tests:** Update assertions in `seo-jsonld-contract.test.tsx` (lines 73, 80, 90) to expect slashed URLs

**Acceptance criteria:**
- [ ] All canonical URLs end with `/` (except root `/`)
- [ ] Sitemap entries include trailing slashes
- [ ] All tests pass (assertions updated to expect slashes)
- [ ] curl validation: canonical tag matches final URL (no redirect hop)
- [ ] No regression: JSON-LD still valid after URL format change

**Why 82%:**
- **Implementation (85%):** Clear file list and changes; well-scoped
- **Approach (82%):** Decision made with evidence; follows repo precedent
- **Impact (80%):** Test updates needed (4 assertions); sitemap format change

#### Re-plan Update (2026-01-28)

**Investigation performed:**
- Production: `curl -sI https://hostel-positano.com/en/rooms` → Cloudflare enforces trailing slashes
- Repo: `apps/prime/next.config.mjs:7` → Precedent for `trailingSlash: true`
- Tests: `seo-jsonld-contract.test.tsx:73, 80, 90` → Currently expect slashless (will break, need update)
- Config: No `trailingSlash` setting in brikette's `next.config.mjs` (using Next.js default = false)

**Decision:**
- **Policy:** Keep trailing slashes (align with Cloudflare Pages server behavior)
- **Why:** Lower risk, matches repo precedent, aligns with production reality
- **Impact:** 4 files to update, ~4 test assertions to fix

**Confidence raised:** 52% → 82%
- Implementation: 55% → 85% (file list and changes identified)
- Approach: 52% → 82% (decision made with evidence)
- Impact: 50% → 80% (test impact quantified: 4 assertions)

**Evidence:**
- Canonicals strip slash: `seo.ts:66-67`, `routeHead.ts:142`
- Server enforces slash: Production `curl` shows `location: /en/rooms/`, `server: cloudflare`
- Tests expect slashless: `seo-jsonld-contract.test.tsx:73`, line 80, line 90
- Sitemap normalizer: `generate-public-seo.ts:20-23`
- Repo precedent: `apps/prime/next.config.mjs:7` (`trailingSlash: true`)

#### Build Completion (2026-01-28) - INCOMPLETE

**Status:** Partially Complete (tests failing)
**Commit:** f155699480

**TDD cycle:**
- Tests updated: `apps/brikette/src/test/components/seo-jsonld-contract.test.tsx`
- Updated 3 test expectations to require trailing slashes (lines 73, 80, 90)
- Initial test run: FAIL (3/4 tests - expected trailing slashes but code stripped them)
- Implementation: Modified 6 files to preserve/add trailing slashes
- Post-implementation: PASS (4/4 tests in seo-jsonld-contract.test.tsx)

**CRITICAL: Broke existing tests**
- `seo.test.ts` now failing: 3 failed, 20 passed, 23 total
  - Line 45: expects `/en/rooms` (without slash), gets `/en/rooms/`
  - Line 145: expects `/en` (without slash), gets `/en/`
  - Line 309: expects breadcrumb URL without slash, gets with slash
- `metadata.ts:46` canonical still uses `${origin}${path}` (no trailing slash enforcement)
- Tests locked in old behavior, need updating

**Implementation:**
- Changed `apps/brikette/src/utils/seo.ts:66-67,107,221`:
  - Renamed `trimTrailingSlash` → `ensureTrailingSlash`
  - Inverted logic to preserve/add trailing slashes for all non-root paths
- Changed `apps/brikette/src/utils/routeHead.ts:142`:
  - Updated fallback canonical logic to preserve trailing slashes
- Changed `apps/brikette/scripts/generate-public-seo.ts:20-25`:
  - Modified `normalizePathname` to ensure trailing slashes
- Changed `packages/ui/src/lib/seo/buildCanonicalUrl.ts:4,10,22`:
  - Removed slash-stripping logic (`.replace(/\/$/, "")`)
  - Added comments: "// Preserve trailing slash (align with server behavior)"
- Changed `packages/ui/src/lib/__tests__/buildCanonicalUrl.test.ts:5-6,10-11,16,20-21`:
  - Updated test expectations to require trailing slashes
  - Added new test: "preserves trailing slashes to align with server behavior"
- Changed `apps/brikette/src/components/seo/DealsStructuredData.tsx:17`:
  - Added trailing slash to `pageUrl` construction

**Tests updated:**
- Updated 3 expectations in `seo-jsonld-contract.test.tsx`:
  - Line 73: `/en/assistance/arriving-by-ferry` → `/en/assistance/arriving-by-ferry/`
  - Line 80: `/en/experiences/ferry-schedules` → `/en/experiences/ferry-schedules/`
  - Line 90: `${BASE_URL}/en/${dealsSlug}` → `${BASE_URL}/en/${dealsSlug}/`
- Updated 4 expectations in `buildCanonicalUrl.test.ts` to expect trailing slashes
- Added new test case for trailing-slash preservation

**Validation:**
- `pnpm typecheck`: PASS (monorepo typecheck, all 70 packages)
- `pnpm test seo-jsonld-contract.test`: PASS (4/4 tests)
- `pnpm test buildCanonicalUrl.test`: PASS (4/4 tests)
- Pre-commit hooks: PASS (lint-staged, typecheck, lint, agent context validation)

**Documentation updated:** None required (code change only)

**Remaining work to complete task:**
1. Fix `seo.test.ts` expectations (3 failing assertions at lines 45, 145, 309)
2. Update `metadata.ts:46` to ensure trailing slash in canonical URL: `const url = ensureTrailingSlash(\`${origin}${path}\`)`
3. Verify `metadata.test.ts` doesn't lock in old behavior
4. Re-run full test suite to confirm no other breaks
5. **Estimated:** 2-3 hours

**Implementation notes:**
- Policy PARTIALLY applied: `seo.ts` and `generate-public-seo.ts` now ensure trailing slashes ✅
- Policy NOT applied: `metadata.ts:46` canonical still uses `${origin}${path}` (no trailing slash) ❌
- Tests broken: `seo.test.ts` has 3 failures (23 total, 20 passing) ❌
- Partially unblocks TASK-SEO-3 and TASK-SEO-7 (core logic correct, but incomplete)

---

### TASK-SEO-5: Fix broken machine-layer references

**Status:** Ready
**Confidence:** 85% (min: Implementation 92%, Approach 88%, Impact 85%)
**Effort:** M (3-4 hours)
**Owner:** Unassigned
**Dependencies:** TASK-SEO-7 (for schema files generation)
**Priority:** P0

**Problem (code-grounded — complete inventory):**

**OpenAPI references non-existent endpoints:**
- `apps/brikette/public/.well-known/openapi.yaml` lists `/api/quote`, `/api/rooms`, `/api/book`
- No implementations exist: `apps/brikette/src/app/api/` only has other routes
- Production: `curl https://hostel-positano.com/api/rooms` → HTML 404 or wrong content

**ai-plugin.json has broken references:**
- Line 15: `logo_url: /favicon/android-chrome-512x512.png` — Wrong path
  - Actual file: `/android-chrome-512x512.png` (root of public/, not /favicon/)
- Line 17: `legal_info_url: /en/legal` — Route doesn't exist
  - No `/en/legal` route in `apps/brikette/src/app/[lang]/`

**llms.txt references missing files:**
- Lines 5-10: `/schema/hostel-brikette/*.jsonld` — Directory doesn't exist
  - `apps/brikette/public/schema/` → No such directory
- Line 14: `/sitemap_index.xml` — Not generated
  - `generate-public-seo.ts` exists but not wired into build

**Solution:**
1. Remove non-existent endpoints from `openapi.yaml` (or mark as deprecated)
2. Fix `ai-plugin.json`:
   - Update `logo_url` to `/android-chrome-512x512.png`
   - Remove or update `legal_info_url` (point to `/en/terms` or `/en/privacy-policy`)
3. Fix `llms.txt`:
   - Remove schema references until TASK-SEO-7 generates them
   - Remove sitemap_index reference until TASK-SEO-7 generates it
4. Add validation test: assert each URL in machine docs returns 200/30x

**Acceptance criteria:**
- [ ] OpenAPI only lists implemented endpoints
- [ ] ai-plugin.json logo_url and legal_info_url are valid (200 response)
- [ ] llms.txt only references existing files
- [ ] Validation test: curl each machine-doc URL, assert not 404/405
- [ ] Update llms.txt when TASK-SEO-7 wires generator

**Why not 80%+:**
- **Implementation (85%):** Straightforward deletion/fixing
- **Approach (75%):** Product decision needed: remove booking capability marketing or implement APIs?
- **Impact (70%):** Scope was incomplete in original plan (missed ai-plugin.json + llms.txt issues)

**Evidence:**
- OpenAPI endpoints: `openapi.yaml:324`, `openapi.yaml:372`, `openapi.yaml:406` (non-existent)
- ai-plugin.json: lines 15, 17 (broken URLs)
- llms.txt: lines 5-14 (references to missing files)
- No schema dir: `ls apps/brikette/public/schema/` → No such directory
- Actual logo: `apps/brikette/public/android-chrome-512x512.png` (not in /favicon/)

#### Re-plan Update (2026-01-28)

**Investigation performed:**
- Read all 3 machine-doc files (openapi.yaml, ai-plugin.json, llms.txt)
- Verified broken refs:
  - openapi.yaml advertises `/api/quote`, `/api/rooms`, `/api/book` (grep confirmed)
  - Actual API routes: only `/api/debug-env`, `/api/guides/*` (find confirmed)
  - ai-plugin.json line 17: `legal_info_url` points to `/en/legal` (route doesn't exist)
  - Actual route: `/terms` exists (find confirmed)
  - llms.txt references `/schema/hostel-brikette/*.jsonld` (files exist in `src/` but NOT in `public/`)
  - llms.txt references `/sitemap_index.xml` (file doesn't exist)
- Confirmed TASK-SEO-7 dependency: generator syncs schema files + creates sitemap

**Decision:**
- Remove broken OpenAPI endpoints (vs implement APIs - lower risk for P0 fix)
- Fix ai-plugin.json legal URL to `/en/terms`
- Mark schema/sitemap refs in llms.txt as generated by TASK-SEO-7 (explicit dependency)

**Confidence raised:** 75% → 85%
- Implementation: 85% → 92% (all 3 files verified, exact changes identified, TASK-SEO-7 dependency explicit)
- Approach: 75% → 88% (decision made: remove broken refs, legal URL fix confirmed)
- Impact: 70% → 85% (blast radius minimal: 3 static files, TASK-SEO-10 adds future contract tests)

**Changes to task:**
- Updated evidence: Corrected ai-plugin.json legal URL (verified /terms route exists)
- Updated acceptance criteria: Schema/sitemap refs await TASK-SEO-7
- No dependency changes

---

### TASK-SEO-6: Fix SearchAction to use localized slug

**Status:** Complete (2026-01-28)
**Confidence:** 88% (min: Implementation 92%, Approach 88%, Impact 85%)
**Effort:** S (30 min actual)
**Owner:** Claude
**Dependencies:** None
**Priority:** P1

**Problem (code-grounded — corrected from original plan):**
- `apps/brikette/src/components/seo/SiteSearchStructuredData.tsx:29` currently:
  ```typescript
  target: `${BASE_URL}/${lang}/assistance?q={search_term_string}`,
  ```
- **Bug:** Uses internal segment `assistance` instead of localized slug
- English slug is `help`, German is `hilfe`, French is `aide`, etc. (see `slug-map.ts:97-120`)
- User-facing URL should use `getSlug("assistance", lang)` not hardcoded `assistance`

**Solution:**
- Import `getSlug` from `@/utils/slug`
- Change line 29 to:
  ```typescript
  target: `${BASE_URL}/${lang}/${getSlug("assistance", lang)}?q={search_term_string}`,
  ```

**Acceptance criteria:**
- [ ] SearchAction target uses localized slug for assistance page
- [ ] Test: assert SearchAction URL for each locale matches expected slug
- [ ] curl homepage, extract JSON-LD, verify URL format

**Why 88% (not higher):**
- **Implementation (92%):** Trivial one-line fix
- **Approach (88%):** Could potentially use `buildLinks()` for consistency, but not required
- **Impact (85%):** Isolated to homepage JSON-LD; low risk

**Evidence:**
- Current code: `SiteSearchStructuredData.tsx:29` (hardcoded `/assistance`)
- Correct slug map: `slug-map.ts:97-120` (`assistance` key with locale-specific values)

#### Build Completion (2026-01-28)

**Status:** Complete
**Commit:** ecc6d761b4

**TDD cycle:**
- Tests written: `apps/brikette/src/test/components/seo/SiteSearchStructuredData.test.tsx` (NEW)
- Initial test run: FAIL (4/5 tests - expected localized slugs but got hardcoded "assistance")
- Implementation: Import `getSlug`, replace hardcoded string with `getSlug("assistance", lang)`
- Post-implementation: PASS (5/5 tests)

**Tests added:**
- Test localized slug for English (help)
- Test localized slug for German (hilfe)
- Test localized slug for French (aide)
- Test all supported locales (parameterized: en, es, de, fr, it, ja)
- Test required SearchAction schema fields

**Validation:**
- `pnpm typecheck`: PASS
- `pnpm test SiteSearchStructuredData`: PASS (5/5 tests, 13.754s)
- Pre-commit hooks: PASS (monorepo typecheck, lint, agent context validation)

**Documentation updated:** None required (code change only)

**Implementation notes:**
- Changed `apps/brikette/src/components/seo/SiteSearchStructuredData.tsx`:
  - Added `getSlug` import from `@/utils/slug`
  - Replaced hardcoded `assistance` string with `getSlug("assistance", lang)` on line 29
- SearchAction now generates locale-appropriate URLs: `/en/help`, `/de/hilfe`, `/fr/aide`, etc.
- Affects Google's "Search Hostel Brikette" auto-suggest box
- No changes to other files; isolated fix as planned

---

### TASK-SEO-7: Wire SEO artifact generator into build

**Status:** Ready
**Confidence:** 82% (min: Implementation 88%, Approach 84%, Impact 82%)
**Effort:** M (4-6 hours)
**Owner:** Unassigned
**Dependencies:** TASK-SEO-4 (canonical policy - now resolved)
**Priority:** P0

**Problem (code-grounded):**
- `apps/brikette/scripts/generate-public-seo.ts` generates robots.txt, sitemap.xml, sitemap_index.xml, and copies schema assets
- **Not wired into build:** Not in `package.json` scripts, not in `turbo.json`, not in deployment config
- Result: `llms.txt` references files that won't exist in deployed build

**Current generator capabilities (from code):**
- **FIXED in TASK-SEO-4 (commit f155699480):** Ensures trailing slashes (line 20-24): `normalizePathname()` now preserves/adds slashes ✅
- Excludes `/draft` routes (line 41): Correct
- Generates sitemap + index
- Copies schema .jsonld files from `src/schema/hostel-brikette/` (generate-public-seo.ts:101)

**Why 72%:**
- **Implementation (75%):** Wire point identified (prebuild script); generator update clear
- **Approach (72%):** Keep generator (simpler than rewrite); matches repo pattern
- **Impact (70%):** Build process change; need to verify schema source files

**Decision:** Use existing generator script, wire into build

**Rationale:**
1. Generator already exists and works (just not wired)
2. Simpler than migrating to Next.js `app/sitemap.ts` (would require rewrite)
3. Matches repo pattern (separate script for SEO artifacts)
4. Lower risk than build pipeline rewrite

**Implementation plan:**
1. ~~Update generator to preserve trailing slashes~~ ✅ DONE in TASK-SEO-4 (commit f155699480)
2. **Wire into existing prebuild script** in `apps/brikette/package.json`:
   ```json
   "scripts": {
     "prebuild": "pnpm --filter @acme/telemetry clean && pnpm --filter @acme/telemetry build && tsx scripts/generate-public-seo.ts",
   }
   ```
   **IMPORTANT:** APPEND to existing prebuild (don't replace telemetry build)
3. Verify schema source files exist (✅ confirmed: `src/schema/hostel-brikette/` has 6 .jsonld files)
4. Test locally: `pnpm prebuild && ls public/` → verify robots.txt, sitemap.xml, schema/

**Acceptance criteria:**
- [ ] Generator preserves trailing slashes in sitemap URLs
- [ ] `prebuild` script runs generator automatically before build
- [ ] Output files present after build: `public/robots.txt`, `public/sitemap.xml`
- [ ] If schema files missing, update llms.txt to remove references (or create files)
- [ ] llms.txt references are valid post-build

#### Re-plan Update (2026-01-28)

**Investigation performed:**
- Verified generator exists: `generate-public-seo.ts` (138 lines, read entire file)
- Confirmed NOT wired: `grep generate-public-seo apps/brikette/package.json` → no hits
- Verified TASK-SEO-4 already fixed trailing-slash bug (commit f155699480)
- Identified integration seam: Add to existing `prebuild` script in package.json
- Checked current prebuild: Builds telemetry dependency only
- Confirmed schema files exist: `src/schema/hostel-brikette/*.jsonld` (6 files verified)

**Decision:**
- Wire existing generator into `prebuild` script: `tsx scripts/generate-public-seo.ts`
- Pattern: Chain with existing telemetry build using `&&`
- No generator code changes needed (TASK-SEO-4 already fixed trailing-slash)
- Defer .gitignore decision to build time (commit or ignore generated files)

**Confidence raised:** 72% → 82%
- Implementation: 75% → 88% (script exists, integration point clear, TASK-SEO-4 fixed, 12% for .gitignore decision)
- Approach: 72% → 84% (decision made: wire existing vs rewrite, pattern confirmed, 16% for build impact)
- Impact: 70% → 82% (build time quantified +1-2s, side effects mapped, 18% for CI/CD compatibility)

**Remaining unknowns at 82%:**
- Should generated files be committed or gitignored? (Can decide during build)
- Build process impact (needs local test run)
- CI/CD pipeline compatibility (needs preview deployment test)

**Changes to task:**
- Updated implementation plan: Simplified (no generator code changes needed, just wire script)
- Updated acceptance criteria: TASK-SEO-4 already fixed trailing-slash requirement
- No dependency changes

---

### TASK-SEO-8: Noindex draft routes

**Status:** Complete (2026-01-28)
**Confidence:** 85% (min: Implementation 90%, Approach 85%, Impact 82%)
**Effort:** S (30 min actual)
**Owner:** Claude
**Dependencies:** None
**Priority:** P0

**Problem (code-grounded):**
- `apps/brikette/src/app/[lang]/draft/page.tsx:25-31` calls `buildAppMetadata()` without `isPublished: false`
- Result: Draft dashboard is indexable (SEO leak for internal tool)
- `buildAppMetadata` default is `isPublished: true` (`metadata.ts:27`)

**Solution:**
- Add `isPublished: false` to `buildAppMetadata()` call in draft/page.tsx
- Verify robots tag is emitted: `<meta name="robots" content="noindex,follow">`

**Acceptance criteria:**
- [ ] draft/page.tsx sets `isPublished: false`
- [ ] curl `/en/draft` → assert `<meta name="robots" content="noindex,follow">`
- [ ] Verify draft routes excluded from sitemap (generator already does this: `generate-public-seo.ts:41`)

**Why 85%:**
- **Implementation (90%):** One-line fix
- **Approach (85%):** Straightforward, follows existing pattern
- **Impact (82%):** Low risk; only affects one route

**Evidence:**
- Missing noindex: `draft/page.tsx:25-31` (no isPublished param)
- Default value: `metadata.ts:27` (isPublished defaults to true)
- Sitemap exclusion already works: `generate-public-seo.ts:41` (excludes /draft)

#### Build Completion (2026-01-28)

**Status:** Complete
**Commit:** 6b38653565

**TDD cycle:**
- Tests written: `apps/brikette/src/test/lib/metadata.test.ts` (NEW)
- Tested buildAppMetadata function behavior with isPublished parameter
- All tests passing (4/4): robots noindex when isPublished=false, no robots when true

**Implementation:**
- Changed `apps/brikette/src/app/[lang]/draft/page.tsx`:
  - Added `isPublished: false` parameter to buildAppMetadata() call (line 31)
  - Added inline comment explaining the purpose

**Tests added:**
- Test robots noindex set when isPublished=false
- Test robots not set when isPublished=true (default behavior)
- Test robots not set when isPublished=explicitly true
- Test canonical URL unaffected by isPublished parameter

**Validation:**
- `pnpm typecheck`: PASS
- `pnpm test metadata.test`: PASS (4/4 tests, 6.888s)
- Pre-commit hooks: PASS (monorepo typecheck, lint, agent context validation)

**Documentation updated:** None required (code change only)

**Implementation notes:**
- Draft dashboard now emits `<meta name="robots" content="noindex,follow">`
- Prevents search engines from indexing internal draft tool
- Sitemap already excluded draft routes (no change needed)
- Low-risk change affecting single internal route

---

### TASK-SEO-9: Complete social metadata coverage

**Status:** Ready
**Confidence:** 80% (min: Implementation 82%, Approach 80%, Impact 78%)
**Effort:** M (3-4 hours)
**Owner:** Unassigned
**Dependencies:** TASK-SEO-1
**Priority:** P1

**Problem (confirmed via production):**
- Root layout defines `openGraph.siteName`, `twitter.site`, `twitter.creator` (`layout.tsx:19-24`)
- **BUT:** Production pages have NO twitter tags and NO og:site_name
- **Root cause:** Next.js App Router page-level metadata completely overrides root layout instead of merging
- Pages using `buildAppMetadata()` don't include these fields → they're lost

**Production evidence (homepage):**
- ✅ Has: `og:title`, `og:description`, `og:locale`
- ❌ Missing: `og:site_name`, `og:image`, `twitter:card`, `twitter:site`, `twitter:creator`, `twitter:image`

**Solution:**
- **Option A (chosen):** Explicitly include social metadata fields in `buildAppMetadata()` return
  - Add `openGraph.siteName: "Hostel Brikette"` to returned Metadata
  - Add `twitter.site: "@hostelbrikette"`, `twitter.creator: "@hostelbrikette"` to returned Metadata
  - Ensure `twitter.card` is always set (currently exists, line 93)
  - Add `openGraph.images` if not provided by caller (use default OG_IMAGE)

**Implementation:**
- Update `apps/brikette/src/app/_lib/metadata.ts:69-95`
- Add missing fields to returned Metadata object:
  ```typescript
  openGraph: {
    siteName: "Hostel Brikette",
    // ...existing fields
  },
  twitter: {
    site: "@hostelbrikette",
    creator: "@hostelbrikette",
    // ...existing fields
  }
  ```

**Acceptance criteria:**
- [ ] `buildAppMetadata()` includes `openGraph.siteName`
- [ ] `buildAppMetadata()` includes `twitter.site` and `twitter.creator`
- [ ] All pages have `og:image` (use DEFAULT_OG_IMAGE if page-specific not provided)
- [ ] curl 5 pages (home, rooms, guides, deals, about) → all have complete social tags
- [ ] Social preview tools (Facebook Debugger, Twitter Card Validator) pass

**Why 80%:**
- **Implementation (82%):** Clear fix location; straightforward addition
- **Approach (80%):** Option A is proven pattern (explicit > implicit merging)
- **Impact (78%):** Affects all pages; need to verify no conflicts with page-specific images

#### Re-plan Update (2026-01-28)

**Investigation performed:**
- Production: `curl https://hostel-positano.com/en/` → NO twitter tags, NO og:site_name, NO og:image
- Code: `layout.tsx:19-24` defines these values but they don't render
- Root cause: Next.js App Router page metadata doesn't merge with layout metadata (overrides completely)

**Decision:**
- **Approach:** Explicitly add social metadata fields to `buildAppMetadata()` return
- **Why:** Explicit is better than relying on Next.js metadata merging (which doesn't work as expected)

**Confidence raised:** 55% → 80%
- Implementation: 60% → 82% (bug confirmed, fix location identified)
- Approach: 55% → 80% (decision made, follows explicit-over-implicit pattern)
- Impact: 50% → 78% (affects all pages, but additive change only)

**Evidence:**
- Root layout: `layout.tsx:19-24` (defines siteName, twitter.site, twitter.creator)
- Production missing: `curl` shows NO twitter tags, NO og:site_name
- Fix location: `metadata.ts:69-95` (buildAppMetadata return object)

---

### TASK-SEO-10: Add machine-document contract tests

**Status:** Ready
**Confidence:** 82% (min: Implementation 88%, Approach 84%, Impact 82%)
**Effort:** S (2-3 hours)
**Owner:** Unassigned
**Dependencies:** TASK-SEO-5, TASK-SEO-7
**Priority:** P1

**Problem:**
- No automated validation of machine-readership layer contracts
- Broken references in OpenAPI, ai-plugin.json, llms.txt currently undetected
- Manual curl checks are time-consuming and error-prone
- Risk: Files referenced in machine docs may not exist or may return 404/500

**Solution:**
Create contract tests that validate all machine-document URLs return expected status codes and content.

**Test scope:**
1. **OpenAPI spec validation:**
   - Parse `openapi.yaml`
   - Extract all endpoint paths
   - Assert each endpoint exists (200/30x) or is documented as not-yet-implemented
   - Validate schema references resolve

2. **ai-plugin.json validation:**
   - Parse JSON
   - Extract all URL references (logo_url, legal_info_url, api.url)
   - Assert each URL returns 200/30x (not 404/405)
   - Validate JSON structure matches OpenAI plugin spec

3. **llms.txt validation:**
   - Parse file
   - Extract all URL/path references (schema files, sitemap, etc.)
   - Assert each file exists in public/ or returns 200
   - Validate format follows llms.txt spec

**Test precedent:**
- Existing SEO contract test: `apps/brikette/src/test/components/seo-jsonld-contract.test.tsx` (4 test cases)
- Similar pattern: Parse document → extract references → validate each reference

**Implementation:**
- Create `apps/brikette/src/test/machine-docs-contract.test.ts`
- Use `fs.readFileSync` for parsing local files (openapi.yaml, ai-plugin.json, llms.txt)
- Mock or conditionally test public/ file existence (depending on test environment)
- Run in CI to catch broken references before deployment

**Acceptance criteria:**
- [ ] Test parses openapi.yaml and validates endpoint references
- [ ] Test parses ai-plugin.json and validates all URL fields
- [ ] Test parses llms.txt and validates all referenced files/URLs
- [ ] Test fails if any reference returns 404/405 or file doesn't exist
- [ ] Test runs in CI pipeline (part of `pnpm test`)

**Why 76%:**
- **Implementation (80%):** Test pattern clear (follows seo-jsonld-contract.test.tsx precedent)
- **Approach (76%):** Uncertainty about mocking strategy (test against local public/ or deployed URLs?)
- **Impact (72%):** Low risk; tests only; but precedent exists so slightly uncertain on integration

**Evidence:**
- Test precedent: `apps/brikette/src/test/components/seo-jsonld-contract.test.tsx` (4 test cases, similar validation pattern)
- Machine docs: `public/.well-known/openapi.yaml`, `public/.well-known/ai-plugin.json`, `public/llms.txt`
- No existing contract tests: `rg "openapi.yaml|ai-plugin" apps/brikette/src/test` → zero hits

#### Re-plan Update (2026-01-28)

**Investigation performed:**
- Verified test precedent exists: `apps/brikette/src/test/components/seo-jsonld-contract.test.tsx` (4 test cases, read file)
- Confirmed pattern: Parse document → extract references → validate each reference
- Identified test structure: Use `fs.readFileSync` + yaml/JSON parsers
- Verified dependencies: TASK-SEO-5 fixes broken refs, TASK-SEO-7 generates schema files
- Checked for yaml parsing library (may need to add js-yaml or yaml package)

**Decision:**
- Create `machine-docs-contract.test.ts` following seo-jsonld-contract pattern
- Test against local files (simpler, faster than deployed URLs)
- Validate: openapi.yaml paths, ai-plugin.json URLs, llms.txt schema refs

**Test approach (concrete):**
```typescript
// Parse openapi.yaml → assert no broken endpoints
// Parse ai-plugin.json → assert legal_info_url valid
// Parse llms.txt → assert schema files exist in public/
```

**Confidence raised:** 76% → 82%
- Implementation: 80% → 88% (test pattern confirmed, file parsing clear, Jest auto-discovers, 12% for yaml library)
- Approach: 76% → 84% (decision made: follow seo-jsonld-contract pattern, test scope defined, 16% for mocking strategy)
- Impact: 72% → 82% (blast radius minimal: test file only, dependencies documented, 18% for CI integration)

**Remaining unknowns at 82%:**
- YAML parsing library availability (check deps or add js-yaml)
- Test against local files vs deployed URLs (local decided, but untested)
- CI integration (should work automatically, but untested)

**Changes to task:**
- Updated acceptance criteria: Clarified test file structure (3 describe blocks)
- No dependency changes

---

## Completed Tasks

### TASK-SEO-6: Fix SearchAction to use localized slug ✅
- **Completed:** 2026-01-28
- **Commit:** ecc6d761b4
- **Validation:** 5/5 tests passing

### TASK-SEO-8: Noindex draft routes ✅
- **Completed:** 2026-01-28
- **Commit:** 6b38653565
- **Validation:** 4/4 tests passing

### TASK-SEO-4: Align canonical/trailing-slash policy ⚠️ INCOMPLETE
- **Status:** Partially complete (2026-01-28)
- **Commit:** f155699480
- **Issue:** Tests failing (3 failed, 20 passed in seo.test.ts)
  - seo.test.ts:45, 145, 309 expect NO trailing slash
  - metadata.ts:46 canonical doesn't ensure trailing slash
  - buildBreadcrumb() producing URLs with trailing slash but tests expect without
- **Action required:** Fix tests + metadata.ts canonical to match new policy
- **See:** Decision Log entry below

---

## Decision Log

### Decision 1: Defer repo/production artifact sync (out of scope)
- **When:** 2026-01-28
- **Context:** Fact-find identified drift between repo and production llms.txt
- **Decision:** Defer to post-P0 work
- **Rationale:** Lower priority than duplicate content and broken refs

### Decision 2: Remove broken API refs instead of implementing (TASK-SEO-5)
- **When:** 2026-01-28
- **Context:** OpenAPI advertises booking endpoints that don't exist
- **Options:**
  - A: Implement /api/quote, /api/rooms, /api/book
  - B: Remove from docs until implemented
- **Decision:** Option B for P0 fix
- **Rationale:** Quick fix; defer API implementation to separate feature work

### Decision 3: Trailing-slash policy (TASK-SEO-4)
- **When:** 2026-01-28 (re-planning investigation)
- **Context:** Canonical URLs strip slashes but Cloudflare Pages enforces them
- **Options:**
  - A: Keep trailing slashes (align with server)
  - B: Remove trailing slashes (change server config)
- **Decision:** Option A (keep slashes)
- **Rationale:** Cloudflare Pages enforces slashes (external); updating repo code is lower risk than changing deployment config
- **Evidence:** Production `curl` shows `location: /en/rooms/`, `server: cloudflare`; `apps/prime` precedent uses `trailingSlash: true`
- **Impact:** Unblocks TASK-SEO-3 (middleware) and TASK-SEO-7 (generator)

### Decision 4: Social metadata implementation (TASK-SEO-9)
- **When:** 2026-01-28 (re-planning investigation)
- **Context:** Root layout defines social metadata but it doesn't render on pages
- **Root cause:** Next.js App Router page metadata overrides root layout (doesn't merge)
- **Options:**
  - A: Explicitly add social fields to buildAppMetadata() return
  - B: Research Next.js metadata merging workarounds
- **Decision:** Option A (explicit)
- **Rationale:** Explicit is better than relying on framework merging behavior; proven pattern
- **Evidence:** Production `curl` shows NO twitter tags, NO og:site_name despite layout.tsx definitions

### Decision 5: Metadata testing approach (TASK-SEO-2)
- **When:** 2026-01-28 (re-planning investigation)
- **Context:** No precedent in repo for testing App Router metadata
- **Options:**
  - A: Unit tests for buildAppMetadata() wrapper
  - B: Integration tests calling page generateMetadata() functions
  - C: E2E tests with DOM scraping
- **Decision:** Option A (unit tests for wrapper)
- **Rationale:** Simpler, faster, provides regression prevention; E2E is wrong approach for metadata
- **Evidence:** No existing generateMetadata tests in repo; unit approach matches existing test patterns

### Decision 6: Wire SEO generator (TASK-SEO-7)
- **When:** 2026-01-28 (re-planning investigation)
- **Context:** Generator script exists but not wired into build
- **Options:**
  - A: Wire existing generator into prebuild script
  - B: Migrate to Next.js app/sitemap.ts + app/robots.ts
- **Decision:** Option A (wire existing)
- **Rationale:** Simpler than rewrite; generator already works; just needs integration and trailing-slash fix
- **Evidence:** Generator at `scripts/generate-public-seo.ts` exists, not in package.json scripts

### Decision 7: Reopen TASK-SEO-4 (discovered post-build)
- **When:** 2026-01-28 (post-build audit)
- **Context:** TASK-SEO-4 marked complete but tests failing
- **Evidence:**
  - `seo.test.ts`: 3 failed, 20 passed (failures at lines 45, 145, 309)
  - `metadata.ts:46` canonical doesn't ensure trailing slash
  - Policy partially applied (seo.ts ✅, metadata.ts ❌, tests ❌)
- **Decision:** Reopen TASK-SEO-4, drop confidence to 65%
- **Rationale:** Can't claim completion with failing tests and incomplete implementation
- **Action required:** Fix tests + metadata.ts canonical (2-3 hours estimated)

---

## Notes & Risk Assessment

### Highest-Risk Tasks
1. **TASK-SEO-3** (middleware redirects): L-effort, sitewide impact, no test precedent, affects 150+ URL pairs
2. **TASK-SEO-7** (wire generator): Build pipeline changes, deployment coordination required
3. **TASK-SEO-4** (canonical policy): Multi-surface change, test breakage risk

### Blockers (Resolved via Re-planning)
- ✅ TASK-SEO-2: Testing approach decided (unit tests for wrapper)
- ✅ TASK-SEO-3: Trailing-slash coordination resolved (include slash in redirect)
- ✅ TASK-SEO-4: Policy decided (keep trailing slashes)
- ✅ TASK-SEO-7: Build integration decided (wire existing generator)
- ✅ TASK-SEO-9: Bug confirmed (social metadata not rendering)

### Missing from Original Plan (P0 gaps)
- TASK-SEO-7: Wire SEO artifact generator (affects sitemap, robots, schema URLs)
- TASK-SEO-8: Noindex draft routes (SEO leak)
- Validation test suite for machine-layer contracts
- Product decision: Keep booking capability marketing or implement APIs?

### Plan Quality Issues (Fixed)
- ✅ Added proper frontmatter per `AGENTS.docs.md` conventions
- ✅ Used min-of-dimensions confidence (not weighted average)
- ✅ Fixed internal inconsistencies (task confidence matches summary)
- ✅ All confidence scores grounded in code reality
- ✅ Added evidence citations for every claim
- ✅ Identified unknowns explicitly (not hidden in inflated scores)

### Overall Assessment

**Ready to build** (with phased approach)

**Re-planning results (2026-01-28):**
- ✅ Resolved: TASK-SEO-4 policy (keep trailing slashes)
- ✅ Resolved: TASK-SEO-9 (bug confirmed, fix identified)
- ✅ Resolved: TASK-SEO-2 (testing approach defined)
- ✅ Resolved: TASK-SEO-7 (wire generator decision)
- ✅ Resolved: TASK-SEO-3 (trailing-slash coordination clear)

**Task Status Summary:**

**Completed (Phase 1):**
1. TASK-SEO-6: Fix SearchAction (88%) ✅ Complete
2. TASK-SEO-8: Noindex draft (85%) ✅ Complete

**Partially Complete (needs fix):**
3. TASK-SEO-4: Align canonical/trailing-slash (65%) ⚠️ Tests failing, metadata.ts not updated

**High-confidence (≥85%):**
4. TASK-SEO-1: Fix hreflang alternates (88%) - Ready to build
5. TASK-SEO-5: Fix machine refs (85%) - Ready to build

**At threshold (80-84%):**
6. TASK-SEO-2: Add metadata tests (80%) - Ready to build
7. TASK-SEO-3: Middleware redirects (80%) - Highest risk; preview testing recommended
8. TASK-SEO-7: Wire generator (82%) - Ready to build
9. TASK-SEO-9: Social metadata (80%) - Ready to build
10. TASK-SEO-10: Machine-doc contract tests (82%) - Ready to build

**Recommended build order (corrected post-audit):**
1. **Phase 1 (Quick wins, P0):** ⚠️ INCOMPLETE - TASK-SEO-4 needs 2-3 hours to fix tests
2. **Phase 2 (Core fixes, P0):** TASK-SEO-1 (4-6hrs), TASK-SEO-5 (3-4hrs)
3. **Phase 3 (Quality gates, P1):** TASK-SEO-2 (3-4hrs), TASK-SEO-9 (3-4hrs), TASK-SEO-10 (2-3hrs)
4. **Phase 4 (Infrastructure, requires preview):** TASK-SEO-7 (4-6hrs), TASK-SEO-3 (8-10hrs)

**Priority fix:**
- **TASK-SEO-4 completion:** Fix seo.test.ts (3 failures), update metadata.ts:46 canonical (2-3 hours)

**Risk mitigation for Phase 4:**
- TASK-SEO-7: Test in preview environment first; verify build doesn't break
- TASK-SEO-3: Extensive testing required (150+ URL patterns); deploy to preview first

**Overall confidence:** 78% (weighted by effort, accounting for TASK-SEO-4 regression)
- 9 of 10 tasks ≥80%: Ready to build
- 2 of 10 tasks complete (TASK-SEO-6, TASK-SEO-8)
- 1 of 10 tasks incomplete with regressions (TASK-SEO-4 at 65%)
- TASK-SEO-3 at exactly 80% (highest risk, but buildable with caution)
