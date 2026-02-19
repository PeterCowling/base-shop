---
Type: Plan
Status: Draft
Domain: Platform
Workstream: Mixed
Last-reviewed: 2026-02-19
Relates-to: docs/business-os/business-os-charter.md
Created: 2026-02-19
Last-updated: 2026-02-19
Build-Progress: 1/3 tasks complete
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

Note: the `-v2` path naming is operator-directed (preserve progression history).
The runbook prefers stable canonical paths; this exception is documented.

## Context

v1 (`docs/plans/email-draft-quality-upgrade/plan.md`) delivered all 13 tasks including
`draft_refine` (TASK-11). However, the TASK-11 implementation used `@anthropic-ai/sdk`
to make a direct Anthropic API call from inside the MCP tool handler. This violates the
TASK-00 decision: *"implementation via AI agent CLI — no API calls in the resulting system"*.

The correct design: **Claude (running in the user's CLI session) performs the refinement
itself**, then calls `draft_refine` to submit and attest the result. The tool is a
deterministic attestation and quality-gate layer — no API calls, no SDK.

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
    → [Claude rewrites the draft — no API call]
    → MCP: draft_refine            (Claude submits refinedBodyPlain;
                                    tool validates quality + attests)
    → { refinement_applied: true, refinement_source: 'claude-cli',
        quality: { passed, failed_checks, warnings } }
```

## Input Contract Migration

`draft_refine` currently accepts `draft: { bodyPlain, bodyHtml }`. v2 changes this to
`originalBodyPlain + refinedBodyPlain`.

**Zero in-repo callers exist.** The `ops-inbox` skill was never updated to call
`draft_refine` (TASK-11 created the tool only; skill integration was deferred). TASK-01
and TASK-02 ship together, so the new schema is live before any in-repo caller exists.

**External MCP consumer guard:** An external MCP client (e.g. Claude Desktop) could
theoretically already call `draft_refine` with the old schema. Rather than a dual-schema
window, TASK-01 adds a schema guard: if the payload contains a `draft` field but no
`refinedBodyPlain`, the tool returns an `errorResult` with an explicit migration message.
This fails fast and visibly for any external caller rather than producing silent breakage
or corrupt output.

## Goals

- Correct `draft_refine` to a deterministic attestation tool with no internal API calls.
- Preserve the `refinement_source: 'claude-cli' | 'codex' | 'none'` tri-state contract
  from `decisions/v1-1-scope-boundary-decision.md`.
- Define explicit quality-failure semantics: soft-fail with transparency.
- Eliminate plain/HTML divergence by deriving `bodyHtml` from `refinedBodyPlain` in-tool.
- Remove `@anthropic-ai/sdk` dependency from `packages/mcp-server`.
- Add `ops-inbox` skill step where Claude refines then commits via `draft_refine`.
- Update `docs/testing-policy.md` to reflect attestation semantics (not LLM-call behavior).

## Non-goals

- Changing `draft_generate`, `draft_quality_check`, or `draft_interpret`.
- Altering the evaluation harness or regression fixtures.
- Redesigning the broader ops-inbox workflow beyond the refinement step.

## Constraints & Assumptions

- `refinement_source: 'codex'` is preserved in the type even though no Codex path is
  implemented; keeps the enum open for future CLI-based LLMs without a schema change.
- On quality failure: tool returns refined draft with `refinement_applied: true` and
  `quality.passed: false`. The caller (Claude in the CLI session) decides — retry, fall
  back to original, or escalate. Hard-failing loses information; `refinement_applied: false`
  on quality failure would be factually wrong.
- `bodyHtml` is always derived from `refinedBodyPlain` inside the tool. No `refinedBodyHtml`
  input accepted — eliminates plain/HTML divergence by design.
- `originalBodyPlain` (plain text only, no HTML) is retained in the input for one purpose:
  identity detection. If `refinedBodyPlain.trim() === originalBodyPlain.trim()`, the tool
  short-circuits with `refinement_applied: false, refinement_source: 'none'`.

## Plan Gates

- Foundation Gate: **Pass** — v1 baseline complete; scope is bounded to 3 S-effort tasks.
- Build Gate: **Pass** — all surfaces known, no scouts needed, confidence ≥ 80%.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Rework `draft_refine` tool: attestation pattern, remove SDK, new input schema | 90% | S | Complete (2026-02-19) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Update `ops-inbox` skill: Claude refines → calls `draft_refine` to commit | 90% | S | Pending | TASK-01 | - |
| TASK-03 | IMPLEMENT | Rewrite `draft-refine.test.ts` + update `testing-policy.md` semantics | 90% | S | Pending | TASK-01 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Core tool rework; unblocks all downstream |
| 2 | TASK-02, TASK-03 | TASK-01 | Skill update + test/docs rewrite in parallel |

## Tasks

### TASK-01: Rework `draft_refine` tool — attestation pattern, remove SDK, new input schema

- **Type:** IMPLEMENT
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-02-19)
- **Affects:**
  - `packages/mcp-server/src/tools/draft-refine.ts`
  - `packages/mcp-server/src/__tests__/draft-refine.test.ts`
  - `packages/mcp-server/package.json`
  - `pnpm-lock.yaml`
  - `packages/lib/src/growth/schema.ts` [scope expansion: pre-existing lint error exposed by lockfile change]
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 90%
  - Implementation: 90% — input schema change is bounded; `handleDraftQualityTool` importable directly; HTML derivation is a simple wrapper; schema guard is one Zod branch.
  - Approach: 90% — attestation pattern is simpler than the SDK pattern; no unknowns.
  - Impact: 95% — removes hidden API call, eliminates divergence, aligns with operator intent.

### Input schema (new)

```typescript
{
  actionPlan: EmailActionPlan,
  originalBodyPlain: string,  // used only for identity check (no-op detection)
  refinedBodyPlain: string,   // Claude's improved plain text; HTML derived internally
  context?: string,           // optional: why/what was refined
}
```

The old `originalDraft.bodyHtml` field (from the initial v2 draft) is intentionally excluded —
it was not used in any tool logic and carried unnecessary coupling. The HTML in output is
always derived from `refinedBodyPlain`.

### Schema guard for old callers

If the payload contains a `draft` field but no `refinedBodyPlain`, the tool returns:
```
errorResult("draft_refine input schema has changed: remove the `draft` field and supply `originalBodyPlain: string` + `refinedBodyPlain: string` instead.")
```

### Output schema (`codex` tri-state restored)

```typescript
{
  draft: { bodyPlain: string; bodyHtml: string },
  refinement_applied: boolean,
  refinement_source: 'claude-cli' | 'codex' | 'none',
  quality: { passed: boolean; failed_checks: string[]; warnings: string[] },
}
```

### Identity check

If `refinedBodyPlain.trim() === originalBodyPlain.trim()`:
→ `refinement_applied: false, refinement_source: 'none'`, run quality check on the body,
return unchanged draft. (Claude submitted the same text — no refinement occurred.)

### Quality failure semantics

- `refinement_applied: true` when refinement happened (text changed) and `refinedBodyPlain` provided.
- `quality` reflects `draft_quality_check` result always, regardless of pass/fail.
- Caller inspects `quality.passed` and `failed_checks` to decide next action.

### HTML derivation

Tool wraps `refinedBodyPlain` in standard HTML structure, splitting on double-newlines to
`<p>` tags. Matches structure used in existing quality-check test fixtures.

- **Acceptance:**
  - No `draft` field in new input schema.
  - Schema guard: payload with `draft` field but no `refinedBodyPlain` → `errorResult` with migration message.
  - `@anthropic-ai/sdk` removed from `packages/mcp-server/package.json`.
  - No Anthropic SDK import in `draft-refine.ts`.
  - `refinement_source` type is `'claude-cli' | 'codex' | 'none'` (tri-state preserved).
  - Identity check: unchanged text → `refinement_applied: false`.
  - Quality failure: refined draft returned with `refinement_applied: true`, `quality.passed: false` — no exception.
  - `bodyHtml` in output always derived from `refinedBodyPlain`.

- **Validation contract (TC-01):**
  - TC-01-01: valid `refinedBodyPlain` (changed text, passes quality) → `refinement_applied: true`, `refinement_source: 'claude-cli'`, `quality.passed: true`, `draft.bodyHtml` contains `<!DOCTYPE html>`.
  - TC-01-02: `refinedBodyPlain` identical to `originalBodyPlain` → `refinement_applied: false`, `refinement_source: 'none'`.
  - TC-01-03: `refinedBodyPlain` fails quality (contains "availability confirmed") → `refinement_applied: true`, `quality.passed: false`, named `failed_checks`, no exception.
  - TC-01-04: old-schema payload (`draft` field, no `refinedBodyPlain`) → `errorResult` with migration message string.
  - TC-01-05: missing `refinedBodyPlain` entirely (Zod parse fail) → `errorResult`.
  - TC-01-06: `grep -c "@anthropic-ai/sdk" packages/mcp-server/src/tools/draft-refine.ts` returns 0.
  - TC-01-07: `pnpm --filter @acme/mcp-server typecheck` exits 0; `pnpm --filter @acme/mcp-server lint` exits 0.
  - TC-01-08: `pnpm -w run test:governed -- jest -- --testPathPattern="draft-refine" --no-coverage` exits 0.

- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:**
  - Rollout: TASK-01 and TASK-02 treated as one logical release (zero in-repo callers until TASK-02 lands).
  - Rollback: revert `draft-refine.ts` and `package.json`; restore SDK dep.
- **Documentation impact:** None in TASK-01 — covered in TASK-03.

#### Build completion evidence (2026-02-19)

- Red: TC-01-01..05 failed, TC-01-06 failed (SDK string in source) → 5/6 fail confirmed.
- Green: Rewrote `draft-refine.ts` — removed SDK import, new input schema, schema guard, identity check, `deriveHtml()`, `runQualityGate()` via `handleDraftQualityTool`. TC-01-01..06 all pass.
- Refactor: `pnpm -w run test:governed -- jest -- --config packages/mcp-server/jest.config.cjs --no-coverage --maxWorkers=2` → 42 suites, 381 tests, all pass.
- TC-01-07: ESLint autofix applied (import sort); lint clean. TypeScript clean (`tsc -b` via turbo).
- TC-01-08: targeted run exits 0; 6/6 tests pass.
- Commit: `ce5bf75b0f` (includes pre-existing `@acme/lib` lint fix exposed by lockfile change).

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
  - Approach: 90% — flow is well-defined; wording is the only variable.
  - Impact: 90% — activates the corrected tool for the first time; becomes the first real caller.

- **Acceptance:**
  - Skill shows Claude (not a tool) rewrites the draft to address coverage gaps.
  - Skill shows `draft_refine` called with `originalBodyPlain` + `refinedBodyPlain`.
  - Skill explains `quality.passed` / `failed_checks` response: if `false`, Claude retries or escalates.
  - Skill notes `refinement_source: 'codex'` is reserved, not an active path.
  - Hard rules from v1 TASK-02 carried forward: no invented policy facts; cancellation/prepayment text uneditable.

- **Validation contract (TC-02):**
  - TC-02-01: skill doc contains `draft_refine` with `originalBodyPlain` + `refinedBodyPlain` parameters.
  - TC-02-02: skill doc explicitly names Claude as the refinement actor (not a tool call).
  - TC-02-03: skill doc includes handling instruction for `quality.passed: false`.
  - TC-02-04: cancellation/prepayment hard-rule preserved in refinement step.

- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:**
  - Rollout: publish updated skill; first moment `draft_refine` has a live in-repo caller.
  - Rollback: revert skill to v1 TASK-02 state (gap-patch loop, no `draft_refine` call).
- **Documentation impact:** Updates operator runbook with corrected refinement flow.

---

### TASK-03: Rewrite `draft-refine.test.ts` + update `testing-policy.md` semantics

- **Type:** IMPLEMENT
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `packages/mcp-server/src/__tests__/draft-refine.test.ts`
  - `docs/testing-policy.md`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — SDK mock removal simplifies the test file; tool is now fully deterministic; no external mocks needed.
  - Approach: 90% — `__esModule: true` hack resolved by design; new TCs are straightforward.
  - Impact: 85% — tests become more reliable and cover previously-missing paths (identity check, quality failure, schema guard).

### testing-policy.md update scope

The "LLM Refinement Stage" section currently describes the old LLM-call/fallback behavior
(lines 145, 153–154). It must be rewritten to describe the attestation pattern: Claude
refines, then calls `draft_refine` to commit; tool runs `draft_quality_check`; no LLM
call inside the tool. The governed runner command (`--testPathPattern="draft-refine"`) is unchanged.

### Why full mcp-server suite is required here

`pnpm --filter @acme/mcp-server typecheck` and the targeted `draft-refine` pattern cover
the changed files. The full suite (`jest.config.cjs`) is additionally required in TASK-03
because removing `@anthropic-ai/sdk` is a **dependency-level change** — targeted tests
won't catch module resolution failures in other mcp-server files that may transitively
reference or type-check against SDK types. One full-suite pass de-risks the removal.

- **Acceptance:**
  - No `jest.mock("@anthropic-ai/sdk")`, `MockAnthropic`, or `__esModule` in the test file.
  - TC-01-01..TC-01-08 implemented as jest tests.
  - Identity-check path (TC-01-02) explicitly tested.
  - Quality-failure path (TC-01-03) explicitly tested with an adversarial fixture.
  - Old-schema guard (TC-01-04) explicitly tested.
  - `testing-policy.md` "LLM Refinement Stage" section rewritten: attestation semantics, no LLM-call/fallback language.

- **Validation contract (TC-03):**
  - TC-03-01: `grep -c "jest.mock.*@anthropic-ai/sdk\|MockAnthropic\|__esModule" packages/mcp-server/src/__tests__/draft-refine.test.ts` returns 0 (no SDK mock or mock helpers in the file; the string "@anthropic-ai/sdk" may appear as a literal in TC-01-06's assertion).
  - TC-03-02: all TC-01-01..TC-01-08 assertions pass in targeted run.
  - TC-03-03: `testing-policy.md` no longer contains "LLM call" or "fallback" language in the refinement section; does contain "attestation" or "Claude refines".
  - TC-03-04: `pnpm -w run test:governed -- jest -- --testPathPattern="draft-refine" --no-coverage` exits 0.
  - TC-03-05: `pnpm --filter @acme/mcp-server typecheck` exits 0.
  - TC-03-06: `pnpm -w run test:governed -- jest -- --config packages/mcp-server/jest.config.cjs --no-coverage --maxWorkers=2` exits 0.
    *(Full suite required: SDK removal is a dependency-level change; targeted tests won't catch
    module resolution failures elsewhere in mcp-server. `--maxWorkers=2` per repo broader-run policy.)*

- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:** Test + docs only; rollback by reverting both files.
- **Documentation impact:** `docs/testing-policy.md` semantics corrected in-place.

---

## Risks & Mitigations

- `ops-inbox` skill wording could be ambiguous about whether Claude or a tool performs refinement.
  - Mitigation: TASK-02 acceptance requires Claude named as actor; `draft_refine` named as commit step.
- `codex` in the enum but no implementation may confuse future builders.
  - Mitigation: TASK-02 acceptance requires a note that `codex` is reserved, not active.
- Old-schema external callers receive an error rather than a graceful response.
  - Mitigation: error message includes an explicit migration pointer to this plan. Risk is low — `draft_refine` was shipped ≤24h ago.
- Removing `@anthropic-ai/sdk` may cause module resolution issues elsewhere in mcp-server.
  - Mitigation: full mcp-server suite required in TASK-03 specifically to catch this.

## Decision Log

- 2026-02-19: v2 plan created. v1 TASK-11 shipped wrong pattern (direct SDK call inside tool).
  Correct design: Claude (CLI) is the refinement intelligence; `draft_refine` is deterministic
  attestation + quality-gate. Clean break on input schema — zero in-repo callers exist; old-schema
  guard protects any external MCP clients. Tri-state `refinement_source` preserved per
  `decisions/v1-1-scope-boundary-decision.md`. Quality failure: soft-fail with transparency.
  `originalBodyPlain` retained (identity check only); `originalDraft.bodyHtml` removed as unused.
  Full-suite run required in TASK-03 due to SDK dependency removal risk.

## Overall-confidence Calculation

- S=1, M=2, L=3
- All tasks S-effort: `90 + 90 + 90 = 270`, weight = 3
- Overall-confidence: `270 / 3 = 90%`
