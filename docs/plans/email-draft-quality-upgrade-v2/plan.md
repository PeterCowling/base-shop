---
Type: Plan
Status: Draft
Domain: Platform
Workstream: Mixed
Last-reviewed: 2026-02-19
Relates-to: docs/business-os/business-os-charter.md
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
`draft_refine` (TASK-11). However, the TASK-11 implementation used `@anthropic-ai/sdk`
to make a direct Anthropic API call from inside the MCP tool handler. This violates the
TASK-00 decision: *"implementation via AI agent CLI"*.

The correct design is that **Claude (running in the user's CLI session) performs the
refinement itself**, then calls `draft_refine` to submit and attest the result. The tool
is a deterministic attestation and quality-gate layer — no API calls, no SDK.

## Correct Design

```
v1 (wrong):
  /ops-inbox → Claude CLI
    → MCP: draft_generate
    → MCP: draft_quality_check
    → MCP: draft_refine
         └── [hidden Anthropic SDK call inside tool handler]

v2 (correct):
  /ops-inbox → Claude CLI
    → MCP: draft_generate          (deterministic draft)
    → MCP: draft_quality_check     (identify gaps)
    → [Claude rewrites the draft, filling coverage gaps — no API call]
    → MCP: draft_refine            (Claude submits refinedBodyPlain;
                                    tool validates quality + attests)
    → { refinement_applied: true, refinement_source: 'claude-cli',
        quality: { passed, failed_checks, warnings } }
```

## Input Contract Migration

`draft_refine` currently accepts `draft: { bodyPlain, bodyHtml }`. v2 changes this to
`originalDraft + refinedBodyPlain`. This is a **clean break** — zero production callers
exist. The `ops-inbox` skill was never updated to call `draft_refine` (TASK-11 created
the tool only; skill integration was deferred). TASK-01 and TASK-02 ship together, so
the new schema is live before any caller exists.

No dual-schema window or versioning shim is needed.

## Goals

- Correct `draft_refine` to a deterministic attestation tool with no internal API calls.
- Preserve the `refinement_source: 'claude-cli' | 'codex' | 'none'` tri-state contract
  from `decisions/v1-1-scope-boundary-decision.md`.
- Define explicit quality-failure semantics: soft-fail with transparency.
- Eliminate plain/HTML body divergence by deriving `bodyHtml` from `refinedBodyPlain`.
- Remove `@anthropic-ai/sdk` dependency from `packages/mcp-server`.
- Add `ops-inbox` skill step where Claude refines then commits via `draft_refine`.

## Non-goals

- Changing `draft_generate`, `draft_quality_check`, or `draft_interpret`.
- Altering the evaluation harness or regression fixtures.
- Redesigning the broader ops-inbox workflow beyond the refinement step.

## Constraints & Assumptions

- `refinement_source: 'codex'` is preserved in the type even though no Codex path is
  implemented; this keeps the enum open for future CLI-based LLMs.
- On quality failure: tool returns refined draft with `refinement_applied: true` and
  `quality.passed: false`. The caller (Claude in the CLI session) decides whether to
  retry, fall back to the original, or escalate. Hard-failing loses information;
  `refinement_applied: false` would be factually wrong.
- `bodyHtml` is always derived from `refinedBodyPlain` inside the tool (wrap in standard
  HTML structure). No `refinedBodyHtml` input accepted — eliminates plain/HTML divergence.

## Plan Gates

- Foundation Gate: **Pass** — v1 baseline complete; scope is bounded to 3 S-effort tasks.
- Build Gate: **Pass** — all surfaces known, no scouts needed, confidence ≥ 80%.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Rework `draft_refine` tool: attestation pattern, remove SDK, new input schema | 90% | S | Pending | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Update `ops-inbox` skill: Claude refines → calls `draft_refine` to commit | 90% | S | Pending | TASK-01 | - |
| TASK-03 | IMPLEMENT | Rewrite `draft-refine.test.ts`: remove SDK mock, test new schema and failure paths | 90% | S | Pending | TASK-01 | - |

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
  - Implementation: 90% — input schema change is bounded; `handleDraftQualityTool` is importable directly; HTML derivation is a simple wrapper.
  - Approach: 90% — attestation pattern is simpler than the SDK pattern; no unknowns.
  - Impact: 95% — removes hidden API call, eliminates plain/HTML divergence, aligns with operator intent.

### Input schema (new)

```typescript
{
  actionPlan: EmailActionPlan,
  originalDraft: { bodyPlain: string; bodyHtml: string },
  refinedBodyPlain: string,   // Claude's improved plain text — HTML derived internally
  context?: string,           // optional: why/what was refined
}
```

### Output schema (surface preserved; `codex` tri-state restored)

```typescript
{
  draft: { bodyPlain: string; bodyHtml: string },
  refinement_applied: boolean,                    // true if Claude submitted refinedBodyPlain
  refinement_source: 'claude-cli' | 'codex' | 'none',
  quality: { passed: boolean; failed_checks: string[]; warnings: string[] },
}
```

### Quality failure semantics

- `refinement_applied: true` always when `refinedBodyPlain` is provided (Claude did produce it).
- `quality` reflects the `draft_quality_check` result on the refined content, regardless of pass/fail.
- Caller inspects `quality.passed` and `quality.failed_checks` to decide next action.

### HTML derivation

Tool wraps `refinedBodyPlain` in a minimal HTML structure (`<!DOCTYPE html>...`), converting
double-newlines to `<p>` tags. This matches the structure used in existing quality-check
test fixtures. No `refinedBodyHtml` input is accepted.

- **Acceptance:**
  - `draft_refine` accepts `originalDraft` + `refinedBodyPlain`; no `draft` field in schema.
  - `@anthropic-ai/sdk` removed from `packages/mcp-server/package.json` dependencies.
  - No Anthropic SDK import in `draft-refine.ts`.
  - `refinement_source` type is `'claude-cli' | 'codex' | 'none'` (tri-state preserved).
  - Quality failure returns refined draft with `refinement_applied: true`, `quality.passed: false` — no exception thrown.
  - `bodyHtml` in output is always derived from `refinedBodyPlain`, never from `originalDraft.bodyHtml`.

- **Validation contract (TC-01):**
  - TC-01-01: valid `refinedBodyPlain` that passes quality check → `refinement_applied: true`, `refinement_source: 'claude-cli'`, `quality.passed: true`, `draft.bodyHtml` contains `<!DOCTYPE html>`.
  - TC-01-02: valid `refinedBodyPlain` that fails quality check (e.g. contains "availability confirmed") → `refinement_applied: true`, `quality.passed: false`, named `failed_checks`, no exception.
  - TC-01-03: missing `refinedBodyPlain` (Zod parse fail) → `errorResult` returned.
  - TC-01-04: `grep -c "@anthropic-ai/sdk" packages/mcp-server/src/tools/draft-refine.ts` returns 0.
  - TC-01-05: `pnpm --filter @acme/mcp-server typecheck` passes; `pnpm --filter @acme/mcp-server lint` passes.
  - TC-01-06: `pnpm -w run test:governed -- jest -- --testPathPattern="draft-refine" --no-coverage` exits 0.

- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:**
  - Rollout: TASK-01 and TASK-02 treated as one logical release (zero callers until TASK-02 lands).
  - Rollback: revert `draft-refine.ts` and `package.json`; restore SDK dep.
- **Documentation impact:** `testing-policy.md` governed runner command unchanged.

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
  - Approach: 90% — flow is well-defined; prompt wording is the only variable.
  - Impact: 90% — activates the corrected tool for the first time; first real caller.

- **Acceptance:**
  - Skill doc shows a step where **Claude** (not a tool) rewrites the draft to address coverage gaps identified by `draft_quality_check`.
  - Skill shows `draft_refine` called with `originalDraft` + `refinedBodyPlain` (Claude's output).
  - Skill explains `quality.passed` / `failed_checks` response: if `false`, Claude retries or escalates — does not silently accept a failed refinement.
  - Hard rules from v1 TASK-02 carried forward: no invented policy facts, cancellation/prepayment text uneditable in refinement step.
  - Skill does NOT describe `refinement_source: 'codex'` as an active path (reserved, not implemented).

- **Validation contract (TC-02):**
  - TC-02-01: skill doc contains `draft_refine` with `refinedBodyPlain` in the call shape.
  - TC-02-02: skill doc explicitly names Claude as the actor performing the rewrite.
  - TC-02-03: skill doc includes explicit handling instruction for `quality.passed: false`.
  - TC-02-04: hard-rule preservation — cancellation/prepayment text remains uneditable in the refinement step.

- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:**
  - Rollout: publish updated skill; this is the first moment `draft_refine` has a live caller.
  - Rollback: revert skill to v1 TASK-02 version (gap-patch loop, no `draft_refine` call).
- **Documentation impact:** Updates operator runbook with corrected refinement flow.

---

### TASK-03: Rewrite `draft-refine.test.ts` — remove SDK mock, test new schema and failure paths

- **Type:** IMPLEMENT
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `packages/mcp-server/src/__tests__/draft-refine.test.ts`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — SDK mock removal simplifies the file; tool is now fully deterministic; no external mocks needed.
  - Approach: 90% — test patterns established; `__esModule: true` hack resolved by design.
  - Impact: 85% — tests become more reliable and cover the previously-missing quality-failure path.

- **Acceptance:**
  - No `jest.mock("@anthropic-ai/sdk")`, `MockAnthropic`, or `__esModule` in the test file.
  - TC-01-01..TC-01-06 implemented as jest tests.
  - Quality failure path (TC-01-02) explicitly tested with an adversarial `refinedBodyPlain`.
  - Full mcp-server suite passes: `pnpm -w run test:governed -- jest -- --config packages/mcp-server/jest.config.cjs --no-coverage`.
  - `pnpm --filter @acme/mcp-server typecheck` passes.

- **Validation contract (TC-03):**
  - TC-03-01: `grep -c "@anthropic-ai/sdk" packages/mcp-server/src/__tests__/draft-refine.test.ts` returns 0.
  - TC-03-02: all TC-01-01..TC-01-06 assertions pass.
  - TC-03-03: quality-failure fixture (`refinedBodyPlain` containing "availability confirmed") produces `quality.passed: false` with named `failed_checks`.
  - TC-03-04: `pnpm -w run test:governed -- jest -- --testPathPattern="draft-refine" --no-coverage` exits 0.
  - TC-03-05: `pnpm --filter @acme/mcp-server typecheck` exits 0.

- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:** Test-only change; rollback by reverting test file.
- **Documentation impact:** None.

---

## Risks & Mitigations

- `ops-inbox` skill wording could be ambiguous about whether Claude or a tool performs refinement.
  - Mitigation: TASK-02 acceptance explicitly requires Claude named as actor; tool named as commit step.
- `codex` in the enum but no implementation may confuse future builders.
  - Mitigation: TASK-02 acceptance explicitly notes `codex` is reserved, not active.
- HTML derivation from plain text may differ visually from v1 HTML output.
  - Mitigation: `draft_quality_check` checks `bodyHtml` only for emptiness and signature; visual
    divergence is inconsequential for the quality gate. Operator sees plain text in Gmail compose.

## Decision Log

- 2026-02-19: v2 plan created. v1 TASK-11 shipped the wrong pattern (direct SDK call inside tool).
  Correct design: Claude (CLI) is the refinement intelligence; `draft_refine` is a deterministic
  attestation + quality-gate tool. Clean break on input schema — zero existing callers.
  Tri-state `refinement_source` preserved per `decisions/v1-1-scope-boundary-decision.md`.
  Quality failure: soft-fail with transparency (caller decides).

## Overall-confidence Calculation

- S=1, M=2, L=3
- All tasks S-effort: `90 + 90 + 90 = 270`, weight = 3
- Overall-confidence: `270 / 3 = 90%`
