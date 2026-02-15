---
Type: Plan
Status: Active
Domain: Platform / Business-OS
Workstream: Engineering
Created: 2026-02-15
Last-updated: 2026-02-15
Feature-Slug: startup-loop-s2-market-intel-prompt-quality
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: /lp-build
Supporting-Skills: /lp-sequence
Overall-confidence: 83
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-OS-Integration: on
Business-Unit: BOS
Card-ID:
---

# Startup Loop S2 Market Intelligence Prompt Quality — Plan

## Summary
Refactor S2 (Market Intelligence) prompt generation so Deep Research consistently produces decision-grade outputs for `website-live` hospitality/direct-booking businesses (starting with BRIK). This plan introduces a profile registry (category-aware templates), an internal-baseline assembler that embeds deltas + compact slices without YAML contamination, standardized competitor benchmarking rules, explicit website-live funnel + measurement repair requirements, and deterministic two-pass prompt emission when token budgets would otherwise force shallow output.

## Goals
- Generated S2 prompts are category-correct (hospitality/direct-booking/OTA), not “B2C consumer-product”.
- Delta Q1–Q3 are the organizing spine of the prompt; every major section maps back to them.
- Prompt forces explicit business model classification (A/B/C) with ambiguity resolution tests.
- Competitor and pricing research is reproducible (minimum sets + standardized scenarios + date/comparability rules).
- Website-live is operationalized: live funnel audit + measurement repair plan is required before any paid scaling.
- Baseline injection is compact and clean: embedded deltas + month slice + measurement snapshot, no nested YAML/frontmatter inside the Deep Research text.
- “Decision-grade” is defined with static acceptance criteria (CI-testable) plus a minimal manual scoring harness.

## Non-goals
- Building new `measure_*` connectors.
- Automated competitive pricing scrapers.
- Producing the S2 pack content itself.

## Constraints & Assumptions
- Constraints:
  - Deep Research may not have repo access; prompts must not rely on file pointers for internal evidence.
  - Generator must enforce a token/length budget and choose two-pass deterministically.
- Assumptions:
  - Business category can be inferred from intake + strategy artifacts with conservative heuristics, with an explicit override.

## Fact-Find Reference
- Related brief: `docs/plans/startup-loop-s2-market-intel-prompt-quality/fact-find.md`
- Key findings (planning anchors):
  - Current S2 prompts have a role/category mismatch for BRIK and a “coverage trap” that produces shallow outputs.
  - Current generator embeds noisy/bloated baseline blocks (including nested YAML), degrading reasoning.
  - Website-live and competitor benchmarking need hard, reproducible rules.

## Existing System Notes
- Current generator: `scripts/src/startup-loop/s2-market-intelligence-handoff.ts`
- Current generic template: `docs/business-os/market-research/_templates/deep-research-market-intelligence-prompt.md`
- Broken example output (BRIK): `docs/business-os/market-research/BRIK/2026-02-15-deep-research-market-intelligence-prompt.user.md`


## Validation Foundation (Evidence Collected In Planning)
- Generator entry point reviewed: `scripts/src/startup-loop/s2-market-intelligence-handoff.ts`
- Current prompt size scout (BRIK 2026-02-15 prompt): prompt ~9,580 chars; internal baselines ~5,668 chars; total file ~10,299 chars. (Used to set two-pass thresholds.)
- Targeted test run executed: `pnpm run test:governed -- jest -- --runTestsByPath scripts/src/startup-loop/__tests__/s2-market-intelligence-handoff.test.ts --maxWorkers=2`
- Known warning during Jest collection: `jest-haste-map: duplicate manual mock found: ui-modal-context` due to multiple app mocks; the S2 handoff test still passes.

## Proposed Approach

### Option A (minimal): Patch the existing generator and generic template
- Pros: fewer files changed.
- Cons: risks reintroducing category mismatch for non-hospitality businesses; generator remains monolithic.

