---
Type: Fact-Find
artifact: fact-find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Mixed
Created: 2026-02-23
Last-updated: 2026-02-23
Feature-Slug: hbag-website-02-image-first-upgrade
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: website-upgrade-backlog
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-design-spec, lp-design-qa, lp-design-system
Related-Plan: docs/plans/hbag-website-02-image-first-upgrade/plan.md
Business-OS-Integration: off
Business-Unit: HBAG
Card-ID: none
direct-inject: true
direct-inject-rationale: WEBSITE-02 continuation from active HBAG site-upgrade brief and operator command to proceed.
---

# HBAG WEBSITE-02 Image-First Upgrade Fact-Find Brief

## Scope
### Summary
Convert the active HBAG WEBSITE-02 L1 Build 2 brief into a plan-ready implementation backlog for image-first merchandising in `apps/caryina`, focusing on homepage, PLP, PDP media behavior and launch-time media QA contracts.

### Goals
- Produce a deterministic, evidence-backed website-upgrade backlog mapped to business outcomes.
- Preserve current API/accessibility constraints while shifting Caryina from text-forward to image-led commerce UX.
- Define measurable acceptance criteria for homepage/PLP/PDP/mobile gallery behavior before build.

### Non-goals
- Re-running deep research or replacing the active site-upgrade brief.
- Full copywriting/content production for all launch variants.
- New runtime stack migrations (for example, WebGL libraries, CMS migration, or architecture rewrites).

### Constraints & Assumptions
- Constraints:
  - Platform baseline pointer must be active and current.
  - Business upgrade brief pointer must be active and current.
  - Implementation must fit current `apps/caryina` Next.js app-router architecture.
  - Accessibility and reduced-motion behavior must remain intact.
- Assumptions:
  - Launch assortment target is high-variant (about 60 variants), so dense visual browsing is a first-order requirement.
  - Media-first conversion behavior can be shipped in existing architecture without new runtime dependencies.
  - Existing placeholder product content will be replaced in follow-on content production, not in this implementation cycle.

## Evidence Audit (Current State)
### Entry Points
- `docs/business-os/platform-capability/latest.user.md` - platform baseline pointer (`Status: Active`).
- `docs/business-os/site-upgrades/HBAG/latest.user.md` - HBAG upgrade brief pointer (`Status: Active`).
- `docs/business-os/site-upgrades/HBAG/2026-02-23-upgrade-brief.user.md` - active WEBSITE-02 L1 Build 2 image-first brief.
- `apps/caryina/src/app/[lang]/shop/page.tsx` - current PLP implementation seam.
- `apps/caryina/src/app/[lang]/product/[slug]/page.tsx` - current PDP implementation seam.

### Key Modules / Files
- `apps/caryina/src/app/[lang]/layout.tsx` - shared locale shell (Header/Main/Footer composition).
- `apps/caryina/src/components/Header.tsx` - primary nav and BrandMark integration.
- `apps/caryina/src/components/SiteFooter.tsx` - legal/support nav surface.
- `apps/caryina/src/lib/shop.ts` - catalog/settings read helpers and money formatting.
- `data/shops/caryina/products.json` - current SKU data source; `media` arrays currently empty.
- `docs/business-os/site-upgrades/HBAG/2026-02-23-upgrade-brief.user.md` - best-of matrix and image-heavy launch contract.
- `docs/business-os/strategy/HBAG/brand-dossier.user.md` - active imagery-first brand language and visual constraints.
- `docs/business-os/platform-capability/2026-02-12-platform-capability-baseline.user.md` - platform fit and delivery constraints.

### Patterns & Conventions Observed
- WEBSITE-02 first cycle is treated as L1 Build 2 with image-first auto-mode.
  - evidence: `docs/business-os/site-upgrades/HBAG/2026-02-23-upgrade-brief.user.md`
- Existing PLP/PDP in Caryina are framework-level and currently text-forward.
  - evidence: `apps/caryina/src/app/[lang]/shop/page.tsx`, `apps/caryina/src/app/[lang]/product/[slug]/page.tsx`
- SKU media fields are present in data model but unset, creating a direct seam for media-contract enforcement.
  - evidence: `data/shops/caryina/products.json`
- Tokenized brand/theme system is already active; visual upgrade can be layered without foundation rewrite.
  - evidence: `apps/caryina/src/app/layout.tsx`, `apps/caryina/src/styles/global.css`, `packages/themes/caryina/src/tokens.ts`

### Data & Contracts
- Types/schemas/events:
  - Current product objects include `media` arrays but no typed role metadata (hero/detail/on_body/etc).
  - Analytics seams already exist for shop/product/checkout route events in current app.
