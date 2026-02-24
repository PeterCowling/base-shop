---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: BOS / Startup Loop
Workstream: Operations
Created: 2026-02-22
Last-updated: 2026-02-22
Feature-Slug: startup-loop-ideas-pipeline-redesign
Execution-Track: business-artifact
Deliverable-Family: doc
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/startup-loop-ideas-pipeline-redesign/plan.md
Business-OS-Integration: off
Business-Unit: BOS
Card-ID: none
direct-inject: true
direct-inject-rationale: >
  Redesign decision emerged from operator review of the workflow process map HTML (session 2026-02-22).
  No existing idea card — this is a structural spec defect identified through direct operator analysis,
  not a signal from standing intelligence.
---

# Startup Loop IDEAS Pipeline Redesign — Fact-Find Brief

## Scope

### Summary

The IDEAS container (added in v3.9.2) is structurally broken. It is declared as a container in
`loop-spec.yaml` but (a) not wired into the `ordering.sequential` chain, (b) described as a
one-time manual backlog capture step, and (c) positioned between ASSESSMENT and MEASURE — implying
a one-time setup pass rather than a continuous operational pipeline.

The required model is: IDEAS is a **diff-scan job** — triggered automatically when Layer A aggregate
packs are updated, operating on the _diff_ of the pack (not the full text), evaluating both new signal
coverage AND impact on existing in-flight ideas, and emitting structured proposals for operator
confirmation before committing changes to the idea backlog.

### Goals

- Redefine IDEAS as `type: standing_pipeline` — continuous, event-driven, not sequential
- Two explicit trigger paths: (1) Layer A pack diff event, (2) operator/agent direct injection
- IDEAS-01 becomes an automated diff scan (skill: `/idea-scan`); output: `scan-proposals.md`
- Scan must resolve each diff chunk against the existing idea backlog using six impact categories:
  `CREATE | STRENGTHEN | WEAKEN | INVALIDATE | MERGE | SPLIT`
- IDEAS-02 becomes a semi-automated backlog update: agent applies proposals; MERGE/SPLIT require
  operator confirmation before restructuring cards
- IDEAS-03 remains the promote-to-DO gate (unchanged in function)
- Remove IDEAS from the `ordering.sequential` chain entirely
- Update all downstream artifacts: stage-operator-dictionary, idea-backlog schema, HTML map,
  startup-loop SKILL.md table, bottleneck-detector StageId type + UPSTREAM_PRIORITY_ORDER
- New schema doc: `scan-proposals.schema.md` defining the structured proposal artifact

### Non-goals

- Implementing the automated diff job as a cron/CI trigger (infrastructure concern; spec only)
- Changing the IDEAS stage IDs (IDEAS, IDEAS-01..03 remain canonical — backward compat preserved)
- Changing the handoff-to-fact-find contract (IDEAS-03 → DO already correctly specified)
- Implementing `/idea-scan` skill changes (separate work; fact-find scopes the spec contract only)

### Constraints & Assumptions

- Constraints:
  - Stage IDs must not change (existing manifests may reference `current_stage: IDEAS-01` etc.)
  - `StageId` type in `bottleneck-detector.ts` is a hardcoded union — must stay in sync with spec
  - Test in `s10-weekly-routing.test.ts` asserts exactly 66 stages — will need updating
  - `loop_spec_version` in `stage-operator-dictionary.yaml` is still `"3.9.0"` — needs bumping
    to match current spec (already at 3.9.3 after the S3→SELL change this session)
- Assumptions:
  - `type: standing_pipeline` is a new container type value; no runtime code currently parses
    the `type` field (stage-addressing only resolves IDs/aliases, not types)
  - The scan diff mechanism is spec-level only in this change; tooling implementation is deferred
  - IDEAS stages remain in the `StageId` union and the runtime stage lists — they're still valid
    addressable stages; only their sequential _position_ in the ordering changes

---

## Delivery & Channel Landscape

- Audience/recipient: startup loop operators; `/lp-do-plan` and `/lp-do-build` as downstream consumers of the updated spec artifacts
- Rollout order: TASK-01 (loop-spec.yaml) **must complete before TASK-02** (stage-operator-dictionary.yaml). If TASK-01 ships without TASK-02, operator prompts temporarily contradict the spec (dict still says "proceed to MEASURE-01" while spec says standing pipeline). TASK-01 and TASK-02 should be committed in the same write operation.
- CI validation: run `generate-stage-operator-views.ts` after TASK-02 to verify dict alignment with the updated spec
- Existing assets: loop-spec.yaml, stage-operator-dictionary.yaml, ideas/ schema docs, HTML process map, startup-loop/SKILL.md — all identified in task seeds
- Approvals/owners: single operator (BOS); no external reviewers required
- Measurement hooks: post-change test suite (s10-weekly-routing.test.ts, generate-stage-operator-views.test.ts) confirms no regression; stage count stays at 66

