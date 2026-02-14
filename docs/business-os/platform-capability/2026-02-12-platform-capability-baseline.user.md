---
Type: Platform-Capability-Baseline
Status: Active
Domain: Platform
Created: 2026-02-12
Updated: 2026-02-12
Last-reviewed: 2026-02-12
Owner: Pete
Source: Repo capability snapshot + internal docs (no external web research in this baseline)
---

# Platform Capability Baseline (2026-02-12)

## A) Executive Summary

- [Observed][High] The repo has a strong reusable web foundation for fast startup site work: shared UI/design tokens, page-builder packages, checkout primitives, telemetry, and app templates across `apps/` and `packages/`.
- [Observed][High] Commerce primitives are mature enough for direct startup launch work (cart/checkout/webhook standards documented, Stripe tooling/scripts present).
- [Observed][High] Test and validation surface is broad (unit, integration, Cypress e2e, Storybook tests, Lighthouse/LHCI scripts), but not yet uniformly productized per startup app.
- [Observed][High] Platform automation for launch exists (`pnpm launch-shop`, setup/generate/provision scripts, runbook evidence in prior audits).
- [Observed][Medium] The monorepo carries both platform-grade and startup-specific apps/workers; capability exists, but operator routing discipline is required to prevent execution drift.
- [Observed][High] Current baseline pointers for site-upgrade and market-research artifacts are still mostly `Status: Missing`, so process readiness is behind technical capability readiness.
- [Inferred][High] For speed-to-first-sales execution, platform supports a "build directly in app now, retrofit into CMS later" operating mode without architectural dead-end risk.
- [Inferred][Medium] Primary bottleneck is no longer raw engineering capability; it is missing canonical baseline artifacts and inconsistent go-to-market instrumentation per startup.
- [Inferred][Medium] Checkout/payments and deployment are reusable now; copy/offer/measurement loops remain the highest leverage gap for startup outcomes.
- [Inferred][High] Platform baseline should be treated as standing reference for all site-upgrade briefs, refreshed on cadence and after major platform changes.

## B) Capability Assumptions and Scope Boundaries

### Scope used for this baseline

- Included app layer: `apps/api`, `apps/cms`, `apps/dashboard`, `apps/storybook`, `apps/reception`, `apps/prime`, `apps/brikette`, `apps/cochlearfit`, `apps/cochlearfit-worker`, `apps/cover-me-pretty`, `apps/handbag-configurator`, `apps/handbag-configurator-api`, `apps/xa`, `apps/xa-uploader`, `apps/checkout-gateway-worker`, `apps/telemetry-worker`, `apps/front-door-worker`.
- Included package layer: core PLAT packages (for example `@acme/ui`, `@acme/design-system`, `@acme/design-tokens`, `@acme/platform-core`, `@acme/page-builder-*`, `@acme/stripe`, `@acme/telemetry`, `@acme/theme`, `@acme/templates`, `@acme/types`, `@acme/zod-utils`, and related shared packages).
- Included process evidence: `package.json` scripts, repo quality audit, commerce blueprint, PLAT strategy plan, startup loop workflow.

### Explicit exclusions

- Excluded apps by operator direction: `apps/xa-b`, `apps/xa-drop-worker`, `apps/xa-j`.
- No external market benchmarking used in this baseline (internal capability analysis only).

### Baseline assumption

- Recommendations are optimized for startup speed-to-first-sales and near-term conversion learning, not platform purity.

## C) Reusable Capability Inventory

### C1. Frontend and design system

- [Observed][High] Shared UI and design foundations exist (`@acme/ui`, `@acme/design-system`, `@acme/design-tokens`, theme packages, Storybook app and test scripts).
- [Observed][Medium] Page-construction primitives exist (`@acme/page-builder-core`, `@acme/page-builder-ui`, templates/template-app).
- [Inferred][Medium] Platform can support rapid landing/PDP/checkout composition; most friction will be business-specific content and conversion instrumentation.

### C2. Commerce and transaction layer

- [Observed][High] Commerce standards are documented and codified (contract + manifest direction, checkout/webhook modes in commerce blueprint).
- [Observed][High] Stripe integration tooling is present (`register-stripe-webhook`, `checkout-test`, `stripe` package dependencies and scripts).
- [Observed][High] Checkout gateway and worker apps are present for operational variants (`checkout-gateway-worker`, `front-door-worker`).
- [Inferred][Medium] Platform has enough capability to run startup launches without waiting for full CMS integration.