- Persistence:
  - Product data currently loaded via platform repositories through `apps/caryina/src/lib/shop.ts`.
  - Immediate implementation seam is data shape + UI consumption in `apps/caryina`.
- API/contracts:
  - No new API route is required for first image-first cycle; scope is primarily UI/data-contract evolution.

### Dependency & Impact Map
- Upstream dependencies:
  - `docs/business-os/platform-capability/latest.user.md`
  - `docs/business-os/site-upgrades/HBAG/latest.user.md`
  - `docs/business-os/strategy/HBAG/brand-dossier.user.md`
- Downstream dependents:
  - `docs/plans/hbag-website-02-image-first-upgrade/plan.md` (next stage)
  - `apps/caryina/src/app/[lang]/shop/page.tsx`
  - `apps/caryina/src/app/[lang]/product/[slug]/page.tsx`
  - media-production and SKU ingestion process for HBAG launch catalog
- Likely blast radius:
  - `apps/caryina/src/app/[lang]/` (homepage/PLP/PDP routes)
  - `apps/caryina/src/components/` (new reusable media components)
  - `data/shops/caryina/products.json` and related product media ingestion
  - targeted tests and validation scripts in `@apps/caryina`

### Delivery & Channel Landscape
- Audience/recipient:
  - Social-origin mobile shoppers evaluating premium bag accessories (HBAG/Caryina ICP).
- Channel constraints:
  - Image quality and browsing density are primary conversion levers for this category.
- Existing templates/assets:
  - Active image-first site-upgrade brief and deep-research prompt artifacts in `docs/business-os/site-upgrades/HBAG/`.
- Approvals/owners:
  - Owner: Pete (HBAG business owner, brief owner).
- Compliance constraints:
  - Preserve accessibility semantics and reduced-motion behavior.
  - Do not use copied proprietary brand assets from exemplar sites.
- Measurement hooks:
  - Existing event seams can capture gallery interaction/variant behavior once instrumented.

### Website Upgrade Inputs
- Existing site baseline:
  - Locale-ready route framework exists but visual merchandising depth is missing.
  - evidence: `apps/caryina/src/app/[lang]/layout.tsx`, `apps/caryina/src/app/[lang]/shop/page.tsx`, `apps/caryina/src/app/[lang]/product/[slug]/page.tsx`
- Platform capability baseline:
  - Active and suitable for app-direct iterative upgrades.
  - evidence: `docs/business-os/platform-capability/latest.user.md`, `docs/business-os/platform-capability/2026-02-12-platform-capability-baseline.user.md`
- Business upgrade brief:
  - Active and decision-grade with best-of matrix + image-heavy contract.
  - evidence: `docs/business-os/site-upgrades/HBAG/latest.user.md`, `docs/business-os/site-upgrades/HBAG/2026-02-23-upgrade-brief.user.md`
- Reference-site decomposition:
  - Captured in active brief across LOEWE, Bottega Veneta, Coach, Strathberry, Polene, Longchamp, Mulberry, DeMellier, Mansur Gavriel.
  - evidence: `docs/business-os/site-upgrades/HBAG/2026-02-23-upgrade-brief.user.md`

### Best-Of Synthesis Matrix
| Pattern | Source reference | User value | Commercial impact | Platform fit | Effort | Risk | Classification | Rationale |
|---|---|---:|---:|---:|---:|---:|---|---|
| Full-bleed homepage hero with family entry links | LOEWE, Coach | High | High | High | Medium | Low | Adopt | Establishes premium visual hierarchy and faster route to shop |
| Dense PLP with uniform image ratio and minimal copy | Strathberry, Polene, DeMellier | High | High | High | Medium | Low | Adopt | Required for scanning high-variant catalog without cognitive overload |
| Deterministic PDP gallery ordering | LOEWE, Strathberry, Longchamp | High | High | High | Medium | Low | Adopt | Enables repeatable media QA contract across all SKUs |
| Mandatory hardware/detail macro shot per SKU | Bottega, LOEWE | High | High | High | Medium | Low | Adopt | Converts premium claim into visual proof |
| On-body context in early media sequence | Strathberry, LOEWE | High | High | High | Medium | Low | Adopt | Reduces scale/styling uncertainty before checkout |
| Desktop PLP hover secondary image | Coach, Strathberry | Medium | Medium | High | Low | Low | Adopt | Improves browsing throughput with low implementation cost |
| Mobile PLP swipe preview | HBAG brief synthesis (sections D/E) | Medium | Medium | Medium | Medium | Medium | Adapt | Good for discovery UX if performance guardrails are maintained |
| Above-fold background video campaign module | Luxury campaign patterns | Medium | Low | Medium | Medium | Medium | Defer | Defer until static-image baseline achieves conversion and performance targets |
| 3D/AR PDP media | Luxury innovation patterns | Medium | Low | Low | High | High | Defer | Exceeds L1 Build 2 scope and runtime constraints |

