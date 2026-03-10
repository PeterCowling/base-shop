---
Type: Plan
Status: Active
Domain: SEO | Routing
Workstream: Engineering
Created: 2026-03-08
Last-reviewed: 2026-03-08
Last-updated: 2026-03-08
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brikette-sitemap-canonicalization
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 93%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Brikette Sitemap Canonicalization Plan

## Summary
The current sitemap contract is polluted in two distinct ways: `generate-public-seo.ts` explicitly emits legacy `/directions/*` aliases, and the route inventory feeding sitemap generation includes top-level localized rooms roots that middleware permanently redirects to booking pages. The fix needs to be structural rather than a one-off exclusion: sitemap emission should consume a dedicated “indexable final URL” inventory, redirect inventories should remain intact for runtime, and the checked-in sitemap artifact plus its contract tests should be regenerated against the corrected source of truth.

## Active tasks
- [x] TASK-01: Introduce a dedicated sitemap canonical inventory and update generator logic
- [x] TASK-02: Update sitemap contract tests and verification scripts
- [x] TASK-03: Regenerate sitemap artifacts and validate the corrected contract

## Goals
- Emit only final canonical sitemap URLs.
- Exclude legacy `/directions/*` aliases while preserving their runtime redirects.
- Exclude redirect-source URLs such as `/`, legacy `/directions/*`, and top-level localized rooms roots such as `/en/dorms` while keeping canonical detail pages.
- Regenerate `apps/brikette/public/sitemap.xml` so the repository artifact matches the fixed generator.

## Non-goals
- Removing legacy redirects from runtime.
- Broader route canonicalization work outside sitemap emission.
- Expanding `lastmod` coverage or changing unrelated SEO surfaces.

## Constraints & Assumptions
- Constraints:
  - Existing route inventories serve multiple consumers with different semantics.
  - The checked-in `public/sitemap.xml` must stay consistent with the generator.
  - Local Jest is CI-only per repo policy.
- Assumptions:
  - A dedicated sitemap-specific inventory is the safest long-term contract.
  - Root redirects and top-level rooms redirects are intentional and should remain live, but absent from the sitemap.