### C3. Content and CMS layer

- [Observed][High] CMS/editorial stack exists (`apps/cms`, `@acme/cms-ui`, `@acme/editorial`, Sanity-related packages, page-builder packages).
- [Observed][Medium] Prior audits indicate strong progress but not full operational simplification for every startup launch path.
- [Inferred][High] CMS is a valid strategic platform lane, but should not be a hard dependency for first startup sales loops.

### C4. Deployment, observability, and quality

- [Observed][High] Launch/deploy scaffolding exists (`pnpm launch-shop`, `setup-ci`, deployment and validation scripts, quality audit evidence).
- [Observed][High] Testing stack spans unit/integration/e2e/storybook/lighthouse.
- [Observed][Medium] Telemetry foundations exist (`@acme/telemetry`, `apps/telemetry-worker`), but startup-level KPI instrumentation remains uneven.
- [Inferred][Medium] Delivery reliability is strong enough for iterative startup shipping if each business has explicit measurement and gate contracts.

## D) Delivery Constraints and Risk Table

| Constraint | Evidence | Risk if ignored | Confidence | Practical handling |
|---|---|---|---|---|
| Monorepo complexity and breadth | Large app + package surface, mixed business/system concerns | Teams optimize infra work not sales outcomes | High | Force every startup deliverable to include outcome + KPI + decision gate |
| CMS path not universally launch-ready for all startup contexts | Startup workflow docs call out missing canonical upgrade artifacts; PLAT plan still has unresolved quality/measurement items | Delay to first sales while waiting on platform-perfect flow | Medium | Use app-direct launch path first, CMS retrofit second |
| Testing breadth can become slow/fragile if run broadly | Root scripts include guardrails (`test` guard, targeted patterns); AGENTS testing policy emphasizes filtered runs | Slow iteration and flaky signal | High | Keep targeted test policy and per-change validation contracts |
| Missing canonical baseline pointers | `latest.user.md` pointers in platform/site-upgrade/market-research often `Missing` | Repeated re-discovery, weak planning quality | High | Maintain pointer discipline; refresh baseline docs on cadence |
| Mixed runtime patterns (Node + worker variants) | Commerce blueprint and app inventory show divergent runtime shapes | Integration inconsistencies across launches | Medium | Choose per-launch runtime profile explicitly in brief/plan |

## E) Website-Upgrade Capability Matrix

| Capability area | Current strength | Proven in repo | Known limits | Confidence |
|---|---|---|---|---|
| IA/navigation frameworks | Medium | Page-builder + template packages, multiple Next apps | Not all businesses have active canonical upgrade briefs | Medium |
| PDP and conversion components | Medium | UI/design-system stack, commerce apps, Storybook coverage | Startup-specific offer/fit/compatibility components not standardized per business | Medium |
| Checkout and payments | High | Commerce blueprint, Stripe scripts, checkout worker/gateway components | Runtime divergence can add integration overhead | High |
| SEO and metadata | Medium | Lighthouse/SEO scripts present (`seo:audit`, LHCI scripts) | No enforced per-business SEO baseline packet in startup loop yet | Medium |
| Analytics and monitoring | Medium | Telemetry packages/workers, synthetic monitor script | KPI dashboards and event taxonomies not uniformly bound to each startup stage gate | Medium |
| Localization | Medium | `@acme/i18n`, locale scripts, multi-app support | Business-level localization readiness not documented consistently | Medium |
| Content operations | Medium | CMS/editorial/sanity stack, launch-shop automation | Current strategy favors app-direct first; CMS throughput target is not yet default operational path | High |
| Experimentation velocity | Medium | Broad script/tooling surface and test infra | Missing canonical per-business experiment backlog contracts in several startup tracks | Medium |

## F) Gap Register (Severity + Mitigation)

