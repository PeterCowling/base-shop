---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Mixed
Created: 2026-02-23
Last-updated: 2026-02-23
Feature-Slug: hbag-website-v1-first-build
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: website-first-build-backlog
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-design-spec, lp-design-system
Related-Plan: docs/plans/hbag-website-v1-first-build/plan.md
Business-OS-Integration: off
Business-Unit: HBAG
Card-ID: none
---

# HBAG Website V1 First Build Fact-Find Brief

## Scope
### Summary
Convert the active WEBSITE-01 first-build contract into a plan-ready build backlog for the first Caryina site version in `apps/caryina`, reusing proven commerce flow structure from the legacy baseline without copying unnecessary legacy complexity.

### Goals
- Establish a deterministic V1 route/framework implementation backlog tied to existing assets.
- Preserve token-driven Caryina brand language and accessibility constraints.
- Keep unknown business data explicit via traceable TODO markers instead of fabricated defaults.

### Non-goals
- Full content polish for every page before framework launch.
- New feature invention outside the WEBSITE-01 contract (UGC, personalization, account expansion).
- Re-defining business strategy or brand language already locked in canonical docs.

### Constraints & Assumptions
- Constraints:
  - WEBSITE-01 source contract is `docs/business-os/strategy/HBAG/site-v1-builder-prompt.user.md` and is now `Status: Active`.
  - Route and commerce foundation must be built in `apps/caryina` with token-only styling.
  - Validation must use targeted package commands for touched scopes.
- Assumptions:
  - Locale parity with legacy baseline (`[lang]`) is default until explicitly changed in plan decisions.
  - `data/shops/caryina/` will start as controlled bootstrap from legacy data structure.
  - Missing env secrets do not block skeleton/framework delivery when stubs are traceable.

## Evidence Audit (Current State)
### Entry Points
- `docs/business-os/strategy/HBAG/site-v1-builder-prompt.user.md` - authoritative WEBSITE-01 build contract.
- `docs/business-os/strategy/HBAG/index.user.md` - gate status row for Site V1 Builder Prompt (`Active`).
- `apps/caryina/src/app/page.tsx` - current scaffold entry.

### Key Modules / Files
- `apps/caryina/src/app/layout.tsx` - app shell root.
- `apps/caryina/src/styles/global.css` - global styling baseline.
- `apps/caryina/src/components/BrandMark/BrandMark.tsx` - signature brand component seam.
- `apps/caryina/src/components/BrandMark/BrandMark.test.tsx` - existing test seam.
- `packages/themes/caryina/src/tokens.ts` - token authority.
- `apps/cover-me-pretty/src/app/[lang]/shop/page.tsx` - listing baseline.
- `apps/cover-me-pretty/src/app/[lang]/product/[slug]/page.tsx` - PDP baseline.
- `apps/cover-me-pretty/src/app/[lang]/checkout/page.tsx` - checkout baseline.
- `apps/cover-me-pretty/src/app/[lang]/success/page.tsx` - purchase success baseline.

### Patterns & Conventions Observed
- WEBSITE-01 contract is framework-first and explicitly excludes page-by-page micro-specing.
  - evidence: `docs/business-os/strategy/HBAG/site-v1-builder-prompt.user.md`
- Reduced-motion and accessibility are explicit build guardrails.
  - evidence: `docs/business-os/strategy/HBAG/site-v1-builder-prompt.user.md`
- Legacy app is the structural baseline for commerce route flow, not a full copy target.
  - evidence: `docs/business-os/strategy/HBAG/site-v1-builder-prompt.user.md`

### Data & Contracts
- Types/schemas/events:
  - WEBSITE-01 contract defines minimum analytics event set: page view, product view, checkout start, purchase success.
- Persistence:
  - Planned first-build fact-find path: `docs/plans/hbag-website-v1-first-build/fact-find.md`.
  - Planned data bootstrap namespace: `data/shops/caryina/`.
- API/contracts:
  - Analytics route pattern in legacy app:
    - `apps/cover-me-pretty/src/app/api/analytics/event/route.ts`

### Dependency & Impact Map
- Upstream dependencies:
  - `docs/business-os/strategy/HBAG/site-v1-builder-prompt.user.md`
  - `docs/business-os/strategy/HBAG/2026-02-21-brand-identity-dossier.user.md`
  - `docs/business-os/startup-baselines/HBAG-offer.md`
- Downstream dependents:
  - `docs/plans/hbag-website-v1-first-build/plan.md` (next stage)
  - `apps/caryina/` implementation work
  - `docs/business-os/startup-loop/modules/cmd-advance.md` gate flow