## Evidence Audit (Current State)

### Key Modules / Files

- `docs/business-os/startup-loop/loop-spec.yaml` — authoritative spec
  - IDEAS declared as `type: container` at lines 291–306
  - Stages IDEAS-01..03 defined at lines 308–345 (all `skill: prompt-handoff`)
  - `ordering.sequential` at lines 996–1058: chain goes `[ASSESSMENT, MEASURE-01]` — IDEAS
    is entirely absent from sequential ordering despite being positioned between them in the
    stages list. **This is an existing inconsistency.**
  - No `trigger:`, `automation:`, or `impact_categories:` fields exist yet
  - `spec_version: "3.9.3"` (after S3→SELL change earlier this session)

- `docs/business-os/startup-loop/stage-operator-dictionary.yaml`
  - `loop_spec_version: "3.9.0"` — stale; needs bumping to 3.9.3+
  - IDEAS container entry at line 178: `operator_next_prompt: "IDEAS container complete. Proceed to MEASURE-01 Agent-Setup."` — contradicts the handoff-to-fact-find.md contract (which correctly says IDEAS-03 → DO, not MEASURE-01)
  - IDEAS-01 operator prompt (line 204): fully manual ("Review standing intelligence outputs... capture candidate ideas")
  - IDEAS-02 operator prompt (line 219): manual scoring ("Score each idea card 1–5...")
  - All three stages list `skill: prompt-handoff` in the spec — no actual skill assigned

- `docs/business-os/startup-loop/ideas/idea-backlog.schema.md`
  - Frontmatter has `Review-trigger` (which pack triggered this review) — good
  - Missing: `last_scanned_pack_versions` map per source pack — needed for diff tracking
  - Missing: reference to `scan-proposals.md` artifact

- `docs/business-os/startup-loop/ideas/handoff-to-fact-find.md`
  - Correctly specifies IDEAS-03 → DO (fact-find) connection
  - Does NOT need structural changes; reference updates only

- `docs/business-os/startup-loop-containers-process-map.html`
  - IDEAS currently shown in the sequential main flow (incorrectly)
  - Needs to be moved to a "Standing Pipelines" visual section, showing both trigger paths and
    the output arrow to DO

- `scripts/src/startup-loop/bottleneck-detector.ts`
  - Line 13: `StageId` type is a hardcoded union string literal including `'IDEAS' | 'IDEAS-01' | 'IDEAS-02' | 'IDEAS-03'`
  - Line 89: `UPSTREAM_PRIORITY_ORDER` array includes IDEAS in sequential position (between ASSESSMENT-11 and MEASURE-01)
  - **Risk**: IDEAS in `UPSTREAM_PRIORITY_ORDER` implies bottleneck scoring treats IDEAS as
    a sequential predecessor to MEASURE. Must be removed or relocated to avoid false bottleneck
    signals when IDEAS is legitimately not sequentially complete.

- `packages/mcp-server/src/tools/loop.ts`
  - Lines 49–52: `VALID_STAGE_IDS` array includes IDEAS in sequential position
  - This list is used for stage ID validation; position order here may affect manifest advance logic

- `scripts/src/startup-loop/__tests__/s10-weekly-routing.test.ts`
  - Line 59: `expect(idMatches!.length).toBe(66)` — asserts exactly 66 stages
  - IDEAS contributes 4 entries (container + 3 stages); removing them from the count would
    break this test. **Decision needed**: do we keep IDEAS in the stage count or not?
  - Recommended: keep in count (IDs are unchanged), but test comment needs updating

- `.claude/skills/startup-loop/SKILL.md`
  - Lines 107–110: IDEAS table entry describes prompt-handoff with no skill — needs updating
    to reflect automated diff scan (IDEAS-01) and backlog update (IDEAS-02)

### Patterns & Conventions Observed

- `type: container` is used for ASSESSMENT, PRODUCT, PRODUCTS, LOGISTICS, MARKET, SELL — all
  sequential or fan-out containers. There is currently no `type: standing_pipeline` in the spec.
  This is the first instance of this new container type.
- Automation fields (`automation:`, `trigger:`, `recurrence:`) do not exist in the spec today.
  Adding them is additive and does not break existing consumers (they will ignore unknown fields).
