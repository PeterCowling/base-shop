---
Type: Plan
Status: Complete
Domain: CMS
Relates-to charter: Content unification
Created: 2026-01-26
Last-reviewed: 2026-01-26
Last-updated: 2026-01-26
Overall-confidence: 90%
---

## Progress Update (2026-01-26)

### All Tasks Complete

- **TASK-01**: ✅ Added `%URL:` token support for external/mailto links
- **TASK-02**: ✅ Created conversion script (`scripts/convert-assistance-articles-to-guides.ts`)
- **TASK-03**: ✅ Added guide keys + slug parity for all 12 articles
- **TASK-04**: ✅ Pilot converted `rules` article (all 18 locales)
- **TASK-05**: ✅ Converted remaining 10 low/medium complexity articles (180 conversions, 10 manifest + index entries)
- **TASK-06**: ✅ Converted `bookingBasics` with grouping (35 sections → 9 groups, all 18 locales)
  - Extended script with `--grouping` option for structure file
  - Created `scripts/help-articles/bookingBasics.structure.json`
- **TASK-07**: ✅ Cutover complete:
  - Updated `/[lang]/assistance/[article]/page.tsx` to use guide rendering only
  - Deleted `AssistanceArticleContent.tsx` (no longer needed)
  - Deleted 216 legacy article JSON files (12 articles × 18 locales)
  - Removed legacy article imports from `i18n.ts`
  - Legacy article helpers remain for link generation (same URLs, slug parity maintained)

# Help Articles to Guides Conversion Plan

## Summary

Convert the existing assistance help articles from the legacy article format to the guide format. This unifies help content under the guide system, enabling consistent rendering, translation workflow, and editorial tooling — while preserving existing `/[lang]/assistance/[slug]` URLs across locales.

## Success Signals (What “Good” Looks Like)

- Every existing assistance article URL continues to work (no 404s) for every locale that currently has an article.
- Content fidelity is maintained: no missing sections, and link targets remain clickable (mailto + external links).
- Guides render through the standard guide stack (GenericContent), so future authoring/translation tooling applies consistently.
- Legacy article rendering/routing is removed without leaving dead codepaths.

## Audit Updates (2026-01-26)

Concrete repo findings that reduce uncertainty:

- Assistance routing already supports “guide fallback” when a slug does not match an article key: `apps/brikette/src/app/[lang]/assistance/[article]/page.tsx`.
- Legacy assistance articles are **not** 9 keys — there are **12** keys in `ARTICLE_KEYS`: the plan must include `arrivingByFerry`, `naplesAirportBus`, and `travelHelp`. (`apps/brikette/src/routes.assistance-helpers.ts`)
- All 12 articles exist across (effectively) all supported locales today, so we can convert translations programmatically rather than degrading non-English locales.
- Guide rendering supports:
  - Markdown-lite emphasis (`*`, `**`, `***`)
  - Bullet lists when stored as `* ...` entries (or `\n`-separated `* ...` lines)
  - Internal guide links via `%LINK:key|Label%` tokens
  (`apps/brikette/src/routes/guides/utils/_linkTokens.tsx`)

## Current State

### Articles to Convert

| Key | File | Sections | Complexity |
|-----|------|----------|------------|
| `ageAccessibility` | `ageAccessibility.json` | 12 | Low |
| `bookingBasics` | `bookingBasics.json` | 35 | **High** |
| `changingCancelling` | `changingCancelling.json` | 5 | Low |
| `checkinCheckout` | `checkinCheckout.json` | 14 | Medium |
| `defectsDamages` | `defectsDamages.json` | 7 | Low |
| `depositsPayments` | `depositsPayments.json` | 16 | Medium |
| `rules` | `rules.json` | 2 | Low |
| `security` | `security.json` | 5 | Low |
| `legal` | `legal.json` | 5 | Low |
| `arrivingByFerry` | `arrivingByFerry.json` | 7 | Low |
| `naplesAirportBus` | `naplesAirportBus.json` | 7 | Low |
| `travelHelp` | `travelHelp.json` | 2 | Low |

### Format Comparison

**Article format (current):**
```json
{
  "slug": "...",
  "meta": { "title": "...", "description": "..." },
  "headings": { "section1": "Title", ... },
  "content": { "section1": "HTML content...", ... },
  "mediaAlt": { "section1": "Alt text", ... }
}
```

