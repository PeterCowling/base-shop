---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: SEO | Routing | Content Freshness
Workstream: Engineering
Created: 2026-03-08
Last-updated: 2026-03-08
Feature-Slug: brikette-sitemap-lastmod-coverage
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/brikette-sitemap-lastmod-coverage/plan.md
Trigger-Why: Sitemap freshness coverage is sparse, so Google receives weak update signals across guide-heavy content clusters.
Trigger-Intended-Outcome: type: measurable | statement: Sitemap generation emits reliable `lastmod` values for guide detail pages, guide-derived collection pages, and explicit page-content routes wherever a trustworthy content freshness signal exists, and regenerates `apps/brikette/public/sitemap.xml` with those values. | source: operator
---

# Brikette Sitemap Lastmod Coverage Fact-Find Brief

## Scope
### Summary
Expand sitemap `lastmod` coverage so content-heavy SEO surfaces emit freshness hints from deterministic content sources. The current generator only reads explicit guide `lastUpdated` values from localized guide content JSON, which leaves most sitemap URLs without freshness metadata even though many route families can derive it from content files or guide-child freshness.

### Goals
- Trace the current `lastmod` source path and explain why coverage is sparse.
- Identify trustworthy freshness signals already present in the repo for guide and guide-derived pages.
- Extend sitemap `lastmod` generation without inventing dates.
- Regenerate the checked-in sitemap artifact and add regression coverage for future runs.

### Non-goals
- Adding manual timestamps to hundreds of content files in this task.
- Inferring freshness from unstable filesystem mtimes.
- Reworking sitemap canonical URL eligibility.

### Constraints & Assumptions
- Constraints:
  - Local Jest remains CI-only.
  - `lastmod` values must come from durable, content-linked sources.
  - The checked-in sitemap artifact must match the generator output.
- Assumptions:
  - Git commit timestamps for repo-tracked content files are acceptable fallback freshness signals when explicit `lastUpdated` fields are absent.
  - Guide collection pages can safely derive freshness from the newest child guide included on the page.

## Outcome Contract
- **Why:** Sitemap freshness coverage is sparse, so Google receives weak update signals across guide-heavy content clusters.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Sitemap generation emits reliable `lastmod` values for guide detail pages, guide-derived collection pages, and explicit page-content routes wherever a trustworthy content freshness signal exists, and regenerates `apps/brikette/public/sitemap.xml` with those values.
- **Source:** operator

## Access Declarations
- None.

## Evidence Audit (Current State)
### Entry Points
- `apps/brikette/scripts/generate-public-seo.ts` - current sitemap generator and sole `lastmod` builder.
- `apps/brikette/src/data/guides.index.ts` - live guide inventory and section/tag relationships.
- `apps/brikette/src/routing/routeInventory.ts` - sitemap path inventory including guide details, section indexes, and tag pages.
- `apps/brikette/src/locales/*/guides/content/*.json` - localized guide content sources, some with explicit `lastUpdated`.
- `apps/brikette/src/locales/*/*Page.json` - localized page-content sources for policy and other static content routes.

### Key Modules / Files
- `apps/brikette/scripts/generate-public-seo.ts`
  - `buildGuideLastmodByPath()` currently emits `lastmod` only for guide detail URLs.
  - It only checks `content.lastUpdated` and `content.seo.lastUpdated`.
- `apps/brikette/src/test/lib/generate-public-seo.lastmod.test.ts`
  - Current coverage encodes the “guide detail only” contract.
- `apps/brikette/src/locales/en/privacyPolicyPage.json`
  - Contains structured freshness metadata at `lastUpdated.date`.
- `apps/brikette/src/locales/en/cookiePolicyPage.json`
  - Contains structured freshness metadata at `lastUpdated.date`.

### Data Findings
- Current emitted `lastmod` map size: `682`
  - Evidence: `buildGuideLastmodByPath()` executed on 2026-03-08.
- Live guide count: `119`
- Live guides with any explicit `lastUpdated` across locales: `44`
  - Evidence: scripted repo scan on 2026-03-08.
- English guide content files:
  - total: `168`
  - explicit `lastUpdated` / `seo.lastUpdated`: `40`
- All localized guide content files:
  - total: `3024`
  - explicit `lastUpdated` / `seo.lastUpdated`: `772`
- Explicit non-guide page freshness found in English locale namespaces:
  - `privacyPolicyPage.json`
  - `cookiePolicyPage.json`