- Likely blast radius:
  - `apps/caryina/src/app/**`
  - `apps/caryina/src/components/**`
  - `data/shops/caryina/**` (new)
  - Targeted startup-loop docs/tests for handover contract integrity

### Delivery & Channel Landscape
- Audience/recipient:
  - HBAG/Caryina early buyers entering from social/WhatsApp into web checkout flow.
- Channel constraints:
  - Pre-website launch posture; framework needs conversion-ready skeleton before paid expansion.
- Existing templates/assets:
  - WEBSITE-01 builder prompt packet is active and complete.
- Approvals/owners:
  - Owner: Pete (per artifact frontmatter).
- Compliance constraints:
  - No fabricated business facts; TODO traceability required.
- Measurement hooks:
  - V1 baseline event hooks per WEBSITE-01 contract.

### Website First-Build Inputs
- Existing site baseline:
  - `apps/caryina/` scaffold only (no full commerce route framework yet).
- Platform capability baseline:
  - Legacy implementation patterns in `apps/cover-me-pretty/`.
- Business first-build brief:
  - `docs/business-os/strategy/HBAG/site-v1-builder-prompt.user.md` (`Active`).
- Reference surfaces:
  - Legacy `[lang]` route tree and checkout analytics seams.

### Assembly Extraction Matrix
| Surface | Source reference | Reuse vs new-build | Acceptance check | Risk/unknown | Owner |
|---|---|---|---|---|---|
| Route skeleton (`/`, `/shop`, `/product/[slug]`, `/checkout`, `/success`, `/cancelled`) | `apps/cover-me-pretty/src/app/[lang]/...` + WEBSITE-01 contract | Reuse structure, new Caryina wiring | Routes render in dev without runtime errors | Locale strategy lock needed in plan | Pete |
| App shell + branding primitives | `apps/caryina/src/app/layout.tsx`, `packages/themes/caryina/src/tokens.ts` | New-build in Caryina | Token-only styling and brand language consistency | Token drift risk if shortcuts taken | Pete |
| Data bootstrap (`data/shops/caryina`) | `data/shops/cover-me-pretty/` | Controlled bootstrap | Minimum required files exist and parse | Placeholder completeness unknown | Pete |
| Analytics baseline | Legacy analytics route/client seams | Reuse pattern | Baseline events wired or traceable stubs | Secret availability | Pete |
| BrandMark motion/accessibility seam | `BrandMark.tsx` + test | Reuse and extend | Reduced-motion behavior preserved; test coverage retained | Visual QA still needed | Pete |

### Prioritized Website First-Build Backlog Candidates
| Priority | Item | Why now | Acceptance criteria | Dependencies | Evidence refs |
|---|---|---|---|---|---|
| P1 | Establish route framework in `apps/caryina/src/app/` | Unblocks all downstream website build work | Required V1 routes render; no runtime crash | Locale decision + baseline route map | WEBSITE-01 contract; legacy route tree |
| P1 | Bootstrap `data/shops/caryina/` minimum dataset | Required for route rendering and commerce seams | Required JSON files present and referenced | Source bootstrap from legacy data | WEBSITE-01 contract |
| P1 | Wire baseline analytics hooks | Needed for launch learning loop and QA gates | Baseline events implemented or explicit stubs with TODO source refs | Env key availability | WEBSITE-01 contract + legacy analytics seams |
| P2 | Apply Caryina token system across framework | Prevents brand/design drift | No arbitrary color values outside documented exceptions | Theme coverage during reuse | Caryina tokens + brand dossier |
| P2 | Add legal/support route skeletons | Completes minimum commerce trust surface | Terms/Privacy/Returns/Shipping/Support routes in place | Content placeholders may remain | WEBSITE-01 contract |

### Hypothesis & Validation Landscape
#### Key Hypotheses
| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | Legacy route structure can be reused in Caryina without hidden architecture conflicts | Locale/data wiring parity | Medium | 1-2 build cycles |
| H2 | Baseline analytics instrumentation can be safely wired at framework stage | Env + route integration seams | Low-Medium | Same cycle |

#### Existing Signal Coverage
| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | Explicit reuse policy + route references | WEBSITE-01 contract + legacy app tree | Medium |
| H2 | Existing analytics route/client patterns | legacy analytics files in cover-me-pretty | Medium |

#### Falsifiability Assessment
- Easy to test:
  - Route rendering and lint/typecheck/build for `@apps/caryina`.
- Hard to test:
  - Production analytics validity without full secrets/deploy context.
- Validation seams needed:
  - Route smoke checks + reduced-motion/accessibility checks in QA pass.

#### Recommended Validation Approach
- Quick probes:
  - Implement route skeleton + run targeted `dev`, `typecheck`, `lint`, `build`.
