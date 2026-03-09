---
Type: Build-Record
Status: Complete
Feature-Slug: xa-uploader-status-and-media-model-rewrite
Completed-date: 2026-03-06
artifact: build-record
Build-Event-Ref: docs/plans/xa-uploader-status-and-media-model-rewrite/build-event.json
---

# Build Record: XA Uploader Status and Media Model Rewrite

## Outcome Contract

- **Why:** The current xa-uploader product model and media workflow no longer match the confirmed operator requirements. The app already has the correct one-page shell, but the underlying status and image contracts are still built around `ready` state, numeric stock, and role-based media.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A planning-ready implementation path exists for xa-uploader to use `draft | live | out_of_stock` status semantics, `main image + additional photos` media semantics, predetermined registry-backed product entry, and the existing one-page sidebar/editor workflow.
- **Source:** operator

## What Was Built

The rewrite closed the two precursor investigations first: `replan-notes.md` now records the fail-closed cleanup policy for legacy CSV/cloud/runtime rows and the status-only cart behavior that replaces numeric stock semantics.

The main implementation then rewired the XA catalog contract across shared schema/helpers, uploader routes, uploader UI, CSV/runtime fixtures, and XA storefront consumers. Status now uses `draft | live | out_of_stock`, numeric stock is removed from the active operator contract, publish filtering no longer depends on `ready`, and storefront availability follows status rather than quantity fields.

Media handling was rewritten to one main image plus ordered additional photos across upload, persistence, export, and storefront gallery consumption. Regression fixtures, copy, and validation surfaces were updated to the new contract, and the closing checkpoint confirmed no downstream follow-up replan was required.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @apps/xa-uploader typecheck` | Pass | Recorded in TASK-04 completion evidence |
| `pnpm --filter @apps/xa-uploader lint` | Pass | Recorded in TASK-04 completion evidence |

## Validation Evidence

- TASK-06: `docs/plans/xa-uploader-status-and-media-model-rewrite/replan-notes.md` classifies each legacy surface as `discard`, `ignore on read`, or `regenerate`.
- TASK-07: `replan-notes.md` records the fixed-quantity, single-unit cart and stale-cart rule after stock removal.
- TASK-02: shared XA schema, uploader routes, storefront availability consumers, and checked-in catalog artifacts now implement status-only availability under the new enum.
- TASK-03: uploader media UI, upload/export flow, and XA storefront gallery consumers now use main-image plus ordered-photo semantics.
- TASK-04: regression fixtures and UI validation were updated to the rewritten contract, with typecheck and lint passing for the uploader package.
- TASK-05: the checkpoint closed the plan with no remaining downstream blockers after contract hardening.

## Scope Deviations

None. The post-build artifacts were backfilled on 2026-03-09 to close a stale build-completion gap; the implementation scope itself did not expand.
