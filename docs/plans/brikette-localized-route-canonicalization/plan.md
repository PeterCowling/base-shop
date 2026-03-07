---
Type: Plan
Status: Active
Domain: SEO | Routing
Workstream: Engineering
Created: 2026-03-04
Last-reviewed: 2026-03-04
Last-updated: 2026-03-04
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brikette-localized-route-canonicalization
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-guide-audit
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact); overall effort-weighted average (S=1,M=2,L=3)
Auto-Build-Intent: plan-only
---

# Brikette Localized Route Canonicalization Plan

## Summary
The live site currently serves two URL contracts for many locale pages: internal App Router segments (for example `/ar/experiences`) and localized slugs (for example `/ar/tajarib`). This creates duplicate crawl paths and inconsistent user-visible URLs. The target contract is single-canonical localized URLs per locale, with permanent redirects from internal-segment URLs to localized URLs, while preserving static-export rendering via edge rewrites. This plan removes public duplication, aligns sitemap/internal links/structured data to localized paths, and adds regression tests so the issue does not reappear.

## Active tasks
- [ ] TASK-01: Freeze route contract and generate authoritative redirect matrix
- [ ] TASK-02: Enforce internal -> localized permanent redirects at edge
- [ ] TASK-03: Emit localized URLs from all user-facing links and redirects
- [ ] TASK-04: Emit localized-only SEO surfaces (sitemap + structured data targets)
- [ ] TASK-05: Add route-contract regression tests and CI guards
- [ ] TASK-06: Staging and live verification gate (redirect-chain and loop safety)

## Goals
- One public URL set per locale, localized by language.
- Non-canonical internal-segment URLs permanently redirect to localized equivalents.
- Sitemap and internal link graph emit only localized URLs (except routes where localized slug equals internal slug).
- No redirect loops and no multi-hop chains on core navigational paths.

## Non-goals
- Changing content, copy, or translation strings.
- Reworking unrelated legacy URL migrations already covered by separate SEO redirects.
- Removing internal route folders from Next.js app tree.

## Constraints & Assumptions
- Constraints:
  - Static export on Cloudflare Pages: runtime behavior depends on generated `public/_redirects` ordering.
  - Existing Next.js app routes are internal-segment based; localized rendering depends on aliasing/rewrites.
  - Large multi-locale surface area (18 locales) requires generated, deterministic rules.
- Assumptions:
  - Permanent redirects (`301`) are acceptable for internal-segment public URLs.
  - Localized route slugs in `slug-map.ts` are the canonical per-locale URL contract.

## Inherited Outcome Contract
- **Why:** Remove duplicate locale URL contracts on live and harden SEO/routing correctness.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Every locale page has a single canonical localized URL; internal-segment variants redirect permanently and are absent from sitemap/internal link emission.
- **Source:** operator

## Fact-Find Reference
- Related brief: None: direct operator request with live verification evidence.
- Key findings used:
  - Live confirms dual availability for Arabic (`/ar/experiences` and `/ar/tajarib` both `200`).
  - Current generated rules are localized -> internal `200` rewrites only (no reverse `301`).
  - Route inventory/sitemap source currently emits internal segment URLs.

## Proposed Approach
- Option A: Hard-404 internal-segment URLs.
  - Rejected: breaks existing links/bookmarks and loses migration equity.
- Option B: Keep localized as canonical, add permanent redirects from internal URLs, and keep edge rewrites for localized rendering.
  - Chosen: preserves user and SEO continuity while achieving a single canonical URL contract.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No (plan-only by user request)

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | INVESTIGATE | Build authoritative locale route pair matrix (localized vs internal; top-level + nested guide/tag families) | 95% | S | Pending | - | TASK-02,TASK-05,TASK-06 |
| TASK-02 | IMPLEMENT | Generate internal->localized 301 rules while preserving localized->internal 200 rendering rewrites | 82% | M | Pending | TASK-01 | TASK-06 |
| TASK-03 | IMPLEMENT | Replace internal-segment user-facing href emission with localized slugs; remove redirect-chain sources | 78% | M | Pending | TASK-01 | TASK-06 |
| TASK-04 | IMPLEMENT | Localized-only sitemap/SEO target emission (route inventory + structured data target paths) | 80% | M | Pending | TASK-01 | TASK-06 |
| TASK-05 | IMPLEMENT | Add regression tests and static guards for route contract and redirect safety | 76% | M | Pending | TASK-01,TASK-02,TASK-03,TASK-04 | TASK-06 |
| TASK-06 | CHECKPOINT | Staging/live audit: status codes, canonicals, chains, loops, sitemap contract | 84% | S | Pending | TASK-02,TASK-03,TASK-04,TASK-05 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Generate exact matrix once; all downstream tasks consume it. |
| 2 | TASK-02, TASK-03, TASK-04 | TASK-01 | Can run in parallel with strict file-boundary ownership. |
| 3 | TASK-05 | TASK-02,TASK-03,TASK-04 | Tests/guards after implementation settles. |
| 4 | TASK-06 | TASK-02,TASK-03,TASK-04,TASK-05 | Deploy + verify + rollback readiness gate. |

## Tasks

### TASK-01: Freeze route contract and generate authoritative redirect matrix
- **Type:** INVESTIGATE
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/brikette/src/slug-map.ts`, `apps/brikette/src/routing/sectionSegments.ts`, `apps/brikette/src/data/guides.index.ts`, `apps/brikette/src/routing/staticExportRedirects.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-05, TASK-06
- **Acceptance:**
  - Machine-readable matrix exists for all locale+section pairs where localized != internal.
  - Matrix includes nested families requiring wildcard redirecting (guides, tags).
  - Matrix marks no-op locales/segments where localized == internal.