### Option B (preferred): Add a profile registry + profile templates, refactor generator into modules
- Pros: scalable taxonomy, cheap to add profiles, reduces regressions, makes prompt quality testable.
- Cons: more files touched, needs careful test coverage.

Chosen: Option B.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Baseline assembler: embedded deltas + compact slice; strip YAML contamination | 86 | M | Complete (2026-02-15) | - | TASK-03, TASK-05 |
| TASK-02 | IMPLEMENT | Add hospitality S2 profile template (exemplar-aligned) incl. scenario rules + decision-grade criteria | 85 | S | Complete (2026-02-15) | - | TASK-03 |
| TASK-03 | IMPLEMENT | Profile registry + override + selection debug metadata; generator chooses correct template | 82 | M | Complete (2026-02-15) | TASK-01, TASK-02 | TASK-04, TASK-06, TASK-07 |
| TASK-04 | IMPLEMENT | Base URL derivation + website-live BLOCKED behavior + funnel audit anchors | 82 | M | Complete (2026-02-15) | TASK-03 | TASK-07 |
| TASK-05 | IMPLEMENT | Deterministic two-pass prompt emission + length guards + tests | 82 | M | Complete (2026-02-15) | TASK-01, TASK-03 | TASK-07 |
| TASK-06 | IMPLEMENT | Prompt evaluation harness doc (golden businesses + rubric) | 80 | S | Complete (2026-02-15) | TASK-03 | TASK-07 |
| TASK-07 | CHECKPOINT | Horizon checkpoint: run rubric on BRIK + confirm prompt quality; replan if needed | 95 | S | Pending | TASK-03, TASK-04, TASK-05, TASK-06 | - |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | Independent foundations (baseline + template) |
| 2 | TASK-03 | Wave 1 | Registry wiring depends on baseline + template |
| 3 | TASK-04, TASK-06 | Wave 2 | URL derivation and eval harness can run in parallel |
| 4 | TASK-05 | Wave 2 | Two-pass depends on registry + baseline sizing |
| 5 | TASK-07 | Wave 3-4 | Checkpoint after prompt generation changes land |

**Max parallelism:** 2 (Wave 1, Wave 3) | **Critical path:** TASK-01 -> TASK-03 -> TASK-04 -> TASK-07 (5 waves total incl. optional TASK-05) | **Total tasks:** 7

## Tasks

### TASK-01: Baseline assembler: embedded deltas + compact slice; strip YAML contamination
- **Type:** IMPLEMENT
- **Deliverable:** Refactor S2 generator to assemble a single `BEGIN_INTERNAL_BASELINES` block that contains only embedded evidence required by Deep Research.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** Generated prompt file under `docs/business-os/market-research/<BIZ>/`.
- **Reviewer:** Pete
- **Approval-Evidence:** Accept prompt by replying “ok” after inspection.
- **Measurement-Readiness:** n/a (prompt-generation infrastructure)
- **Affects:**
  - Primary: `scripts/src/startup-loop/s2-market-intelligence-handoff.ts`
  - Secondary: `scripts/src/startup-loop/__tests__/s2-market-intelligence-handoff.test.ts`
- **Depends on:** -
- **Blocks:** TASK-03, TASK-05
- **Confidence:** 86
  - Implementation: 88% — we already compute deltas from CSVs; we need to change what we embed and sanitize nested YAML.
  - Approach: 86% — baseline block as a single-purpose assembler reduces prompt noise and is testable.
  - Impact: 86% — localized to S2 prompt generation; downstream effects are prompt content only.
- **Acceptance:**
  - Baseline block includes: header (inventory + channel mix + measurement status), YoY decomposition, top decline months, compact month slice table, measurement snapshot.
  - Baseline block does not embed other markdown docs verbatim.
  - Generated Deep Research text contains no nested YAML frontmatter separators (`---`) inside the pasted text block.
