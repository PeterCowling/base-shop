---
Type: Artifact
Status: Complete
Domain: UI
Workstream: Engineering
Created: 2026-02-23
Last-updated: 2026-02-23
Relates-to: docs/plans/xa-uploader-usability-hardening/plan.md
Task-ID: TASK-02
---

# XA Uploader Scope Decision (TASK-02)

## Decision Outcome
- Sync ownership decision: **Option A selected**.
  - Keep sync in uploader and harden route/UI failure handling.
- Auth UX scope decision: **Option C selected**.
  - Keep token-based auth this cycle and limit scope to token UX hardening only.

## Decision Owner and Date
- Decision owner: Operator (current session user).
- Decision method: direct operator instruction (`proceed`) against TASK-02 default recommendation.
- Decision date: 2026-02-23.

## Rationale
- Sync remains operationally important for uploader users; removing it would reduce workflow completeness for this cycle.
- Shared identity/session migration introduces broader architectural and security change risk than this usability-hardening iteration allows.
- This decision keeps the implementation bounded to reliability and operator feedback improvements.

## Downstream Task Impact
- TASK-03: **In scope**. Implement sync dependency preflight + actionable failure contract.
- TASK-04: **In scope** with token-only auth assumptions.
- TASK-09: **In scope** for sync failure recovery UX in E2E flows.
- No task removals required.

## Deferred Scope (Explicitly Out)
- Shared identity/session migration for uploader operators.
- Auth provider replacement or cross-app SSO rollout.
