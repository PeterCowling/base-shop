---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Engineering
Created: "2026-03-12"
Last-reviewed: "2026-03-12"
Last-updated: "2026-03-12"
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brikette-seo-audit-remediation
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/brikette-seo-audit-remediation/analysis.md
---

# Brikette SEO Audit Remediation Plan

## Summary

Fix 4 open findings from the hostel-positano.com SEO technical audit (2026-03-08, fact-checked 2026-03-12). Remove 24 dead `/directions/*` URLs from sitemap, fix i18n SSR key leakage on how-to-get-here pages, add missing `/assistance` redirect, and improve lastmod coverage from 23% to ≥60%. All fixes are independent S-effort code/config changes in the brikette app.

## Active tasks

- [x] TASK-01: Remove dead `/directions/*` URLs from sitemap + add redirect — Complete (2026-03-12)
- [x] TASK-02: Fix i18n SSR key leakage on how-to-get-here pages — Complete (2026-03-12)
- [x] TASK-03: Add `/assistance` → `/en/help` redirect — Complete (2026-03-12)
- [x] TASK-04: Backfill `lastmod` coverage in guide content JSON — Complete (2026-03-12)

## Goals

- All sitemap URLs return 200 (zero 404s)
- No raw i18n keys in SSR HTML for how-to-get-here pages
- `/assistance` (bare, no lang prefix) redirects to `/en/help`
- `lastmod` coverage ≥60% of sitemap URLs

## Non-goals

- Keyword research, content strategy, SERP analysis (lp-seo Phases 1-3)
- Google Search Console integration
- Core Web Vitals optimization

## Constraints & Assumptions

- Constraints:
  - Tests run in CI only
  - Static export build — `_redirects` is the redirect mechanism (no middleware)
  - `assertNoBulkTodayLastmod()` guard rejects ≥95% same-day entries in batches of ≥50
- Assumptions:
  - i18n leakage is a namespace preload ordering issue, not a missing translation
  - Git history is available locally for lastmod date extraction

## Inherited Outcome Contract

- **Why:** SEO tech audit identified crawl waste (24 dead URLs in sitemap), content quality degradation (raw i18n keys visible to Google on transport guide pages), and sparse freshness signals (77% of sitemap without lastmod). These directly impact search indexing quality for a 1,246-URL multilingual travel site.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All sitemap URLs return 200, no i18n keys leak in SSR HTML for how-to-get-here pages, /assistance redirects correctly, lastmod coverage ≥60%
- **Source:** auto

## Analysis Reference

- Related analysis: `docs/plans/brikette-seo-audit-remediation/analysis.md`
- Selected approach inherited:
  - Remove `listDirectionPaths()` from `listCanonicalSitemapPaths()` (source removal, not filter)
  - Fix server-side namespace preload for PlanChoice/TransportNotice components
  - Add `/assistance /en/help 301` to `_redirects`
  - Backfill `lastUpdated` in guide content JSON using git commit dates
- Key reasoning used:
  - Source removal preferred over filter-based exclusion (cleaner, one-line)
  - Client-only rendering rejected (defeats SEO purpose)
  - Build timestamp rejected (misleading freshness signal, blocked by bulk-today guard)

## Selected Approach Summary

- What was chosen: Execute all 4 fixes as independent tasks. Tasks 1-3 are straightforward code/config changes. Task 4 involves scripted bulk content update using git dates.
- Why planning is not reopening option selection: All options thoroughly evaluated in analysis. Chosen approaches are strictly superior to rejected alternatives.

## Fact-Find Support

- Supporting brief: `docs/plans/brikette-seo-audit-remediation/fact-find.md`
- Evidence carried forward:
  - `generate-public-seo.ts:244-252` — `listDirectionPaths()` and `listCanonicalSitemapPaths()`
  - `_redirects:20` — existing `/directions/:slug` rule (missing `/en/directions/:slug` variant)
  - `PlanChoice.tsx:34`, `TransportNotice.tsx:60` — `useTranslation("guides")` calls
  - `guide-i18n-bundle.ts:49-50` — `loadGuideI18nBundle()` preload
  - `generate-public-seo.ts:98-116` — `resolveGuideLastmod()` only reads `lastUpdated`/`seo.lastUpdated`

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---|---|---|---|---|
| TASK-01 | IMPLEMENT | Remove dead `/directions/*` from sitemap + add redirect | 95% | S | Complete (2026-03-12) | - | - |
| TASK-02 | IMPLEMENT | Fix i18n SSR key leakage on how-to-get-here pages | 85% | S | Complete (2026-03-12) | - | - |
| TASK-03 | IMPLEMENT | Add `/assistance` → `/en/help` redirect | 95% | S | Complete (2026-03-12) | - | - |
| TASK-04 | IMPLEMENT | Backfill `lastmod` in guide content JSON using git dates | 85% | S | Complete (2026-03-12) | - | - |

