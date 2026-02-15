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

This work is prompted by quality issues in the current auto-generated prompt (category mismatch, coverage trap, missing business-model classification, unusable competitor benchmarking, website-live not operationalized, baseline bloat/YAML contamination) and by a concrete exemplar prompt that demonstrates the target bar.

### Goals
- Make the generated S2 prompt category-correct (role framing + language + deliverables) for BRIK-style businesses.
- Make the 3 Delta Questions the organizing spine of S2 outputs (root causes, fastest levers, 14-day stop/continue/start).
- Require explicit business model classification (A/B/C) before unit economics, competitors, and channel advice, with explicit “ambiguous/hybrid” handling.
- Force standardized competitor benchmarking (minimum N, selection logic, reproducible scenarios with date and comparability rules) so comparisons are actionable.
- Operationalize `website-live` mode: require a live funnel audit, instrumentation gaps, and a measurement repair plan.
- Replace baseline bloat with an internal baseline header + computed deltas + compact month slice embedded in the prompt, plus pointers to full artifacts for operator convenience.
- Define “decision-grade” as acceptance criteria (prompt correctness + outcome usefulness) and add a minimal evaluation loop to detect regressions.

### Non-goals
- Building new measurement connectors (`measure_*`) or automating competitive pricing scrapes.
- Running Deep Research itself or producing the S2 pack content (this is prompt-generation infrastructure).
- Fixing S6 site-upgrade prompt quality (adjacent; should be follow-on scope).

### Constraints & Assumptions
- Constraints:
  - Must work without hand-editing per-run prompts (automation-first), but allow a lightweight override when heuristics fail.
  - Prompt must remain within practical Deep Research context limits; the generator must deterministically choose two-pass prompts when needed.
  - Must remain compatible with current Business OS layout under `docs/business-os/`.
  - Deep Research may not have repo access; prompts must not rely on file pointers for internal evidence.
- Assumptions:
  - Business category can be inferred from `docs/business-os/startup-baselines/<BIZ>-intake-packet.user.md` plus strategy docs with reasonable heuristics.

## Evidence Audit (Current State)

### Entry Points
- Current generator:
  - `scripts/src/startup-loop/s2-market-intelligence-handoff.ts`
- Current generic template:
  - `docs/business-os/market-research/_templates/deep-research-market-intelligence-prompt.md`
- Example output showing issues (BRIK):
  - `docs/business-os/market-research/BRIK/2026-02-15-deep-research-market-intelligence-prompt.user.md`

### Key Observations (Why Current Output Degrades)
- Role/category mismatch is hard-coded in the prompt body, causing physical-product thinking.
- Coverage trap: template mandates many requirements + rigid A–Q outputs, incentivizing shallow compliance.
- Baseline bloat and contamination: current generator embeds large tables and verbatim markdown blocks (including YAML), polluting structure.
- Website-live isn’t operationalized: no explicit live URLs, funnel audit, or measurement repair as a required deliverable.
- Competitor benchmarking is under-specified: no standardized scenarios, dates, or comparability rules.

Note: pointers to repo artifacts are only useful if Deep Research can read them. We must treat pointers as operator convenience and embed the internal evidence the model needs (computed deltas + compact month slice + measurement snapshot).

## Findings And Recommended Fixes

### FND-01 (P0): Prompt profile is not business-category aware
**Impact:** Deep Research defaults to generic ecommerce/physical product patterns.

**Fix:** Introduce category-specific S2 prompt profiles (at minimum: `hospitality_direct_booking_ota` vs `b2c_dtc_product` fallback).

### FND-02 (P0): No explicit business model classification gate
**Impact:** Unit economics and benchmarks become incoherent.

**Fix:** Require a first step in the prompt: classify model A/B/C using internal evidence only. If ambiguous, require “resolve ambiguity in 14 days” tests and proceed with 2–3 model-specific ranges.

### FND-03 (P0): Decision spine exists but isn’t dominant
**Impact:** The 3 core questions (YoY softness, fastest levers, 14-day plan) get diluted.

**Fix:** Move Delta Questions to the top and make them the organizing spine. Require every major section to cite which Delta question(s) it supports.

### FND-04 (P0): Competitor/pricing research is not reproducible
**Impact:** Benchmarks become anecdotal and non-comparable.

**Fix:** Require minimum competitor counts + explicit selection logic + standardized scenarios with date selection and comparability rules.

### FND-05 (P0): Website-live mode lacks required operational outputs
**Impact:** Recommendations aren’t anchored to the live funnel and measurement gaps persist.

**Fix:** Require:
- live funnel audit (explicit URLs and steps)
- friction inventory
- prioritized P0/P1/P2 checklist with impact/effort/metric per item
- measurement repair plan (events, UTMs, reconciliation to net booking value exports)

### FND-06 (P1): Baseline injection is too long and structurally messy
**Impact:** The model burns tokens parsing noise.

**Fix:** Implement a baseline assembler that emits a single delimited `BEGIN_INTERNAL_BASELINES` block containing:
- compact header (domain/property, inventory constraint, channel mix, measurement status)
- computed deltas (YoY decomposition + top decline months)
- compact month slice (default last 12 complete months; allow 18 when seasonality requires)
- measurement snapshot table

Hard rule: do not embed other markdown docs verbatim; never include nested YAML/frontmatter blocks inside the Deep Research prompt text.

### FND-07 (P0): “Decision-grade” needs acceptance criteria + an evaluation loop
**Impact:** Quotas prevent underproduction but don’t guarantee decision usefulness; without an eval loop we can’t prove improvement or detect regressions.

