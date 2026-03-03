---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: BOS
Workstream: Engineering
Created: 2026-02-26
Last-updated: 2026-02-26
Feature-Slug: lp-do-ideas-content-quality
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/lp-do-ideas-content-quality/plan.md
Trigger-Why: The lp-do-ideas skill generated a progress report about PWRB business registration instead of decomposed, actionable idea dispatches. Content quality is unmeasured and the operator can't trust the queue as a signal source until it is fixed.
Trigger-Intended-Outcome: type: operational | statement: The skill intake path produces narrow, artifact-scoped dispatch packets — one per gap — and suppresses administrative non-ideas (business registration events). Existing queue entries are not retroactively corrected. | source: operator
---

# lp-do-ideas Content Quality Fact-Find Brief

## Scope

### Summary

The `lp-do-ideas` skill generates dispatch packets that feed the ideas queue
(`docs/business-os/startup-loop/ideas/trial/queue-state.json`). Three content-quality
defects were identified via a concrete bad example (IDEA-DISPATCH-20260226-0023, PWRB):

1. **Progress-report content**: `area_anchor`, `current_truth`, and `next_scope_now` were
   authored as a full business-state narrative, not as a narrow artifact-scoped description
   of a single gap.
2. **No "one event → multiple narrow packets" rule**: a single incoming event (PWRB
   strategy backfill) produced one aggregate packet instead of ≥4 separate ones
   (IPEI agreement, hardware SKU, venue selection, brand name).
3. **No guard against administrative non-ideas**: "new business registration" events
   should be `logged_no_action` with a redirect to `/startup-loop start`; currently the
   intake path routes them as `briefing_ready`.

A secondary finding is a schema-format mismatch between what the TypeScript persistence
layer writes (`schema_version: "queue-state.v1"`, `entries[]`) and what the actual
`queue-state.json` contains (`queue_version: "queue.v1"`, `dispatches[]`). The TS
persistence infrastructure has never been used to write the live queue file.

### Goals

- Add three new rules to SKILL.md intake path: (A) `area_anchor` format constraint,
  (B) "one event, multiple narrow packets" decomposition requirement, (C) administrative
  non-idea suppression list.
- Document the queue-state schema mismatch as a known divergence so it doesn't surprise
  future agents.
- No changes to the TypeScript orchestrator are needed for defects 1–3 (those are
  skill-only defects). The schema mismatch does not affect current operations.

### Non-goals

- Fixing the schema mismatch between TS persistence and the hand-authored queue file
  (separate work — current file format works fine for the viewer and is stable).