## Engineering Coverage

| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A — build-time/config changes only | - | No rendering changes |
| UX / states | N/A — no interaction changes | - | SSR fix improves content quality for JS-off users |
| Security / privacy | N/A — no auth/input changes | - | - |
| Logging / observability / audit | N/A — no runtime logging | - | - |
| Testing / validation | Required — extend sitemap and SSR audit tests | TASK-01, TASK-02, TASK-04 | Each task includes specific test assertions |
| Data / contracts | Required — sitemap XML unchanged; guide content JSON `lastUpdated` field backfill | TASK-04 | Existing field, no schema change |
| Performance / reliability | N/A — build-time changes only | - | - |
| Rollout / rollback | Required — standard deploy, all independently reversible | All | Revert commit to rollback any individual fix |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03, TASK-04 | None | All 4 tasks are fully independent — can execute in any order or parallel |

## Tasks

### TASK-01: Remove dead directions URLs from sitemap and add redirect

- **Type:** IMPLEMENT
- **Deliverable:** code-change in `apps/brikette/scripts/generate-public-seo.ts` and `apps/brikette/public/_redirects`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-12)
- **Affects:** `apps/brikette/scripts/generate-public-seo.ts`, `apps/brikette/public/_redirects`, `[readonly] apps/brikette/src/data/how-to-get-here/routes.json`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% - one-line removal + one-line redirect addition, well-understood code
  - Approach: 98% - source removal is strictly superior to filter-based exclusion
  - Impact: 95% - removes 24 dead 404s from sitemap immediately
- **Acceptance:**
  - [ ] `listCanonicalSitemapPaths()` no longer includes `listDirectionPaths()` output
  - [ ] Sitemap XML contains zero `/directions/*` URLs
  - [ ] `_redirects` includes `/en/directions/:slug /en/how-to-get-here/:slug 301` rule
  - [ ] Existing sitemap test TC-14 still passes (canonical public paths present)
  - [ ] New test assertion: no sitemap entry matches `/directions/`
- **Engineering Coverage:**
  - UI / visual: N/A — build script only
  - UX / states: N/A — no interaction
  - Security / privacy: N/A — no auth
  - Logging / observability / audit: N/A — no runtime logging
  - Testing / validation: Required — add sitemap exclusion assertion to existing test
  - Data / contracts: N/A — sitemap XML format unchanged
  - Performance / reliability: N/A — build-time only
  - Rollout / rollback: N/A — revert commit to rollback
- **Validation contract (TC-XX):**
  - TC-01: Generated sitemap XML → contains zero URLs matching `/directions/`
  - TC-02: Existing TC-14 canonical path test → still passes (no regression)
- **Execution plan:**
  1. Remove `...listDirectionPaths()` from `listCanonicalSitemapPaths()` in `generate-public-seo.ts`
  2. Add `/en/directions/:slug /en/how-to-get-here/:slug 301` to `_redirects`
  3. Add test assertion in `generate-public-seo.lastmod.test.ts` that no sitemap entry matches `/directions/`
- **Planning validation (required for M/L):** None: S-effort
- **Scouts:** None: code path fully traced in fact-find
- **Edge Cases & Hardening:** If `listDirectionPaths()` is used elsewhere, the function should remain but the call from sitemap removed. Fact-find confirmed no other callers.
- **What would make this >=90%:** Already at 95%.
- **Rollout / rollback:**
  - Rollout: standard deploy
  - Rollback: revert commit
- **Documentation impact:** Update SEO standing artifact after deployment
- **Notes / references:** Fact-find evidence: `generate-public-seo.ts:244-252`, `_redirects:20`

### TASK-02: Fix i18n SSR key leakage on how-to-get-here pages