### TASK-02: Enforce internal -> localized permanent redirects at edge
- **Type:** IMPLEMENT
- **Execution-Track:** code
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/brikette/src/routing/staticExportRedirects.ts`, `apps/brikette/scripts/generate-static-export-redirects.ts`, `apps/brikette/public/_redirects`
- **Depends on:** TASK-01
- **Blocks:** TASK-06
- **Acceptance:**
  - For every mismatched locale segment, internal path returns `301` to localized path.
  - Localized requests still resolve content (`200`) through non-looping rewrite behavior.
  - Redirect rules are deterministic and regenerated via build scripts.
  - No redirect loop for top-level or wildcard paths.

### TASK-03: Emit localized URLs from user-facing links and redirect stubs
- **Type:** IMPLEMENT
- **Execution-Track:** code
- **Effort:** M
- **Status:** Pending
- **Affects:** link emitters and redirect stubs using internal segments (for example nav/footer/language-modal redirect paths and `/[lang]/help`, `/[lang]/guides` stubs)
- **Depends on:** TASK-01
- **Blocks:** TASK-06
- **Acceptance:**
  - User-facing navigation hrefs use localized slugs where localized != internal.
  - Legacy shortcut pages (`/help`, `/guides`) redirect directly to localized targets (single hop).
  - Expected user-observable behavior:
    - Arabic navigation lands on localized paths (`/ar/tajarib`, `/ar/musaada`, `/ar/kayfa-tasil`).
    - English and any same-slug locales remain unchanged.

### TASK-04: Emit localized-only SEO surfaces
- **Type:** IMPLEMENT
- **Execution-Track:** code
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/brikette/src/routing/routeInventory.ts`, `apps/brikette/scripts/generate-public-seo.ts`, structured-data path emitters using internal segments
- **Depends on:** TASK-01
- **Blocks:** TASK-06
- **Acceptance:**
  - Sitemap emits localized URLs only for mismatched locale segments.
  - Structured-data URL targets use localized canonical paths.
  - No internal-segment URLs remain in emitted sitemap for mismatched locale sections.

### TASK-05: Add route-contract regression tests and CI guards
- **Type:** IMPLEMENT
- **Execution-Track:** code
- **Effort:** M
- **Status:** Pending
- **Affects:** route/SEO tests under `apps/brikette/src/test/**` and any new redirect-contract tests
- **Depends on:** TASK-01,TASK-02,TASK-03,TASK-04
- **Blocks:** TASK-06
- **Acceptance:**
  - Automated assertions cover:
    - internal -> localized `301`
    - localized -> content `200`
    - no loop / no >1-hop redirect chains on representative routes
  - Sitemap contract test fails if internal-segment URLs are emitted for mismatched locales.
  - Link-emission test fails if nav/footer regresses to internal segments for mismatched locales.

### TASK-06: Staging and live verification gate
- **Type:** CHECKPOINT
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Depends on:** TASK-02,TASK-03,TASK-04,TASK-05
- **Acceptance:**
  - Staging and live checks pass for matrix sample and full generated route list.
  - For mismatched locale sections:
    - internal URL: `301` to localized
    - localized URL: `200`
    - canonical points to localized URL
  - No redirect loops detected.
  - Post-deploy audit report archived in plan directory.

## Simulation Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01 | Yes | None | No |
| TASK-02 | Yes | Ordering risk in `_redirects` could cause loop if misordered | Yes |
| TASK-03 | Partial | Mixed usage of internal segment constants across UI may leave residual internal links | Yes |
| TASK-04 | Yes | Sitemap source currently internal-segment based | Yes |
| TASK-05 | Partial | Existing tests assert internal segments in some places; updates required | Yes |
| TASK-06 | Yes | CDN cache propagation may temporarily mask redirect behavior | Yes |

## Risks & Mitigations
- Redirect loop risk from bidirectional rules.
  - Mitigation: explicit rule-order contract + automated loop test with representative wildcard paths.
- Partial migration leaves internal links in UI.
  - Mitigation: grep-backed checklist + link-emission tests.
- SEO inconsistency if sitemap lags contract.
  - Mitigation: update sitemap source and add contract test before deploy.
- Cache confusion right after deploy.
  - Mitigation: verify against deployment URL and canonical host; re-check after cache propagation window.

## Observability
- Logging: capture route status matrix (`internal`, `localized`, `Location`, `canonical`) for staging/live.
- Metrics: count of internal-segment hits post-launch from access logs/analytics.
- Alerts/Dashboards: None: add if internal-segment traffic does not decline after migration window.

## Acceptance Criteria (overall)
- [ ] For all locale+section pairs where localized slug differs, internal URL returns permanent redirect to localized URL.
- [ ] Localized URL returns `200` and is canonical/self-consistent.
- [ ] Sitemap contains only localized URLs for mismatched locale segments.
- [ ] No core navigation path produces a redirect chain longer than one hop.
- [ ] Regression tests enforce the contract in CI.

## Decision Log
- 2026-03-04: Chose permanent redirects (not hard 404) from internal-segment URLs to localized URLs to preserve link equity and user continuity while enforcing single canonical locale routes.

## What would make this ≥90%
- Confirm exact Cloudflare Pages redirect evaluation order against generated mixed `301` + `200` rules with wildcard overlap in staging.
- Complete full-locale automated matrix validation for top-level + nested guide/tag routes before live cutover.
- Add one dedicated test that fails on any new `INTERNAL_SEGMENT_BY_KEY` usage in user-facing href emission paths.
