---
Type: Analysis
Status: Draft
Domain: Platform
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: xa-uploader-image-required-for-publish
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/xa-uploader-image-required-for-publish/fact-find.md
Related-Plan: docs/plans/xa-uploader-image-required-for-publish/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# XA Uploader — Image Required for Publish Analysis

## Decision Frame

### Summary

The fact-find described a data integrity bug: products with no images could be persisted as `publishState: "live"` when a staff member confirmed the `would_unpublish` dialog. Analysis investigation reveals this is **not accurate** — `route.ts:286` already calls `deriveCatalogPublishState(productInput)` at persist time, which always returns `"draft"` when `imageFiles` is empty. The server was hardened in a prior plan (`xa-uploader-media-path-and-publish-flow-hardening`).

The real remaining gap is UX-only: the client has no pre-save hard gate. Staff who set `publishState: "live"` with no images proceed through a misleading `would_unpublish` confirmation dialog instead of seeing a clear "add images first" error. The server silently downgrades them to draft regardless. This is confusing and makes the workflow feel broken.

The analysis decision is: add a client-side hard gate in `handleSaveImpl` that shows an inline field error when `publishState === "live"` and `imageFiles` is empty, before any save attempt is made.

### Goals

- Add a hard client-side gate that blocks a "publish without images" save attempt with an inline error.
- Preserve the `would_unpublish` confirmation flow as a server-side fallback (it is still useful as a last-resort guard).
- Ensure TC-01 and TC-02 regression tests are written against the existing correct server behavior.
- Ensure TC-03 tests the new client-side gate.

### Non-goals

- Server-side changes — the server already normalizes `publishState` via `deriveCatalogPublishState`.
- Storefront no-image fallback rendering.
- Image upload UI, R2 endpoint, or CDN changes.
- Any other xa-uploader feature work.

### Constraints & Assumptions

- Constraints:
  - Tests run in CI only.
  - English-only — internal tool.
  - `catalogConsoleActions.test.ts` has an established `handleSaveImpl` + `fetchMock` harness.
  - The server's `deriveCatalogPublishState` normalization must NOT be removed — it is defense-in-depth.
- Assumptions:
  - Staff can always save as "draft" (no images required for draft).
  - A live product with images being saved normally should never trigger the new gate.

## Inherited Outcome Contract