### Prioritized Website Upgrade Backlog Candidates
| Priority | Item | Why now | Acceptance criteria | Dependencies | Evidence refs |
|---|---|---|---|---|---|
| P1 | Introduce typed media schema + launch media lint gate | Current product media arrays are empty and unstructured | Build/lint fails when required slots (`hero`, `detail`, `on_body`, `scale`) are missing for launch SKUs; report includes SKU + missing slot | Product data schema update + ingestion script | `data/shops/caryina/products.json`, HBAG brief section L |
| P1 | Rebuild homepage for image-first hierarchy | Current entry flow is route redirect + basic framework composition | Homepage first viewport is image-dominant with direct family links and restrained copy contract from brief | Hero/family asset pack | HBAG brief sections F/L |
| P1 | Replace PLP cards with media-dense grid | Existing PLP is text-card dominant | Mobile 2-up and desktop 4-up media grid; fixed ratio; secondary image behavior available for >=90% launch SKUs | Typed media schema + reusable card component | `apps/caryina/src/app/[lang]/shop/page.tsx`, HBAG brief section L |
| P1 | Implement deterministic PDP gallery | Existing PDP has no media gallery depth | Each launch SKU renders minimum 6-slot sequence; gallery keyboard/screen-reader reachable; CTA remains within target thumb travel on mobile | PDP gallery component + media data contract | `apps/caryina/src/app/[lang]/product/[slug]/page.tsx`, HBAG brief section L |
| P2 | Add silhouette family hubs and filter persistence | 60-variant launch requires stronger discovery structure | Family landing paths exist and filter state persists on back/forward navigation | Taxonomy mapping and URL-state strategy | HBAG brief sections E/H |
| P2 | Add image-led related-products strip on PDP | Supports AOV after primary trust improvements | Related-product strip renders >=8 items with image-first cards and tracked interactions | Related mapping + analytics event extension | HBAG brief sections E/H |
| P3 | Add optional lightweight campaign video block | Potential premium storytelling uplift post-baseline | Video module loads only after hero image and does not regress agreed LCP threshold | CDN/video asset pipeline | HBAG brief sections E/L |

### Hypothesis & Validation Landscape
#### Key Hypotheses
| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | Image-first homepage/PLP/PDP will increase qualified product engagement versus current text-forward baseline | Media asset completeness + component implementation | Medium | 1 cycle |
| H2 | Deterministic media-slot contract reduces launch QA failures across high-variant catalog | Typed media schema + lint gate adoption | Low-Medium | 1 cycle |
| H3 | Mobile gallery behavior can improve confidence without harming performance budgets | Optimized image delivery + interaction design | Medium | 1-2 cycles |
| H4 | Existing architecture can support image-heavy UX without new runtime dependencies | Next.js/image and current component system | Low | 1 cycle |

#### Existing Signal Coverage
| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | Exemplar decomposition + image-heavy contract + current code baseline gap | HBAG brief + current `shop/page.tsx` and `product/[slug]/page.tsx` | Medium |
| H2 | Current `media` arrays are empty and untyped, confirming contract gap | `data/shops/caryina/products.json` | High |
| H3 | Brief includes explicit mobile criteria; no real interaction telemetry yet | HBAG brief section L | Medium-Low |
| H4 | Existing app architecture already handles route framework and theme tokens without extra deps | `apps/caryina/src/app/`, `packages/themes/caryina/src/tokens.ts` | Medium-High |

#### Falsifiability Assessment
- Easy to test:
  - Media schema completeness and lint gate pass/fail.
  - PLP/PDP rendering and accessibility checks in local/staging.
- Hard to test:
  - True conversion uplift before meaningful traffic volume lands.
  - Quality perception impact without standardized photo production quality.
- Validation seams needed:
  - Event instrumentation for gallery interactions.
  - Baseline-vs-upgraded visual and performance snapshots.

#### Recommended Validation Approach
- Quick probes:
  - Build-time media completeness check against launch SKU subset.
  - Visual regression snapshots for homepage/PLP/PDP key states.
- Structured tests:
  - Accessibility checks for gallery keyboard and screen-reader flows.
  - Performance checks for hero LCP and PLP/PDP image payload behavior on mobile profile.
