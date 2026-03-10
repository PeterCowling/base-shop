---
Type: Plan
Status: Complete
Domain: SEO | Routing | Content Freshness
Workstream: Engineering
Created: 2026-03-08
Last-reviewed: 2026-03-08
Last-updated: 2026-03-08
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brikette-sitemap-lastmod-coverage
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 89%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Brikette Sitemap Lastmod Coverage Plan

## Summary
Sitemap freshness coverage is sparse because the generator only emits `lastmod` for guide detail URLs with locale-specific explicit timestamps. The fix is to broaden freshness resolution structurally: use explicit page timestamps where present, fall back to repo-tracked content file commit dates when explicit timestamps are absent, and propagate guide freshness to section/tag collection pages derived from those guides. Then regenerate the sitemap artifact and lock the behavior in tests.

## Active tasks
- [x] TASK-01: Build a broader sitemap freshness resolver for guide and page-content routes
- [x] TASK-02: Extend regression coverage for derived `lastmod` contracts
- [x] TASK-03: Regenerate sitemap artifacts and record validation evidence

## Goals
- Emit `lastmod` for all guide detail routes with a trustworthy freshness signal.
- Emit `lastmod` for guide-derived collection routes such as section indexes and guide tags.
- Emit `lastmod` for explicit page-content routes with page namespace freshness metadata or deterministic content-file fallback.
- Regenerate `apps/brikette/public/sitemap.xml` from the corrected generator.

## Non-goals
- Adding manual timestamps across the content corpus.
- Reworking sitemap URL eligibility.
- Using unstable filesystem mtimes.

## Constraints & Assumptions
- Constraints:
  - Local Jest remains CI-only.
  - Freshness signals must be deterministic and content-linked.
  - The generator must remain safe when git metadata is unavailable.
- Assumptions:
  - Git commit dates on repo-tracked content files are acceptable fallback freshness hints.
  - Derived collection pages should track the freshest included child content.

## Inherited Outcome Contract
- **Why:** Sitemap freshness coverage is sparse, so Google receives weak update signals across guide-heavy content clusters.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Sitemap generation emits reliable `lastmod` values for guide detail pages, guide-derived collection pages, and explicit page-content routes wherever a trustworthy content freshness signal exists, and regenerates `apps/brikette/public/sitemap.xml` with those values.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/brikette-sitemap-lastmod-coverage/fact-find.md`
- Key findings used:
  - current `lastmod` map size is only `682`
  - only `44` live guides have any explicit timestamp across locales
  - policy pages already expose `lastUpdated.date`
  - guide section and tag pages can derive freshness from child guides

## Proposed Approach
- Option A: only widen explicit timestamp parsing.
  - Rejected: helps privacy/cookie and a few guide shapes, but leaves most content routes uncovered.
- Option B: build a generalized sitemap `lastmod` map with explicit timestamps first, git-backed content-file fallback second, and derived section/tag freshness third.
  - Chosen: covers current gaps while remaining deterministic and reusable.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Expand generator freshness sourcing for guide, derived guide, and explicit page-content routes | 88% | M | Complete (2026-03-08) | - | TASK-02,TASK-03 |
| TASK-02 | IMPLEMENT | Update tests to lock the broader `lastmod` contract | 87% | M | Complete (2026-03-08) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Regenerate sitemap and validate the expanded freshness coverage | 92% | S | Complete (2026-03-08) | TASK-01,TASK-02 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Build the broader freshness map first. |
| 2 | TASK-02 | TASK-01 | Tests should encode the new coverage contract. |
| 3 | TASK-03 | TASK-01,TASK-02 | Refresh artifacts only after code/tests settle. |

## Tasks

### TASK-01: Build a broader sitemap freshness resolver for guide and page-content routes
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-03-08)
- **Affects:** `apps/brikette/scripts/generate-public-seo.ts`, `[readonly] apps/brikette/src/data/guides.index.ts`, `[readonly] apps/brikette/src/routing/routeInventory.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Acceptance:**
  - guide detail routes resolve `lastmod` from explicit local timestamps, then deterministic fallback sources
  - guide section index and tag pages inherit derived freshness from included guides
  - privacy/cookie and other explicit page-content routes can emit `lastmod` when their namespace file provides or implies a trustworthy freshness signal
  - the bulk-today guard still protects the expanded emitted set
