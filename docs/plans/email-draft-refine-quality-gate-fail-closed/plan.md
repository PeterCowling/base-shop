---
Type: Plan
Status: Complete
Domain: STRATEGY
Workstream: Code
Created: 2026-03-02
Last-reviewed: 2026-03-02
Last-updated: 2026-03-02 (TASK-01 complete)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: email-draft-refine-quality-gate-fail-closed
Deliverable-Type: code-change
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas
Overall-confidence: 95%
Confidence-Method: Direct code-path + targeted regression coverage
---

# Email Draft Refine Quality Gate Fail-Closed

## Summary

`draft_refine` currently treats quality-gate response parse failures as pass-with-warning. This creates a verification gap where the attestation layer can return `quality.passed: true` even when the gate response is malformed or an error payload. The fix is to enforce fail-closed behavior and add regression tests for malformed/error quality-gate outputs.

## Active tasks
- [x] TASK-01: Harden `draft_refine` quality gate handling to fail closed and add regression coverage

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Fail closed on quality gate parse/error paths and add regression tests | 95% | S | Complete (2026-03-02) | - | - |

## Tasks

### TASK-01: Harden `draft_refine` quality gate handling to fail closed and add regression coverage
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-02)
- **Affects:** `packages/mcp-server/src/tools/draft-refine.ts`, `packages/mcp-server/src/__tests__/draft-refine.quality-gate-fail-closed.test.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 95%
- **Acceptance:**
  - `runQualityGate` no longer reports `passed: true` when quality-gate parsing fails.
  - Error-shaped quality-gate responses are treated as failed checks.
  - New tests prove malformed/error quality-gate responses fail closed.
- **Validation contract (TC):**
  - TC-01: Malformed quality-gate payload -> `quality.passed === false` and failure marker present.
  - TC-02: ErrorResult from quality gate -> `quality.passed === false` and failure marker present.
  - TC-03: `pnpm --filter @acme/mcp-server typecheck` passes.
  - TC-04: `pnpm --filter @acme/mcp-server lint` passes.

#### Build evidence (2026-03-02)
- Updated `runQualityGate` in `draft-refine.ts` to fail closed on:
  - empty/missing quality tool response payloads,
  - `isError` responses from `draft_quality_check`,
  - malformed JSON or invalid JSON shape.
- Added regression tests in `draft-refine.quality-gate-fail-closed.test.ts` for both:
  - error-result quality responses,
  - malformed quality payload responses.
- Validation executed:
  - `pnpm --filter @acme/mcp-server typecheck` -> pass.
  - `pnpm --filter @acme/mcp-server lint` -> pass.
