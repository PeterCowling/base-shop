---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Mixed
Created: 2026-02-13
Last-updated: 2026-02-13
Feature-Slug: ds-skill-alignment-loop-consolidation
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: /lp-do-build
Supporting-Skills: /meta-reflect
Related-Plan: docs/plans/ds-skill-alignment-loop-consolidation-plan.md
Business-OS-Integration: on
Business-Unit: PLAT
Card-ID: pending
---

> **Note:** S7/S8/S9 stage IDs referenced below were consolidated into stage DO in loop-spec v3.0.0 (2026-02-21).

# Skill Alignment & Loop Consolidation — Fact-Find Brief

## Scope

### Summary

Restructure the entire skill inventory (~37 skills across 10 prefix families) to align with the S0–S10 startup loop. The user has identified three missing "spines" — Offer, Distribution, and Experiment — and proposed ~40 new skills to fill them. This fact-find assesses: (1) which existing skills should be renamed/absorbed/kept, (2) which proposed new skills are viable now vs. premature, (3) what the minimum viable skill set is to close the three spine gaps, and (4) how naming conventions should work.

### Goals

- Every skill has a clear home in the loop (stage-bound) or an explicit justification for being cross-cutting
- The three missing spines (Offer, Distribution, Experiment) are represented by skills, not just documents
- Proposed ~40 new skills are triaged to a realistic build order: must-have, should-have, and defer
- Naming convention is consistent and self-documenting
- No skill bloat — consolidate where possible (target: fewer new skills than proposed)

### Non-goals

