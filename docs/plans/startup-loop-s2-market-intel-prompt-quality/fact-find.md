---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform / Business-OS
Workstream: Engineering
Created: 2026-02-15
Last-updated: 2026-02-15
Feature-Slug: startup-loop-s2-market-intel-prompt-quality
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: /lp-build
Supporting-Skills: /lp-plan
Related-Plan: docs/plans/startup-loop-s2-market-intel-prompt-quality/plan.md
Business-OS-Integration: on
Business-Unit: BOS
Card-ID:
---

# Startup Loop S2 Market Intelligence Prompt Quality — Fact-Find Brief

## Scope

### Summary
Improve how S2 (Market Intelligence) Deep Research prompts are generated so they are reliably decision-grade for the actual business category (especially `website-live` hospitality/direct-booking businesses like BRIK).

This work is prompted by quality issues in the current auto-generated prompt (category mismatch, coverage trap, missing business-model classification, unusable competitor benchmarking, and baseline bloat) and by a concrete exemplar prompt that demonstrates the target bar.

### Goals
- Make the generated S2 prompt category-correct (role framing + language + deliverables) for BRIK-style businesses.
- Make the **Delta Questions** the organizing spine of S2 outputs (root causes, fastest levers, 14-day stop/continue/start).
- Require explicit **business model classification** (A/B/C) before unit economics, competitors, and channel advice.
- Force **standardized competitor benchmarking** (minimum N, selection logic, fixed scenarios) so comparisons are actionable.
- Operationalize `website-live` mode: require a live funnel audit, instrumentation gaps, and a measurement repair plan.
- Replace baseline “bloat” with an **internal baseline header + computed deltas + pointers** to full artifacts (without contaminating the prompt with nested frontmatter blocks).
- Add a **Decision-grade quality bar** that the research output must satisfy.

### Non-goals
- Building new measurement connectors (`measure_*`) or automating competitive pricing scrapes.
- Running Deep Research itself or producing the S2 pack content (this is prompt-generation infrastructure).
- Fixing S6 site-upgrade prompt quality (adjacent; should be a follow-on scope).

### Constraints & Assumptions
- Constraints:
  - Must work without hand-editing per-run prompts (automation-first), but allow a lightweight override when heuristics fail.
  - Prompt must remain within practical Deep Research context limits; prefer two-pass prompts over one mega prompt when needed.
  - Must remain compatible with current Business OS layout under `docs/business-os/`.
- Assumptions:
  - Business category + model can be inferred from `docs/business-os/startup-baselines/<BIZ>-intake-packet.user.md` plus strategy docs with reasonable heuristics.

## Evidence Audit (Current State)

### Entry Points
- Current generator:
  - `scripts/src/startup-loop/s2-market-intelligence-handoff.ts`
- Current generic template:
  - `docs/business-os/market-research/_templates/deep-research-market-intelligence-prompt.md`
- Example output showing issues (BRIK):
  - `docs/business-os/market-research/BRIK/2026-02-15-deep-research-market-intelligence-prompt.user.md`

### Key Observations (Why Current Output Degrades)
- **Role/category mismatch is hard-coded**:
  - The generator currently frames the analyst role as “venture studio launching B2C consumer-product businesses” in the prompt body (see `scripts/src/startup-loop/s2-market-intelligence-handoff.ts`).
  - This mismatches BRIK’s reality: a `website-live` hospitality direct-booking + OTA distribution business with property constraints (11 rooms) and strong seasonality.
- **Coverage trap**:
  - Template mandates 10 research requirements + A–Q structure. This strongly biases toward shallow compliance.
- **Baseline bloat + contamination**:
  - The generator embeds a very large monthly table.
  - It also embeds other markdown content verbatim (e.g., Cloudflare data notes), including YAML frontmatter blocks, which pollute the prompt’s semantic structure.
- **Website-live isn’t operationalized**:
  - The prompt doesn’t require a live funnel audit against specific URLs, nor does it force measurement repair as a P0 deliverable.
- **Competitor benchmarking under-specified**:
  - The prompt asks for competitor maps and “pricing/offer benchmarks” but doesn’t standardize scenarios, dates, or selection logic.

## Findings (Mapped To The Reported Issues)

### FND-01 (P0): Prompt profile is not business-category aware
**Impact:** Deep Research defaults to physical product mental models and generic ecommerce heuristics.

**Recommended fix:** Introduce category-specific prompt profiles (at minimum: `hospitality_direct_booking_ota` vs `b2c_dtc_product`).

### FND-02 (P0): No explicit business model classification gate
**Impact:** Unit economics, CAC ceilings, and funnel expectations become incoherent.

**Recommended fix:** Require a first step in the prompt: classify model A/B/C based only on internal evidence, and force downstream sections to align with the chosen model.