- Deferred validation:
  - Conversion and AOV impact once meaningful traffic/checkout data accumulates.

### Test Landscape
#### Test Infrastructure
- Frameworks:
  - Jest unit/component tests in `@apps/caryina`.
  - Existing workspace lint/typecheck/build commands.
- Commands:
  - `pnpm --filter @apps/caryina typecheck`
  - `pnpm --filter @apps/caryina lint`
  - `pnpm --filter @apps/caryina test -- --runInBand --testPathPattern="BrandMark.test.tsx"`
  - `pnpm --filter @apps/caryina build`
- CI integration:
  - Standard targeted package validation gates; no unfiltered test runs.
- Verified in this run:
  - `pnpm --filter @apps/caryina test -- --runInBand --testPathPattern="BrandMark.test.tsx"` -> pass (3/3 tests), 2026-02-23.

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| BrandMark animation/pixel sampling | Unit/component | `apps/caryina/src/components/BrandMark/BrandMark.test.tsx`, `BrandMark.particleEngine.test.ts`, `BrandMark.sampleTextPixels.test.ts` | Good coverage for brandmark seam only |
| PLP/PDP media behavior | Unit/integration | Not present | No direct tests for current or upgraded media behavior |
| Homepage merchandising modules | Unit/integration | Not present | Requires new coverage in upgrade cycle |

#### Coverage Gaps
- Untested paths:
  - Image-heavy homepage modules.
  - PLP media-card interactions and fallback states.
  - PDP gallery sequence, keyboard behavior, and mobile swipe behavior.
- Extinct tests:
  - Not investigated: no explicit extinct test artifacts identified for this scope.

#### Testability Assessment
- Easy to test:
  - Data/schema contracts and static rendering behavior.
- Hard to test:
  - Real-device confidence effects from media sequencing without production photo set.
- Test seams needed:
  - Dedicated media component tests and snapshot baselines.

#### Recommended Test Approach
- Unit tests for:
  - Media slot validation utilities.
  - Card/gallery ordering logic.
- Integration tests for:
  - PLP grid rendering with varied media availability.
  - PDP gallery interactions (keyboard and swipe).
- E2E tests for:
  - Mobile browse flow (`/shop -> /product/[slug] -> /checkout`) with image-heavy UI.
- Contract tests for:
  - Launch SKU media completeness gate.

### Recent Git History (Targeted)
- `b34bd90c1d` - checkpoint shipping large workspace updates including Caryina framework surfaces.
- `53b5e61fab` - stabilize CI/tests while retaining Caryina route foundation.
- Implication:
  - Current upgrade should layer on the stabilized framework rather than reopen WEBSITE-01 scaffolding decisions.

## External Research (If Needed)
- Not investigated directly in this run: external site analysis is consumed from active brief artifact.
  - Source: `docs/business-os/site-upgrades/HBAG/2026-02-23-upgrade-brief.user.md`

## Questions
### Resolved
- Q: Are website-upgrade prerequisites active (platform baseline and business brief pointers)?
  - A: Yes. Both pointers are `Status: Active`.
  - Evidence: `docs/business-os/platform-capability/latest.user.md`, `docs/business-os/site-upgrades/HBAG/latest.user.md`
- Q: Is this WEBSITE-02 run classified as L1 Build 2 image-first mode?
  - A: Yes. Mode is explicit in the active HBAG brief and prompt.
  - Evidence: `docs/business-os/site-upgrades/HBAG/2026-02-23-upgrade-brief.user.md`, `docs/business-os/site-upgrades/HBAG/2026-02-23-deep-research-site-upgrade-prompt.user.md`
- Q: What is the mandatory launch shot-pack size per SKU (6 vs 8) for the first production media gate?
  - A: Option A selected (6 mandatory slots) in plan decision log on 2026-02-23.
  - Evidence: `docs/plans/hbag-website-02-image-first-upgrade/plan.md` (`## Decision Log`, TASK-01)
- Q: Which bag families are primary homepage and PLP navigation anchors at launch?
  - A: Launch defaults set to `Top Handle`, `Shoulder`, and `Mini`.
  - Evidence: `apps/caryina/src/lib/launchMerchandising.ts`, `docs/plans/hbag-website-02-image-first-upgrade/plan.md` (`## Decision Log`)
- Q: Should launch include campaign video blocks or remain static-image only?
  - A: Static-image-only for launch; video remains deferred (`video_optional` only).
  - Evidence: `docs/business-os/site-upgrades/HBAG/2026-02-23-image-production-contract.user.md`

### Open (User Input Needed)
- None.