## Inherited Outcome Contract
- **Why:** The live sitemap is leaking redirecting and legacy alias URLs, which wastes crawl budget and weakens canonical trust.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Sitemap generation emits only final canonical 200 URLs, excludes `/`, legacy `/directions/*` aliases, and top-level localized rooms roots, and regenerates `apps/brikette/public/sitemap.xml` without those entries.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/brikette-sitemap-canonicalization/fact-find.md`
- Key findings used:
  - `generate-public-seo.ts` explicitly emits `/directions/*`.
  - `middleware.ts` permanently redirects top-level localized rooms roots to booking routes.
  - Existing verifier/tests encode the polluted sitemap contract and must be updated alongside the generator.

## Proposed Approach
- Option A: Add ad hoc excludes inside `buildSitemapXml()`.
  - Rejected: too implicit and easy to regress; it hides contract problems instead of fixing the inventory source.
- Option B: Introduce a dedicated sitemap inventory that contains only final indexable URLs, migrate generator/verifier/tests to it, and regenerate the public artifact.
  - Chosen: this keeps route contracts explicit and prevents future alias leakage from broader inventories.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Create sitemap-only canonical inventory and update generator path selection | 90% | M | Complete (2026-03-08) | - | TASK-02,TASK-03 |
| TASK-02 | IMPLEMENT | Update tests and verifier to enforce the new sitemap contract | 88% | M | Complete (2026-03-08) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Regenerate `public/sitemap.xml` and validate the corrected contract | 93% | S | Complete (2026-03-08) | TASK-01,TASK-02 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Establish the new source-of-truth contract first. |
| 2 | TASK-02 | TASK-01 | Tests/verifier must match the new inventory. |
| 3 | TASK-03 | TASK-01,TASK-02 | Regenerate artifacts only after code and guards are aligned. |

## Tasks

### TASK-01: Introduce a dedicated sitemap canonical inventory and update generator logic
- **Type:** IMPLEMENT
- **Deliverable:** code-change in route inventory + SEO generator
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-08)
- **Affects:** `apps/brikette/src/routing/routeInventory.ts`, `apps/brikette/scripts/generate-public-seo.ts`, `[readonly] apps/brikette/src/middleware.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 90%
  - Implementation: 92% - pure deterministic inventory/generator code.
  - Approach: 90% - dedicated contract avoids collateral breakage.
  - Impact: 90% - directly removes the polluted sitemap sources.
- **Acceptance:**
  - Sitemap generation consumes a dedicated final indexable URL inventory.
  - Legacy `/directions/*` aliases are excluded from sitemap generation.
  - Redirect-source root `/` is excluded from sitemap generation.
  - Top-level localized rooms roots are excluded from sitemap generation while canonical room-detail URLs remain included.
  - Broader canonical app URL inventories remain available for other consumers.
- **Validation contract (TC-01):**
  - TC-01: sitemap inventory excludes `/directions/amalfi-positano-bus` and `/en/dorms` -> both absent from sitemap input.
  - TC-02: sitemap inventory still includes representative canonical detail URLs such as `/en/dorms/8-bed-mixed-dorm` and `/it/camere-private/appartamento-vista-mare`.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: inspect generator callers and other route inventory consumers before changing shared semantics.
  - Validation artifacts: updated inventory tests and generator verifier in TASK-02.
  - Unexpected findings: None expected.
- **Scouts:** None: bounded deterministic surface.
- **Edge Cases & Hardening:** Exclude only top-level rooms roots, not nested detail pages.
- **What would make this >=90%:**
  - Verify the generated sitemap artifact no longer contains forbidden paths.
- **Rollout / rollback:**
  - Rollout: regenerate sitemap artifact after tests are updated.
  - Rollback: restore prior inventory/generator contract if sitemap exclusions unexpectedly remove canonical details.
- **Documentation impact:**
  - Plan evidence only.
- **Notes / references:**
  - `docs/plans/brikette-sitemap-canonicalization/fact-find.md`
- **Build evidence (2026-03-08):**
  - Added `listLocalizedSitemapUrls()` in `apps/brikette/src/routing/routeInventory.ts`.
  - Updated `apps/brikette/scripts/generate-public-seo.ts` to emit sitemap paths from the sitemap-specific inventory only.
  - Removed sitemap emission of `/`, `/directions/*`, and top-level localized rooms roots by contract rather than XML post-filtering.

### TASK-02: Update sitemap contract tests and verification scripts
- **Type:** IMPLEMENT
- **Deliverable:** corrected regression coverage for sitemap inventory and generated XML
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-08)
- **Affects:** `apps/brikette/src/test/routing/routeInventory.seo.test.ts`, `apps/brikette/src/test/lib/generate-public-seo.lastmod.test.ts`, `apps/brikette/scripts/verify-sitemap-contract.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 88%
  - Implementation: 90% - existing tests already cover adjacent contracts.
  - Approach: 88% - requires updating tests without weakening coverage.
  - Impact: 89% - prevents the bad sitemap contract from returning.
- **Acceptance:**
  - Tests explicitly fail if `/directions/*` aliases appear in sitemap inventories.
  - Tests explicitly fail if top-level localized rooms roots appear in sitemap inventories.
  - Verifier checks the corrected sitemap inventory rather than the polluted legacy set.
- **Validation contract (TC-02):**
  - TC-03: route inventory SEO test proves sitemap exclusions for top-level rooms roots.
  - TC-04: generator test proves emitted XML excludes representative redirect-source URLs.
  - TC-05: verifier expected-path set matches the new sitemap inventory.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: cross-check route inventory consumers before changing verifier expectations.
  - Validation artifacts: scoped `typecheck` and `lint`; CI covers Jest.
  - Unexpected findings: None expected.
- **Scouts:** None: deterministic contract layer.
- **Edge Cases & Hardening:** Keep non-sitemap consumers on broader inventories where needed.
- **What would make this >=90%:**
  - CI confirmation that updated Jest coverage passes.
- **Rollout / rollback:**
  - Rollout: land test changes with generator changes in one batch.
  - Rollback: restore previous tests only alongside generator rollback.
- **Documentation impact:**
  - Plan evidence only.
- **Notes / references:**
  - Existing contracts live in `routeInventory.seo.test.ts` and `generate-public-seo.lastmod.test.ts`.
- **Build evidence (2026-03-08):**
  - Updated route inventory tests to assert sitemap exclusion of localized rooms roots while keeping canonical room-detail URLs.
  - Updated sitemap generator tests to assert absence of `/`, `/directions/*`, and `/en/dorms`.
  - Tightened `apps/brikette/scripts/verify-sitemap-contract.ts` to fail on unexpected emitted paths, not only missing expected ones.
  - Removed generator side effects during verifier imports by guarding `generate-public-seo.ts` execution on the invoked script path.

### TASK-03: Regenerate sitemap artifacts and validate the corrected contract
- **Type:** IMPLEMENT
- **Deliverable:** regenerated `apps/brikette/public/sitemap.xml` and validation evidence
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-08)
- **Affects:** `apps/brikette/public/sitemap.xml`, `apps/brikette/public/sitemap_index.xml`, `apps/brikette/public/robots.txt`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** -
- **Confidence:** 93%
  - Implementation: 95% - generator command already exists.
  - Approach: 93% - artifact refresh is straightforward once contracts are fixed.
  - Impact: 93% - produces the actual corrected sitemap artifact requested by the user.
- **Acceptance:**
  - Regenerated `public/sitemap.xml` contains no `/directions/*` URLs.
  - Regenerated `public/sitemap.xml` contains no root `/` entry.
  - Regenerated `public/sitemap.xml` contains no top-level localized rooms roots like `/en/dorms`.
  - `sitemap_index.xml` and `robots.txt` remain coherent.
  - Scoped validation passes.
- **Validation contract (TC-03):**
  - TC-06: grep-based artifact check finds no `/directions/` or `/en/dorms` entries in `public/sitemap.xml`.
  - TC-07: `pnpm --filter @apps/brikette typecheck` passes.
  - TC-08: `pnpm --filter @apps/brikette lint` passes.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: `generate:public-seo`, grep checks, scoped typecheck/lint.
  - Validation artifacts: regenerated XML plus command outputs.
  - Unexpected findings: None expected.
- **Scouts:** None: bounded artifact regeneration.
- **Edge Cases & Hardening:** Confirm canonical detail URLs remain in the regenerated artifact.
- **What would make this >=90%:**
  - Already met once regenerated artifact and scoped validation succeed.
- **Rollout / rollback:**
  - Rollout: commit regenerated artifacts with code changes.
  - Rollback: restore prior generated files only with code rollback.
- **Documentation impact:**
  - Record validation evidence in this plan.
- **Notes / references:**
  - Generator command: `pnpm --filter @apps/brikette generate:public-seo`
- **Build evidence (2026-03-08):**
  - `pnpm --filter @apps/brikette generate:public-seo` regenerated `apps/brikette/public/sitemap.xml`.
  - `pnpm --filter @apps/brikette exec tsx --tsconfig tsconfig.scripts.json scripts/verify-sitemap-contract.ts` returned `missing: 0`, `unexpected: 0`.
  - Grep checks confirmed `apps/brikette/public/sitemap.xml` no longer contains `/directions/*`, `/en/dorms`, or the site root entry, while canonical detail entries such as `/en/dorms/8-bed-mixed-dorm` and `/en/private-rooms/sea-view-apartment` remain present.
  - `pnpm --filter @apps/brikette typecheck` passed.
  - `pnpm --filter @apps/brikette lint` passed with existing package warnings only.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Introduce a dedicated sitemap canonical inventory and update generator logic | Yes | None | No |
| TASK-02: Update sitemap contract tests and verification scripts | Yes | None | No |
| TASK-03: Regenerate sitemap artifacts and validate the corrected contract | Yes | None | No |

## Risks & Mitigations
- Shared inventory semantics drift.
  - Mitigation: create a sitemap-specific inventory instead of weakening broader canonical route inventories.
- Canonical room-detail pages accidentally removed.
  - Mitigation: explicit assertions for representative room-detail URLs.
- Generated artifact mismatch.
  - Mitigation: regenerate `public/sitemap.xml` in the same change set and grep-check it directly.

## Observability
- Logging: generator already reports emitted `lastmod` count and target dirs.
- Metrics: `public/sitemap.xml` path presence/absence is the primary local signal.
- Alerts/Dashboards: None for this local change.

## Acceptance Criteria (overall)
- [x] Sitemap generation uses a dedicated final canonical inventory.
- [x] Legacy `/directions/*` aliases are absent from sitemap generation and regenerated XML.
- [x] Root `/` redirect source is absent from sitemap generation and regenerated XML.
- [x] Top-level localized rooms roots are absent from sitemap generation and regenerated XML.
- [x] Canonical detail URLs remain present.
- [x] Scoped validation passes.

## Decision Log
- 2026-03-08: Chose a dedicated sitemap inventory over ad hoc XML filtering so redirect-source URLs are excluded by contract, not by cleanup.
- 2026-03-08: Tightened the sitemap verifier to fail on unexpected URLs so extra aliases cannot silently re-enter the generated XML.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Overall-confidence = sum(task confidence * effort weight) / sum(effort weight)

## What would make this ≥90%
- Already achieved in this build cycle through completed tasks, regenerated artifacts, and clean scoped validation.
