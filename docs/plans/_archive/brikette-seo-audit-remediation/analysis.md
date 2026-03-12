---
Type: Analysis
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: brikette-seo-audit-remediation
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/brikette-seo-audit-remediation/fact-find.md
Related-Plan: docs/plans/brikette-seo-audit-remediation/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Brikette SEO Audit Remediation Analysis

## Decision Frame

### Summary

Four open SEO findings need remediation on hostel-positano.com. The decision is how to structure the fixes: as a single bundled change or independent tasks, and what specific approach to use for each finding (particularly the i18n SSR fix and the lastmod backfill, which have options).

### Goals

- Remove 24 dead `/directions/*` 404 URLs from the sitemap
- Fix i18n key leakage on how-to-get-here guide pages (SSR rendering shows raw keys)
- Add missing `/assistance` → `/en/help` redirect
- Improve `lastmod` sitemap coverage from 23% toward ≥60%

### Non-goals

- Keyword research, content strategy, or SERP analysis (lp-seo Phases 1-3)
- Google Search Console integration
- Core Web Vitals optimization

### Constraints & Assumptions

- Constraints:
  - Tests run in CI only
  - Static export build (`OUTPUT_EXPORT=1`) — no middleware, `_redirects` is the redirect mechanism
  - `assertNoBulkTodayLastmod()` guard rejects ≥95% same-day entries in batches of ≥50
- Assumptions:
  - The i18n leakage is a namespace preload ordering issue, not a missing translation
  - `lastmod` backfill can be done via content JSON without schema changes

## Inherited Outcome Contract

- **Why:** SEO tech audit identified crawl waste (24 dead URLs in sitemap), content quality degradation (raw i18n keys visible to Google on transport guide pages), and sparse freshness signals (77% of sitemap without lastmod). These directly impact search indexing quality for a 1,246-URL multilingual travel site.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All sitemap URLs return 200, no i18n keys leak in SSR HTML for how-to-get-here pages, /assistance redirects correctly, lastmod coverage ≥60%
- **Source:** auto

## Fact-Find Reference

- Related brief: `docs/plans/brikette-seo-audit-remediation/fact-find.md`
- Key findings used:
  - Finding #1: `listCanonicalSitemapPaths()` includes `listDirectionPaths()` which emits 24 `/directions/:slug` URLs. These become `/en/directions/:slug` in sitemap but no route handles them → 404.
  - Finding #2: `PlanChoice.tsx` and `TransportNotice.tsx` use `useTranslation("guides")` but the guides sub-namespaces (`components`, `transportNotice`) aren't preloaded before SSR render.
  - Finding #3: `_redirects` has `/directions/:slug` but no bare `/assistance` rule.
  - Finding #4: `resolveGuideLastmod()` only reads `lastUpdated`/`seo.lastUpdated` from guide content JSON; ~77% of guides lack this field.

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Correctness | Fixes must resolve the exact issues verified on the live site | Critical |
| Independence | Fixes should be independently deployable (no coupling between findings) | High |
| Test coverage | Each fix needs verifiable acceptance criteria in CI | High |
| Minimal blast radius | Changes should not affect working pages or existing SEO signals | High |
| Implementation speed | All findings are straightforward; avoid over-engineering | Medium |

## Options Considered

### Finding #1: Sitemap dead `/directions/*` URLs

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A: Remove `listDirectionPaths()` call | Delete the `...listDirectionPaths()` line from `listCanonicalSitemapPaths()` | Clean fix, removes the source. One-line change. | None — canonical URLs already in sitemap via `listLocalizedPublicUrls()` | None identified | **Yes — chosen** |
| B: Add exclusion to `shouldExcludeFromSitemap()` | Add `/directions/` pattern to the filter function | Also works | Less clean — generates paths then filters them out. Two places to maintain. | Fragile if path format changes | Yes but inferior |

**Elimination rationale for B:** Option A is strictly better — it removes the source of dead URLs rather than filtering them after generation. One-line change with no downsides.

**Additional action:** Add `/en/directions/:slug` → `/en/how-to-get-here/:slug` redirect to `_redirects` to catch any inbound links to the language-prefixed variant (existing rule only catches `/directions/:slug`).

### Finding #2: i18n SSR key leakage

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A: Ensure namespace preload in page server component | Verify `loadGuideI18nBundle()` completes before component render; add explicit preload if needed | Fixes SSR timing directly | Needs careful investigation of RSC execution order | May need to restructure component tree | **Yes — chosen** |
| B: Move PlanChoice/TransportNotice to client-only rendering | Wrap in `<ClientOnly>` or equivalent — don't attempt SSR for these | Avoids SSR preload issue entirely | Hides content from crawlers entirely — defeats the SEO purpose | Worsens SEO rather than fixing it | **No — rejected** |

**Elimination rationale for B:** The entire point is making this content visible to crawlers in SSR HTML. Rendering client-only would hide it.

**Implementation note:** The exact fix depends on why `loadGuideI18nBundle()` at line 111 of the page component doesn't make the namespace available to child components during SSR. The build task must diagnose the timing gap and fix it. The existing SSR audit test (`guide-content-ssr-audit.test.tsx`) provides the verification mechanism.

### Finding #3: Missing `/assistance` redirect

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A: Add to `_redirects` | Add `/assistance /en/help 301` line | Trivial, correct, matches existing pattern | None | None | **Yes — chosen** |