**Guide format (target):**
```json
{
  "seo": { "title": "...", "description": "..." },
  "linkLabel": "...",
  "intro": ["..."],
  "sections": [
    { "id": "...", "title": "...", "body": ["paragraph1", "paragraph2"] }
  ],
  "tips": ["..."],
  "faqs": [{ "q": "?", "a": ["..."] }]
}
```

## Design Decisions

### Decision 1: URL Handling Strategy

**Chosen approach:** Preserve article URLs with **no redirects** by making guide slugs match the existing `ARTICLE_SLUGS` map.

The existing assistance route falls through to the guide renderer when an article key is not found. To ensure the *same* locale-specific slugs still resolve after we remove legacy article keys, we will:

1. Add new guide keys for each assistance article key (same string key).
2. Set guide slug overrides for every language to the exact `ARTICLE_SLUGS[articleKey][lang]` value.
3. Remove the article keys from the legacy article system (`ARTICLE_KEYS`, slug map, and namespaces map).

This preserves all existing `/[lang]/assistance/<localized-slug>` URLs without needing redirects.

**Rationale:** Minimal routing changes; leverages existing fallthrough behavior.

### Decision 2: Content Transformation

**Chosen approach:** Scripted conversion for **all locales**, with a single shared structural mapping per article and a manual review pass.

1. Script converts `headings` + `content` objects → `sections[]` in stable order.
2. Script normalizes formatting to match what guide rendering supports today:
   - Convert `•` bullet lines into `* ` list entries so `renderBodyBlocks()` renders actual `<ul><li>`.
   - Convert `<a href="...">Label</a>` to an explicit link token (see Decision 4).
   - Convert simple `<strong>/<em>` tags to markdown-lite `**/***`.
3. Script maps `meta` → `seo` and sets `linkLabel` (fallback: `seo.title`).
4. Manual review ensures:
   - No missing sections.
   - `bookingBasics` grouping is readable (see Decision 5).

**Rationale:** Reduces manual effort while ensuring quality for complex articles.

### Decision 3: Translation Handling

**Chosen approach:** Convert **all existing article locales**, fallback only when a locale file is missing.

These articles already exist per locale; converting English-only would be a regression. The conversion script will:

1. Convert `apps/brikette/src/locales/<lang>/<articleKey>.json` for every locale where the file exists.
2. Write guide content to `apps/brikette/src/locales/<lang>/guides/content/<guideKey>.json`.
3. Preserve locale-specific slugs via slug overrides (Decision 1), so routing does not depend on translation availability.

**Rationale:** Maintains existing localized content while still consolidating on the guide format.

### Decision 4: External link tokens (to avoid losing clickable links)

**Chosen approach:** Add `%URL:https://...|Label%` support to the guide token renderer and use it during conversion.

- `%LINK:` remains internal guide linking.
- `%URL:` renders a safe external `<a>` (http/https) or mailto link (mailto).
- Unknown/unsafe URLs render as plain text.

**Rationale:** Legacy articles contain `<a href>` tags (notably in `bookingBasics`); leaving links as plain text would be a UX regression.

### Decision 5: `bookingBasics` structure (reduce ToC noise without losing content)

**Chosen approach:** Convert `bookingBasics` into a single guide, but group the 35 legacy sections into ~10 guide sections via an explicit mapping file that is applied to every locale.

- Introduce `scripts/help-articles/bookingBasics.structure.json` (or similar) that defines:
  - section id/title
  - included legacy keys (in order)
  - optional “FAQ extraction” rules for Q&A-like blocks
- Add a “mapping completeness” check: every legacy key must be included exactly once.

**Rationale:** Splitting into multiple guides changes IA and link targets. Grouping preserves the existing “everything on one page” expectation while making navigation usable.

## Files Required Per Article

For each article conversion:

| # | File | Action |
|---|------|--------|
| 1 | `apps/brikette/src/data/generate-guide-slugs.ts` | Add guide key → English slug (match `ARTICLE_SLUGS[key].en`) |
| 2 | `apps/brikette/src/guides/slugs/overrides.ts` | Add per-locale slugs copied from `ARTICLE_SLUGS` (Decision 1) |
| 3 | `apps/brikette/src/data/guides.index.ts` | Add entry with `section: "help"` and tags |
| 4 | `apps/brikette/src/routes/guides/guide-manifest.ts` | Add manifest entry (areas: `["help"]`, blocks: GenericContent + FAQ) |
| 5 | `apps/brikette/src/locales/<lang>/guides/content/{key}.json` | **Create** guide content for every locale that has an article file |
| 6 | `apps/brikette/src/routes.assistance-helpers.ts` | Remove from `ARTICLE_KEYS` once guide parity is verified |
| 7 | `apps/brikette/src/app/[lang]/assistance/[article]/page.tsx` | Remove from `ARTICLE_NAMESPACES` and legacy article resolution once cutover is complete |
| 8 | `apps/brikette/src/article-slug-map.ts` | Remove legacy article slug entries once cutover is complete |