- **Validation contract:**
  - TC-01: nested frontmatter contamination → generated prompt text contains exactly one YAML frontmatter block at file top and no `\n---\n` within the Deep Research code block.
  - TC-02: baseline correctness → fixture CSVs produce expected YoY decomposition + top decline months.
  - TC-03: compact slice enforcement → output includes last N complete months (default 12) and excludes older months unless explicitly configured.
  - Run/verify: `pnpm run test:governed -- jest -- --runTestsByPath scripts/src/startup-loop/__tests__/s2-market-intelligence-handoff.test.ts --maxWorkers=2`
- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:**
  - Rollout: apply to BRIK first; keep existing behavior behind a generator option if needed.
  - Rollback: revert to prior generator baseline embedding if prompt quality regresses.
- **Documentation impact:** None (covered in TASK-02/TASK-06).

#### Build Completion (2026-02-15)
- **Status:** Complete
- **Commits:** 770f313e43
- **Execution cycle:** Red → Green → Refactor
  - TC-01/02/03 implemented as assertions in `scripts/src/startup-loop/__tests__/s2-market-intelligence-handoff.test.ts`
  - Initial validation: FAIL (expected) after updating tests; Final validation: PASS
- **Validation:**
  - Ran: `pnpm run test:governed -- jest -- --runTestsByPath scripts/src/startup-loop/__tests__/s2-market-intelligence-handoff.test.ts --maxWorkers=2` — PASS
  - Ran: `pnpm exec tsc -p scripts/tsconfig.json --pretty false --noEmit` — PASS
  - Ran: `pnpm exec eslint scripts/src/startup-loop/s2-market-intelligence-handoff.ts scripts/src/startup-loop/__tests__/s2-market-intelligence-handoff.test.ts` — PASS
- **Implementation notes:**
  - Replaced the “baseline bloat” block with a compact, decision-grade internal baseline that embeds: YoY 12-month window, decomposition, top decline months, last-12-month slice, and GA4 snapshot.
  - Removed nested-YAML risk by no longer embedding prior pack excerpts or other markdown docs inside `BEGIN_INTERNAL_BASELINES`.

### TASK-02: Add hospitality S2 profile template (exemplar-aligned)
- **Type:** IMPLEMENT
- **Deliverable:** New template file under `docs/business-os/market-research/_templates/` for hospitality/direct booking/OTA mode.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** `docs/business-os/market-research/_templates/<template>.md`
- **Reviewer:** Pete
- **Approval-Evidence:** reviewer ack in commit message or chat.
- **Measurement-Readiness:** n/a
- **Affects:**
  - Primary: `docs/business-os/market-research/_templates/` (new file)
  - Secondary: `[readonly] docs/business-os/market-research/_templates/deep-research-market-intelligence-prompt.md`
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 85
  - Implementation: 90% — document-only work; derived directly from the exemplar prompt.
  - Approach: 85% — profile templates separate concerns and avoid contaminating the generic template.
  - Impact: 85% — affects only how prompts are generated for matching businesses.
- **Acceptance:**
  - Role framing matches hospitality direct booking + OTA distribution + experiences.
  - Delta Q1–Q3 are top-of-prompt and repeated as the organizing spine.
  - Requires business model classification (A/B/C) with explicit ambiguity resolution tests.
  - Includes competitor min-counts + standardized scenarios with explicit date selection + comparability + sold-out rules.
  - Requires website-live funnel audit + measurement repair plan before paid scaling.
  - Defines decision-grade acceptance criteria (quotas + usefulness).
- **Validation contract:**
  - VC-01: template contains explicit scenario rules and date selection rules.
  - VC-02: template contains a `Status: BLOCKED` rule for missing website URL.

#### Build Completion (2026-02-15)
- **Status:** Complete
- **Commits:** 0cbaa20ff3
- **Validation:** VC-01/VC-02 satisfied in `docs/business-os/market-research/_templates/deep-research-market-intelligence-prompt.hospitality-direct-booking-ota.md`
- **Implementation notes:** hospitality template is exemplar-aligned (Delta Q1-Q3 spine, A/B/C classification gate, reproducible competitor/pricing scenarios, website-live funnel + measurement repair requirements, and a decision-grade quality bar).