- Implementing the skills (that's `/lp-do-plan` → `/lp-do-build`)
- Changing the S0–S10 stage numbering (preserve compatibility with existing docs/cards)
- Rewriting existing working skills just for naming consistency (rename dirs, update refs, done)

### Constraints & Assumptions

- Constraints:
  - Each skill is a directory under `.claude/skills/<name>/SKILL.md` — renaming means renaming the directory + updating all refs
  - Skills are registered in the system prompt via the skill list — renames require updating that list
  - Existing cards/stage-docs reference current skill names — must update or alias
  - Must not break the working core loop (`/lp-do-fact-find` → `/lp-do-plan` → `/lp-sequence` → `/lp-do-build`)
- Assumptions:
  - New sub-stages (S2B, S6B, S9B) can be added without renumbering existing stages
  - Business-artifact skills (`draft-*`, `biz-*`) remain cross-cutting execution endpoints

---

## Evidence Audit (Current State)

### Current Skill Inventory (37 skills + 1 shared + 1 temp script)

#### Stage-Bound Skills (currently 8 — directly execute a loop stage)

| Skill | Stage | Produces | Consumes |
|-------|-------|----------|----------|
| `/startup-loop` | S0–S10 orchestrator | Stage transitions, status reports | All stage outputs |
| `/idea-readiness` | S1 | Readiness report, blocker packs | Business plans, people profiles, cards |
| `/idea-forecast` | S3 | 90-day forecast, assumption register | Market intel, intake packet |
| `/idea-generate` | S5 | Prioritized ideas, cards via API | Baseline seed, forecast, constraints |
| `/lp-site-upgrade` | S6 | Upgrade brief, best-of matrix | Platform baseline, reference sites |
| `/lp-do-fact-find` | S7 | Planning-ready brief | Go-items from S5/S6 |
| `/lp-do-plan` | S8 | Confidence-gated plan | Fact-find brief |
| `/lp-do-build` | S9 | Shipped work + validation | Plan doc |

**Gap**: S0, S1B, S2, S2A, S4, S10 have no dedicated skill (template/manual only).

#### Cross-Cutting Skills (currently 29)

| Prefix | Skills | Role |
|--------|--------|------|
| `idea-` (4) | `idea-develop`, `idea-advance`, `idea-scan`, `ideas-go-faster` | Card lifecycle & portfolio |
| `lp-` (7) | `lp-sequence`, `lp-do-replan`, `lp-brand-bootstrap`, `lp-design-spec`, `lp-design-system`, `lp-refactor`, `lp-onboarding-audit` | Loop support & design |
| `lp-guide-` (2) | `lp-guide-audit`, `lp-guide-improve` | Brikette domain |
| `guide-` (1) | `guide-translate` | Brikette domain |
| `biz-` (4) | `biz-update-plan`, `biz-update-people`, `biz-product-brief`, `biz-spreadsheet` | Business strategy & artifacts |
| `ops-` (3) | `ops-ship`, `ops-inbox`, `ops-git-recover` | Operations |
| `review-` (3) | `lp-do-critique`, `lp-do-factcheck`, `review-plan-status` | Quality assurance |
| `meta-` (2) | `meta-reflect`, `meta-user-test` | Process improvement |
| `draft-` (3) | `draft-email`, `draft-whatsapp`, `draft-marketing` | Artifact authoring |

### Classification: What to Do With Each Existing Skill

#### RENAME → `lp-` prefix (1 skill — stage-bound, should be in the loop namespace)

| Current | Proposed | Rationale |
|---------|----------|-----------|
| `site-upgrade` | `lp-site-upgrade` | S6 stage — part of the loop, not standalone |

#### KEEP — `idea-*` family (7 skills — separate system for established businesses)

The `idea-*` skills serve **larger/established businesses** with existing card portfolios. They are NOT part of the startup loop and should NOT be renamed to `lp-`. The startup loop needs its own lighter-weight skills for the equivalent stages (S1, S3, S5). Two systems coexist permanently.

- `idea-readiness`: Readiness gate for established business idea generation. **Not** the startup loop S1 gate.
- `idea-forecast`: 90-day forecast for established businesses with existing data. **Not** the startup loop S3 forecaster.
- `idea-generate`: Cabinet Secretary multi-lens idea generation for established portfolios. **Not** the startup loop S5 prioritizer.
- `ideas-go-faster`: Accelerated variant of `idea-generate`. Same audience.
- `idea-develop`: Converts raw idea → worked card. Cross-cutting card lifecycle utility (used by both systems).
- `idea-advance`: Proposes lane transitions. Cross-cutting board management (used by both systems).
- `idea-scan`: Monitors `docs/business-os/` for changes. Cross-cutting discovery utility (used by both systems).

#### KEEP with justification (29 skills — cross-cutting utilities)

**Loop support (7)** — Already `lp-` prefixed, serve multiple stages:
- `lp-sequence`: Bridge between S8→S9 (topological sort).
- `lp-do-replan`: Loop-back from S9→S8 when confidence drops.
- `lp-brand-bootstrap`: S0/S1 brand language setup.
- `lp-design-spec`: S7→S8 bridge for UI features.
- `lp-design-system`: Token reference, used anywhere.
- `lp-refactor`: Code maintenance, used in S9.
- `lp-onboarding-audit`: Audit utility, used anywhere.

**Domain-specific (3)** — Brikette content operations:
- `lp-guide-audit`: EN guide SEO audit.
- `lp-guide-improve`: Guide improvement workflow.
- `guide-translate`: Locale propagation with structure-first pattern.

**Business strategy (4)** — Maintain business docs, produce artifacts:
- `biz-update-plan`: Plan maintenance from evidence.
- `biz-update-people`: People doc maintenance.
- `biz-product-brief`: Product brief artifact authoring.
- `biz-spreadsheet`: Spreadsheet artifact authoring.

**Operations (3)** — Infrastructure utilities:
- `ops-ship`: Git safety + CI watch. Essential plumbing.
- `ops-inbox`: Customer email triage. Brikette-specific ops.
- `ops-git-recover`: Git recovery. Emergency utility.

**Quality (3)** — Cross-cutting review:
- `lp-do-critique`: Hardnosed critic for any doc.
- `lp-do-factcheck`: Repo-verified fact checking.
- `review-plan-status`: Plan progress reporting.

**Meta (2)** — Process improvement:
- `meta-reflect`: Session learning capture.
- `meta-user-test`: User testing audit.

**Artifact authoring (3)** — Execution endpoints for non-code deliverables:
- `draft-email`: Email artifacts.
- `draft-whatsapp`: WhatsApp messages.
- `draft-marketing`: Marketing assets.

**Orchestrator (1)**:
- `startup-loop`: The meta-orchestrator. Coordinates stages, not a stage itself.

### Naming Convention (Proposed)

| Prefix | Meaning | Examples |
|--------|---------|---------|
| `lp-` | **Loop-bound** — executes or directly supports a specific S0–S10 stage | `lp-readiness`, `lp-do-fact-find`, `lp-do-build` |
| `idea-` | **Established business portfolio** — idea generation, readiness, forecasting for larger businesses. Cross-cutting card lifecycle utilities shared with the loop. | `idea-generate`, `idea-readiness`, `idea-develop` |
| `biz-` | **Business strategy** — maintains business docs and produces strategy artifacts | `biz-update-plan`, `biz-product-brief` |
| `ops-` | **Operations** — infrastructure, shipping, email triage | `ops-ship`, `ops-inbox` |
| `review-` | **Quality** — critique, fact-check, status reporting | `lp-do-critique`, `lp-do-factcheck` |
| `meta-` | **Meta** — process improvement, session reflection | `meta-reflect` |
| `draft-` | **Artifact authoring** — produces business communication artifacts | `draft-email`, `draft-marketing` |
| `guide-` | **Domain: Brikette** — guide content operations | `guide-translate` |

**Rule**: If a skill is called by the loop orchestrator at a specific stage → `lp-`. If it's a utility invoked from within any stage → keep functional prefix.

---

## Assessment: The Three Missing Spines

### A) Offer Spine (What are we selling, to whom, why now?)

**Gap is real.** The loop currently jumps from Market Intelligence (S2) to Forecasting (S3) without crystallizing the offer. Evidence:
- No startup loop skill produces ICP segmentation, positioning, or pricing/packaging artifacts
- S3 forecasting assumes price intent exists but no startup loop skill validates it
- S1 readiness (to be built) should check "Offer Clarity" but doesn't exist yet
- The HEAD/PET forecasts note "needs operational confirmations (price, compatibility)" — this is an offer gap

**Proposed stage**: **S2B: Offer Design** — after market intelligence, before forecasting.

**Minimum viable skills for S2B** (consolidation of user's 5 proposals into 2):

| Proposed | Action | Rationale |
|----------|--------|-----------|
| `/offer-design` | **BUILD as `lp-offer`** | Core: ICP → pain → promise → offer structure → objections → risk reversal. Consolidates the user's `/icp-segmentation`, `/positioning-onepager`, and `/pricing-packaging` into one skill with sections. These are too thin to be standalone skills — they're sections of one artifact. |
| `/icp-segmentation` | **ABSORB into `lp-offer`** | ICP ranking is step 1 of offer design, not a standalone skill |
| `/positioning-onepager` | **ABSORB into `lp-offer`** | Positioning is the output format of offer design |
| `/pricing-packaging` | **ABSORB into `lp-offer`** | Pricing is step 3 of offer design |
| `/value-prop-stress-test` | **ABSORB into `lp-do-critique`** | This is a Munger-style inversion review — `/lp-do-critique` already does this for fact-finds and plans. Add an "offer" schema detection mode. |

**Net new skills: 1** (`lp-offer`)

### B) Distribution Spine (How do we reliably get demand?)

**Gap is real.** The loop has no channel strategy step. Evidence:
- `/lp-site-upgrade` does surface/funnel synthesis but not channel selection
- No skill produces creative briefs, outreach scripts, or SEO content plans
- The `draft-*` skills produce individual artifacts but with no strategic frame
- HEAD/PET forecasts include "channel-specific forecast ranges" but no channel strategy skill feeds them

**Proposed stage**: **S6B: Asset & Channel Prep** — after lp-site-upgrade synthesis, before fact-find.

**Minimum viable skills for S6B** (consolidation of user's 14 proposals into 4):

| Proposed | Action | Rationale |
|----------|--------|-----------|
| `/channel-strategy` | **BUILD as `lp-channels`** | Core: pick 2-3 channels with rationale, costs, constraints, cadence. Also absorbs `/gtm-plan-30d` (a channel strategy with a timeline is a GTM plan). |
| `/gtm-plan-30d` | **ABSORB into `lp-channels`** | A GTM plan is a channel strategy + timeline — same artifact |
| `/creative-briefs` | **ABSORB into `draft-marketing`** | `draft-marketing` already does "channel-specific marketing asset drafts". Extend it with a `brief` mode vs. `final` mode. |
| `/landing-page-copy` | **ABSORB into `draft-marketing`** | Landing page copy is a marketing asset type |
| `/email-sms-sequence` | **ABSORB into `draft-email`** | Email sequences are a delivery mode of `/draft-email`. Extend with `sequence` mode. |
| `/seo-keyword-universe` | **BUILD as `lp-seo`** | Core: keyword set + intent buckets + priority + content clusters. Consolidates the user's 5 SEO skills into one with phases: universe → clusters → briefs → tech audit → snippet optimization. |
| `/seo-content-clusters` | **ABSORB into `lp-seo`** | Phase 2 of SEO skill |
| `/seo-serp-brief` | **ABSORB into `lp-seo`** | Phase 3 of SEO skill |
| `/seo-tech-audit` | **ABSORB into `lp-seo`** | Phase 4 of SEO skill |
| `/seo-snippet-optimization` | **ABSORB into `lp-seo`** | Phase 5 of SEO skill |
| `/outreach-scripts` | **BUILD as `draft-outreach`** | New artifact type: DM/email scripts + follow-ups + objections. Distinct from `draft-email` (marketing) vs. outreach (sales). |
| `/partner-prospecting` | **DEFER** | Premature — no current business has active partnership strategy. Build when first partnership need arises. |
| `/affiliate-program` | **DEFER** | Premature — same reasoning. |
| `/swipe-file-builder` | **DEFER** | Nice-to-have research utility. Low priority vs. core spine. |

**Net new skills: 3** (`lp-channels`, `lp-seo`, `draft-outreach`)

### C) Experiment Spine (How do we learn fast with controlled bets?)

**Gap is real.** S10 is currently manual with no instrumentation. Evidence:
- No startup loop skill produces event taxonomies or experiment designs
- S1 readiness gate (to be built) should check "Measurement plan exists" but no skill creates one
- S1B is manual (GA4/GSC setup) — should be a skill
- Weekly decision loop has no experiment readout format

**Proposed stages**: **S1B upgrade** (make it a skill) + **S9B: Launch QA** + **S10 upgrade** (experiment readout).

**Minimum viable skills** (consolidation of user's 7 proposals into 3):

| Proposed | Action | Rationale |
|----------|--------|-----------|
| `/measurement-bootstrap` | **BUILD as `lp-measure`** | Core: GA4/GSC/pixels + event taxonomy + UTM governance + baseline dashboard. Absorbs `/event-taxonomy` (event taxonomy is step 2 of measurement bootstrap). Replaces manual S1B. |
| `/event-taxonomy` | **ABSORB into `lp-measure`** | Step 2 of measurement bootstrap |
| `/experiment-design` | **BUILD as `lp-experiment`** | Core: hypothesis → variant → metric → sample/timebox → pass/fail criteria. This is the skill that makes S10 a machine instead of a vibes check. |
| `/experiment-readout` | **ABSORB into `lp-experiment`** | Readout is the "complete" phase of the same skill — design → run → readout. Two modes: `design` and `readout`. |

**Net new skills: 2** (`lp-measure`, `lp-experiment`)

### D) UX / App Design Skills

| Proposed | Action | Rationale |
|----------|--------|-----------|
| `/ux-flows` | **ABSORB into `lp-design-spec`** | User journey definition is already part of design spec — the skill maps "feature requirement → design spec". Extend with explicit flow section. |
| `/wireframe-spec` | **ABSORB into `lp-design-spec`** | Low-fi layout spec is what `lp-design-spec` already produces. |
| `/ui-component-inventory` | **ABSORB into `lp-design-spec`** | Component identification is step 3 of design spec. |
| `/design-qa` | **BUILD as `lp-design-qa`** | Distinct from design spec — this is a post-build QA checklist. Currently missing. |
| `/cro-diagnostics` | **ABSORB into `lp-experiment`** | CRO is an experiment type — funnel leak diagnosis → hypothesis → test. |

**Net new skills: 1** (`lp-design-qa`)

### E) Ops & Compliance Skills

| Proposed | Action | Rationale |
|----------|--------|-----------|
| `/legal-compliance-checklist` | **BUILD as `lp-launch-qa`** | Core: conversion QA + SEO tech checks + performance budget + compliance (GDPR, cookie, terms). Consolidates the user's S9B launch QA concept with legal compliance into one pre-launch gate skill. |
| `/support-playbook` | **DEFER** | Premature — no structured support system yet. Build when first support escalation pattern emerges. |
| `/fulfillment-ops-plan` | **DEFER** | Premature for HEAD/PET (pre-launch). Relevant for BRIK but already handled ad-hoc. |

**Net new skills: 1** (`lp-launch-qa`)

### F) Competitive Intelligence Skills

| Proposed | Action | Rationale |
|----------|--------|-----------|
| `/competitor-map` | **ABSORB into S2 workflow** | Competitor mapping is already part of market intelligence (S2). The Deep Research prompt already produces competitor maps. No new skill needed — improve the S2 prompt template. |
| `/pricing-monitor` | **DEFER** | Recurring monitoring is a future ops concern. No infrastructure for automated monitoring yet. |
| `/review-mining` | **ABSORB into `lp-offer`** | Review mining for pains/objections is part of offer design research. |
| `/swipe-file-builder` | **DEFER** | Nice-to-have. Low priority. |

**Net new skills: 0**

---

## Consolidated Proposal: What Changes

### Summary Scorecard

| Category | User Proposed | Build Now | Absorb | Defer | Net New Skills |
|----------|--------------|-----------|--------|-------|---------------|
| Existing rename | — | 1 | 0 | — | 0 (1 rename) |
| Startup loop stage skills (S1/S3/S5) | — | 3 | 0 | 0 | **3** (new, not renames) |
| Offer spine (S2B) | 5 | 1 | 4 | 0 | **1** |
| Distribution spine (S6B) | 14 | 3 | 8 | 3 | **3** |
| Experiment spine (S1B/S9B/S10) | 7 | 2 | 2 | 0 | **2** |
| UX/Design | 5 | 1 | 4 | 0 | **1** |
| Ops/Compliance | 3 | 1 | 0 | 2 | **1** |
| Competitive Intelligence | 4 | 0 | 2 | 2 | **0** |
| **Total** | **~40** | **12** | **20** | **7** | **11 new + 1 rename** |

### The 11 New Skills to Build

#### Startup Loop Stage Skills (3 — lightweight replacements for idea-* at S1/S3/S5)

| # | Skill | Stage | Purpose | How it differs from idea-* equivalent |
|---|-------|-------|---------|--------------------------------------|
| 1 | `lp-readiness` | S1 | Startup preflight gate: offer clarity, distribution feasibility, measurement plan | `idea-readiness` checks 7 gates for established portfolios (plan freshness, code-to-plan traceability, etc.). `lp-readiness` is startup-specific: does the offer exist? Is there a channel hypothesis? Can we measure? |
| 2 | `lp-forecast` | S3 | Startup 90-day forecast from market intel + offer hypothesis | `idea-forecast` assumes operational history exists. `lp-forecast` works from zero — market signals, competitor pricing, channel benchmarks only. |
| 3 | `lp-prioritize` | S5 | Startup prioritization: rank go-items by effort/impact/learning-value | `idea-generate` is a 7-stage Cabinet Secretary pipeline for large portfolios. `lp-prioritize` is a simple rank-and-pick for a startup's short list of candidates. |

#### Spine Skills (8 — fill the Offer, Distribution, and Experiment gaps)

| # | Skill | Stage | Spine | Produces |
|---|-------|-------|-------|----------|
| 4 | `lp-offer` | S2B | Offer | ICP segmentation, positioning one-pager, pricing/packaging, objection map |
| 5 | `lp-channels` | S6B | Distribution | Channel strategy (2-3 channels), cadence, costs, 30-day GTM plan |
| 6 | `lp-seo` | S6B | Distribution | Keyword universe, content clusters, SERP briefs, tech audit, snippet optimization (phased) |
| 7 | `draft-outreach` | S6B | Distribution | DM/email outreach scripts, follow-ups, objection handling |
| 8 | `lp-measure` | S1B | Experiment | GA4/GSC/pixels, event taxonomy, UTM governance, baseline dashboard |
| 9 | `lp-experiment` | S8→S10 | Experiment | Experiment design (hypothesis → variant → metric) + weekly readout |
| 10 | `lp-design-qa` | S9B | UX | UI regression checklist, screenshot-to-issue format, a11y checks |
| 11 | `lp-launch-qa` | S9B | Ops | Pre-launch gate: conversion QA, SEO tech, perf budget, legal compliance |

### The 1 Rename

| Current | New | Stage |
|---------|-----|-------|
| `site-upgrade` | `lp-site-upgrade` | S6 |

### The idea-* Family — Untouched (separate system)

| Skill | Stays as-is | Audience |
|-------|------------|----------|
| `idea-readiness` | Yes | Established businesses |
| `idea-forecast` | Yes | Established businesses |
| `idea-generate` | Yes | Established businesses |
| `ideas-go-faster` | Yes | Established businesses (accelerated variant) |
| `idea-develop` | Yes | Cross-cutting (both systems) |
| `idea-advance` | Yes | Cross-cutting (both systems) |
| `idea-scan` | Yes | Cross-cutting (both systems) |

### The 3 Existing Skill Extensions (no new dirs — extend existing)

| Skill | Extension | Why |
|-------|-----------|-----|
| `lp-do-critique` | Add "offer" schema detection mode | Absorbs `/value-prop-stress-test` |
| `draft-marketing` | Add `brief` mode (creative brief) + landing page copy type | Absorbs `/creative-briefs` and `/landing-page-copy` |
| `draft-email` | Add `sequence` mode (welcome, abandon, winback) | Absorbs `/email-sms-sequence` |

### The 7 Deferred Skills

| Skill | Reason | Trigger to revisit |
|-------|--------|-------------------|
| `/partner-prospecting` | No active partnership strategy | First partnership conversation |
| `/affiliate-program` | No affiliate infrastructure | First affiliate need |
| `/swipe-file-builder` | Nice-to-have research tool | When creative volume justifies |
| `/pricing-monitor` | No automated monitoring infra | When 3+ competitors tracked |
| `/support-playbook` | No structured support system | First support escalation pattern |
| `/fulfillment-ops-plan` | Pre-launch for HEAD/PET | Post-launch operations |
| (SEO separate skills) | Consolidated into `lp-seo` | If phases prove too complex for one skill |

---

## Revised S0–S10 v2 Stage Map (with skills)

| Stage | Name | Skill(s) | Status |
|-------|------|----------|--------|
| S0 | Intake | `/startup-loop start` | Exists (template) |
| S1 | Readiness Preflight | **`/lp-readiness`** (new — startup-specific) | **BUILD** |
| S1B | Measurement Bootstrap | **`/lp-measure`** (new) | **BUILD** |
| S2 | Market Intelligence | Deep Research prompt | Exists (template) |
| S2A | Historical Baseline | Manual + scripts | Exists (template) |
| **S2B** | **Offer Design** | **`/lp-offer`** (new) | **BUILD** |
| S3 | Forecasting | **`/lp-forecast`** (new — startup-specific) | **BUILD** |
| S4 | Baseline Merge | Manual | Exists (template) |
| S5 | Prioritization | **`/lp-prioritize`** (new — startup-specific) | **BUILD** |
| S6 | Surface & Funnel Synthesis | **`/lp-site-upgrade`** (renamed) | Exists → rename |
| **S6B** | **Asset & Channel Prep** | **`/lp-channels`** + **`/lp-seo`** + `draft-*` + **`draft-outreach`** | **BUILD** |
| S7 | Fact-Find | `/lp-do-fact-find` | Exists |
| S8 | Plan + Sequence | `/lp-do-plan` + `/lp-sequence` | Exists |
| S9 | Build | `/lp-do-build` | Exists |
| **S9B** | **Launch QA** | **`/lp-launch-qa`** + **`/lp-design-qa`** | **BUILD** |
| S10 | Experiment & Decision Loop | **`/lp-experiment`** (new) | **BUILD** |

---

## Hypothesis & Validation Landscape

### Key Hypotheses

| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|-----------|-----------|-------------------|-------------------|
| H1 | Consolidating ~40 proposed skills into 11 new + 1 rename covers all three spine gaps without loss | All 11 skills built | Low (review after first full loop run) | 2 weeks |
| H2 | Startup-specific `lp-readiness`/`lp-forecast`/`lp-prioritize` can be meaningfully lighter than the idea-* equivalents | First run of each on HEAD | Low (run them) | 1 session each |
| H3 | `lp-offer` as a single skill (vs. 4 separate) produces sufficiently detailed output | First offer design run on HEAD | Low (run it) | 1 session |
| H4 | `lp-seo` as a phased single skill (vs. 5 separate) is manageable | First SEO run on BRIK | Low (run it) | 1 session |
| H5 | The 7 deferred skills are genuinely premature (not blocking launch) | HEAD/PET launch attempt | Zero (observe) | 30 days |
| H6 | Two parallel systems (idea-* + lp-*) don't cause confusion about which to use | Both systems running | Zero (observe) | 30 days |

### Existing Signal Coverage

| Hypothesis | Evidence available | Confidence |
|-----------|-------------------|------------|
| H1 | User's own analysis identifies the gaps; agent audit confirms | Medium |
| H2 | idea-readiness has 7 complex gates; startup needs ~3 simpler ones — clear differentiation | High |
| H3 | No prior offer design artifact exists — untested | Low |
| H4 | `lp-guide-audit` already runs multi-phase within one skill (audit → fix → verify) | Medium |
| H5 | HEAD/PET forecasts don't mention partner/affiliate/support blockers | Medium |
| H6 | Prefix convention (`idea-` vs `lp-`) is self-documenting; orchestrator routes correctly | Medium |

### Recommended Validation Approach

- **Quick probes**: H2 (rename blast radius — run grep), H3 (build `lp-offer`, run on HEAD once)
- **Structured tests**: H1 (run full loop with new skills on one business, compare output coverage)
- **Deferred validation**: H5 (observe during first 30 days post-launch)

---

## Questions

### Resolved

- Q: Should ALL skills get `lp-` prefix?
  - A: No. Only stage-bound skills get `lp-`. Cross-cutting utilities keep their functional prefix (`biz-`, `ops-`, `review-`, `meta-`, `draft-`, `idea-`, `guide-`).
  - Evidence: The naming convention serves discoverability — `lp-` means "I'm called by the loop at a specific stage", other prefixes mean "I'm a utility you can invoke from anywhere."

- Q: Should the `idea-*` skills be incorporated into the startup loop?
  - A: **No.** The `idea-*` family serves larger/established businesses, not startups. The startup loop needs its own lighter-weight skills for S1/S3/S5. Two systems coexist permanently.
  - Evidence: User decision — the startup loop is specifically for startups; `idea-*` skills assume existing portfolios, operational history, and complex gate structures that don't apply to early-stage ventures.

- Q: What happens to `idea-readiness`, `idea-forecast`, `idea-generate`?
  - A: **Keep as-is.** They remain in the `idea-*` namespace, serving established businesses. New `lp-readiness`, `lp-forecast`, `lp-prioritize` are built as startup-specific equivalents.
  - Evidence: User decision.

- Q: Is `ideas-go-faster` a duplicate?
  - A: Yes. Identical SKILL.md content to `idea-generate`. This is an `idea-*` concern — not part of the loop restructuring.
  - Evidence: Agent audit confirmed identical content in both SKILL.md files.

- Q: Should the Brikette guide skills (`lp-guide-audit`, `lp-guide-improve`, `guide-translate`) be restructured?
  - A: Keep as-is. They're domain-specific content operations, not loop stages. They're invoked from within S9 when the build task is guide content.
  - Evidence: These skills have a proven structure-first workflow with 100% success rate (Batch 3 evidence in MEMORY.md).

### Open (User Input Needed)

- Q: **Build priority order — which spine first?**
  - Why it matters: Determines which new skills are built first. The user's proposal suggests Offer → Distribution → Experiment, which matches the loop stage order. But if HEAD/PET are closest to launch, Experiment (measurement) might be more urgent.
  - Decision owner: Pete
  - Recommended: Stage-order build (S1 → S1B → S2B → S3 → S5 → S6 → S6B → S9B → S10). Rationale: each stage skill feeds the next; building out-of-order means no real validation until the chain is complete. The 3 startup stage skills (lp-readiness, lp-forecast, lp-prioritize) come first since they complete the core loop spine.

- Q: **What happens to `startup-loop` orchestrator — does it get renamed to `lp-startup-loop`?**
  - Why it matters: It's the meta-orchestrator, not a stage. Renaming it to `lp-` would be technically correct (it IS the loop) but might confuse it with stage-bound skills.
  - Decision owner: Pete
  - Default assumption: Keep as `startup-loop` (it's the loop itself, not a step in the loop)

---

## Confidence Inputs (for /lp-do-plan)

- **Implementation:** 80%
  - High: 1 rename is mechanical (dir rename + grep/sed refs). New skill SKILL.md files follow established patterns. Well-understood file structure.
  - Gap: 11 new skills is significant authoring work. The 3 startup stage skills (`lp-readiness`, `lp-forecast`, `lp-prioritize`) need careful design to be meaningfully different from their `idea-*` counterparts — not just copies. The 8 spine skills have no prior template. Rises to 90%+ after first 2-3 skills establish the pattern.

- **Approach:** 82%
  - High: consolidation rationale is evidence-based. The "11 not 40" approach avoids skill bloat. Two-system coexistence is clean (prefix-based routing). Naming convention is self-documenting.
  - Gap: The boundary between `idea-*` and `lp-*` for the 3 shared skills (`idea-develop`, `idea-advance`, `idea-scan`) needs clarity — they serve both systems. The phased approach within single skills (`lp-seo` phases, `lp-experiment` design/readout modes) is untested.

- **Impact:** 90%
  - High: blast radius is well-scoped — skill dirs, SKILL.md files, and reference files. No runtime code changes. No test infrastructure affected. The `idea-*` family is untouched.
  - Only 1 rename (`site-upgrade` → `lp-site-upgrade`) affects existing references.

- **Delivery-Readiness:** 82%
  - High: all deliverables are markdown files (SKILL.md) and directory operations. No external dependencies.
  - Gap: Need to update the system prompt skill registration, the startup-loop orchestrator, and verify the discovery path works. The startup-loop orchestrator needs significant updates to route to new `lp-*` stage skills.

- **Testability:** 70%
  - Medium: skill quality is validated by running the skill on a real business (HEAD/PET/BRIK), not by unit tests. No automated test for "does this skill produce a good artifact?"
  - Lower than before because 11 new skills × 0 automated tests = high manual validation burden.
  - Improvement: Add a validation checklist to each new skill's SKILL.md (quality checks section, following the pattern in `lp-do-fact-find`). Consider a "skill smoke test" script that validates output structure.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Startup `lp-*` skills are too similar to `idea-*` counterparts (confusing duplication) | Medium | Medium | Each `lp-*` stage skill must document HOW it differs from the `idea-*` equivalent in its SKILL.md header. Clear routing in `startup-loop` orchestrator. |
| New skills are too broad (e.g., `lp-seo` tries to do too much in one invocation) | Medium | Low | Each new skill gets explicit phase modes; can split later if needed |
| 11 new skills is too many to build before the next loop run | Medium | Medium | Prioritize by stage order. The 3 startup stage skills + `lp-offer` complete the core spine. The rest can be built incrementally as stages are reached. |
| Deferred skills turn out to be needed sooner (e.g., partner prospecting for BRIK) | Low | Low | Deferred list is documented with triggers — easy to promote when needed |
| Skill count grows from 37 → 48 (11 new + 1 rename) | Low | Low | Net increase is justified: 3 fill empty stages, 8 fill the three missing spines. Cross-cutting utilities are untouched. |
| `lp-offer` is a new concept — no template/pattern to follow | Medium | Medium | Base it on the existing `lp-do-fact-find` brief pattern but for offer artifacts. Run on HEAD first as a probe. |
| Shared skills (`idea-develop`, `idea-advance`, `idea-scan`) need to work with both systems | Low | Medium | These are already cross-cutting. No changes needed — they operate on Business OS cards regardless of which system created them. |

---

## Planning Constraints & Notes

- Must-follow patterns:
  - New SKILL.md files follow the established format (see any existing skill)
  - Each new skill must have a Quality Checks section
  - Each startup stage skill must have a "Differs from idea-* equivalent" section
  - The 1 rename must be atomic (dir rename + all ref updates in one commit)
  - `idea-*` skills are NOT modified as part of this work
- Rollout expectations:
  - Phase 1: Rename + startup stage skills (complete the core loop spine first)
  - Phase 2-5: Spine skills by stage order (Offer → Experiment → Distribution → Launch QA)
  - Phase 6: Extend existing skills (`lp-do-critique`, `draft-marketing`, `draft-email`)
  - Phase 7: Loop integration (orchestrator + routing + discovery)
- Observability:
  - After each new skill is built, run it once on a real business and capture the output quality
  - Verify no confusion between `idea-*` and `lp-*` systems in practice

---

## Suggested Task Seeds (Non-binding)

### Phase 1: Rename + Core Loop Spine (complete the stage coverage)
1. Rename `site-upgrade` → `lp-site-upgrade` + update all refs
2. Build `lp-readiness` (S1) — startup-specific preflight gate
3. Build `lp-forecast` (S3) — startup-specific 90-day forecaster
4. Build `lp-prioritize` (S5) — startup-specific go-item ranking

### Phase 2: Offer Spine (S2B)
5. Build `lp-offer` (S2B) — ICP, positioning, pricing, objections

### Phase 3: Experiment Spine (S1B + S10)
6. Build `lp-measure` (S1B) — measurement bootstrap
7. Build `lp-experiment` (S10) — experiment design + readout

### Phase 4: Distribution Spine (S6B)
8. Build `lp-channels` (S6B) — channel strategy + GTM
9. Build `lp-seo` (S6B) — phased SEO skill
10. Build `draft-outreach` (S6B) — outreach scripts

### Phase 5: Launch QA (S9B)
11. Build `lp-launch-qa` (S9B) — pre-launch gate
12. Build `lp-design-qa` (S9B) — UI regression QA

### Phase 6: Extensions
13. Extend `lp-do-critique` with "offer" schema detection
14. Extend `draft-marketing` with `brief` and `landing-page-copy` modes
15. Extend `draft-email` with `sequence` mode

### Phase 7: Loop Integration
16. Update `/startup-loop` orchestrator to reference new `lp-*` stage skills
17. Update `/lp-do-fact-find` progressive routing to include new skills
18. Rebuild discovery index and validate end-to-end flow

---

## Execution Routing Packet

- **Primary execution skill:** `/lp-do-build` (orchestrator mode for multi-deliverable)
- **Supporting skills:** `/meta-reflect` (post-completion learning capture)
- **Deliverable acceptance package:**
  - 1 rename (`site-upgrade` → `lp-site-upgrade`) complete with zero broken references
  - All 11 new skills have SKILL.md with Quality Checks section
  - Each startup stage skill (`lp-readiness`, `lp-forecast`, `lp-prioritize`) documents how it differs from its `idea-*` counterpart
  - All 3 extensions documented in respective SKILL.md files
  - `/startup-loop` orchestrator updated to reference new `lp-*` stage skills
  - One full loop run on a real business validates end-to-end flow
- **Post-delivery measurement plan:**
  - Run `/startup-loop status` for each business — all stages should show skill coverage
  - Run each new skill once — output passes its own quality checks
  - Verify `idea-*` family still works independently (no regressions from coexistence)

---

## Planning Readiness

- **Status: Ready-for-planning**
- Blocking items: None — the 3 open questions are preference decisions, not blockers (defaults are stated)
- Recommended next step: Answer the open questions, then proceed to `/lp-do-plan`
