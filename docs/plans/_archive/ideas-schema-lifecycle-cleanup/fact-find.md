---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Infra
Workstream: Engineering
Created: 2026-03-03
Last-updated: 2026-03-03
Feature-Slug: ideas-schema-lifecycle-cleanup
Execution-Track: business-artifact
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/ideas-schema-lifecycle-cleanup/plan.md
Trigger-Source: dispatch-routed
Dispatch-ID: IDEA-DISPATCH-20260303120000-0133
Trigger-Why: Two dispatch schema versions coexist with no deprecation marker. The trial-to-live queue lifecycle is undocumented, making it unclear how dispatches progress through the system.
Trigger-Intended-Outcome: "type: operational | statement: v1 schema deprecated or deleted. Schemas moved to ideas/schemas/. IDEAS-LIFECYCLE.md documents trial to live queue transition clearly. | source: operator"
---

# Ideas Schema Lifecycle Cleanup — Fact-Find Brief

## Scope

### Summary

The `docs/business-os/startup-loop/ideas/` directory has dual dispatch schema versions (v1 and v2) coexisting with no deprecation marker on v1, no dedicated schemas subdirectory, and no lifecycle documentation explaining the trial-to-live queue transition. This fact-find assesses the current state and scopes the cleanup work.

### Goals

- Determine whether v1 schema can be deprecated (moved to `_deprecated/`) or must remain active
- Design an `ideas/schemas/` subdirectory for schema files
- Scope a lifecycle document (`IDEAS-LIFECYCLE.md`) covering the trial → live queue transition
- Identify all reference paths that would need updating if schemas move

### Non-goals

- Modifying TypeScript type definitions (types are inline in `.ts` files, not imported from JSON schemas)
- Changing the v1/v2 compat layer in production code (routing adapter stays as-is)
- Activating live mode (that has its own go-live checklist with 7 NO-GO gates)

### Constraints & Assumptions

- Constraints:
  - 129 v1 packets exist in trial `queue-state.json` — v1 compat layer is load-bearing for historical data
  - The routing adapter (`lp-do-ideas-routing-adapter.ts`) actively handles v1 packets via `extractCompatV1WhyFields()`
  - Test suites (8+ test files) construct v1 packets — moving or deleting v1 schema is a documentation change, not a code change
- Assumptions:
  - Schema JSON files are reference documentation only — no runtime import/require
  - Moving schemas to a subdirectory requires JSDoc comment updates (2 `.ts` files) plus doc reference updates in contract/skill markdown files

## Outcome Contract

- **Why:** Two dispatch schema versions coexist with no deprecation marker. The trial-to-live queue lifecycle is undocumented, making it unclear how dispatches progress through the system.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** v1 schema deprecated or deleted. Schemas moved to ideas/schemas/. IDEAS-LIFECYCLE.md documents trial to live queue transition clearly.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `docs/business-os/startup-loop/ideas/` — root directory containing 10 files + 3 subdirectories (trial/, live/, _archive/)

### Key Modules / Files

- `docs/business-os/startup-loop/ideas/lp-do-ideas-dispatch.schema.json` — v1 schema, `dispatch.v1`, trial-only mode
- `docs/business-os/startup-loop/ideas/lp-do-ideas-dispatch.v2.schema.json` — v2 schema, `dispatch.v2`, adds required `why` + `intended_outcome`
- `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md` — trial mode operating contract (v1.2.0)
- `docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-seam.md` — trial → live transition contract (v1.2.0)
- `docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-checklist.md` — activation gate checklist (7 NO-GO sections)
- `docs/business-os/startup-loop/ideas/lp-do-ideas-routing-matrix.md` — dispatch routing rules (v1.0.0)
- `docs/business-os/startup-loop/ideas/lp-do-ideas-rollback-playbook.md` — live mode rollback procedure
- `docs/business-os/startup-loop/ideas/lp-do-ideas-telemetry.schema.md` — telemetry event schema
- `docs/business-os/startup-loop/ideas/lp-do-ideas-standing-registry.schema.json` — standing artifact registry schema
- `docs/business-os/startup-loop/ideas/standing-registry.json` — shared standing registry data

### Patterns & Conventions Observed

