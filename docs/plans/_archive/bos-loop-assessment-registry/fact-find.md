---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: BOS
Workstream: Engineering
Created: 2026-03-02
Last-updated: 2026-03-02
Feature-Slug: bos-loop-assessment-registry
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/bos-loop-assessment-registry/plan.md
Dispatch-ID: IDEA-DISPATCH-20260302210000-0125
---

# BOS Loop Assessment Registry Fact-Find Brief

## Scope

### Summary

The self-improving loop monitors standing artifacts via the standing registry. Assessment containers — the 104 `.user.md` files under `docs/business-os/strategy/` that hold brand decisions, solution evaluations, naming specs, and business plans — are completely absent from this registry. As a result, changes to strategic decisions (e.g. deciding a brand name, selecting a solution, updating a business plan) never trigger dispatch events, and the loop never surfaces follow-on planning work from them.

This fact-find investigates the existing registry infrastructure and designs the minimum addition required to register high-value assessment artifacts as monitored signal sources.

### Goals
- Confirm the exact data gap (no registry data file exists, vs. a file that is missing entries)
- Identify which assessment artifact classes and artifact types should be registered
- Determine appropriate `trigger_policy` and `artifact_class` assignments
- Establish whether T1 semantic keyword coverage needs extending for assessment sections
- Define the deliverable scope: new registry data file + keyword extension + live-hook wiring

### Non-goals
- CASS retrieval indexing of assessment containers (separate dispatch 0126)
- Post-build write-back to assessment containers (separate dispatch 0127)
- Migrating all 104 assessment files at once — start with high-value, actively-changing types

### Constraints & Assumptions
- Constraints:
  - Registry data file must conform to `registry.v2` schema (`additionalProperties: false`)
  - T1-conservative threshold remains active — keyword extension must stay within conservative posture
  - Cannot add new `artifact_class` enum values (schema is strict) — must use existing classes
- Assumptions:
  - Assessment containers map to `artifact_class: source_reference` (authoritative reference data)
  - `domain: "ASSESSMENT"` is the correct domain (already defined in both schema and TS types)
  - Initial registration covers ~10–15 high-value files, not all 104

---

## Outcome Contract

- **Why:** The self-improving loop has a structural blind spot: changes to assessment containers (brand decisions, solution selections, naming specs, business plan updates) never trigger dispatch events. This means the loop cannot detect when a strategic decision has been made or revised, and cannot automatically route follow-on planning work. Closing this gap lets the balance sheet inform the P&L.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Assessment artifact classes registered in the standing registry with appropriate `trigger_policy` and delta-signal semantics, enabling future changes to assessment containers to automatically surface as dispatch candidates.
- **Source:** operator

---

## Evidence Audit (Current State)

### Entry Points
- `docs/business-os/startup-loop/ideas/lp-do-ideas-standing-registry.schema.json` — registry.v2 schema; defines `artifact_class` enum (6 values), `trigger_policy` enum (3 values), `domain` enum (8 values including `"ASSESSMENT"`)
- `scripts/src/startup-loop/lp-do-ideas-live-hook.ts` — CLI module; reads registry data file from disk via `--registry-path` arg; passes to orchestrator as `standingRegistry`
- `scripts/src/startup-loop/lp-do-ideas-trial.ts` — orchestrator; checks `registryEntry.trigger_policy` at line ~896; suppresses if not `eligible`
- `docs/business-os/startup-loop/ideas/trial/queue-state.json` — live queue; currently no assessment-domain dispatches

