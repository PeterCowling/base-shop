---
Type: Results-Review
Status: Draft
Feature-Slug: startup-loop-why-intended-outcome-automation
Review-date: 2026-02-25
artifact: results-review
---

# Results Review

## Observed Outcomes

Pending — check back after first dispatch.v2 packet is processed in production. Expected: new builds using dispatch.v2 produce Build Summary rows with non-heuristic why_source.

## Standing Updates

- `docs/business-os/startup-loop/ideas/lp-do-ideas-dispatch.v2.schema.json` (new): additive v2 JSON schema file added; v1 schema unchanged.
- `scripts/src/startup-loop/lp-do-ideas-trial.ts`: added `IntendedOutcomeV2`, `TrialDispatchPacketV2`, `validateDispatchV2()`, `DispatchV2ValidationResult` exports; v1 types unchanged.
- `scripts/src/startup-loop/lp-do-ideas-routing-adapter.ts`: `AnyDispatchPacket` union updated; `routeDispatch()` now accepts `dispatch.v1` and `dispatch.v2`; `routeDispatchV2()` added; `extractCompatV1WhyFields()` pure helper added for v1 compat; `FactFindInvocationPayload` and `BriefingInvocationPayload` gain optional `why`, `why_source`, `intended_outcome` fields; `why_source` type extended to include `"compat-v1"`.
- `docs/plans/_templates/fact-find-planning.md`: `Trigger-Why` and `Trigger-Intended-Outcome` optional frontmatter fields added; `## Outcome Contract` non-omittable section added with `Why`, `Intended Outcome Type`, `Intended Outcome Statement`, `Source` sub-fields; Section Omission Rule updated to exempt `## Outcome Contract`.
- `docs/plans/_templates/plan.md`: `## Inherited Outcome Contract` section added with carry-through propagation rules.
- `docs/business-os/startup-loop/loop-output-contracts.md`: Artifact 3 (`build-record.user.md`) consumer list updated to include `lp-do-build-event-emitter.ts`; `## Outcome Contract` required section added to Artifact 3 spec; `build-event.json` added to path namespace summary table; `Build-Event-Ref` optional frontmatter field documented.
- `docs/plans/_templates/build-record.user.md`: `## Outcome Contract` section added as first content section; `Build-Event-Ref` frontmatter field documented.
- `scripts/src/startup-loop/lp-do-build-event-emitter.ts` (new): canonical build-event emitter with `emitBuildEvent()` (pure), `writeBuildEvent()` (atomic FS write), `readBuildEvent()` (null-safe), `getBuildEventPath()`, `getPlanDir()` exports; `BuildEvent` schema `schema_version: "build-event.v1"`, `why_source: "operator"|"auto"|"heuristic"|"compat-v1"`.
- `scripts/src/startup-loop/generate-build-summary.ts`: `tryLoadCanonicalBuildEvent()` helper added; `getWhyValue()` and `getIntendedValue()` updated to prefer canonical build event over heuristic extraction; heuristic fallback preserved for pre-migration artifacts.
- `scripts/src/startup-loop/lp-do-build-reflection-debt.ts`: `WARN_REFLECTION_SECTIONS`, `ReflectionWarnSection` type, `warn_sections` field, and `validateIntendedOutcomeCheck()` added; validation emits warn (non-blocking) when `## Intended Outcome Check` is missing or contains placeholder verdict.
- `docs/plans/_templates/results-review.user.md`: `## Intended Outcome Check` section added with `Intended:`, `Observed:`, `Verdict:`, `Notes:` sub-fields and warn-mode annotation comment.
- `docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-checklist.md`: Section I (Payload Quality Prerequisites) added with 3 no-go checkboxes; activation decision block updated to reference Section I; version bumped 1.1.0 → 1.2.0.
- `docs/plans/_archive/startup-loop-why-intended-outcome-automation/migration-guide.md` (new): v1→v2 migration steps, compat reader behaviour, `why_source` flag meanings, cutover policy (2026-03-27), and authorship guidance.

## New Idea Candidates

- None.

## Standing Expansion

Recommend expanding the standing pipeline on one point: update `.claude/skills/lp-do-build/SKILL.md` to include an explicit build-event emission step at build completion (call `writeBuildEvent()` after `build-record.user.md` is written, set `Build-Event-Ref` frontmatter in the corresponding strategy artifact). This was identified as a documentation impact in TASK-05 but was out of scope for this plan. Without it the canonical build-event path in `generate-build-summary.ts` is never activated in practice.

No other standing expansion is required. All template and contract changes are already in place.

## Intended Outcome Check

<!--
Warn mode (introduced TASK-06, startup-loop-why-intended-outcome-automation, 2026-02-25).
This section is non-blocking during the warn window. After one loop cycle (~14 days) it
will be promoted to a hard gate. A valid verdict keyword is required to clear the warn.
-->

- **Intended:** Introduce a contract-first pipeline (dispatch.v2 schema, template propagation, canonical build-event.json emitter, reflection debt expansion) that structurally eliminates the missing-field problem without fabricating data. Measured by: new builds using dispatch.v2 produce Build Summary rows with non-heuristic `why_source`.
- **Observed:** Pending — not yet observable (build completed 2026-02-25, requires live dispatch.v2 traffic).
- **Verdict:** Pending
- **Notes:** Revisit after the first full build that uses a dispatch.v2 packet end-to-end (fact-find → plan → build-record → build-event.json emitted → strategy artifact with `Build-Event-Ref` → Build Summary row). The compat-v1 cutover date is 2026-03-27; by that date all new dispatches should be v2 and `why_source: "compat-v1"` should no longer appear in new rows. Check Build Summary fill rates at that point to issue a final verdict.