- **Type:** IMPLEMENT
- **Deliverable:** code-change in brikette i18n/guide rendering pipeline
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-12)
- **Affects:** `apps/brikette/src/app/[lang]/how-to-get-here/[slug]/page.tsx`, `apps/brikette/src/app/_lib/guide-i18n-bundle.ts`, `[readonly] apps/brikette/src/components/guides/PlanChoice.tsx`, `[readonly] apps/brikette/src/components/guides/TransportNotice.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 80% - likely preload ordering but exact RSC timing needs diagnosis during build
  - Approach: 90% - SSR preload is the correct fix; client-only rejected
  - Impact: 90% - directly fixes raw keys visible to Google on transport guide pages
- **Acceptance:**
  - [ ] Raw `curl` of `/en/how-to-get-here/naples-airport-positano-bus` shows translated H1, not `naplesAirportPositanoBus`
  - [ ] No `components.planChoice.title` or `transportNotice.title` tokens in SSR HTML
  - [ ] SSR audit test (`guide-content-ssr-audit.test.tsx`) passes with how-to-get-here page coverage
  - [ ] Existing experiences pages still render correctly (no regression)
- **Engineering Coverage:**
  - UI / visual: N/A — content quality, not visual layout
  - UX / states: N/A — improves JS-off content but no interaction change
  - Security / privacy: N/A — no auth
  - Logging / observability / audit: N/A — no runtime logging
  - Testing / validation: Required — verify SSR audit test covers how-to-get-here pages with PlanChoice/TransportNotice
  - Data / contracts: N/A — no schema changes
  - Performance / reliability: N/A — preload ordering, not new network calls
  - Rollout / rollback: N/A — revert commit to rollback
- **Validation contract (TC-XX):**
  - TC-01: SSR render of `naples-airport-positano-bus` → H1 is translated title, not raw key
  - TC-02: SSR render → no `components.planChoice` or `transportNotice` dot-path tokens in visible HTML
  - TC-03: SSR render of experience pages (e.g., `cheap-eats-in-positano`) → still correct (regression check)
- **Execution plan:**
  1. Diagnose exact preload gap: trace how `loadGuideI18nBundle()` namespace reaches `PlanChoice`/`TransportNotice` during SSR
  2. Fix namespace preload timing — ensure `guides/components` and `guides/transportNotice` sub-namespaces are available before component render
  3. Verify via SSR audit test; spot-check 3+ how-to-get-here pages
- **Planning validation (required for M/L):** None: S-effort
- **Scouts:** None: root cause narrowed to preload ordering; SSR audit test provides verification mechanism
- **Edge Cases & Hardening:** Other guide sections may have similar sub-namespace dependencies. The fix should address the general preload mechanism, not just PlanChoice/TransportNotice specifically.
- **What would make this >=90%:** Confirmed exact preload gap via local SSR trace
- **Rollout / rollback:**
  - Rollout: standard deploy
  - Rollback: revert commit
- **Documentation impact:** Update SEO standing artifact after deployment
- **Notes / references:** Fact-find evidence: `PlanChoice.tsx:34`, `TransportNotice.tsx:60`, `guide-i18n-bundle.ts:49-50`, `guides.imports.ts:23-35`

### TASK-03: Add `/assistance` → `/en/help` redirect

- **Type:** IMPLEMENT
- **Deliverable:** config-change in `apps/brikette/public/_redirects`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-12)
- **Affects:** `apps/brikette/public/_redirects`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 98% - one-line config addition matching existing pattern
  - Approach: 98% - `_redirects` is the only redirect mechanism on static export
  - Impact: 90% - catches bare `/assistance` traffic, prevents 404
- **Acceptance:**
  - [ ] `_redirects` contains `/assistance /en/help 301`
  - [ ] After deploy: `curl -I https://hostel-positano.com/assistance` returns 301 to `/en/help`
- **Engineering Coverage:**
  - UI / visual: N/A — edge redirect only
  - UX / states: N/A — no interaction
  - Security / privacy: N/A — no auth
  - Logging / observability / audit: N/A — no runtime logging
  - Testing / validation: N/A — `_redirects` not locally testable; post-deploy verification via curl
  - Data / contracts: N/A — no data changes
  - Performance / reliability: N/A — edge redirect, sub-ms
  - Rollout / rollback: N/A — revert line to rollback
- **Validation contract (TC-XX):**
  - TC-01: After deploy → `curl -I hostel-positano.com/assistance` returns 301 Location: `/en/help`
- **Execution plan:**
  1. Add `/assistance /en/help 301` line to `_redirects`