No alternatives considered — this is a one-line config addition with no trade-offs.

### Finding #4: Sparse `lastmod` coverage

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A: Backfill `lastUpdated` in guide content JSON using git dates | Build-time script extracts git commit dates for each content file, writes `lastUpdated` field | Accurate per-file dates. Survives build. Google gets meaningful freshness signals. | Needs git history in CI (shallow clones may lack it). Script to write across 18 locales × ~128 guides. | CI shallow clone gives same date for all files | **Yes — chosen** |
| B: Use build timestamp as fallback | For any sitemap entry without `lastmod`, use the build timestamp | Simple. 100% coverage instantly. | Misleading — tells Google every page was updated today. Bulk-today guard would reject it. | Actively harmful to SEO freshness signal | **No — rejected** |
| C: Manual backfill only (no automation) | Manually add `lastUpdated` to content JSON files with known dates | Most accurate for files with known dates | Doesn't scale; doesn't help for files with unknown dates | Slow, incomplete | Yes but inferior to A |

**Elimination rationale for B:** Build timestamps are misleading. Google treats `lastmod` as a signal of content change; lying about it degrades trust. The `assertNoBulkTodayLastmod()` guard would also reject bulk-today entries.

**Elimination rationale for C:** Manual backfill is accurate but doesn't scale to 18 locales × 128+ guides. Option A automates this with real git dates.

**Implementation note for A:** If CI uses shallow clones (`fetch-depth: 1`), all files appear to have the same commit date. The script should run locally (or CI can use `fetch-depth: 0` for the sitemap generation job). Alternative: store git dates in a committed lookup file that gets updated periodically, decoupling the date extraction from CI depth.

## Engineering Coverage Comparison

| Coverage Area | Option A (bundle of chosen approaches) | Option B (not applicable — only one viable option per finding) | Chosen implication |
|---|---|---|---|
| UI / visual | N/A — build-time/config only | — | None |
| UX / states | N/A — no interaction changes | — | None |
| Security / privacy | N/A — no auth/input changes | — | None |
| Logging / observability / audit | N/A — no runtime logging | — | None |
| Testing / validation | Required: extend sitemap test (no `/directions/*`), verify SSR audit covers how-to-get-here PlanChoice/TransportNotice | — | Add test assertions for each finding |
| Data / contracts | Required: sitemap XML contract unchanged; guide content JSON `lastUpdated` field backfill | — | Plan lastmod backfill script carefully to avoid bulk-today guard |
| Performance / reliability | N/A — build-time changes only | — | None |
| Rollout / rollback | Required: all independently deployable, reversible via revert | — | Standard deploy; can ship fixes 1-3 first, lastmod backfill separately |

## Chosen Approach

- **Recommendation:** Execute all 4 fixes as independent tasks within a single plan. Ship findings #1 (sitemap), #3 (redirect), and #2 (i18n) together as they're small, well-understood changes. Ship finding #4 (lastmod backfill) as a separate task since it involves a scripted bulk content update.

- **Why this wins:** Each fix is well-bounded, independently deployable, and has clear acceptance criteria. Bundling #1 + #2 + #3 minimizes deployment overhead while keeping #4 separate avoids risking the straightforward fixes on the more complex lastmod automation.

- **What it depends on:**
  - Finding #2 depends on diagnosing the exact SSR preload timing gap during implementation
  - Finding #4 depends on git history depth in CI (or a committed lookup file)

### Rejected Approaches

- **Client-only rendering for PlanChoice/TransportNotice** — defeats SEO purpose; hiding content from crawlers is the opposite of the goal
- **Build timestamp as lastmod fallback** — misleading signal, blocked by bulk-today guard
- **Filter-based sitemap exclusion** — works but inferior to removing the source

### Open Questions (Operator Input Required)

None. All approach decisions resolved from evidence and effectiveness reasoning.

## Planning Handoff

- Planning focus:
  - Task 1: Sitemap cleanup (remove `listDirectionPaths()` + add `/en/directions/:slug` redirect + test)
  - Task 2: i18n SSR fix (diagnose preload timing + fix + verify with SSR audit test)
  - Task 3: `/assistance` redirect (one-line `_redirects` addition)
  - Task 4: `lastmod` backfill (build git-date extraction script + run + verify coverage ≥60%)
- Validation implications:
  - Tasks 1 + 3: verifiable via sitemap content check and curl redirect test
  - Task 2: verifiable via SSR audit test (existing `guide-content-ssr-audit.test.tsx`)
  - Task 4: verifiable via lastmod coverage threshold assertion in sitemap test
- Sequencing constraints:
  - Tasks 1, 2, 3 are fully independent — can execute in parallel
  - Task 4 is independent but should ship separately (bulk content change)
- Risks to carry into planning:
  - i18n fix may be more complex than a preload ordering change if RSC boundary prevents namespace sharing
  - lastmod git-date approach needs CI depth check

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| i18n preload fix requires component tree restructure | Low | Medium | Exact RSC timing only verifiable during implementation | Plan should include diagnostic step before code change |
| CI shallow clone breaks git-date lastmod extraction | Medium | Low | CI config not investigated in this analysis | Plan should include CI depth check or committed lookup file approach |

## Planning Readiness

- Status: Go
- Rationale: All 4 findings have chosen approaches with clear acceptance criteria. No operator input required. No architectural risk. Evidence gate, option gate, and planning handoff gate all pass.