| Gap | Severity | Why this blocks fast upgrades | Mitigation pattern |
|---|---|---|---|
| Missing active platform baseline pointer (resolved by this doc) plus missing downstream upgrade pointers | High | Without canonical baseline and linked briefs, teams re-interpret platform fit each run | Keep `latest.user.md` pointers active and date-stamped; require pointer check in preflight |
| Business-specific site-upgrade briefs still missing (`HEAD`, `PET`, others) | High | No Adopt/Adapt/Defer/Reject matrix means implementation scope drifts | Generate per-business upgrade briefs using template + this baseline |
| Startup KPI instrumentation not uniformly codified per business | High | Hard to decide keep/pivot/scale quickly | Require KPI contract (traffic, CVR, CAC, refund, fulfillment SLA, SEO health) in each brief |
| CMS-first bias can delay startup launches | Medium | Startup timeline suffers when waiting for full CMS pathway | Enforce app-direct first launch mode unless explicit exception |
| Runtime/profile ambiguity for commerce features | Medium | Can cause rework at checkout/webhook integration time | Force explicit runtime declaration in lp-fact-find and plan docs |
| Conversion-focused component patterns not pre-packaged per vertical | Medium | Repeated ad hoc implementation across businesses | Build a minimal conversion pattern pack tied to real startup deliverables |

## G) Preferred Patterns and Anti-Patterns

### Preferred patterns

- [Observed+Inferred][High] Outcome-first delivery: each work item must state business outcome, KPI target, and decision gate.
- [Observed][High] Reuse shared platform primitives before new one-off implementations (`@acme/ui`, design-system, platform-core, telemetry, page-builder).
- [Inferred][High] App-direct launch first, CMS retrofit second when startup speed is priority.
- [Observed][High] Use targeted test/validation runs aligned with changed scope.
- [Inferred][Medium] Package design-system/UI work only when attached to a concrete sales-impact deliverable.

### Anti-patterns

- Platform cleanup detached from startup outcome contract.
- CMS migration as prerequisite for first customer sales.
- Unbounded broad test runs for small changes.
- Creating business upgrade plans without explicit platform-fit scoring.
- Rebuilding solved platform primitives in business apps without evidence.

### Do-first checklist for new site-upgrade work

1. Confirm active platform baseline pointer.
2. Confirm active business upgrade brief pointer.
3. Lock launch-surface mode (`pre-website` or `website-live`).
4. Define KPI and decision gates for first 14/30/60/90 days.
5. Choose Adopt/Adapt/Defer/Reject for each reference pattern.
6. Generate lp-fact-find packet and move into plan/build flow.

## H) Adopt/Adapt/Defer/Reject Scoring Rubric

Score each candidate pattern 0-5 in each dimension.

| Dimension | What 0 means | What 5 means |
|---|---|---|
| User value impact | No meaningful user benefit | Strongly improves purchase confidence/usability |
| Conversion/commercial impact | No measurable revenue effect | Clear expected CVR/AOV/CAC benefit |
| Platform fit | Requires net-new risky architecture | Fits existing platform primitives cleanly |
| Effort (inverse) | Multi-sprint/high coordination | Can ship quickly with existing components |
| Risk (inverse) | High legal/ops/quality risk | Low implementation and operational risk |

Weighted score:

- `Total = 0.30*UserValue + 0.30*Commercial + 0.20*PlatformFit + 0.10*EffortInverse + 0.10*RiskInverse`

Decision thresholds:

- `Adopt`: score >= 4.0 and no dimension < 3
- `Adapt`: score 3.0-3.9 or one dimension < 3 with clear mitigation
- `Defer`: score 2.0-2.9, useful later but not now
- `Reject`: score < 2.0 or fails hard constraints (compliance, runtime, operator constraints)

## I) Freshness Contract

- Default refresh cadence: every 30 days.
- Force refresh triggers:
  - Major platform/package architecture change affecting website delivery.
  - Material runtime/deployment/checkout standard change.
  - New startup business added or major channel model shift.
  - Evidence of repeated misfit between business briefs and delivered work.
- Staleness rule: if baseline age >30 days, mark brief confidence as reduced until refreshed.

## J) Source List (Repo Evidence)

Access date for all sources: 2026-02-12.

1. `package.json` (root scripts and platform capabilities) - confidence high.
2. `docs/repo-quality-audit-2026-01.md` (launch readiness evidence) - confidence high.
3. `docs/commerce/cart-checkout-standardization-blueprint.md` (commerce contract/runtime standards) - confidence high.
4. `docs/business-os/strategy/PLAT/plan.user.md` (platform priorities and risks) - confidence medium.
5. `docs/business-os/startup-loop-workflow.user.md` (startup loop and missing data context) - confidence high.
6. `docs/business-os/platform-capability/latest.user.md` (prior missing baseline pointer state) - confidence high.
7. `docs/business-os/site-upgrades/*/latest.user.md` (business upgrade brief pointer status) - confidence high.
8. `apps/` and `packages/` directory inventories (capability surface) - confidence high.