- **Why:** When staff add products using the main upload workflow, products can appear live in the store without images, which looks unprofessional and loses sales — shoppers browsing a luxury fashion brand expect visuals for everything.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Products cannot go live without at least one image.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/xa-uploader-image-required-for-publish/fact-find.md`
- Key findings used:
  - Bug site: `catalogConsoleActions.ts:459–462` — client retries with `confirmUnpublish: true` and unmodified `draft.publishState: "live"`.
  - `deriveCatalogPublishState()` already returns `"draft"` when `imageFiles` is empty.
  - **Critical correction from analysis investigation:** `route.ts:283–287` already builds `productForSave` with `publishState: deriveCatalogPublishState(productInput)`. The server does not use `withAutoCatalogDraftFields()` to construct `productForSave` in the POST handler at `route.ts:283–287` — it applies the derived state directly. The data integrity concern in the fact-find is already resolved.
  - `catalogConsoleActions.test.ts` has a full `handleSaveImpl` + fetch mock harness (B1–B3 suites). TC-03 is straightforward to add to B1.

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Blast radius | Narrow is mandatory — only the save action should change | Critical |
| Test coverage | TC-03 (client gate) must be verifiable with the existing harness | High |
| UX clarity | Staff need an explicit message, not a confusing dialog for this case | High |
| Defense-in-depth | Server normalization must remain intact regardless of client changes | Medium |
| Implementation simplicity | Small team; avoid over-engineering | Medium |

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A | Client-side hard gate in `handleSaveImpl`: check `publishState === "live" && imageFiles empty` before `doSave()`; set inline `imageFiles` field error and return `{ status: "error" }` | Minimal — one check before the save attempt; testable with existing harness; no new files | None significant | None — the check uses already-available draft fields | Yes |
| B | UI-layer gate in `CatalogProductForm`: disable/error the Save button when `publishState === "live" && !hasImages` | Earlier in the stack; gives visual feedback before user clicks Save | Requires component-level testing; harder to write a precise TC; more coupling | May interact with autosave logic if autosave bypasses the form gate | Yes |
| C | Client gate (A) + rewrite `would_unpublish` dialog text to distinguish the two cases | Better UX documentation | Additional string/i18n scope; dialog is already effectively dead-code for this path after A is added | Minor scope creep | Yes but out of scope |

## Engineering Coverage Comparison

| Coverage Area | Option A (client gate in action) | Option B (UI gate in form) | Chosen implication |
|---|---|---|---|
| UI / visual | Inline `imageFiles` field error set via `setFieldErrors`; existing error display renders it | Disabled/error state on Save button — requires form-layer conditional logic | A: re-uses existing field-error channel without new UI components |
| UX / states | Pre-save block; user sees field error immediately on Save attempt | Block at button level; earlier feedback | A is consistent with existing form validation UX pattern |
| Security / privacy | N/A — admin-only, no auth surface change | N/A | None |
| Logging / observability / audit | Add `uploaderLog("warn", "publish_blocked_no_images", {...})` in the guard branch | Same pattern possible | A is the right layer for action-level observability |
| Testing / validation | TC-03 adds to `catalogConsoleActions.test.ts` B1 suite using existing `fetchMock` + `setFieldErrors` mock | Requires new component test; `CatalogProductForm.test.tsx` exists but is heavier to extend | A: straightforward TC-03 in existing harness |
| Data / contracts | No schema or server changes; server normalization already in place | Same | No data contract change |
| Performance / reliability | Single synchronous pre-check before fetch; negligible | Same | None |
| Rollout / rollback | One function changed; clean git revert | Two layers changed | A is simpler to roll back |

## Chosen Approach

- **Recommendation:** Option A — client-side hard gate in `handleSaveImpl`.
- **Why this wins:** Narrowest blast radius. One check in one function, testable with the existing harness, uses the already-available `setFieldErrors` callback and `splitList` utility. Option B provides earlier visual feedback but requires component-layer changes with heavier test infrastructure and creates an implicit dependency between form state and button affordance that the existing save action flow doesn't need. The server already handles the data integrity case; the fix needed is UX clarity, and Option A delivers that at the right abstraction layer.
- **What it depends on:**
  - `splitList` from `@acme/lib` is available in `catalogConsoleActions.ts` context (or `draft.imageFiles` can be tested directly as `(draft.imageFiles ?? "").trim().length === 0`).
  - `setFieldErrors` callback is always passed to `handleSaveImpl` — confirmed in the existing test harness setup.

### Rejected Approaches

- Option B (UI gate in form) — viable but heavier: changes the component layer unnecessarily when the action layer already has the right callback contract for field errors.
- Option C (dialog rewrite) — out of scope: the `would_unpublish` dialog will no longer fire for the "no images" case once Option A is in place, making the rewrite low-value and adds i18n surface.

### Open Questions (Operator Input Required)

None. All decisions are resolvable from codebase evidence and business requirements.

## End-State Operating Model

| Area | Current state | Trigger | Delivered step-by-step end state | What remains unchanged | Risks / seams to carry into planning |
|---|---|---|---|---|---|
| Save attempt — imageless publish | `handleSaveImpl` proceeds to `doSave()` → POST → 409 `would_unpublish` → confirmation dialog → retry with `confirmUnpublish: true` → server saves as "draft" (silent downgrade) | Staff clicks Save with `publishState: "live"` and `imageFiles: ""` | `handleSaveImpl` checks `publishState === "live" && imageFiles empty` before `doSave()` → `setFieldErrors({ imageFiles: "<error message>" })` → returns `{ status: "error" }` → no POST made | 409 `would_unpublish` server path remains as last-resort guard; server normalization unchanged | None — the new check is purely additive |
| Save attempt — live product with images | Unchanged — products with images save normally | Staff saves product with `publishState: "live"` and `imageFiles` non-empty | Unchanged | All save paths | None |
| Save attempt — draft product with no images | Unchanged — can always save as draft | Staff saves product with `publishState: "draft"` | Unchanged | All draft save paths | None |
| Server persist normalization | `route.ts:286` calls `deriveCatalogPublishState(productInput)` — already normalizes | Any POST to `/api/catalog/products` | Unchanged — no server changes in this plan | Server normalization remains defense-in-depth | None |

## Planning Handoff

- Planning focus:
  - TASK-01: Add pre-save guard to `handleSaveImpl` in `catalogConsoleActions.ts`. Check `params.suppressUiBusy !== true` (skip for autosave) AND `draft.publishState === "live"` AND `(draft.imageFiles ?? "").trim() === ""` (no images). If all conditions true: call `setFieldErrors({ imageFiles: <error message> })`, log `uploaderLog("warn", "publish_blocked_no_images", { slug: draft.slug })`, and return `{ status: "error" }` — no fetch attempted.
  - TASK-02: Add TC-01 (server regression — POST imageless live with `confirmUnpublish: true` returns `publishState: "draft"`), TC-02 (happy path), and TC-03 (client gate — `handleSaveImpl` sets field error and returns error without fetch) to the existing test files. TC-01/TC-02 go in `route.test.ts`; TC-03 goes in `catalogConsoleActions.test.ts` B1 suite. **Note: TC-01 and TC-02 are regression guards that already pass with zero code changes — write them first to confirm the server baseline, then write TC-03 as the Red→Green test for the new client gate.**
- Validation implications:
  - TC-03 tests `handleSaveImpl` with `draft.publishState: "live"` and `draft.imageFiles: ""` — expects `result.status === "error"`, `setFieldErrors` called with `imageFiles` key, no fetch call.
  - TC-01 tests the server remains correct: POST with `publishState: "live"`, `imageFiles: ""`, `confirmUnpublish: true` → response has `product.publishState === "draft"`.
- Sequencing constraints:
  - No external dependencies. TASK-01 and TASK-02 can be written together in a single commit.
- Risks to carry into planning:
  - `splitList` import path in `catalogConsoleActions.ts` — needs to confirm the utility is accessible without new imports.
  - Error message string: `t("publishRequiresImage")` translation key may not exist yet. Either add to i18n or use hardcoded English (internal tool; i18n confirmed not required).

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| `splitList` not importable in `catalogConsoleActions.ts` | Low | Low | Import path unverified; direct string check is equivalent fallback | Use `(draft.imageFiles ?? "").trim() === ""` as fallback if splitList unavailable |
| `t("publishRequiresImage")` key missing | Medium | Low | Internal tool; i18n not required | Use hardcoded English string; add i18n key only if needed |
| Autosave fires gate and shows field errors during mid-edit | High | Medium | Gate must check `params.suppressUiBusy !== true` before blocking — autosave calls `handleSaveImpl` with `suppressUiBusy: true`, and firing the gate on autosave would show a field error on every background save while staff is mid-edit. Skip gate silently for autosave; only block explicit saves. | Resolved in planning handoff |

## Planning Readiness

- Status: Go
- Rationale: Approach is decisive, blast radius confirmed narrow (one function in `catalogConsoleActions.ts`, two test files), existing test harness is ready, no operator-only unknowns.