- The six impact categories (CREATE/STRENGTHEN/WEAKEN/INVALIDATE/MERGE/SPLIT) are entirely new
  to the IDEAS domain; they have no prior spec precedent.

### Data & Contracts

- Existing schemas needing updates:
  - `idea-backlog.schema.md`: add `last_scanned_pack_versions` frontmatter field
- New schema needed:
  - `docs/business-os/startup-loop/ideas/scan-proposals.schema.md`
    - Defines the `scan-proposals.md` artifact: structured list of proposals per diff chunk
    - Each proposal: `{ type, idea_id?, merge_target?, split_from?, evidence_ref, reasoning, confidence }`
- Handoff contract (`handoff-to-fact-find.md`): no structural changes; minor reference updates

### Dependency & Impact Map

- Upstream dependencies (things this change reads):
  - `loop-spec.yaml` (primary)
  - `stage-operator-dictionary.yaml` (display contract)
  - Layer A pack artifacts: MARKET-11, SELL-07, PRODUCTS-07, LOGISTICS-07
- Downstream dependents (things that must stay consistent):
  - `bottleneck-detector.ts` — StageId type, UPSTREAM_PRIORITY_ORDER
  - `loop.ts` — VALID_STAGE_IDS array
  - `s10-weekly-routing.test.ts` — 66-stage count assertion
  - `generate-stage-operator-views.ts` (generates stage-operator-table.md + stage-operator-map.json from dict)
  - `startup-loop/SKILL.md` — IDEAS table
  - HTML process map
- Blast radius:
  - **Spec files**: loop-spec.yaml, stage-operator-dictionary.yaml, idea-backlog.schema.md — primary changes
  - **New file**: scan-proposals.schema.md
  - **TypeScript**: bottleneck-detector.ts UPSTREAM_PRIORITY_ORDER (remove IDEAS from sequential position)
  - **Tests**: s10-weekly-routing.test.ts line 59 comment update; count stays at 66
  - **Skill docs**: startup-loop/SKILL.md table rows
  - **HTML**: process map visual repositioning

---

## Questions

### Resolved

- Q: Should IDEAS stage IDs change?
  - A: No. `IDEAS | IDEAS-01 | IDEAS-02 | IDEAS-03` remain canonical. Existing manifests with
    `current_stage: IDEAS-01` continue to be valid.
  - Evidence: stage-addressing.ts resolves by ID/alias only; ID changes would break manifests.

- Q: Should IDEAS remain in the StageId union and VALID_STAGE_IDS?
  - A: Yes — IDs are still addressable stages; they just aren't sequential. Remove from
    `UPSTREAM_PRIORITY_ORDER` (which implies sequential precedence) but keep in the type union.
  - Evidence: `UPSTREAM_PRIORITY_ORDER` comment in bottleneck-detector.ts is explicitly
    positional (used for upstream stage bottleneck scoring).

- Q: Does IDEAS-03 → DO connection need to change?
  - A: No. `handoff-to-fact-find.md` already correctly specifies this. Operator prompt in
    `stage-operator-dictionary.yaml` needs updating to stop saying "proceed to MEASURE-01."

- Q: What happens to the stage-operator-dictionary `loop_spec_version`?
  - A: Must be bumped to `"3.9.4"` (the version this redesign produces). Currently stale at 3.9.0.

### Open (User Input Needed)

- Q: Should IDEAS appear in a new `standing_pipelines:` top-level section in loop-spec.yaml,
  or remain in `stages:` with `type: standing_pipeline`?
  - Why it matters: determines whether runtime tooling needs a separate parsing path or just
    ignores the type field.
  - Decision impacted: implementation complexity of the spec change.
  - Default assumption: keep in `stages:` with `type: standing_pipeline` — simpler, additive,
    backward-compatible. Runtime tools ignore unknown type values.
  - Risk if wrong: low — `type` field is not parsed by any current runtime code.

---

## Confidence Inputs

- Implementation: 82% — all files identified; TypeScript changes are minimal (array surgery, no
  logic changes). Raises to 90% once `scan-proposals.schema.md` structure is confirmed.
- Approach: 88% — diff-scan model is well-specified; six impact categories cover the state space.
  Drops to 75% if the scan diff mechanism (last_scanned_version tracking) needs tooling not in scope.
- Impact: 85% — scope is clear; backward compat preserved; no existing manifests will break.
- Delivery-Readiness: 90% — all artifacts identified, owner clear (this session), no external
  blockers, no approvals needed.