- **Build evidence:**
  - `apps/brikette/scripts/generate-public-seo.ts` now builds a unified content-route `lastmod` map instead of limiting coverage to explicit guide-detail timestamps.
  - Freshness resolution order is explicit timestamp first, repo git-history fallback second, with support for both plain string dates and `{ date: ... }` page metadata.
  - Derived route families now inherit freshness from child guides:
    - guide section indexes: `assistance`, `experiences`, `howToGetHere`
    - guide tag pages under `/<lang>/<experiences>/<tags>/<tag>`
  - Explicit page-content routes now participate through localized `*Page.json` namespaces, including privacy/cookie policies and related static pages.

### TASK-02: Extend regression coverage for derived `lastmod` contracts
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-03-08)
- **Affects:** `apps/brikette/src/test/lib/generate-public-seo.lastmod.test.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Acceptance:**
  - tests prove guide detail routes emit `lastmod` from the broader resolver
  - tests prove representative section/tag URLs inherit child-guide freshness
  - tests prove explicit page-content routes like privacy/cookie emit `lastmod`
- **Build evidence:**
  - `apps/brikette/src/test/lib/generate-public-seo.lastmod.test.ts` now asserts the broader contract through `buildContentRouteLastmodByPath()`.
  - Regression coverage now checks:
    - broader coverage exceeds the legacy explicit-guide-only map
    - representative section indexes inherit the freshest child guide timestamp
    - representative tag pages inherit the freshest tagged guide timestamp
    - policy routes such as `/en/privacy-policy` emit `lastmod`
    - object-form freshness metadata such as `lastUpdated.date` resolves correctly

### TASK-03: Regenerate sitemap artifacts and record validation evidence
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-08)
- **Affects:** `apps/brikette/public/sitemap.xml`, `docs/plans/brikette-sitemap-lastmod-coverage/plan.md`
- **Depends on:** TASK-01,TASK-02
- **Blocks:** -
- **Acceptance:**
  - regenerated sitemap reflects the expanded `lastmod` coverage
  - `pnpm --filter @apps/brikette generate:public-seo` succeeds
  - scoped `typecheck` and `lint` succeed
  - plan records the new emitted coverage and validation results
- **Build evidence:**
  - Regenerated `apps/brikette/public/sitemap.xml` on 2026-03-08 via `pnpm --filter @apps/brikette generate:public-seo`.
  - Fresh sitemap totals:
    - URLs: `3938`
    - URLs with `lastmod`: `1426`
    - URLs without `lastmod`: `2512`
    - uplift versus fact-find baseline: `+744` `lastmod` entries (`682` -> `1426`)
  - Emitted `lastmod` map breakdown:
    - guide detail pages: `682`
    - guide section index pages: `54`
    - guide tag pages: `654`
    - explicit page-content routes: `36`
  - Sitemap contract verification remained exact:
    - expected: `3938`
    - emitted: `3938`
    - missing: `0`
    - unexpected: `0`
  - Validation:
    - `pnpm --filter @apps/brikette typecheck` passed
    - `pnpm --filter @apps/brikette lint` passed with existing package warnings only (`129` warnings, `0` errors)
    - local Jest not run per repo testing policy

## Risks & Mitigations
- Git fallback unavailable.
  - Mitigation: degrade gracefully to explicit-only coverage for affected files.
- Derived collection pages over-report freshness.
  - Mitigation: derive only from direct visible child content.
- Regression coverage becomes too brittle.
  - Mitigation: assert representative routes and map behavior rather than hard-coding the whole XML.

## Acceptance Criteria (overall)
- [x] Guide detail URLs emit `lastmod` wherever explicit or deterministic fallback freshness exists.
- [x] Guide section and guide tag pages emit derived `lastmod`.
- [x] Explicit page-content routes such as privacy/cookie emit `lastmod`.
- [x] Regenerated sitemap artifact reflects the broader coverage.
- [x] Scoped validation passes.