### Key Modules / Files
- `docs/business-os/startup-loop/ideas/lp-do-ideas-standing-registry.schema.json` — schema only; **no data file exists** at a sibling path
- `scripts/src/startup-loop/lp-do-ideas-registry-migrate-v1-v2.ts` — exports `RegistryV2ArtifactEntry`, `ArtifactClassV2` (`source_process | source_reference | projection_summary | system_telemetry | execution_output | reflection`), `RegistryV2Domain` (includes `"ASSESSMENT"`)
- `scripts/src/startup-loop/lp-do-ideas-live-hook.ts` — loads registry with `loadRegistryFromDisk(registryPath)` at line ~34 in dist; validates `artifacts` array exists
- `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md` — T1-conservative trigger threshold defined; qualifying sections: ICP, positioning, pricing/offer, channel strategy only
- `docs/business-os/strategy/` — 104 `.user.md` files across 9 businesses (BRIK, HBAG, HEAD, PET, PWRB, PIPE, PLAT, XA, BOS) — none registered
- High-value assessment types observed: `*-brand-identity-dossier.user.md`, `*-solution-decision.user.md`, `*-brand-profile.user.md`, `plan.user.md`, `*-naming-generation-spec.user.md`, `*-problem-statement.user.md`

### Patterns & Conventions Observed
- `source_reference` class: authoritative reference data (brand decisions, solution selections) — this is the correct class for assessment containers; `source_process` is for process/workflow docs
- Tests in `lp-do-ideas-trial.test.ts` cover `source_process` (eligible) and `projection_summary` (manual_override_only); no `source_reference ASSESSMENT` test exists
- T1 semantic sections cover: `icp, target customer, segment, persona, job-to-be-done, jtbd, positioning, value proposition, unique, differentiation, key message, pricing, price point, offer, bundle, promotional, channel strategy, launch channel, channel mix, channel priorities, channel selection` — no assessment-specific sections (brand name, solution decision, naming, distribution)

### Data & Contracts
- Types/schemas/events:
  - `RegistryV2ArtifactEntry` required fields: `artifact_id` (format `<BIZ>-<DOMAIN>-<descriptor>` uppercase), `path`, `domain`, `business`, `artifact_class`, `trigger_policy`, `propagation_mode`, `depends_on`, `produces`, `active`
  - `propagation_mode` options: `projection_auto | source_task | source_mechanical_auto`
  - For assessment `source_reference` artifacts: `propagation_mode: source_task` (changes trigger fact-find tasks, not mechanical auto-updates)
- Persistence:
  - No standing-registry data file exists anywhere in the repo — confirmed by `find docs/business-os/startup-loop/ideas -name "*.json"` (returns only dispatch schema, registry schema, and queue-state files — no data file with artifact entries)
  - Live hook expects `--registry-path <path>` — must be wired to a new file location
- API/contracts:
  - `lp-do-ideas-live-hook.ts` validates the registry has an `artifacts` array; partial registry (missing some files) is safe — `unknown_artifact_policy: "fail_closed_never_trigger"` means unregistered files are simply ignored

### Dependency & Impact Map
- Upstream dependencies:
  - Assessment containers (`docs/business-os/strategy/**/*.user.md`) are the inputs; must exist before registration
  - `registry.v2` schema constrains `artifact_id` format — all IDs must be `[A-Z][A-Z0-9]+-[A-Z]+-[A-Z0-9_-]+`
- Downstream dependents:
  - `lp-do-ideas-live-hook.ts` reads the registry file at `--registry-path`; once wired, artifact deltas to registered files will enter the orchestrator
  - `lp-do-ideas-trial.ts` admissions logic: registered + `trigger_policy: eligible` + semantic section match → dispatch emitted
  - `lp-do-ideas-trial-contract.md` T1 threshold definition — needs keyword extension for assessment sections

### Test Landscape

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `source_process` eligible | Unit | `lp-do-ideas-trial.test.ts` line 85 | Covered — triggers dispatch correctly |
| `projection_summary` suppressed | Unit | `lp-do-ideas-trial.test.ts` line 97,109 | Covered — `manual_override_only` blocked |
| `source_reference` ASSESSMENT | Unit | `lp-do-ideas-trial.test.ts` | **Missing** — no test for this artifact class + domain combo |
| T1 keyword match | Unit | `lp-do-ideas-trial.test.ts` | ICP/pricing/channel keywords covered; assessment keywords absent |