### FND-03 (P0): Decision spine is present but not dominant
**Impact:** The three core questions (YoY softness, fastest levers, 14-day plan) are diluted by breadth requirements.

**Recommended fix:** Move Delta Questions to the top and make them the organizing structure; every section must tie back to Q1–Q3.

### FND-04 (P0): Competitor and pricing research is not standardized
**Impact:** Outputs become anecdotal and non-comparable.

**Recommended fix:** Require minimum competitor counts + explicit selection logic + standardized booking scenarios (S1/S2/S3), with “blocked” handling.

### FND-05 (P0): Website-live mode lacks required operational outputs
**Impact:** Recommendations aren’t anchored to the live funnel, and measurement gaps persist.

**Recommended fix:** Require:
- live funnel audit (explicit URLs)
- conversion friction list
- prioritized P0/P1/P2 checklist with impact/effort/metric
- measurement repair plan (required events + UTMs + reconciliation to exported net values)

### FND-06 (P1): Baseline injection is too long and structurally messy
**Impact:** The model spends tokens parsing tables/frontmatter rather than reasoning.

**Recommended fix:** Replace baseline injection with:
- a compact baseline header (domain/property, model hypothesis, inventory constraints, channel mix)
- computed delta summary (YoY decomposition, top months contributing)
- a short table slice (e.g., last 12 complete months) + explicit pointers to full CSVs/docs
- strict removal of nested YAML frontmatter when embedding referenced docs

## Recommended Implementation Approach (Planning Inputs)

### A) Add “Prompt Profiles” (category-aware research prompts)
- Create profile templates under `docs/business-os/market-research/_templates/`:
  - `deep-research-market-intelligence-hospitality-direct-booking-prompt.md` (BRIK-style)
  - keep the existing generic prompt as a fallback
- The hospitality profile should follow the exemplar structure:
  - specialist role framing (EU hospitality direct booking + OTA distribution)
  - business model classification as Step 0
  - standardized competitor/pricing methodology
  - website-live funnel + measurement repair as P0

### B) Improve automated profile selection with an explicit override
- Add `inferResearchProfile(biz)` in the generator using repo evidence:
  - intake packet core offer + keyword heuristics (e.g., “hostel”, “booking”, “rooms”, “Octorate”)
  - strategy plan content (mentions “bookings”, “direct share”, “OTA”)
- Allow an override file:
  - `docs/business-os/market-research/<BIZ>/research-profile.user.md` (Status: Active, declares profile id)

### C) Refactor baseline injection into a “Baseline Header + Delta Summary + Pointers”
- Stop embedding entire referenced markdown docs verbatim.
- Extract only the needed machine-readable facts:
  - YoY decomposition (bookings, net per booking, direct share)
  - top decline months
  - latest measurement snapshot (GA4 Data API) in a small table
  - operational constraints (inventory count)
- Include pointers to:
  - `docs/business-os/strategy/<BIZ>/data/net_value_by_month.csv`
  - `docs/business-os/strategy/<BIZ>/data/bookings_by_month.csv`
  - `docs/business-os/strategy/<BIZ>/data/cloudflare_monthly_proxies.csv` (optional)

### D) Add a “Decision-grade bar” for S2
Borrow the pattern used in the site-upgrade prompt template:
- minimum sources
- minimum competitor evidence counts
- minimum number of P0 checklist items tied to metrics
- pricing benchmark completion thresholds (or explicit “blocked” reporting)

### E) Two-pass mode (if prompt still yields shallow outputs)
- Pass 1: internal diagnosis + measurement repair + 14-day plan.
- Pass 2: external competitor + demand + pricing scenarios.
- Synthesis: combine into the pack.

## Task Seeds For `/lp-plan`
1. Add hospitality S2 prompt template + update output section names to booking/ops language.
2. Update generator (`scripts/src/startup-loop/s2-market-intelligence-handoff.ts`) to:
   - select template by inferred profile
   - generate the exemplar-style hospitality prompt
   - generate baseline header + deltas + pointers (no nested frontmatter)
   - include explicit live URLs (derived from measurement verification doc) when available.
3. Add tests:
   - profile inference for BRIK
   - snapshot test asserting the hospitality prompt contains classification gate + standardized scenarios + decision-grade bar.
4. (Optional follow-on) Apply same profile system to S6 upgrade prompt templates (currently also B2C consumer-product framed).

## Open Questions (User Input Needed)
_None required to start planning._

Optional (improves generality):
- Do you want the profile override to live under `docs/business-os/market-research/<BIZ>/` (closest to S2), or under `docs/business-os/strategy/<BIZ>/` (more canonical business config)? Default recommendation: market-research.

## Planning Readiness
**Ready-for-planning.** Scope is clear, evidence anchors exist, and the work can be decomposed into low-risk incremental changes with tests.