## Confidence Inputs
- Implementation: 86%
  - Evidence basis: Active platform + business brief prerequisites, clear code seams, and explicit upgrade contract.
  - What raises to >=80: Already >=80.
  - What raises to >=90: Finalize media schema implementation and run contract fixtures before UI integration.
- Approach: 84%
  - Evidence basis: Image-first strategy is grounded in active brief and current code gap evidence.
  - What raises to >=80: Already >=80.
  - What raises to >=90: Run small implementation spike for one route (PLP or PDP) and validate no architecture friction.
- Impact: 82%
  - Evidence basis: Category and brief evidence indicate image depth is a primary premium conversion lever.
  - What raises to >=80: Already >=80.
  - What raises to >=90: Collect first post-upgrade engagement metrics (gallery interactions, PDP depth, checkout starts) versus baseline.
- Delivery-Readiness: 79%
  - Evidence basis: Technical seam is ready and build evidence is now available, but real-device launch QA is still outstanding.
  - What raises to >=80: Completed.
  - What raises to >=90: Validate launch media readiness for the target SKU subset before build start.
- Testability: 78%
  - Evidence basis: Existing tests cover BrandMark only; media-heavy surfaces currently lack dedicated tests.
  - What raises to >=80: Define new media contract tests in the plan and add at least one integration seam.
  - What raises to >=90: Add route-level media interaction tests plus baseline visual snapshots before implementation expansion.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Incomplete media assets block deterministic launch contract | High | High | Set mandatory slot minimum and enforce build/lint gate before rollout |
| Image-heavy UI harms mobile performance | Medium | High | Add explicit LCP/payload acceptance criteria and responsive image strategy |
| PLP density introduces visual clutter if ratio/cropping rules drift | Medium | Medium | Standardize card aspect ratios and image crop policy in component contract |
| Missing family taxonomy causes weak variant discoverability | Medium | Medium | Resolve family-anchor IA decisions early in plan phase |
| No direct media-surface tests increases regression risk | High | Medium | Add unit/integration/E2E media tests in first build wave |
| Placeholder content remains in launch-facing surfaces | Medium | Medium | Track content replacement as explicit dependency with owner and due gate |

## Planning Constraints & Notes
- Must-follow patterns:
  - L1 Build 2 image-first contract from active HBAG upgrade brief.
  - Tokenized styling and accessibility parity with current Caryina framework.
- Rollout/rollback expectations:
  - Implement in layered slices (schema -> component -> route integration) so rollback can disable upgraded media components while retaining route framework.
- Observability expectations:
  - Add gallery/card interaction telemetry and monitor performance and checkout-start trends after rollout.

## Suggested Task Seeds (Non-binding)
- TASK-01: Lock media contract decisions (shot-pack size + family anchors).
- TASK-02: Implement typed media schema and launch completeness validator.
- TASK-03: Build homepage image-first modules and family entry rails.
- TASK-04: Upgrade PLP to dense media grid with desktop/mobile behaviors.
- TASK-05: Upgrade PDP to deterministic gallery sequence with accessibility checks.
- TASK-06: Add media-focused tests and performance validation contracts.
- TASK-07: Checkpoint on launch readiness and unresolved media/content blockers.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - `lp-design-spec`
  - `lp-design-qa`
  - `lp-design-system`
- Deliverable acceptance package:
  - Image-first homepage/PLP/PDP implementation, media schema + validation tooling, test evidence, and performance checks.
- Post-delivery measurement plan:
  - Track gallery interaction rate, PDP depth, checkout starts, and mobile performance deltas vs current baseline.

## Evidence Gap Review
### Gaps Addressed
- Verified that both required prerequisites (platform baseline and HBAG business brief) are active and linked.
- Confirmed current PLP/PDP code-state and data-model gap (empty media arrays) with direct file evidence.
- Bound external-reference claims to the active HBAG upgrade brief rather than re-stating unverified web claims.
- Verified existing test seam by executing targeted Caryina BrandMark test command and capturing pass result.

### Confidence Adjustments
- Delivery-Readiness reduced to 79% due to pending real-device QA evidence.
- Testability reduced to 78% due to missing direct media-surface tests in current app baseline.
- Implementation/Approach retained above 80% due to active prerequisites and clear seam mapping.

### Remaining Assumptions
- A 6-slot media contract is sufficient for first launch quality (confirmed in TASK-01 decision log).
- Existing image delivery stack can satisfy performance contract once media density increases.
- Follow-on content production will supply assets on schedule for build validation.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None (open questions are decision-quality improvements but do not block plan creation)
- Recommended next step:
  - `/lp-do-plan docs/plans/hbag-website-02-image-first-upgrade/fact-find.md`
