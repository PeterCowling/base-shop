---
Type: Shared-Contract
Status: Active
---

# Engineering Coverage Matrix

Use this shared matrix for `Execution-Track: code | mixed` work across `lp-do-ideas`, `lp-do-fact-find`, `lp-do-analysis`, `lp-do-plan`, `lp-do-build`, and `lp-do-critique`.

Purpose:
- keep engineering coverage expectations in one place,
- reduce repeated skill prose,
- force explicit treatment of cross-cutting work that is often missed when plans focus only on the happy path.

## Canonical Coverage Areas

Use these labels verbatim in workflow artifacts and task contracts:

1. `UI / visual`
2. `UX / states`
3. `Security / privacy`
4. `Logging / observability / audit`
5. `Testing / validation`
6. `Data / contracts`
7. `Performance / reliability`
8. `Rollout / rollback`

Each row must be marked either:
- `Required` — the change materially affects this coverage area and the artifact must explain how it is handled
- `N/A` — not applicable for this change, with a short reason

Never leave a row implicit.

## Stage Expectations

### Ideas

`lp-do-ideas` stays thin. It does not validate the matrix, but for code-bearing ideas it should note likely impacted coverage areas when they are obvious from the operator description (for example: UI, security, observability, testing).

### Fact-Find

`fact-find.md` must include `## Engineering Coverage Matrix` for `code` and `mixed` work.

Goal:
- identify the current-state evidence, gaps, and likely carry-forward burden for each applicable area.

Recommended columns:
- `Coverage Area`
- `Applicable?`
- `Current-state evidence`
- `Gap / risk`
- `Carry forward to analysis`

### Analysis

`analysis.md` must include `## Engineering Coverage Comparison` for `code` and `mixed` work.

Goal:
- compare viable approaches across the same coverage areas, not just on implementation speed.

Recommended columns:
- `Coverage Area`
- `Option A`
- `Option B`
- `Chosen implication`

### Plan

`plan.md` must include `## Engineering Coverage` for `code` and `mixed` work.

Goal:
- state which tasks satisfy each coverage area and which areas are explicitly `N/A`.

Every `IMPLEMENT` task with `Execution-Track: code | mixed` must include an `Engineering Coverage` block with all canonical rows.

### Build

`build-record.user.md` must include `## Engineering Coverage Evidence` for `code` and `mixed` work.

Goal:
- prove which coverage areas were actually exercised, with evidence or explicit `N/A`.

## Row Guidance

### `UI / visual`
- Rendering path, visual design, design-system fit, layout, responsive presentation.

### `UX / states`
- Happy path, empty state, error state, loading state, recovery path, copy clarity.

### `Security / privacy`
- Auth/authz, untrusted input handling, sensitive data exposure, privacy/compliance implications.

### `Logging / observability / audit`
- Logs, metrics, traces, audit trail, operator diagnostics, alerting hooks, failure visibility.

### `Testing / validation`
- Automated tests, walkthrough validation, probes, governed commands, manual evidence where automation is impossible.

### `Data / contracts`
- Schema changes, return types, API contracts, config keys, persistence expectations, downstream consumers.

### `Performance / reliability`
- Hot paths, retry behavior, timeouts, durability, concurrency hazards, degraded-mode behavior, failure containment.

### `Rollout / rollback`
- Release path, migration ordering, feature flags, rollback trigger, rollback method, rollback verification.

## Deterministic Enforcement

Use:
- `scripts/validate-engineering-coverage.sh <artifact.md>`

The deterministic validator is advisory for idea intake and required for `fact-find.md`, `analysis.md`, `plan.md`, and `build-record.user.md` when `Execution-Track` is `code` or `mixed`.