- **Schema files at root level:** All 3 schema JSON files (dispatch v1, dispatch v2, standing-registry) sit at `ideas/` root alongside contract docs — evidence: `ls docs/business-os/startup-loop/ideas/`
- **JSDoc-only schema references:** TypeScript files reference schema paths in JSDoc comments only (lines 5-10 of `lp-do-ideas-trial.ts` and line 16 of `lp-do-ideas-live.ts`), not via import/require
- **Inline TypeScript types:** Dispatch packet types (`TrialDispatchPacket`, `TrialDispatchPacketV2`, `IntendedOutcomeV2`) are defined inline in `lp-do-ideas-trial.ts` (lines 131, 191-229), not generated from schema JSON
- **Active v1 compat layer:** `lp-do-ideas-routing-adapter.ts` has `extractCompatV1WhyFields()` function (line 228) that maps v1 `current_truth` to v2 `why` with `why_source: "compat-v1"` sentinel
- **Data ratio:** 129 v1 packets vs 11 v2 packets in trial queue — v1 is 92% of historical data
- **_archive/ already exists:** 5 archived schema docs in `ideas/_archive/` (handoff-to-fact-find, idea-backlog, idea-card, idea-portfolio, scan-proposals)

### Data & Contracts

- Types/schemas/events:
  - `dispatch.v1` schema: mode trial-only, fields: dispatch_id, root_event_id, anchor_key, cluster_key, status, queue_state, evidence_refs
  - `dispatch.v2` schema: extends v1, adds required `why` (string), `intended_outcome` (object with type/statement/source), supports `mode: "live"`
  - `queue-state.v1` schema: defined in `lp-do-ideas-persistence.ts` (separate from dispatch schemas)
  - `meta-observation.v1`: derived from dispatch packets in `self-evolving-from-ideas.ts`
- Persistence:
  - Trial queue: `trial/queue-state.json` (351 KB, 140 dispatches)
  - Live queue: `live/queue-state.json` (144 bytes, seed state, empty entries)
  - Trial telemetry: `trial/telemetry.jsonl` (empty)
  - Trial classifications: `trial/classifications.jsonl` (empty)

### Dependency & Impact Map

- Upstream dependencies:
  - Schema files are documentation/reference — no code imports them
  - 2 JSDoc comments in `.ts` files reference schema paths (non-functional)
- Downstream dependents:
  - Skill files reference schema paths in doc context (`.claude/skills/lp-do-ideas/SKILL.md`)
  - Contract docs reference schema files inline
  - 8+ test files construct `dispatch.v1` packets — they use inline TypeScript types, not schema JSON
- Likely blast radius:
  - Moving schemas: 2 JSDoc comment updates + doc references in contract files
  - Deprecating v1 schema: documentation-only change (add deprecation notice), no code change
  - Lifecycle doc: new file, no existing references to update

### Delivery & Channel Landscape

- Audience/recipient: Internal engineering team / agents
- Channel constraints: None — all artifacts are repo-local markdown/JSON
- Existing templates/assets: `_archive/` directory pattern already established
- Approvals/owners: Operator review of lifecycle doc content
- Compliance constraints: None
- Measurement hooks: None — operational improvement

### Hypothesis & Validation Landscape

#### Key Hypotheses

| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | v1 schema can be deprecated (moved to _deprecated/) without breaking any code | Confirming no runtime imports | Low — grep search | Done |
| H2 | Moving schemas to ideas/schemas/ requires only JSDoc + doc updates | Confirming no dynamic path resolution | Low — grep search | Done |
| H3 | A lifecycle document can be written from existing contract/seam docs | Reading existing docs | Low — reading | Done |

#### Existing Signal Coverage

| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | No runtime imports found; only JSDoc refs in 2 files | grep across codebase | 95% |
| H2 | Only JSDoc comments reference schema paths | grep for schema filenames in .ts files | 95% |
| H3 | trial-contract, go-live-seam, go-live-checklist, routing-matrix all exist with detailed lifecycle info | File listing + reading | 95% |

### Recent Git History (Targeted)

Not investigated: Schema files are stable reference docs with no recent changes relevant to this scope.

## Access Declarations

None — all artifacts are repo-local.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| v1 schema usage in code | Yes | None | No |
| v2 schema usage in code | Yes | None | No |
| Schema path references in docs/skills | Yes | None | No |
| ideas/ directory structure | Yes | None | No |
| Trial-to-live lifecycle documentation | Yes | None | No |
| _archive/ existing pattern | Yes | None | No |
| Queue data format impact | Yes | None — queue data is keyed by `schema_version` string, not by schema file path | No |