- Structured tests:
  - Maintain/update targeted component tests (BrandMark and route-critical seams).
- Deferred validation:
  - Post-deploy analytics verification through S9B measurement checks.

### Test Landscape
#### Test Infrastructure
- Frameworks:
  - Jest via workspace package scripts.
- Commands:
  - `pnpm --filter @apps/caryina test -- --runInBand --testPathPattern="BrandMark.test.tsx"`
- CI integration:
  - Existing repo validation gates; targeted scripts package tests for workflow contract changes.

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| BrandMark component | Unit/component | `apps/caryina/src/components/BrandMark/BrandMark.test.tsx` | Existing seam already present |
| Startup-loop WEBSITE contract | Jest contract | `scripts/src/startup-loop/__tests__/website-contract-parity.test.ts` | Contract-level guardrail |

#### Coverage Gaps
- Untested paths:
  - Full route framework rendering in Caryina post-migration.
- Test seams needed:
  - Targeted route smoke tests once route scaffolding is implemented.

## Questions
### Resolved
- Q: Is WEBSITE-01 ready to hand over to DO?
  - A: Yes. `site-v1-builder-prompt.user.md` exists and is now `Status: Active`; strategy index row is `Active`.
  - Evidence: `docs/business-os/strategy/HBAG/site-v1-builder-prompt.user.md`, `docs/business-os/strategy/HBAG/index.user.md`

### Open (User Input Needed)
- Q: Should V1 retain `[lang]` paths in Caryina or collapse to single-locale route structure?
  - Why it matters: Determines route skeleton and data binding shape.
  - Decision impacted: Route implementation tasks and test paths.
  - Decision owner: Pete
  - Default assumption (if any) + risk: Retain `[lang]` parity initially; risk is extra complexity if single-locale is final target.

## Confidence Inputs
- Implementation: 84%
  - Evidence basis: WEBSITE-01 contract is specific with path-level source map and defaults.
  - To reach >=90: confirm locale decision before plan lock.
- Approach: 82%
  - Evidence basis: Reuse boundaries and DoD are explicit; first-build alias now codified.
  - To reach >=90: run one lightweight route scaffold spike.
- Impact: 86%
  - Evidence basis: This handover is the required bridge from WEBSITE to executable DO tasks.
  - To reach >=90: complete first route scaffold and validate in dev.
- Delivery-Readiness: 83%
  - Evidence basis: Builder contract active; canonical sources mapped.
  - To reach >=90: confirm env ownership for analytics keys.
- Testability: 80%
  - Evidence basis: targeted unit and contract seams exist; route coverage still pending.
  - To reach >=90: add route smoke tests in build phase.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Locale routing misalignment between Caryina and legacy baseline | Medium | High | Lock locale decision in plan task 1 before route implementation |
| Placeholder data leaks into production-facing copy | Medium | Medium | Enforce TODO traceability format for all unknown business values |
| Analytics wiring blocked by missing secrets | Medium | Medium | Allow stubs with explicit TODO + env key references, verify in S9B |
| Legacy complexity imported unintentionally | Medium | Medium | Use reuse policy from WEBSITE-01 contract as hard plan gate |

## Planning Constraints & Notes
- Must-follow patterns:
  - WEBSITE-01 framework-first scope boundary.
  - Token-only styling and reduced-motion constraints.
- Rollout/rollback expectations:
  - Build in modular route slices; retain ability to ship scaffold incrementally.
- Observability expectations:
  - Baseline analytics hooks and explicit stubs where blocked.

## Suggested Task Seeds (Non-binding)
- TASK-01: Lock locale strategy and route-path contract for Caryina V1.
- TASK-02: Scaffold core commerce routes and layout wiring in `apps/caryina/src/app/`.
- TASK-03: Bootstrap `data/shops/caryina/` minimum dataset with traceable placeholders.
- TASK-04: Wire baseline analytics seams and env fallback TODOs.
- TASK-05: Run targeted validation commands and capture evidence.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - `lp-design-spec`
  - `lp-design-system`
- Deliverable acceptance package:
  - Updated `apps/caryina` route framework + data bootstrap + validation output
- Post-delivery measurement plan:
  - S9B launch QA and measurement verification prompts

## Evidence Gap Review
### Gaps Addressed
- WEBSITE-01 contract activation status and strategy index alignment verified.
- Automated handover path standardized with `website-first-build-backlog`.

### Confidence Adjustments
- Delivery readiness raised from draft handoff state to plan-ready state after activation + fact-find creation.

### Remaining Assumptions
- Locale final decision and production secret readiness remain open but non-blocking for plan creation.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None
- Recommended next step:
  - `/lp-do-plan docs/plans/hbag-website-v1-first-build/fact-find.md`