## Milestones

| Milestone | Focus | Effort | CI |
|-----------|-------|--------|-----|
| 1 | Link token support + conversion script + 1 pilot (all locales) | S | **91%** |
| 2 | Convert remaining articles (all locales) + slug parity | M | **90%** |
| 3 | Convert `bookingBasics` with explicit grouping map (all locales) | L | **90%** |
| 4 | Remove legacy article system + delete old files | M | **90%** |

## Tasks

### TASK-01: Add `%URL:` token support for external links

- **Affects:** `apps/brikette/src/routes/guides/utils/_linkTokens.tsx`
- **CI:** 90%
  - Implementation: 90% — extend `tryParsePercentToken()` to handle URL keys safely.
  - Approach: 90% — avoids introducing a new renderer; reuses existing token plumbing.
  - Impact: 90% — small, well-contained behavior addition.
- **Acceptance:**
  - `%URL:https://example.com|Example%` renders a safe external link (target/rel)
  - `%URL:mailto:test@example.com|Email us%` renders a mailto link
  - Unsafe URLs (e.g., `javascript:`) render as plain text
  - Targeted unit test coverage for URL tokens

### TASK-02: Create article-to-guide conversion script (multi-locale)

- **Affects:** `apps/brikette/scripts/convert-assistance-articles-to-guides.ts` (new)
- **CI:** 91%
  - Implementation: 92% — deterministic JSON transformation; article format is consistent.
  - Approach: 90% — script-first reduces manual error and supports re-runs.
  - Impact: 90% — additive; does not change runtime until cutover.
- **Acceptance:**
  - Script converts one or many article keys across all locales where the source file exists
  - Produces guide JSON that renders correctly via GenericContent:
    - list normalization to `* ` markers
    - anchor `<a>` to `%URL:` tokens
    - `<strong>/<em>` to markdown-lite
  - Includes a “completeness check” (every heading key has content; no orphan content keys)
  - Includes a “diff assist” mode (outputs a report of changed section counts per locale)

### TASK-03: Create new guide keys + slug parity for assistance articles

- **Affects:** `apps/brikette/src/data/generate-guide-slugs.ts`, `apps/brikette/src/guides/slugs/overrides.ts`
- **CI:** 90%
  - Implementation: 90% — reuse `ARTICLE_SLUGS` to generate per-locale guide slugs.
  - Approach: 90% — ensures no 404s post-cutover without redirects.
  - Impact: 90% — localized to slug mapping.
- **Acceptance:**
  - For each converted article key, `GENERATED_GUIDE_SLUGS[key]` matches `ARTICLE_SLUGS[key].en`
  - For each locale, `GUIDE_SLUG_OVERRIDES[key][lang]` matches `ARTICLE_SLUGS[key][lang]` (fallback to `.en` where missing)
  - Targeted tests verify `resolveGuideKeyFromSlug(articleSlug(lang, key), lang) === key` for representative locales

### TASK-04: Pilot conversion + render parity (`rules`, all locales)

- **Affects:** `apps/brikette/src/routes/guides/guide-manifest.ts`, `apps/brikette/src/data/guides.index.ts`, `apps/brikette/src/locales/*/guides/content/rules.json`
- **CI:** 91%
  - Implementation: 92% — small content footprint; validates end-to-end.
  - Approach: 90% — confirms tokens/lists/emphasis render as intended.
  - Impact: 90% — low risk and easy to validate manually.
- **Acceptance:**
  - `/[lang]/assistance/<rules-slug>` renders as a guide for every locale where the legacy article exists today
  - SEO title/description preserved (guide `seo.*` matches article `meta.*`)
  - No missing sections and bullet lists render as lists

### TASK-05: Convert remaining low/medium complexity articles (all locales)