- Testability: 65% — the diff scan logic and proposal generation are not tested in the current
  test suite. The spec change itself is low-risk (additive YAML fields + array removal in TS).
  Raises to 80% if scan-proposals schema validation is added to spec-lint scripts.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| `UPSTREAM_PRIORITY_ORDER` keeps IDEAS in sequential position → false bottleneck signals for runs where IDEAS hasn't run yet | High (it's the current state) | Medium | Remove IDEAS-01..03 and IDEAS from the array in bottleneck-detector.ts |
| `loop_spec_version: "3.9.0"` in stage-operator-dictionary stays stale → VC-03 invariant failure | High (already stale) | Low | Bump to 3.9.4 as part of this change |
| `scan-proposals.md` artifact not yet schema-validated by any lint script → proposals artifact exists in practice but is unchecked | Medium | Low | Create scan-proposals.schema.md now; add lint rule in a follow-on task |
| Ideas in-flight when spec deploys will have no `scan_status` field → old idea cards appear unclassified by new scan logic | Low (no current live runs with ideas) | Low | Schema update is additive; old cards just lack the field (scan treats absence as `needs-first-scan`) |
| Parallel session modifying loop-spec.yaml after S3→SELL change this session → merge conflict | Low | Medium | Writer-lock is active; single session making changes |
| **Spec ships before /idea-scan skill is updated → system remains manual despite "automated" label in spec** | **High** | **High** | **Expand TASK-07 to include updating /idea-scan SKILL.md description to match new IDEAS-01 contract (diff scan against last_scanned_version, outputs scan-proposals.md); explicit paper-tiger period accepted until /idea-scan implementation follows** |
| MERGE/SPLIT proposal quality is low → operators disengage from pipeline, backlog diverges from reality | Medium | High | Define minimum proposal quality bar in scan-proposals.schema.md: each proposal must include `evidence_ref`, `reasoning`, and `confidence` to be valid; invalid proposals are rejected before operator review |

---

## Suggested Task Seeds (Non-binding)

1. **TASK-01**: Update `loop-spec.yaml` — bump to v3.9.4; change IDEAS container `type` to
   `standing_pipeline`; add `trigger:`, `automation:`, `recurrence:`, and `impact_categories:` fields;
   update IDEAS-01..03 stage definitions (skill, automation, inputs, output_artifact);
   remove IDEAS from `ordering.sequential`; update comment block
2. **TASK-02**: Update `stage-operator-dictionary.yaml` — bump `loop_spec_version` to 3.9.4;
   update IDEAS container and stage entries (labels, outcome descriptions, operator prompts)
3. **TASK-03**: Update `idea-backlog.schema.md` — add `last_scanned_pack_versions` frontmatter field
4. **TASK-04**: Create `docs/business-os/startup-loop/ideas/scan-proposals.schema.md`
5. **TASK-05**: Update `bottleneck-detector.ts` — remove `IDEAS | IDEAS-01 | IDEAS-02 | IDEAS-03`
   from `UPSTREAM_PRIORITY_ORDER`; StageId type stays unchanged.
   Note: `loop.ts` `STARTUP_LOOP_STAGES` (lines 49-52) also includes IDEAS in sequential position
   but is used as a validation whitelist only (`allowedStages`) — position is irrelevant, IDs
   are unchanged, **no change needed to `STARTUP_LOOP_STAGES`**.
   Acceptance criteria: `grep -rn '\.type\b' scripts/src/startup-loop/` returns no container
   type access; test suite passes after array removal.
6. **TASK-06**: Update `docs/business-os/startup-loop-containers-process-map.html` — move IDEAS
   out of main sequential flow; add "Standing Pipelines" panel with diff-trigger arrows from
   Layer A packs and output arrow to DO; show both trigger paths
7. **TASK-07** (expanded): Two-part:
   (a) Update `startup-loop/SKILL.md` — refresh IDEAS table rows (automation: automated /
   semi-automated / operator-gate; skill: /idea-scan / /idea-develop + /idea-advance / handoff)
   (b) Update `.claude/skills/idea-scan/SKILL.md` description to reflect the new IDEAS-01 contract:
   diff scan against `last_scanned_pack_versions`, inputs are pack diff + existing idea backlog,
   output is `scan-proposals.md` with CREATE/STRENGTHEN/WEAKEN/INVALIDATE/MERGE/SPLIT proposals.
   This closes the paper-tiger risk: spec says "automated" and the skill description now matches.