### TASK-03: Profile registry + override + selection debug metadata
- **Type:** IMPLEMENT
- **Deliverable:** Generator chooses the correct profile template using a registry and supports an explicit override file.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** generator output prompt file under `docs/business-os/market-research/<BIZ>/`.
- **Reviewer:** Pete
- **Approval-Evidence:** reviewer ack after inspecting generated BRIK prompt.
- **Measurement-Readiness:** n/a
- **Affects:**
  - Primary: `scripts/src/startup-loop/s2-market-intelligence-handoff.ts`
  - Primary: `docs/business-os/market-research/_templates/` (new hospitality template referenced)
  - Secondary: `[readonly] docs/business-os/startup-loop/loop-spec.yaml` (should remain unchanged)
  - Secondary: `docs/business-os/startup-loop-workflow.user.md` (optional: mention profiles + override)
  - Tests: `scripts/src/startup-loop/__tests__/s2-market-intelligence-handoff.test.ts`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-04, TASK-06, TASK-07
- **Confidence:** 82
  - Implementation: 82% — requires refactor of generator into profile selection + rendering; testable via fixtures.
  - Approach: 85% — registry reduces future refactors and keeps taxonomy extensible.
  - Impact: 82% — affects which prompt text is emitted per business.
- **Acceptance:**
  - Registry supports `profile_id`, matchers, required fields, template path, `two_pass_supported`, baseline extractor.
  - Override file `docs/business-os/market-research/<BIZ>/research-profile.user.md` takes precedence when `Status: Active`.
  - Generator emits debug metadata outside the Deep Research block: selected profile, signals, override used.
  - BRIK selects hospitality profile by default (signals include Octorate/inventory + bookings/direct share cues).
- **Validation contract:**
  - TC-01: profile selection → BRIK fixture selects `hospitality_direct_booking_ota`.
  - TC-02: override precedence → override file forces profile even if matchers disagree.
  - TC-03: debug metadata → output contains `SelectedProfile` and `OverrideUsed` lines.

#### Build Completion (2026-02-15)
- **Status:** Complete
- **Commits:** 6b937db473
- **Execution cycle:** Red → Green → Refactor
  - Added TC coverage for profile selection + override precedence + debug metadata in `scripts/src/startup-loop/__tests__/s2-market-intelligence-handoff.test.ts`
- **Validation:**
  - Ran: `pnpm run test:governed -- jest -- --runTestsByPath scripts/src/startup-loop/__tests__/s2-market-intelligence-handoff.test.ts --maxWorkers=2` — PASS
  - Ran: `pnpm exec tsc -p scripts/tsconfig.json --pretty false --noEmit` — PASS
  - Ran: `pnpm exec eslint scripts/src/startup-loop/s2-market-intelligence-handoff.ts scripts/src/startup-loop/__tests__/s2-market-intelligence-handoff.test.ts` — PASS
- **Implementation notes:**
  - Generator now selects a research profile (`hospitality_direct_booking_ota` vs `b2c_dtc_product`) and renders Deep Research prompts from markdown templates, injecting `{{INTERNAL_BASELINES}}` as mandatory evidence.
  - Added `docs/business-os/market-research/<BIZ>/research-profile.user.md` override support (Status: Active, `Profile-Id: ...`).
  - Generated prompt doc now includes a `## Generator Debug` section with `SelectedProfile`, `OverrideUsed`, `SelectionSignals`, and `TemplatePath` (outside the Deep Research code block).

### TASK-04: Base URL derivation + website-live BLOCKED behavior + funnel audit anchors
- **Type:** IMPLEMENT
- **Deliverable:** Generator derives canonical base URL with strict precedence and injects explicit website-live funnel audit instructions.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** Generated hospitality prompt contains explicit URLs and audit steps.
- **Reviewer:** Pete
- **Approval-Evidence:** reviewer ack after inspecting prompt.
- **Measurement-Readiness:** n/a
- **Affects:**
  - Primary: `scripts/src/startup-loop/s2-market-intelligence-handoff.ts`
  - Tests: `scripts/src/startup-loop/__tests__/s2-market-intelligence-handoff.test.ts`