#### Coverage Gaps
- No test for `artifact_class: source_reference` with `domain: ASSESSMENT` and `trigger_policy: eligible`
- No test for T1 keyword match on assessment-specific section headings (brand identity, solution decision)
- No test for `source_reference ASSESSMENT` + T1 keyword match combination specifically (`lp-do-ideas-live-hook.test.ts` does exercise disk-loading of registry JSON, but uses `source_process` fixtures not `source_reference ASSESSMENT`)

#### Recommended Test Approach
- Unit tests for: `source_reference ASSESSMENT` + T1 keyword match → dispatch emitted (new TC)
- Unit tests for: `source_reference ASSESSMENT` + non-matching section → `logged_no_action`
- No integration or E2E tests needed for registry data file creation

### Recent Git History (Targeted)
- `scripts/src/startup-loop/lp-do-ideas-registry-migrate-v1-v2.ts` — domain enum extended to include `"ASSESSMENT"` as part of registry.v2 migration; indicates the infra was designed with assessment artifacts in mind
- `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md` v1.2.0 — T1-conservative keyword list locked; no assessment sections added

---

## Questions

### Resolved

- Q: Does the ASSESSMENT domain exist in TS types and schema?
  - A: Yes. `RegistryV2Domain` in the migration file includes `"ASSESSMENT"`. The schema's `domain` field enum includes `"ASSESSMENT"`. No new enum values needed.
  - Evidence: `scripts/src/startup-loop/lp-do-ideas-registry-migrate-v1-v2.ts` line 15, `lp-do-ideas-standing-registry.schema.json` domain field

- Q: What `artifact_class` should assessment containers use?
  - A: `source_reference` — assessment containers hold authoritative reference data (final brand decisions, selected solutions, approved business plans). `source_process` is for process/workflow documents; `execution_output` is for build/plan artifacts. `source_reference` is the semantic fit.
  - Evidence: `ArtifactClassV2` type definition; semantic alignment with "authoritative strategic decisions"

- Q: Would T1-conservative keyword matching suppress most assessment artifact changes?
  - A: Yes, for most sections. However, `plan.user.md` files contain "pricing" sections that would match today. For brand-specific sections (brand identity, solution decision, naming), T1 keywords need extension: add `brand identity, brand name, solution decision, naming, distribution plan` to cover the most common substantive changes. This stays within T1-conservative posture (keyword-gated, not free-text).
  - Evidence: T1 keyword list in `lp-do-ideas-trial-contract.md` Section 3; assessment artifacts reviewed

- Q: Does a registry data file exist that just lacks assessment entries?
  - A: No. **No registry data file exists at all.** The schema JSON exists but there is no `standing-registry.json` (or equivalent) data file anywhere in `docs/business-os/startup-loop/ideas/`. The live hook's `--registry-path` argument has never been pointed at a real file in production use.
  - Evidence: `find docs/business-os/startup-loop/ideas -name "*.json"` returns only dispatch schema + registry schema + queue-state files; no data file with artifact entries found

- Q: What `propagation_mode` should assessment artifacts use?
  - A: `source_task` — changes to assessment containers should trigger planning tasks (fact-find/plan cycles), not mechanical auto-updates. `source_mechanical_auto` is for low-judgment automated propagation; `projection_auto` is for derived summaries.
  - Evidence: propagation mode semantics in `RegistryV2ArtifactEntry` interface

- Q: Which 10–15 assessment artifacts should be registered first?
  - A: Priority by signal value and change frequency:
    1. `*-brand-identity-dossier.user.md` (all businesses with one) — brand decisions change and have downstream implications
    2. `plan.user.md` (all businesses) — business plan changes signal strategic pivots
    3. `*-solution-decision.user.md` (PWRB, HBAG, HEAD) — solution selection changes open new build needs
    4. `*-brand-profile.user.md` (HBAG, HEAD) — brand positioning updates
    5. `naming-generation-spec.md`/`naming-shortlist-*.user.md` (active businesses) — lower priority, `manual_override_only` since these change during active campaigns
  - Evidence: assessment file inventory across `docs/business-os/strategy/`