---

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none (all changes are YAML/MD/HTML; no code logic changes)
- Deliverable acceptance package:
  - `loop-spec.yaml` at v3.9.4 with `type: standing_pipeline` on IDEAS container and no IDEAS
    entries in `ordering.sequential`
  - `stage-operator-dictionary.yaml` with bumped `loop_spec_version` and updated IDEAS entries
  - `idea-backlog.schema.md` with `last_scanned_pack_versions` field
  - `scan-proposals.schema.md` created with full proposal type definitions
  - `bottleneck-detector.ts` UPSTREAM_PRIORITY_ORDER without IDEAS stages
  - HTML process map with IDEAS as a standing pipeline panel
  - `startup-loop/SKILL.md` IDEAS table updated
- Post-delivery measurement plan:
  - VC-03 compliance: run `scripts/src/startup-loop/__tests__/generate-stage-operator-views.test.ts`
    to verify dictionary stays aligned
  - Stage count test (`s10-weekly-routing.test.ts`) passes (66 stays correct; IDEAS IDs unchanged)

---

## Hypothesis & Validation Landscape

### Key Hypotheses

| # | Hypothesis | Falsification cost | Falsification time |
|---|---|---|---|
| H1 | `type: standing_pipeline` is safe to add — no runtime code parses the container `type` field | Low — grep verification | Minutes |
| H2 | Removing IDEAS from `UPSTREAM_PRIORITY_ORDER` eliminates false bottleneck signals without affecting valid stage scoring | Low — run existing bottleneck tests post-change | Minutes |
| H3 | The diff-scan model (6 impact categories) produces actionable proposals with sufficient signal-to-noise for operators to engage | High — requires live /idea-scan run against a real pack diff | 1+ sprint (deferred) |

### Existing Signal Coverage

| Hypothesis | Evidence | Source | Confidence |
|---|---|---|---|
| H1 | stage-addressing.ts reads only IDs/aliases/labels. loop.ts STARTUP_LOOP_STAGES is a validation whitelist only. generate-stage-operator-views.ts reads only label fields. bottleneck-detector.ts reads StageId and position, not type field. | Direct code read this session (all 4 relevant runtime files) | High |
| H2 | UPSTREAM_PRIORITY_ORDER is the only position-sensitive structure referencing IDEAS stages | bottleneck-detector.ts line 89; no other grep matches | High |
| H3 | None — deferred to /idea-scan skill update | — | None (accepted gap) |

### Falsifiability Assessment

- Easy to test (H1, H2): run `grep -rn '\.type\b' scripts/src/startup-loop/ packages/mcp-server/src/` and run test suite after TASK-05. Both are part of TASK-05 acceptance criteria.
- Hard to test (H3): requires a working /idea-scan implementation and a populated Layer A pack with a real diff. Deferred by non-goal decision.
- Validation seams needed: scan-proposals.schema.md should define a minimum quality bar (each proposal must include `evidence_ref` and `reasoning` to be parseable) — this is part of TASK-04.

### Recommended Validation Approach

- H1/H2: include in TASK-05 acceptance criteria; run post-change with `pnpm -w test`
- H3: out of scope; accepted as known gap; operational validation requires /idea-scan skill update (follow-on work)

---

## Evidence Gap Review

### Gaps Addressed

- Confirmed IDEAS is absent from `ordering.sequential` (not an oversight to fix — it was
  supposed to be wired in but never was; redesign makes the exclusion intentional)
- Confirmed `UPSTREAM_PRIORITY_ORDER` in bottleneck-detector.ts contains IDEAS (fix required)
- Confirmed `loop_spec_version` in stage-operator-dictionary is stale at 3.9.0 (fix required)
- Confirmed TypeScript stage count test expects 66 (IDs stay the same → count stays 66)
- Confirmed no runtime code parses the `type` field of a container (additive change is safe)

### Confidence Adjustments

- Approach raised from initial 80% to 88% after confirming runtime tools do not parse `type`
- Testability lowered to 65% — diff scan logic has no test coverage path identified yet

### Remaining Assumptions

- `/idea-scan` skill update (to produce `scan-proposals.md`) is out of scope for this spec change;
  the skill contract is defined by the schema doc but the skill implementation is a follow-on
- `scan-proposals.md` diff mechanism (how to get "last scanned version") is implementation-deferred;
  spec says `diff_against_last_scanned` and the `last_scanned_pack_versions` frontmatter field
  provides the tracking anchor, but tooling to compute the diff is not specified here

---

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan` — all 7 task seeds identified, dependencies clear
  (TASK-01 before TASK-02 due to spec_version; TASK-03/04 independent; TASK-05/06/07 independent)