- **Depends on:** TASK-03
- **Blocks:** TASK-07
- **Confidence:** 82
  - Implementation: 80% — URL derivation requires conservative parsing of existing artifacts.
  - Approach: 85% — strict precedence avoids “fake funnel audit” outputs.
  - Impact: 82% — affects prompt fields and BLOCKED conditions.
- **Acceptance:**
  - Base URL precedence implemented (intake explicit URL, strategy plan domain, Cloudflare metadata; else missing).
  - If base URL missing, hospitality prompt requires Deep Research output to return `Status: BLOCKED` with missing field.
  - If base URL present, prompt includes explicit funnel audit path (home -> dates -> room -> checkout).
- **Validation contract:**
  - TC-01: URL derived from measurement verification URLs when present.
  - TC-02: URL derived from Cloudflare metadata when explicit URL absent.
  - TC-03: missing URL → prompt includes explicit BLOCKED instruction.

#### Build Completion (2026-02-15)
- **Status:** Complete
- **Commits:** e386052792
- **Execution cycle:** Red → Green → Refactor
  - Added TC coverage for measurement-derived URL and Cloudflare `host-filter-requested` fallback in `scripts/src/startup-loop/__tests__/s2-market-intelligence-handoff.test.ts`
- **Validation:**
  - Ran: `pnpm run test:governed -- jest -- --runTestsByPath scripts/src/startup-loop/__tests__/s2-market-intelligence-handoff.test.ts --maxWorkers=2` — PASS
  - Ran: `pnpm exec tsc -p scripts/tsconfig.json --pretty false --noEmit` — PASS
  - Ran: `pnpm exec eslint scripts/src/startup-loop/s2-market-intelligence-handoff.ts scripts/src/startup-loop/__tests__/s2-market-intelligence-handoff.test.ts` — PASS
- **Implementation notes:**
  - Generator now derives a canonical website origin via precedence: intake table (Website/Domain) -> measurement verification URLs -> business plan URLs -> Cloudflare `host-filter-requested`.
  - For hospitality + `website-live`, the generated Deep Research prompt now includes an explicit funnel-audit block (URL + audit path) and a `Status: BLOCKED` instruction when the website URL is missing.

### TASK-05: Deterministic two-pass prompt emission + length guards + tests
- **Type:** IMPLEMENT
- **Deliverable:** When prompt would exceed defined size budgets, generator emits a two-pass prompt (Pass 1 internal diagnosis; Pass 2 external competitor/demand/scenarios) plus synthesis instructions.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** one generated prompt file containing two clearly labeled Deep Research blocks (Pass 1 and Pass 2).
- **Reviewer:** Pete
- **Approval-Evidence:** reviewer ack.
- **Measurement-Readiness:** n/a
- **Affects:**
  - Primary: `scripts/src/startup-loop/s2-market-intelligence-handoff.ts`
  - Tests: `scripts/src/startup-loop/__tests__/s2-market-intelligence-handoff.test.ts`
- **Depends on:** TASK-01, TASK-03
- **Blocks:** TASK-07
- **Confidence:** 82
  - Implementation: 82% — output contract is straightforward; thresholds can be tested deterministically.
  - Approach: 82% — two-pass is a durable escape hatch that prevents oversized prompts from forcing shallow outputs.
  - Impact: 82% — changes operator workflow but stays contained to prompt generation and can be default-off below thresholds.
- **Scouts (evidence):**
  - Current BRIK prompt size (2026-02-15): prompt ~9,580 chars; baselines ~5,668 chars; total file ~10,299 chars.