### Open (Operator Input Required)

None. All questions resolved by available evidence.

---

## Confidence Inputs

- **Implementation:** 88%
  - Evidence: Schema and TS types fully support the deliverable. No changes to orchestrator logic required. Creating a JSON data file + updating a contract MD + wiring a CLI arg is straightforward.
  - Raises to ≥90: Confirm live-hook invocation path (how the hook is called in CI/SIGNALS advance). Currently the `--registry-path` arg path is unconfirmed for production use.
- **Approach:** 90%
  - Evidence: `source_reference` class + `ASSESSMENT` domain is the correct classification. T1 keyword extension is the minimum-viable approach for conservative filtering. No alternative approaches are materially better.
  - Raises to ≥95: Validate T1 keyword extension doesn't create false-positive dispatch rate issues. Verifiable post-deployment via telemetry.
- **Impact:** 85%
  - Evidence: Once registered, brand decisions and solution changes will generate dispatches for follow-on work. Directly addresses the "balance sheet is invisible to the loop" gap.
  - Raises to ≥90: First few real dispatches from assessment container changes confirm routing quality.
- **Delivery-Readiness:** 92%
  - Evidence: No external dependencies. All required data (assessment file paths) exists in the repo. Schema is stable. TS infrastructure is complete.
- **Testability:** 80%
  - Evidence: The orchestrator is unit-tested. New test cases for `source_reference ASSESSMENT` + T1 keyword match are straightforward additions to existing test file.
  - Raises to ≥90: Confirm Jest test runner covers the `lp-do-ideas-trial.test.ts` file in CI.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| T1 keyword extension creates too many dispatches from minor assessment edits | Medium | Low | Start with a narrow set of additional keywords (`brand identity`, `solution decision`); review telemetry after first 2 weeks. `T1-conservative` posture is self-limiting. |
| Live hook never wired to a real registry path in CI | Medium | Medium | Include registry path configuration in task scope; document the wiring step explicitly. Without it, the data file exists but dispatch events never fire from artifact deltas. |
| `artifact_id` format constraint broken for some assessment file paths | Low | Medium | Enforce format `<BIZ>-ASSESSMENT-<descriptor>` (e.g. `BRIK-ASSESSMENT-BRAND-IDENTITY`) when writing entries. Validated by schema at runtime. |
| Over-registration (all 104 files) creates noise before T2 is activated | Low | Medium | Initial registration covers ~15 high-value files only. Remaining files added incrementally as T2 threshold is activated. |

---

## Planning Constraints & Notes

- Must-follow patterns:
  - Registry data file must use `registry_version: "registry.v2"` and conform strictly to `lp-do-ideas-standing-registry.schema.json`
  - `artifact_id` format: `<BIZ>-<DOMAIN>-<DESCRIPTOR>` all uppercase (e.g. `BRIK-ASSESSMENT-BRAND-IDENTITY`)
  - `t1_semantic_sections` extension must remain keyword-conservative — no free-text or wildcard additions
- Rollout/rollback expectations:
  - The registry data file is additive — removing it or removing entries has no destructive effect (unregistered artifacts are ignored by the orchestrator)
  - Live-hook invocation must be updated to point `--registry-path` to the new file path; currently the hook has never run against a real registry file in production
- Observability expectations:
  - `telemetry.jsonl` will capture suppressed vs. dispatched events once wiring is active
  - First assessment-domain dispatches should appear in `queue-state.json` within one loop cycle of a registered artifact being modified

---

## Suggested Task Seeds (Non-binding)