### Patterns & Conventions Observed
- Guide detail freshness is content-linked and deterministic when present.
- Guide collection routes (`/experiences`, `/help`, `/how-to-get-here`, tag pages) are derived entirely from guide inventories, so child-guide freshness can be propagated safely.
- Locale page JSON files are the canonical content source for several static routes; git history on those files is a stable fallback when explicit `lastUpdated` is absent.

### Dependency & Impact Map
- Upstream dependencies:
  - localized guide content JSON files
  - localized `*Page.json` namespaces
  - git history for repo-tracked content files (fallback only)
- Downstream dependents:
  - `apps/brikette/public/sitemap.xml`
  - `apps/brikette/public/sitemap_index.xml`
  - `apps/brikette/src/test/lib/generate-public-seo.lastmod.test.ts`
- Likely blast radius:
  - sitemap generation and its tests only

### Test Landscape
#### Existing Coverage
| Area | Test Type | Files | Notes |
|---|---|---|---|
| guide `lastmod` emission | Unit | `apps/brikette/src/test/lib/generate-public-seo.lastmod.test.ts` | Currently only proves guide-detail coverage. |
| sitemap contract parity | Script contract | `apps/brikette/scripts/verify-sitemap-contract.ts` | Verifies URLs, not freshness metadata. |

#### Coverage Gaps
- No test for guide-derived collection pages inheriting freshness.
- No test for page-level `lastUpdated.date` support.
- No test for git-backed fallback freshness on content files without explicit timestamps.

#### Recommended Test Approach
- Extend the generator test to cover:
  - guide-detail fallback to English / git-backed timestamps
  - section and tag pages derived from child guide freshness
  - privacy/cookie policy pages using namespace freshness

## Questions
### Resolved
- Q: Why is sitemap `lastmod` coverage sparse today?
  - A: The generator only emits `lastmod` for guide detail URLs, and only when a locale-specific guide content JSON exposes `lastUpdated` or `seo.lastUpdated`.
  - Evidence: `apps/brikette/scripts/generate-public-seo.ts`
- Q: Are there additional trustworthy freshness signals already in the repo?
  - A: Yes. Some page namespaces expose `lastUpdated.date`, and all content files have git history that can serve as a deterministic fallback.
  - Evidence: `apps/brikette/src/locales/en/privacyPolicyPage.json`, `apps/brikette/src/locales/en/cookiePolicyPage.json`
- Q: Can collection pages get reliable freshness without manual timestamps?
  - A: Yes. Their visible content is derived from guide inventories, so the newest child-guide freshness is a defensible page freshness signal.
  - Evidence: `apps/brikette/src/data/guides.index.ts`, `apps/brikette/src/routing/routeInventory.ts`

### Open (Operator Input Required)
- None.

## Confidence Inputs
- Implementation: 91%
  - Evidence basis: bounded generator/test surface and deterministic content inputs.
- Approach: 88%
  - Evidence basis: git fallback introduces one new dependency, but it is build-time and fail-soft.
- Impact: 92%
  - Evidence basis: guide and guide-derived surfaces dominate the content sitemap.
- Delivery-Readiness: 93%
  - Evidence basis: no blocked decisions or external access needs.
- Testability: 90%
  - Evidence basis: generator functions are pure enough to cover with unit tests.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Git fallback unavailable in some build environments | Medium | Medium | Fail soft: prefer explicit timestamps, use git only when available, emit no `lastmod` rather than fabricate. |
| Derived collection timestamps drift from page reality | Low | Medium | Derive only from direct child content sources that visibly shape the page. |
| Bulk fallback dates cluster unexpectedly | Low | Medium | Keep and extend the existing bulk-today guard over the broader emitted `lastmod` set. |

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Generator `lastmod` source logic | Yes | None | No |
| Guide inventory and derived collection routes | Yes | None | No |
| Page namespace freshness candidates | Yes | None | No |
| Regression tests and artifact refresh | Yes | None | No |

## Scope Signal
- Signal: right-sized
- Rationale: The work is localized to sitemap freshness resolution and bounded regression coverage.

## Evidence Gap Review
### Gaps Addressed
- Quantified current `lastmod` coverage rather than relying only on live-site counts.
- Verified explicit freshness metadata outside guides.
- Identified a deterministic fallback path for content files without explicit timestamps.

### Confidence Adjustments
- Approach held at 88% because git fallback must remain optional and non-breaking when repo metadata is unavailable.

### Remaining Assumptions
- The sitemap generator continues to run inside a repo checkout where `.git` is normally available.