**Fix:** Define acceptance criteria at two layers.

A) Prompt correctness (static; CI-testable)
- correct profile selected (or override honored)
- Delta Questions at top
- business model classification gate included (with ambiguity/hybrid handling)
- standardized competitor set + benchmarking scenarios included (with date + comparability rules)
- website-live outputs included (explicit URL, funnel audit, measurement repair plan)
- no nested YAML/frontmatter contamination inside the Deep Research text block
- token/length budget respected or generator emits deterministic two-pass prompts

B) Outcome usefulness (dynamic; manual scoring harness initially)
- Add a small rubric (0/1/2) for 3–5 golden businesses (include BRIK) scored once per release:
  - prompt forces coherent business model classification
  - prompt forces comparable competitor pricing evidence
  - prompt forces a measurement repair plan before scaling channels
  - prompt ties every section back to Delta Q1–Q3

### FND-08 (P0): Profile taxonomy must be registry-backed to avoid repeated refactors
**Impact:** Two hard-coded profiles will be brittle.

**Fix:** Implement a small profile registry:
- `profile_id`
- `matchers` (signals/keywords)
- `required_fields` (if missing, prompt must return `Status: BLOCKED`)
- `prompt_template_path`
- `two_pass_supported: boolean`
- `baseline_extractor` (function)

Ship only 2 profiles now, but make adding a 3rd profile a small change.

### FND-09 (P0): Competitor benchmarking needs explicit date + inventory rules
**Impact:** Even scenario benchmarking stays non-comparable without date selection and sold-out handling.

**Fix:** Hospitality template must specify:
- Date selection rules relative to `as-of` (choose explicit calendar dates, not “peak season”):
  - Peak: a specific Fri–Sun weekend in Jul/Aug in the next season
  - Shoulder: a specific Tue–Thu in May/Sep
  - Off-season: a specific Tue–Thu in Jan/Feb
- Comparability rules:
  - compare “cheapest available refundable” if exists else “cheapest available”
  - always capture refundable yes/no + cancellation cutoff + deposit/pay-later + fee/tax transparency
  - if sold out: mark “sold out” but still capture policies/fees if visible

## Recommended Implementation Approach (Planning Inputs)

### A) Add prompt profiles as templates + registry
- Create a hospitality S2 template (BRIK-style) under `docs/business-os/market-research/_templates/`.
- Keep the generic template as fallback.
- Add profile registry in the generator (or adjacent module) so adding new business types is a config change, not a refactor.

### B) Separate profile selection (generator) from business model classification (prompt)
- Generator selects the template.
- Prompt forces Deep Research to classify A/B/C.

Add an explicit override file:
- `docs/business-os/market-research/<BIZ>/research-profile.user.md` (Status: Active, declares `profile_id`).

Add generator debug metadata (outside the Deep Research text block):
- `SelectedProfile`
- `SelectionSignals`
- `OverrideUsed`

### C) Baseline assembler (no pointers-only; no YAML contamination)
- Embed computed deltas + compact slice + measurement snapshot in the prompt.
- Keep pointers to CSVs for operator convenience only.
- Add a linter/test: generated Deep Research prompt text must not contain nested YAML separators (`---`).

### D) Deterministic token/length budget + two-pass emission
Add a generator rule:
- if baseline payload > X characters OR competitor benchmark workload > Y items OR prompt length would exceed Z characters:
  - emit Pass 1 prompt: internal diagnosis + measurement repair + 14-day plan
  - emit Pass 2 prompt: external demand + competitor + scenario benchmarking
  - emit a short operator synthesis instruction

Add snapshot tests for the switch.

### E) URL derivation is a hard dependency; formalize it
Generator must determine base URL using strict precedence:
1. explicit website URL field in intake packet (if present)
2. strategy plan contains canonical domain (if present)
3. Cloudflare extraction metadata (zone-name / host-filter-requested)
4. fallback: none

If base URL cannot be determined, prompt must return `Status: BLOCKED` with missing field: website URL.

## Task Seeds For `/lp-plan`
1. Add hospitality S2 prompt template + update deliverable language to booking/distribution/ops.
2. Update generator (`scripts/src/startup-loop/s2-market-intelligence-handoff.ts`) to:
- select template by inferred profile (registry + matchers)
- honor `research-profile.user.md` override
- generate exemplar-style hospitality prompt (classification gate + standardized scenarios + measurement repair)
- generate baseline header + deltas + compact slice + pointers (no nested YAML)
- include explicit live URLs via strict base-URL precedence
- enforce token/length budget and deterministically choose two-pass
- emit debug metadata (selected profile + signals)
3. Add tests:
- profile inference for BRIK
- snapshot test asserting hospitality prompt contains classification gate + scenario rules + decision-grade acceptance criteria
- frontmatter contamination test (no nested YAML inside prompt text)
- token/length guard or two-pass switch test
- baseline correctness test (YoY decomposition + top decline months)
- URL selection precedence test
- override precedence test
4. (Optional) Apply the same profile system to S6 upgrade prompts (currently also framed as “B2C consumer-product”).

## Open Questions (User Input Needed)
None required to start planning.

Optional (diagnostic):
- Does your Deep Research environment have repo access? This doesn’t block planning because prompts are designed not to rely on access, but it changes whether we should ever mention pointers as “readable inputs” vs “operator convenience.”

## Planning Readiness
Ready-for-planning. Scope is clear, evidence anchors exist, and the work can be decomposed into small, testable increments.
