---
Type: Build-Record
Status: Complete
Domain: Products
Workstream: Engineering
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: xa-uploader-cloud-parity-completion
Completed-date: 2026-03-09
artifact: build-record
Build-Event-Ref: docs/plans/xa-uploader-cloud-parity-completion/build-event.json
Relates-to charter: docs/business-os/business-os-charter.md
---

# Build Record: XA Uploader Cloud Parity Completion

## Outcome Contract

- **Why:** The hosted XA uploader path is mostly cloud-native now, but one remaining local-only operator flow still breaks parity and keeps the overall replatform state ambiguous.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** XA uploader hosted mode no longer depends on repo-local currency-rate state for routine operator flows, and the remaining local-FS cleanup question is reduced to an explicit follow-up decision.
- **Source:** operator

## What Was Built

TASK-01 established a canonical hosted-vs-local parity matrix for xa-uploader and narrowed the remaining replatform work to one bounded gap: currency-rate persistence. That removed ambiguity about whether the repo still needed a broad cloud migration or only one specific hosted blocker fixed.

TASK-02 moved hosted currency-rate storage onto the existing catalog contract boundary. `xa-drop-worker` now stores per-storefront currency-rate records behind catalog-token auth, `xa-uploader` reads and writes those rates through new contract-client helpers, and hosted sync plus hosted single-product publish both consume the same stored rates. Local-FS mode still uses repo-local JSON for deterministic local development.

TASK-03 rechecked the post-change parity state and closed the scoped plan. The parity matrix now records hosted currency-rate editing as complete and documents the remaining local-FS branches as environment-support paths such as local image writes and repo-local deploy-state files rather than hosted parity blockers.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @apps/xa-uploader typecheck` | Pass | Hosted currency-rate contract changes typecheck cleanly in uploader app. |
| `pnpm --filter @apps/xa-uploader lint` | Pass | Includes refactor needed to stay under repo complexity thresholds. |
| `pnpm --filter @apps/xa-drop-worker typecheck` | Pass | Worker contract route changes typecheck cleanly. |
| `pnpm --filter @apps/xa-drop-worker lint` | Pass | Worker route additions lint cleanly. |
| `bash scripts/validate-changes.sh` | Pass | Repo-required validation gate passed in shared worktree state. |
| `Jest / e2e` | Skipped | Repo policy says tests run in CI only. |

## Validation Evidence

### TASK-01
- TC-01: The parity matrix exists at `docs/plans/xa-uploader-cloud-parity-completion/cloud-parity-matrix.md` and identifies the remaining hosted gap as currency-rate persistence rather than a broad replatform.

### TASK-02
- Hosted currency-rate route no longer carries the old `currency_rates_local_fs_required` hosted gate.
- Hosted sync/publish now reference cloud currency-rate state and regression coverage was added across uploader and worker contract surfaces.
- Targeted app validation and the repo validation gate all passed.

### TASK-03
- Re-audit confirmed no remaining `currency_rates_local_fs_required` blocker in the currency-rate route.
- Re-audit confirmed surviving local-FS branches are dev/local support paths in `images` and deploy-state handling, not undocumented hosted parity blockers.
- Plan status, parity matrix, and completion artifacts were updated to record the decision not to open a local-FS cleanup tranche from this plan.

## Scope Deviations

- TASK-02 scope expanded from the original plan list to include `apps/xa-uploader/src/app/api/catalog/publish/route.ts`, `apps/xa-uploader/src/lib/catalogDraftToContract.ts`, and supporting tests because hosted single-product publish also computes catalog prices and needed to consume the same canonical currency-rate source as hosted sync.
- TASK-03 scope expanded to refresh `cloud-parity-matrix.md` because the checkpoint acceptance required re-checking the canonical matrix, not just changing plan/task status text.