- **Planning validation (required for M/L):** None: S-effort
- **Scouts:** None: trivial config addition
- **Edge Cases & Hardening:** Check that no App Router route matches `/assistance` (it doesn't — all routes are under `[lang]/`). Verify existing `/en/assistance` → `/en/help` redirect is unaffected.
- **What would make this >=90%:** Already at 95%.
- **Rollout / rollback:**
  - Rollout: standard deploy
  - Rollback: remove line
- **Documentation impact:** Update SEO standing artifact after deployment
- **Notes / references:** Fact-find evidence: verified `/assistance` returns 404, `/en/assistance` returns 301

### TASK-04: Backfill `lastmod` in guide content JSON using git dates

- **Type:** IMPLEMENT
- **Deliverable:** script + content JSON updates across `apps/brikette/src/locales/*/guides/content/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-12)
- **Affects:** `apps/brikette/src/locales/*/guides/content/*.json`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% - straightforward script; needs care to avoid bulk-today guard
  - Approach: 85% - git dates are the best available signal; manual backfill doesn't scale
  - Impact: 80% - Google treats lastmod as advisory, but 23%→60%+ is a meaningful improvement
- **Acceptance:**
  - [ ] ≥60% of sitemap URLs have `<lastmod>` (up from 23%)
  - [ ] `assertNoBulkTodayLastmod()` guard passes (no bulk-today violation)
  - [ ] Existing TC-12 and TC-13 tests still pass
  - [ ] `lastUpdated` values are realistic dates (not all today, not all the same)
- **Engineering Coverage:**
  - UI / visual: N/A — content metadata only
  - UX / states: N/A — no user-facing change
  - Security / privacy: N/A — no auth
  - Logging / observability / audit: N/A — no runtime logging
  - Testing / validation: Required — verify TC-12 passes with increased coverage; add coverage threshold assertion
  - Data / contracts: Required — guide content JSON `lastUpdated` field; existing field, no schema change
  - Performance / reliability: N/A — build-time only
  - Rollout / rollback: N/A — revert content JSON changes to rollback
- **Validation contract (TC-XX):**
  - TC-01: Sitemap generation with updated content → ≥60% of URLs have lastmod
  - TC-02: `assertNoBulkTodayLastmod()` → passes (no guard violation)
  - TC-03: `lastUpdated` values are distributed dates (not all same day)
- **Execution plan:**
  1. Write a one-shot script that iterates over `apps/brikette/src/locales/*/guides/content/*.json` files
  2. For each file without `lastUpdated`, extract `git log -1 --format=%aI -- <file>` date
  3. Write `lastUpdated` field to the JSON (at root level, matching existing pattern)
  4. Skip files that already have `lastUpdated` (preserve existing accurate dates)
  5. Run sitemap generation to verify coverage and bulk-today guard
- **Planning validation (required for M/L):** None: S-effort
- **Scouts:** Git history is available locally (full clone). CI shallow clone concern is N/A since the backfill script runs locally and commits the results.
- **Edge Cases & Hardening:**
  - Files with `seo.lastUpdated` but no root `lastUpdated`: preserve existing, don't overwrite
  - Files with no git history (newly created): skip, don't add fake date
  - Bulk-today guard: script writes historical git dates, not today's date, so guard won't trigger
- **What would make this >=90%:** Run script, verify coverage count, confirm guard passes
- **Rollout / rollback:**
  - Rollout: commit content JSON changes, standard deploy
  - Rollback: revert content JSON commit
- **Documentation impact:** Update SEO standing artifact with new coverage percentage
- **Notes / references:** Fact-find evidence: `generate-public-seo.ts:98-116` (resolveGuideLastmod), `generate-public-seo.ts:166-182` (bulk-today guard)

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| i18n fix more complex than preload reordering | Low | Medium | SSR audit test provides verification; if RSC boundary prevents fix, escalate to replan |
| Git dates inaccurate for bulk-imported content | Low | Low | Dates are best available signal; can be manually corrected later for specific guides |
| Redirect rule conflicts | Very Low | Low | No App Router route matches `/assistance` or `/en/directions/:slug` |

## Observability

- Logging: None: build-time changes
- Metrics: Post-deploy sitemap verification via curl
- Alerts/Dashboards: None: no runtime changes

## Acceptance Criteria (overall)

- [ ] Sitemap contains zero `/directions/*` URLs
- [ ] Sitemap contains zero 404 URLs
- [ ] Raw SSR HTML for how-to-get-here pages shows translated content, not raw i18n keys
- [ ] `/assistance` returns 301 to `/en/help`
- [ ] `lastmod` coverage ≥60% of sitemap URLs
- [ ] All existing sitemap and SSR tests pass in CI

## Decision Log

- 2026-03-12: Analysis chose source removal over filter-based sitemap exclusion for `/directions/*`
- 2026-03-12: Analysis rejected client-only rendering for PlanChoice/TransportNotice (defeats SEO purpose)
- 2026-03-12: Analysis chose git-date backfill over build timestamp (accuracy > coverage)

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Remove `/directions/*` from sitemap + redirect | Yes | None | No |
| TASK-02: Fix i18n SSR key leakage | Yes | [Minor]: Exact preload gap unconfirmed until implementation; diagnosis step included in execution plan | No |
| TASK-03: Add `/assistance` redirect | Yes | None | No |
| TASK-04: Backfill lastmod | Yes | None | No |

## Overall-confidence Calculation

- TASK-01: 95% × S(1) = 95
- TASK-02: 85% × S(1) = 85
- TASK-03: 95% × S(1) = 95
- TASK-04: 85% × S(1) = 85
- Overall: (95 + 85 + 95 + 85) / 4 = 90%