- **What would make this ≥90%:** add a fixture that exceeds thresholds and confirm the emitted Pass 1/Pass 2 prompts are unambiguous and rubric-improving in one real Deep Research trial.
- **Acceptance:**
  - Generator has explicit thresholds (e.g. `MAX_PROMPT_CHARS`, `MAX_BASELINE_CHARS`, `MAX_BENCHMARK_ITEMS`) with defaults committed and covered by tests.
  - Two-pass prompts are clearly separated and labeled; includes synthesis instruction.
  - Snapshot tests cover both single-pass and two-pass outputs.
- **Validation contract:**
  - TC-01: size trigger causes two-pass emission.
  - TC-02: size under threshold emits single-pass.

#### Build Completion (2026-02-15)
- **Status:** Complete
- **Commits:** 98f78a6826
- **Execution cycle:** Red → Green → Refactor
  - Added a two-pass trigger test (forces two-pass via `BASESHOP_S2_MAX_PROMPT_CHARS=1`) in `scripts/src/startup-loop/__tests__/s2-market-intelligence-handoff.test.ts`
- **Validation:**
  - Ran: `pnpm run test:governed -- jest -- --runTestsByPath scripts/src/startup-loop/__tests__/s2-market-intelligence-handoff.test.ts --maxWorkers=2` — PASS
  - Ran: `pnpm exec tsc -p scripts/tsconfig.json --pretty false --noEmit` — PASS
  - Ran: `pnpm exec eslint scripts/src/startup-loop/s2-market-intelligence-handoff.ts scripts/src/startup-loop/__tests__/s2-market-intelligence-handoff.test.ts` — PASS
- **Implementation notes:**
  - Added deterministic two-pass emission when prompt size exceeds committed thresholds (`BASESHOP_S2_MAX_PROMPT_CHARS`, `BASESHOP_S2_MAX_BASELINE_CHARS`).
  - Two-pass output is clearly labeled in the generated prompt doc, with explicit operator synthesis instructions.

### TASK-06: Prompt evaluation harness doc (golden businesses + rubric)
- **Type:** IMPLEMENT
- **Deliverable:** Add a manual scoring checklist to run once per release.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** `docs/business-os/market-research/prompt-quality-eval.user.md` (or equivalent) referenced by operators.
- **Reviewer:** Pete
- **Approval-Evidence:** reviewer ack.
- **Measurement-Readiness:** n/a
- **Affects:**
  - Primary: `docs/business-os/market-research/` (new doc)
- **Depends on:** TASK-03
- **Blocks:** TASK-07
- **Confidence:** 80
  - Implementation: 85% — doc-only.
  - Approach: 80% — minimal manual loop is enough to catch regressions.
  - Impact: 80% — process change only.
- **Acceptance:**
  - Rubric is 0/1/2 per criterion; includes 3–5 golden businesses including BRIK.
  - Explicit “what constitutes pass” definitions.

#### Build Completion (2026-02-15)
- **Status:** Complete
- **Commits:** f89b741875
- **Artifact:** `docs/business-os/market-research/prompt-quality-eval.user.md`
- **Implementation notes:** manual rubric defined with 3 golden businesses (BRIK, HEAD, PET) and explicit pass/fail rules to catch prompt regressions.

### TASK-07: Horizon checkpoint: run rubric on BRIK + confirm prompt quality; replan if needed
- **Type:** CHECKPOINT
- **Depends on:** TASK-03, TASK-04, TASK-05, TASK-06
- **Blocks:** -
- **Confidence:** 95
- **Acceptance:**
  - Generate the BRIK prompt(s) and score them with the rubric.
  - If any rubric dimension scores 0, run `/lp-replan` before continuing and capture what failed.

## Risks & Mitigations
- Risk: Deep Research cannot access repo artifacts, so pointers reduce usefulness.
  - Mitigation: embed deltas + compact slice + measurement snapshot; treat pointers as operator convenience only.
- Risk: two-pass workflow causes operator confusion.
  - Mitigation: strict labeling + synthesis instructions; keep single-pass default when under thresholds.
- Risk: profile matcher misroutes businesses.
  - Mitigation: override file + debug metadata; conservative matchers.