## Scope Signal

- **Signal:** right-sized
- **Rationale:** Three discrete deliverables (deprecate v1 schema, move schemas to subdirectory, write lifecycle doc) are well-bounded with clear evidence. Changes are limited to file moves, JSDoc comment updates in 2 `.ts` files, and doc reference updates — no functional code changes. The _archive/ pattern is already established. All references are mapped.

## Questions

### Resolved

- Q: Can the v1 schema JSON file be deleted entirely?
  - A: No — it should be deprecated (moved to `_deprecated/` or `_archive/`) rather than deleted. 129 historical v1 packets exist in queue-state.json, and the schema documents the structure of that data. The compat layer in code uses inline types, not the JSON file, so the file is reference-only but still valuable for understanding historical data.
  - Evidence: `grep -c '"dispatch.v1"' docs/business-os/startup-loop/ideas/trial/queue-state.json` → 129

- Q: Will moving schema files to `ideas/schemas/` break any code?
  - A: No — only 2 JSDoc comments in `.ts` files reference the schema paths (no runtime import/require). Additionally, several markdown contract/skill docs reference schema paths inline and will need updating. All changes are documentation-only — no functional code impact.
  - Evidence: `grep` for schema filenames in scripts/src/startup-loop/*.ts → only JSDoc matches; grep across docs/ → contract and skill references

- Q: Is there enough existing documentation to write a lifecycle doc without new research?
  - A: Yes — the trial contract (v1.2.0), go-live seam (v1.2.0), go-live checklist, routing matrix, and rollback playbook contain all the lifecycle information. The gap is synthesis and a single-page overview, not missing knowledge.
  - Evidence: Reading all 5 existing contract/seam docs

### Open (Operator Input Required)

None — all questions resolved from evidence.

## Confidence Inputs

- Implementation: 90% — straightforward file moves and doc writing; all paths mapped
  - To reach >=90: already there
- Approach: 90% — clear pattern (_archive/ exists, JSDoc-only references confirmed)
  - To reach >=90: already there
- Impact: 85% — operational improvement; minimal code risk (JSDoc-only changes in 2 `.ts` files + doc reference updates)
  - To reach >=90: lifecycle doc could be validated against operator mental model
- Delivery-Readiness: 90% — all inputs available, no external dependencies
  - To reach >=90: already there

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Lifecycle doc doesn't match operator's mental model of trial→live transition | Low | Low | Doc is synthesised from existing versioned contracts; review at completion |
| Future code changes import schema JSON directly | Very Low | Low | JSDoc in schema file can note "reference only — types are inline in lp-do-ideas-trial.ts" |

## Planning Constraints & Notes

- Must-follow patterns:
  - Use `_deprecated/` (not `_archive/`) for deprecated schemas — `_archive/` already contains different archived docs
  - Update JSDoc comments in `lp-do-ideas-trial.ts` and `lp-do-ideas-live.ts` after schema move
  - Lifecycle doc should reference existing contracts, not duplicate their content
- Rollout/rollback expectations:
  - Fully reversible file moves; no code behaviour change
- Observability expectations:
  - None — operational doc improvement

## Suggested Task Seeds (Non-binding)

1. Create `ideas/schemas/` subdirectory; move v2 schema + standing-registry schema there; add deprecation notice to v1 schema and move to `ideas/_deprecated/`
2. Update JSDoc comments in 2 `.ts` files and doc references in contract/skill markdown files with new schema paths
3. Write `IDEAS-LIFECYCLE.md` synthesising trial contract, go-live seam, routing matrix, and checklist into a single-page lifecycle overview

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: schemas in new locations, JSDoc updated, lifecycle doc present and covers trial→live transition
- Post-delivery measurement plan: None — operational improvement

## Evidence Gap Review

### Gaps Addressed

- Confirmed v1 schema is documentation-only (no runtime imports) — eliminates code breakage risk
- Confirmed data ratio (129 v1 vs 11 v2) — justifies deprecation over deletion
- Confirmed _archive/ vs _deprecated/ distinction — _archive/ already has different content

### Confidence Adjustments

- No adjustments needed — initial confidence inputs match evidence

### Remaining Assumptions

- Schema JSON files will not be imported by future code (mitigated by adding "reference only" note)

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan ideas-schema-lifecycle-cleanup --auto`