1. **IMPLEMENT** — Create `docs/business-os/startup-loop/ideas/standing-registry.json` with initial 15 high-value assessment artifacts across BRIK, HBAG, HEAD, PWRB businesses; domain `ASSESSMENT`, class `source_reference`, policy `eligible`, propagation `source_task`
2. **IMPLEMENT** — Extend `t1_semantic_sections` in the registry data file to add: `brand identity`, `brand name`, `solution decision`, `naming`, `distribution plan` — covers most substantive assessment change types
3. **IMPLEMENT** — Wire `lp-do-ideas-live-hook.ts` CLI invocation to pass `--registry-path docs/business-os/startup-loop/ideas/standing-registry.json`; document in `lp-do-ideas-trial-contract.md`
4. **IMPLEMENT** — Add unit tests to `lp-do-ideas-trial.test.ts`: `source_reference ASSESSMENT` + T1 keyword match → dispatch, and `source_reference ASSESSMENT` + non-matching section → `logged_no_action`

---

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `docs/business-os/startup-loop/ideas/standing-registry.json` exists, is valid JSON, passes schema validation, contains ≥10 assessment artifact entries with `trigger_policy: eligible`
  - T1 semantic sections in registry include assessment keywords
  - Unit tests for `source_reference ASSESSMENT` pass
  - Live-hook wiring documented
- Post-delivery measurement plan:
  - After first registered assessment artifact changes: verify dispatch appears in `trial/queue-state.json` with correct `domain: ASSESSMENT` metadata

---

## Scope Signal

**Signal: right-sized**

**Rationale:** The gap is precisely bounded: one missing data file + one keyword list extension + one wiring step. The TS orchestrator already handles `source_reference` artifacts correctly (evidenced by `source_process` test coverage). No schema changes, no new enum values, no orchestrator logic changes required. Initial registration covers ~15 files, leaving 89 for incremental addition as T2 threshold is activated. The three separate dispatches (0125/0126/0127) correctly decompose the broader gap into independently buildable units.

---

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Registry schema compatibility | Yes | None — `ASSESSMENT` domain already defined, `source_reference` class exists | No |
| No existing registry data file | Yes | None — absence is the gap, not a conflict | No |
| T1 keyword filtering for assessment sections | Yes | [Moderate] Assessment sections (brand identity, solution decision) not in T1 keyword list; most assessment changes would be suppressed without keyword extension | No — addressed in task seed 2 |
| Live-hook invocation wiring | Partial | [Moderate] `--registry-path` has never been pointed to a real file; documentation of wiring is part of deliverable | No — addressed in task seed 3 |
| Test coverage for new artifact class/domain combo | Yes | [Minor] No `source_reference ASSESSMENT` test case exists; adds to coverage gap but doesn't block registration | No — addressed in task seed 4 |
| Blast radius of new registry file | Yes | None — `unknown_artifact_policy: fail_closed_never_trigger` means unregistered files are ignored; adding a registry file has no destructive side effect | No |

---

## Evidence Gap Review

### Gaps Addressed
- Confirmed no registry data file exists (not merely missing entries in an existing file)
- Confirmed `ASSESSMENT` domain and `source_reference` class are already present in TS types and schema — no new code additions needed for classification
- Confirmed T1 keyword gap for assessment-specific section headings — quantified the filtering problem and identified minimum additions
- Identified live-hook `--registry-path` wiring as the production-activation step that has never been completed

### Confidence Adjustments
- Implementation confidence held at 88% (not 95%) because live-hook production wiring path is unconfirmed — we know the flag exists but have not verified how/whether it's invoked in CI or SIGNALS advance flow
- Impact confidence held at 85% pending first real assessment-domain dispatch confirming routing quality

### Remaining Assumptions
- `source_task` propagation mode is correct for assessment artifacts (vs. `source_mechanical_auto`) — this is a judgment call; no counter-evidence found
- Initial 15-file coverage is sufficient to validate the pattern before expanding to all 104 files — this is conservative and safe

---

## Planning Readiness

- **Status: Ready-for-planning**
- Blocking items: None
- Recommended next step: `/lp-do-plan bos-loop-assessment-registry --auto`