- Changing the T1 keyword list in `lp-do-ideas-trial.ts`.
- Retroactively rewriting the 26 existing queue-state dispatches.
- Changing the `autonomy_policy` or trigger threshold (those are governed by the trial
  contract's escalation conditions, not yet met).

### Constraints & Assumptions

- Constraints:
  - Trial contract (Section 2) is `Option B — Queue with Confirmation`. Escalation
    to Option C requires ALL of: trial review period ≥ 14 days, sample size ≥ 40
    dispatches, and dispatch precision ≥ 80%. No auto-execution change permitted
    until all three conditions are met.
  - SKILL.md changes must not conflict with `lp-do-ideas-trial-contract.md` Section 4
    dispatch contract requirements.
  - The queue file format (`queue_version: "queue.v1"`, `dispatches[]`) must remain
    stable; the HTML viewer depends on it.
- Assumptions:
  - All three content-quality defects are SKILL.md (agent instruction) defects, not
    TypeScript code defects.
  - Adding prose rules to SKILL.md intake is sufficient to fix them — no new code paths
    required for defects 1–3.
  - Schema mismatch is pre-existing and accepted; documenting it is sufficient.

## Outcome Contract

- **Why:** PWRB dispatch was a progress report not an idea. The queue can't function as
  a reliable signal source until the intake path enforces content standards. Fixing the
  skill doc is the minimum viable correction.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Three new rules written into SKILL.md intake path
  (area_anchor format, decomposition requirement, administrative non-idea suppression).
  Schema mismatch documented in a known-issues note. No regressions to existing dispatch
  contract.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `.claude/skills/lp-do-ideas/SKILL.md` — the skill definition. The intake path (Steps
  1–4) is where the agent authors `operator_idea` dispatches. Steps 3 and 4 are the
  defective sections.
- `docs/business-os/startup-loop/ideas/trial/queue-state.json` — the live queue file;
  26 dispatches, all `trigger: operator_idea`. Zero `trigger: artifact_delta` dispatches
  have ever been written to this file.

### Key Modules / Files

- `.claude/skills/lp-do-ideas/SKILL.md:30–76` — Intake path (Steps 1–4). Step 3 asks
  for `area_anchor` with no format constraint. Step 4 applies routing intelligence with
  no suppression list for administrative events.
- `.claude/skills/lp-do-ideas/SKILL.md:112–141` — Routing intelligence section. States
  "No hard keyword lists" — this is accurate for `operator_idea` routing, but is
  inconsistent with the TS code which uses `T1_SEMANTIC_KEYWORDS` for `artifact_delta`
  routing. Not a defect, but confusing documentation.
- `scripts/src/startup-loop/lp-do-ideas-trial.ts:26–48` — `T1_SEMANTIC_KEYWORDS` list
  (20 terms). Used only for `artifact_delta` routing. Never used in operator-idea path.
- `scripts/src/startup-loop/lp-do-ideas-trial.ts:123–150` — `TrialDispatchPacket`
  interface. `trigger` field typed as `"artifact_delta"` only — confirming operator-idea
  dispatch is handled entirely in the skill, not in the TS code.
- `scripts/src/startup-loop/lp-do-ideas-persistence.ts:55–65` — `PersistedQueueState`
  interface with `schema_version: "queue-state.v1"` and `entries[]`. This is the TS
  code's expected format.
- `docs/business-os/startup-loop/ideas/trial/queue-state.json:1–15` — actual file has
  `queue_version: "queue.v1"` and `dispatches[]`. Different from what TS code writes.
  The HTML viewer at `docs/business-os/ideas.user.html` handles both formats via a
  branch: `else if (raw && Array.isArray(raw.dispatches))`.

### Patterns & Conventions Observed

- `area_anchor` in TS-generated packets is always a short domain-area string from
  `DOMAIN_TO_AREA` (e.g. `"business-strategy"`, `"market-intelligence"`). In
  operator-authored packets it can be anything — confirmed by the PWRB dispatch where
  it is a 2-sentence business description.
- The dispatch contract (trial contract Section 4) only requires `area_anchor` to be
  "non-empty" — no length or format constraint in the contract itself.
- The SKILL.md Step 3 instruction for operator ideas says "Area anchor — which system,
  product area, or business domain does this touch?" which does not constrain format.

### Data & Contracts

- Types/schemas/events:
  - `dispatch.v1`: `area_anchor: string` (no format constraint in schema)
  - `dispatch.v2`: same, extends v1 with `why` + `intended_outcome`
  - Trial contract Section 4 requires `area_anchor` to be non-empty; no other constraint
- Persistence:
  - TS code writes `PersistedQueueState` (schema_version: "queue-state.v1", entries[])
  - Live queue file uses hand-authored format (queue_version: "queue.v1", dispatches[])
  - **These two formats have never converged in production.** The TS persistence layer has
    never written a single byte to the actual queue file.
  - `ideas.user.html` viewer handles both formats via conditional branch

### Dependency & Impact Map

- Upstream dependencies:
  - Operator invoking `/lp-do-ideas` (currently the only trigger source)
  - SKILL.md intake path drives 100% of queue content
- Downstream dependents:
  - `ideas.user.html` viewer — reads dispatches from queue-state.json
  - `/lp-do-fact-find` — receives `fact_find_ready` dispatches; SKILL.md says
    auto-execute immediately, but trial contract Section 2 (Option B) reserves
    `auto_executed` status and requires operator confirmation. These are in
    conflict; this brief does not change either — scope is SKILL.md intake rules
    only.
  - `/lp-do-briefing` — operator confirms `briefing_ready` dispatches
  - Trial precision measurement (Section 2 of trial contract) — poor content quality
    inflates false-positive rate and blocks escalation to Option C
- Likely blast radius of SKILL.md change:
  - All future operator-idea dispatches affected
  - Zero impact on TS code, CI, or existing dispatches
  - No schema changes required

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest (scripts package)
- Commands: `pnpm --filter scripts test`
- CI integration: yes (reusable-app.yml)

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Trial orchestrator (artifact_delta path) | Unit | `__tests__/lp-do-ideas-trial.test.ts` | Thorough — T1 matching, suppression, dedup, phases |
| Persistence adapter | Unit | `__tests__/lp-do-ideas-persistence.test.ts` | Covers persistOrchestratorResult, appendTelemetry |
| Classifier | Unit | `__tests__/lp-do-ideas-classifier.test.ts` | Covers classification tiers |
| Dispatch v2 validation | Unit | `__tests__/lp-do-ideas-dispatch-v2.test.ts` | validateDispatchV2 |
| Routing adapter | Unit | `__tests__/lp-do-ideas-routing-adapter.test.ts` | v1/v2 compatibility |
| operator_idea intake path | — | None | **Not tested anywhere** — this is entirely agent-executed |

#### Coverage Gaps

- Untested paths:
  - The operator-idea intake path is agent prose; no automated test coverage is possible
    (it's not TypeScript code).
  - The `area_anchor` format constraint (once added to SKILL.md) has no automated
    enforcement — it relies on agent compliance.
- Extinct tests: None identified

#### Testability Assessment

- Easy to test: None of the SKILL.md changes are automatically testable.
- Hard to test: Agent judgment on routing, area_anchor format, decomposition.
- Test seams: The only test seam is human review of queue-state.json content quality
  post-invocation. Consider adding a lint-style quality check script if needed (out of
  scope for this fix).

### Recent Git History (Targeted)

- `f4c6edfcfc` — "feat(bos): wire advisory classifier into trial orchestrator (TASK-04)"
  — added IdeaClassification; no SKILL.md changes
- `4b6a1f3964` — "feat(bos): add classifier tests (TASK-03) and evidence field intake
  guidance (TASK-06)" — added evidence field table to SKILL.md Step 3 (last SKILL.md
  change); no intake content-quality rules added
- `19b4c203f0` — "chore: checkpoint outstanding workspace changes"
- `7a0038cf0a` — "feat(lp-do-ideas-live): live orchestrator and mode-guard"
- `c6651c7447` — "feat(startup-loop): overhaul ideas layer, decision quality, and monitoring"

## Questions

### Resolved

- Q: Does fixing this require TypeScript code changes?
  - A: No. Operator-idea intake authoring is entirely handled by the skill (agent
    instructions). The TS orchestrator (`runTrialOrchestrator`) processes only
    `artifact_delta` events. Note: `TrialDispatchPacketV2.trigger` in the TS type
    definition does include `"operator_idea"` as a valid value (for classifier/routing
    compatibility), but no code path in the orchestrator authors or processes operator-idea
    packets — that is the skill's job. Adding rules to SKILL.md Steps 3 and 4 is
    sufficient for defects 1–3.
  - Evidence: `lp-do-ideas-trial.ts:123–150` — `TrialDispatchPacket` (v1) trigger typed
    `"artifact_delta"` only; `lp-do-ideas-trial.ts:217–256` — `TrialDispatchPacketV2`
    includes `"operator_idea"` in the trigger union type for compatibility.

- Q: Does the schema mismatch between TS persistence and the live queue file need to be
  fixed now?
  - A: No. Current operations work correctly: the viewer handles both formats, and
    operator-authored packets have never been through the TS persistence layer. The
    mismatch should be documented as a known-issues note in the SKILL.md, but resolving
    it (migrating the queue file to queue-state.v1 format) is separate work.
  - Evidence: `ideas.user.html` — branch `else if (raw && Array.isArray(raw.dispatches))`
    handles the legacy format. `lp-do-ideas-persistence.ts:55–65` shows the divergent
    TS schema.

- Q: Should existing bad dispatches (including PWRB 0023) be retroactively corrected?
  - A: Not in scope for this fix. The PWRB dispatch is `status: briefing_ready,
    queue_state: enqueued`. It can remain as-is in the queue; the operator is aware it
    is a progress report, not an actionable idea. The PWRB backfill gaps (IPEI agreement,
    hardware SKU, venue selection, brand name) can be submitted as fresh narrow dispatches
    after this fix is in.
  - Evidence: operator statement in conversation.

- Q: Should the "No hard keyword lists" statement in SKILL.md be corrected given the
  T1_SEMANTIC_KEYWORDS list in the TS code?
  - A: Clarify rather than correct. The statement is accurate for `operator_idea`
    routing (the agent exercises judgment, no hardcoded list). It is inaccurate for
    `artifact_delta` routing (T1 list controls it). Add one sentence to distinguish
    the two paths.
  - Evidence: `SKILL.md:112–120` "No hard keyword lists." vs `lp-do-ideas-trial.ts:26–48`
    `T1_SEMANTIC_KEYWORDS`.

- Q: What is a suitable `area_anchor` format constraint?
  - A: ≤12 words (guidance, not schema-enforced), no full sentences, no narrative prose.
    Format: `"<Business> <Artifact> — <gap in one clause>"`. Good examples (operator-authored):
    `"PWRB IPEI agreement — document empty, needs drafting"` (7 words),
    `"PWRB hardware SKU — no decision, needs supplier research"` (9 words).
    TS-generated packets use domain-area strings even shorter (e.g. `"business-strategy"`,
    `"market-intelligence"`). Bad example: PWRB 0023 area_anchor is a 2-sentence business
    description — the specific failure mode this rule prevents.
    Note: IDEA-DISPATCH-20260226-0024 area_anchor (`"RSC conversion for
    RoomsStructuredData + ExperiencesStructuredData…"`) is not a ≤12-word exemplar
    — it was operator-authored and exceeds the guideline. Do not cite it as a positive
    example of the word-count constraint.
  - Evidence: `lp-do-ideas-trial.ts:402–411` — `DOMAIN_TO_AREA` map shows TS-generated
    area anchors are always short domain strings. `queue-state.json:48–59` — PWRB 0023
    shows the bad pattern (narrative prose as area_anchor).

- Q: What events qualify as "administrative non-ideas" that should be suppressed?
  - A: Events that describe a startup-loop administrative action rather than a knowledge
    or planning gap. Confirmed suppressible: "new business registration / startup loop
    not yet formally started", "startup-loop stage advancement", "results-review completed
    with no new findings". These should produce `logged_no_action` with a note directing
    the operator to the relevant slash command.
  - Evidence: operator statement; SKILL.md routing intelligence section `logged_no_action`
    definition already covers "not material" — registration events fit this.

### Open (Operator Input Required)

- Q: Should the PWRB backfill gaps be submitted as fresh narrow dispatches immediately
  after this fix, or deferred?
  - Why operator input is required: depends on PWRB startup-loop priority vs other
    in-flight work.
  - Decision impacted: whether to run `/lp-do-ideas` for PWRB backfill gaps now.
  - Decision owner: operator
  - Default assumption: defer until after fix lands, then re-submit in one pass.

## Confidence Inputs

- Implementation: 95%
  - Evidence: changes are prose additions to SKILL.md. No ambiguous code to write.
  - To reach 100%: n/a — already near-ceiling for a doc change.

- Approach: 90%
  - Evidence: three distinct rules are well-scoped, independently verifiable against the
    bad example.
  - To reach ≥95%: confirm the `area_anchor` format exemplar with the operator before
    writing.

- Impact: 85%
  - Evidence: fixes the specific failure mode observed. Future operator-idea dispatches
    will be narrow and actionable. No automated enforcement — relies on agent compliance.
  - To reach ≥90%: add an example pair (good/bad) directly in the skill for each rule.

- Delivery-Readiness: 95%
  - Evidence: single file to edit (SKILL.md), no approvals needed, no CI risk.

- Testability: 40%
  - Evidence: content-quality rules cannot be unit-tested; they depend on agent judgment.
  - To raise to ≥80%: out of scope for this fix; would require a lint script over
    queue-state.json checking area_anchor word count etc.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Agent ignores new rules and continues writing narrative area_anchors | Medium | Medium | Add worked examples (good/bad pair) directly in SKILL.md to anchor the rule |
| "Administrative non-idea" list is too narrow and misses variants | Low | Low | Frame as a principle ("describes an admin action, not a knowledge gap") not an exhaustive list |
| area_anchor format rule is too tight for valid edge-case dispatches | Low | Low | Rule is guidance not schema-validated; agent may use up to ≤12 words with leeway for complex area names — never narrative sentences |
| Schema mismatch note in SKILL.md confuses future agents about persistence | Low | Medium | Keep note in a clearly-labelled "known issues" section, separate from intake rules |

## Planning Constraints & Notes

- Must-follow patterns:
  - SKILL.md changes must remain consistent with trial contract Section 4 (dispatch
    contract) — no new required fields, no changes to `area_anchor` schema validation
    (TS schema does not enforce word count).
  - Changes are additive only — no removal of existing intake guidance.
- Rollout/rollback expectations:
  - Instant rollout: skill change is effective on next invocation.
  - Rollback: revert SKILL.md commit. Zero downside risk.
- Observability expectations:
  - Post-fix: review next 2–3 operator-idea dispatches to confirm area_anchor format
    compliance.

## Suggested Task Seeds (Non-binding)

- TASK-01: Add `area_anchor` format constraint to SKILL.md Step 3 — include worked
  examples (one good, one bad).
- TASK-02: Add "one event → multiple narrow packets" decomposition rule to SKILL.md
  Step 4.
- TASK-03: Add administrative non-idea suppression rule to SKILL.md Step 4 routing
  intelligence (with suppression examples: business registration, stage advancement).
- TASK-04: Clarify "No hard keyword lists" statement in SKILL.md routing intelligence
  section — note that this applies to operator-idea routing only; artifact_delta uses
  T1_SEMANTIC_KEYWORDS in the TS code.
- TASK-05: Add a "known issues" note to SKILL.md about the queue-state.json format
  divergence (hand-authored `dispatches[]` vs TS persistence `entries[]`).

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - SKILL.md updated with all three intake rules + clarification note + known-issues note
  - Each rule accompanied by at least one worked example
  - No regressions to existing dispatch contract (trial contract Section 4)
- Post-delivery measurement plan:
  - Review next 2–3 operator-idea invocations; confirm `area_anchor` is ≤12 words
    (guidance, not schema-enforced) and not narrative prose or full sentences
  - Confirm PWRB backfill gaps are submitted as ≥4 separate narrow dispatches

## Evidence Gap Review

### Gaps Addressed

- [x] Citation integrity: all claims trace to file paths and line numbers.
- [x] Boundary coverage: TS code vs skill boundary explicitly mapped; persistence
  boundary (TS vs hand-authored) confirmed by inspecting both the code interface and
  the actual file content.
- [x] Testing coverage: confirmed no unit tests exist for the operator-idea intake path
  (expected — it's agent prose, not TS code).
- [x] Business validation: the bad example (PWRB 0023) is the primary evidence for all
  three defect claims.

### Confidence Adjustments

- Implementation: started at 90%, raised to 95% after confirming changes are SKILL.md
  only (no TS code changes).
- Testability: capped at 40% — content-quality rules are inherently not unit-testable.
  This is acceptable given the low complexity of the change.

### Remaining Assumptions

- The three rules are sufficient to prevent the observed failure mode. If agent models
  systematically ignore prose rules, a lint script over queue-state.json would be needed
  (deferred).
- The schema divergence between TS persistence and the live queue file is stable and
  will not cause operational problems before it is formally resolved.
