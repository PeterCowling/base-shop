---
Type: Plan
Status: Draft
Domain: Platform
Workstream: Mixed
Last-reviewed: 2026-02-19
Relates-to: docs/plans/email-draft-quality-upgrade/plan.md
Created: 2026-02-19
Last-updated: 2026-02-19
Build-Progress: Not started
Feature-Slug: email-draft-quality-upgrade-v2
Deliverable-Type: multi-deliverable
Execution-Track: mixed
Primary-Execution-Skill: lp-build
Supporting-Skills: lp-build
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); weighted by effort
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID: none
---

# Email Draft Quality Upgrade — v2 (draft_refine Design Correction)

## Context

v1 (`docs/plans/email-draft-quality-upgrade/plan.md`) delivered all 13 tasks including
`draft_refine` (TASK-11). However, the `draft_refine` implementation used `@anthropic-ai/sdk`
to make a direct Anthropic API call from inside the MCP tool handler. This is the wrong design.

The TASK-00 decision specified: *"implementation via AI agent CLI"*. The intent is that
**Claude (running in the user's CLI session) performs the refinement itself**, then calls
`draft_refine` to commit the result with attribution metadata. The tool is an attestation
and quality-gate layer — not a second LLM call.

## Correct Design

```
v1 (wrong):
  /ops-inbox → Claude CLI
    → MCP: draft_generate
    → MCP: draft_quality_check
    → MCP: draft_refine
         └── [hidden API call to Anthropic inside the tool]
         └── returns refined draft

v2 (correct):
  /ops-inbox → Claude CLI
    → MCP: draft_generate          (deterministic draft)
    → MCP: draft_quality_check     (identify gaps)
    → [Claude rewrites the draft, filling coverage gaps]
    → MCP: draft_refine            (Claude submits its refinement;
                                    tool validates quality + attests)
    → { refinement_applied: true, refinement_source: 'claude-cli' }
```

The refinement intelligence lives entirely in the CLI session. `draft_refine` becomes a
deterministic tool: accept original + refined drafts from Claude, run `draft_quality_check`
on the refined content, return attribution metadata.

## Goals

- Correct `draft_refine` to be a deterministic attestation tool with no internal API calls.
- Remove `@anthropic-ai/sdk` dependency from `packages/mcp-server`.
- Update `ops-inbox` skill to show Claude as the refinement intelligence.
- Keep `refinement_applied` / `refinement_source` metadata contract intact.

## Non-goals

- Changing any other tool (draft_generate, draft_quality_check, draft_interpret).
- Altering the evaluation harness or testing-policy.md beyond the draft-refine command update.
- Redesigning the ops-inbox workflow beyond the refinement step.

## Constraints & Assumptions

- `refinement_source: 'claude-cli'` remains the correct label — it now accurately describes
  the source (Claude running in the CLI, not a hidden SDK call).
- The `draft_quality_check` call inside `draft_refine` uses the already-tested handler
  directly (no new network calls).
- `ops-inbox` skill invokes `draft_refine` after Claude has already produced the refined text.

## Proposed Approach

Rework `draft-refine.ts` in-place: change input schema (add `refinedBodyPlain` +
`refinedBodyHtml`), remove SDK, run `draft_quality_check` internally, return attestation
result. Update skill and tests. Remove SDK dependency.

## Plan Gates

- Foundation Gate: **Pass** — v1 baseline is complete; scope is narrow and bounded.
- Build Gate: **Pass** — all surfaces are known, no open scouts, confidence ≥ 80%.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Rework `draft_refine` tool: attestation pattern, remove SDK, new input schema | 90% | S | Pending | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Update `ops-inbox` skill: Claude refines → calls `draft_refine` to commit | 90% | S | Pending | TASK-01 | - |
| TASK-03 | IMPLEMENT | Rewrite `draft-refine.test.ts`: remove SDK mock, test new schema | 90% | S | Pending | TASK-01 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Core tool rework; unblocks all downstream |
| 2 | TASK-02, TASK-03 | TASK-01 | Skill update + test rewrite in parallel |

## Tasks

### TASK-01: Rework `draft_refine` tool — attestation pattern, remove SDK, new input schema

- **Type:** IMPLEMENT
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `packages/mcp-server/src/tools/draft-refine.ts`
  - `packages/mcp-server/package.json`
  - `pnpm-lock.yaml`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 90%
  - Implementation: 90% — input schema change is bounded; `handleDraftQualityTool` is importable directly.
  - Approach: 90% — attestation pattern is simpler than the current SDK pattern; no unknowns.
  - Impact: 95% — removes hidden API call and aligns with operator intent.
- **Acceptance:**
  - `draft_refine` accepts `originalDraft` + `refinedBodyPlain` + optional `refinedBodyHtml`.
  - Tool calls `handleDraftQualityTool` internally on the refined content.
  - Returns `{ draft, refinement_applied: true, refinement_source: 'claude-cli', quality }`.
  - `@anthropic-ai/sdk` removed from `packages/mcp-server/package.json` dependencies.
  - No Anthropic SDK import in `draft-refine.ts`.
- **New input schema:**
  ```typescript
  {
    actionPlan: EmailActionPlan,
    originalDraft: { bodyPlain: string; bodyHtml: string },
    refinedBodyPlain: string,       // Claude's improved plain text
    refinedBodyHtml?: string,       // optional; falls back to originalDraft.bodyHtml
  }
  ```
- **Output schema (unchanged surface, no breaking change to downstream):**
  ```typescript
  {
    draft: { bodyPlain: string; bodyHtml: string },
    refinement_applied: boolean,
    refinement_source: 'claude-cli' | 'none',
    quality: { passed: boolean; failed_checks: string[]; warnings: string[] },
  }
  ```
- **Validation contract (TC-01):**
  - TC-01-01: valid `refinedBodyPlain` that passes quality check → `refinement_applied: true`, `refinement_source: 'claude-cli'`, `quality.passed: true`.
  - TC-01-02: `refinedBodyPlain` missing (Zod parse fail) → `errorResult` returned.
  - TC-01-03: no `@anthropic-ai/sdk` import present in `draft-refine.ts` (static assertion).
  - TC-01-04: governed runner passes — `pnpm -w run test:governed -- jest -- --testPathPattern="draft-refine" --no-coverage`.
- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:**
  - Rollout: ship reworked tool; ops-inbox skill update lands in TASK-02.
  - Rollback: revert `draft-refine.ts` and `package.json`; restore SDK dep.
- **Documentation impact:** None beyond `testing-policy.md` (command unchanged).

---

### TASK-02: Update `ops-inbox` skill — Claude refines, then calls `draft_refine` to commit

- **Type:** IMPLEMENT
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `.claude/skills/ops-inbox/SKILL.md`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — bounded to skill doc only; no code change.
  - Approach: 90% — the new flow is well-defined; prompt wording is the only variable.
  - Impact: 90% — aligns operator behaviour with the correct design.
- **Acceptance:**
  - Skill describes a step where Claude (not a tool) rewrites the draft to address coverage gaps.
  - Skill shows `draft_refine` called after Claude's rewrite, with `refinedBodyPlain` as Claude's output.
  - Skill explains `refinement_applied` / `refinement_source` metadata for audit purposes.
  - Hard rules (no invented policy facts, no cancellation/prepayment edits) carried forward from v1 TASK-02.
- **Validation contract (TC-02):**
  - TC-02-01: skill doc contains `draft_refine` call with `refinedBodyPlain` parameter.
  - TC-02-02: skill doc explicitly states Claude performs the refinement (not an internal API call).
  - TC-02-03: hard-rule preservation — cancellation/prepayment text remains uneditable in refinement step.
- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:**
  - Rollout: publish updated skill.
  - Rollback: revert skill to v1 TASK-02 version.
- **Documentation impact:** Updates operator runbook with corrected refinement flow.

---

### TASK-03: Rewrite `draft-refine.test.ts` — remove SDK mock, test new input schema

- **Type:** IMPLEMENT
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `packages/mcp-server/src/__tests__/draft-refine.test.ts`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — test patterns are established; SDK mock removal simplifies the file.
  - Approach: 90% — no external mocks needed; tool is now fully deterministic.
  - Impact: 85% — tests become more reliable without mock fragility (`__esModule: true` issue resolved by design).
- **Acceptance:**
  - No `jest.mock("@anthropic-ai/sdk")` or `MockAnthropic` in the test file.
  - TC-01-01..04 from TASK-01 implemented as jest tests.
  - Full mcp-server suite (42 suites) passes with zero regressions.
- **Validation contract (TC-03):**
  - TC-03-01: `grep "@anthropic-ai/sdk" draft-refine.test.ts` returns no matches.
  - TC-03-02: all TC-01-01..04 assertions pass.
  - TC-03-03: `pnpm -w run test:governed -- jest -- --testPathPattern="draft-refine" --no-coverage` exits 0.
- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:** Test-only change; rollback by reverting test file.
- **Documentation impact:** None.

---

## Risks & Mitigations

- `ops-inbox` skill wording could be ambiguous about who performs the refinement.
  - Mitigation: TASK-02 explicitly names Claude as the actor; `draft_refine` is the commit step.
- Removing `@anthropic-ai/sdk` may affect other packages if they reference mcp-server types.
  - Mitigation: SDK was only used in `draft-refine.ts`; no other mcp-server file imports it.

## Decision Log

- 2026-02-19: v2 plan created. v1 TASK-11 shipped the wrong pattern (direct SDK call inside tool).
  Correct design: Claude (CLI) is the refinement intelligence; `draft_refine` is a deterministic
  attestation + quality-gate tool. Referenced from v1 plan.

## Overall-confidence Calculation

- S=1, M=2, L=3
- All tasks S-effort: `90 + 90 + 90 = 270`, weight = 3
- Overall-confidence: `270 / 3 = 90%`