- **Affects:** New guide content files + manifest/index entries for:
  - `ageAccessibility`, `changingCancelling`, `checkinCheckout`, `defectsDamages`, `depositsPayments`, `rules`, `security`, `legal`, `arrivingByFerry`, `naplesAirportBus`, `travelHelp`
- **CI:** 90%
  - Implementation: 90% — script-driven, repeatable conversion.
  - Approach: 90% — per-article checklists + diff reports catch omissions.
  - Impact: 90% — content-focused changes; routing is already handled by slug parity.
- **Acceptance:**
  - Each guide renders at its existing assistance URL for every locale where the legacy article existed
  - External/mailto links remain clickable via `%URL:` tokens
  - No orphan headings/content keys reported by the conversion script

### TASK-06: Convert `bookingBasics` with explicit grouping map (all locales)

- **Affects:** Conversion script + `apps/brikette/scripts/help-articles/bookingBasics.structure.json` (new) + guide content outputs
- **CI:** 90%
  - Implementation: 90% — grouping is deterministic once the mapping exists.
  - Approach: 90% — reduces ToC items while preserving all content.
  - Impact: 90% — business-critical content; correctness enforced by completeness checks.
- **Acceptance:**
  - Every legacy `bookingBasics.headings` key is present exactly once in the grouped output (script asserts)
  - Resulting guide has a usable ToC (target: ~8–12 sections)
  - External/mailto links remain clickable via `%URL:` tokens
  - Manual review sign-off for EN + spot-check 2 other locales for formatting

### TASK-07: Cutover + remove legacy assistance article system (cleanup)

- **Affects:**
  - `apps/brikette/src/routes.assistance-helpers.ts` (remove converted keys from `ARTICLE_KEYS`)
  - `apps/brikette/src/article-slug-map.ts` (remove converted keys)
  - `apps/brikette/src/app/[lang]/assistance/[article]/page.tsx` (remove legacy `ARTICLE_NAMESPACES` map entries and legacy render path if fully removed)
  - Delete legacy article JSON files: `apps/brikette/src/locales/<lang>/<articleKey>.json`
- **CI:** 90%
  - Implementation: 90% — systematic cleanup; errors surface quickly via typecheck/build.
  - Approach: 90% — staged cutover after pilot + bulk conversion reduces risk.
  - Impact: 90% — removes old system; mitigated by URL parity tests.
- **Acceptance:**
  - No 404s for existing assistance URLs (now served by guides)
  - No dead imports or unused legacy components
  - Typecheck + targeted tests pass

## Additional Ideas (Optional)

- Publish `arrivingByFerry` and `naplesAirportBus` to both `help` and `howToGetHere` areas (primary remains `help` to preserve URLs) for better navigation/discovery once area editing is in place.
- Add a short “Last updated” line to each converted policy guide (as content) if we want to make policy freshness explicit.

## Patterns to Follow

- **Guide content:** `apps/brikette/src/locales/en/guides/content/whatToPack.json` — section structure, tips, FAQs
- **Manifest entry:** `apps/brikette/src/routes/guides/guide-manifest.ts` — block declarations, areas, relatedGuides
- **Token rendering:** `apps/brikette/src/routes/guides/utils/_linkTokens.tsx` — emphasis + list support; extend for `%URL:`

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| URL regressions after removing legacy article keys | Copy `ARTICLE_SLUGS` into `GUIDE_SLUG_OVERRIDES` per locale; add slug-resolution tests |
| Losing clickable external/mailto links | Add `%URL:` tokens + renderer support (Decision 4) |
| `bookingBasics` grouping misses content | Mapping completeness check + “exactly-once” assertion per legacy key |
| Formatting regressions for bullets/emphasis | Normalize to supported formats (`* ` lists, markdown-lite emphasis) and validate with pilot |

## Non-goals (This Iteration)

- Creating bespoke guide components for policy content — use generic guide layout
- Perfect information architecture for `bookingBasics` — goal is “usable and complete”, not a full rewrite
- Cross-linking/related guides curation — add after conversion

## Acceptance Criteria (Overall)

- [ ] All assistance articles render as guides under `/assistance/{slug}` (all locales that currently have articles)
- [ ] No 404s for any existing article URL
- [ ] SEO metadata preserved (title, description)
- [ ] Content renders correctly in guide layout, including bullet lists and external/mailto links
- [ ] Legacy article files and routing removed
- [ ] TypeScript compiles without errors

## Dependencies

- **Depends on:** None (independent work)
- **Blocks:** Future guide-based assistance page redesign
