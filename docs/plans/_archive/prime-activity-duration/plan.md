---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-14
Last-reviewed: 2026-03-14
Last-updated: 2026-03-14
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: prime-activity-duration
Dispatch-ID: IDEA-DISPATCH-20260313200000-PRIME-008
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 87%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/prime-activity-duration/analysis.md
---

# Prime Activity Duration Plan

## Summary

Staff currently have no way to create or edit activity instances in the Prime guest app without direct Firebase console access. The `durationMinutes` field already exists in the `ActivityInstance` type and RTDB schema but is optional with a hardcoded 120-minute fallback, making activity end times inaccurate for guests.

This plan builds a minimal staff-facing activity management UI: a new Cloudflare Pages Function (`activity-manage.ts`) as the privileged write layer, an `ActivityManageForm` component for create/edit, and an owner page at `/owner/activities` listing all instances. The existing `/chat/activities/manage` stub is updated to redirect to the new URL. No guest-facing changes or type migrations are required.

## Active tasks
- [x] TASK-01: Update `/chat/activities/manage` redirect to `/owner/activities`
- [x] TASK-02: New CF function `activity-manage.ts` — GET list + POST create + PATCH update
- [x] TASK-03: New `ActivityManageForm` component — create/edit mode with all fields
- [x] TASK-04: New owner page `/owner/activities` — list + create + edit
- [x] TASK-05: Unit tests — function validation and form validation

## Goals
- Staff can create and edit activity instances through the Prime app UI (no Firebase console needed).
- Activity cards show accurate end times derived from the stored `durationMinutes` field, not the hardcoded 120-minute default.

## Non-goals
- Guest-facing UI changes.
- Type changes to `ActivityInstance` (field is already present as `durationMinutes?: number`).
- Migration of existing Firebase records (fix is forward-only for new and edited instances).
- Full activity analytics dashboard, bulk operations, or template editing.

## Constraints & Assumptions
- Constraints:
  - Activity management is staff-only; the write function must use `enforceStaffOwnerApiGate` (`apps/prime/functions/lib/staff-owner-gate.ts`) — the owner-area API pattern (CF Access or `PRIME_STAFF_OWNER_GATE_TOKEN` secret). The full Firebase Bearer token path (`enforceStaffAuthTokenGate`) is not used here because the owner area has no Firebase ID token source for client components (`PinAuthProvider` is in the messaging context tree, not the owner layout).
  - Firebase RTDB is the persistence layer; writes go via `FirebaseRest.set()` / `FirebaseRest.update()` using service account credentials.
  - Cloudflare Pages Functions (`functions/api/`) are the server-side layer; no new Next.js API route is needed.
  - `durationMinutes` must remain optional in the type (backward-compat with legacy RTDB records).
- Assumptions:
  - `PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL` and `PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY` are set in the CF Pages environment (same env vars required by `aggregate-kpis.ts` and `staff-auth-session.ts`).
  - `CF_FIREBASE_DATABASE_URL` and `CF_FIREBASE_API_KEY` are set (required by existing FirebaseRest usage).
  - Owner page auth follows the same `canAccessStaffOwnerRoutes` pattern used by `apps/prime/src/app/owner/page.tsx`.

## Inherited Outcome Contract

- **Why:** Guests can be sent links to activity events that appear to end after exactly 2 hours regardless of how long the activity actually runs. Staff have no way to adjust this without a code change. Adding a duration field to the staff activity form means new activities will display accurate end times.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Staff can create and edit activity instances via the Prime app UI, setting a custom duration in minutes. Activity cards show accurate end times derived from data, not a hardcoded default.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/prime-activity-duration/analysis.md`
- Selected approach inherited:
  - Option B — Server-side Cloudflare Function for RTDB writes. Staff form POSTs to `POST /api/activity-manage` → function validates owner gate auth (`enforceStaffOwnerApiGate`) + payload → `FirebaseRest.set()` writes to `messaging/activities/instances/[newId]` using service account credentials. (Auth refined from analysis's `enforceStaffAuthTokenGate` to `enforceStaffOwnerApiGate` — see Decision Log.)
- Key reasoning used:
  - Firebase security rules for `messaging/activities/instances` are not confirmed in repo (unversioned). Client-side writes would require unverified rule changes; server-side avoids this entirely.
  - `enforceStaffOwnerApiGate` + `FirebaseRest` + service account is the correct owner-area API pattern — no Firebase client ID token needed.
  - Server-side validation (payload schema + `durationMinutes >= 1`) is cleaner and easier to unit-test than client-side Firebase emulator.

## Selected Approach Summary
- What was chosen:
  - New CF function `apps/prime/functions/api/activity-manage.ts` — handles GET (list), POST (create), and PATCH (update) with `enforceStaffOwnerApiGate` auth and `FirebaseRest` reads/writes.
  - New owner page `apps/prime/src/app/owner/activities/page.tsx` — staff UI for listing instances and launching the create/edit form.
  - New form component `apps/prime/src/components/activity-manage/ActivityManageForm.tsx` — create/edit mode with full field set and validation.
  - Redirect `/chat/activities/manage` → `/owner/activities` (replaces stub redirect to `/activities`).
- Why planning is not reopening option selection:
  - Analysis decisively chose Option B with explicit reasoning; all three options compared. No operator-only fork remains.

## Fact-Find Support
- Supporting brief: `docs/plans/prime-activity-duration/fact-find.md`
- Evidence carried forward:
  - `durationMinutes?: number` already in `ActivityInstance` at `apps/prime/src/types/messenger/activity.ts:38` — zero type changes.
  - `enforceStaffOwnerApiGate` confirmed at `apps/prime/functions/lib/staff-owner-gate.ts` — owner-area API gate (CF Access or secret token).
  - `FirebaseRest.set()/update()` confirmed at `apps/prime/functions/lib/firebase-rest.ts`.
  - `recordDirectTelemetry` confirmed at `apps/prime/functions/lib/direct-telemetry.ts` — used for activity create/edit audit trail.
  - Owner page auth: `canAccessStaffOwnerRoutes` from `apps/prime/src/lib/security/staffOwnerGate.ts`.
  - Existing manage page is a redirect stub with no UI — safe to repurpose.
  - ChatProvider loads activities with 20-instance limit filtered to live/upcoming; owner list must use a separate unrestricted RTDB query.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---:|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Update `/chat/activities/manage` redirect to `/owner/activities` | 95% | S | Complete (2026-03-14) | - | - |
| TASK-02 | IMPLEMENT | New CF function `activity-manage.ts` — GET list + POST create + PATCH update | 85% | M | Complete (2026-03-14) | - | TASK-04, TASK-05 |
| TASK-03 | IMPLEMENT | New `ActivityManageForm` component — create/edit mode | 88% | M | Complete (2026-03-14) | - | TASK-04, TASK-05 |
| TASK-04 | IMPLEMENT | New owner page `/owner/activities` — list + create + edit | 82% | M | Complete (2026-03-14) | TASK-02, TASK-03 | TASK-05 |
| TASK-05 | IMPLEMENT | Unit tests — function validation and form validation | 90% | S | Complete (2026-03-14) | TASK-02, TASK-03 | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | New owner page (activity list + form) at `/owner/activities` using owner-area design conventions | TASK-03, TASK-04 | Staff-only; no guest-facing visual change |
| UX / states | Form: empty/loading/saving/error/success states; list: empty state when no instances | TASK-03, TASK-04 | Form rejects invalid input before submit |
| Security / privacy | `enforceStaffAuthTokenGate` gates the function; owner page behind `canAccessStaffOwnerRoutes` guard | TASK-02, TASK-04 | No guest-facing API surface; no PII |
| Logging / observability / audit | `recordDirectTelemetry('write.success')` + structured console log on every successful create/edit | TASK-02 | Provides audit trail for staff RTDB writes |
| Testing / validation | Function unit tests (401, 400, correct write shape); form validation unit tests | TASK-05 | Mock `FirebaseRest` and `enforceStaffAuthTokenGate`; no RTDB emulator needed |
| Data / contracts | `ActivityInstance` type already typed with `durationMinutes?: number`; function validates payload before write | TASK-02 | No type changes; no RTDB schema migration |
| Performance / reliability | N/A — low-frequency staff-only write; no hot path concern | N/A | Infrequent write; no reliability mitigation needed |
| Rollout / rollback | Additive pages + function; rollback = revert form page to redirect stub and delete function | TASK-01, TASK-04 | No guest risk; zero guest-facing changes |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03 | - | All independent; can execute in parallel |
| 2 | TASK-04 | TASK-02, TASK-03 complete | Owner page depends on both function and form component |
| 3 | TASK-05 | TASK-02, TASK-03 complete | Tests depend on implementations but not on owner page |

## Delivered Processes

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| Staff creates an activity | Staff navigates to `/owner/activities` and clicks "Create" | Staff opens form (title, startTime, durationMinutes ≥ 1, status; optional: description, meetUpPoint, meetUpTime) → submits → frontend POSTs to `POST /api/activity-manage` → function validates owner gate auth (`enforceStaffOwnerApiGate`: CF Access or `PRIME_STAFF_OWNER_GATE_TOKEN`) → validates payload → writes to `messaging/activities/instances/[newId]` via `FirebaseRest.set()` → emits telemetry → returns 201 → form shows success → guest real-time listeners pick up new instance automatically | TASK-02, TASK-03, TASK-04 | Service account env vars must be set in CF Pages (pre-ship check); `PRIME_STAFF_OWNER_GATE_TOKEN` or CF Access must be configured in production |
| Staff edits an activity | Staff navigates to `/owner/activities` and clicks "Edit" on an existing instance | Form pre-populated with existing data → staff edits → submits → frontend sends `PATCH /api/activity-manage` with instance `id` in body → function validates owner gate auth + payload → `FirebaseRest.update()` on existing RTDB path → 200 → form shows success | TASK-02, TASK-03, TASK-04 | Function must reject id mismatch / missing id on PATCH |
| Guest views activity | Guest loads `/activities` | No change to guest view. For instances created with new form, `durationMinutes` is set; guest sees accurate end time. Legacy instances without the field continue using `?? 120` fallback. | None (existing code unchanged) | None; fully backward-compatible |
| Old `/chat/activities/manage` route | Staff navigates to old URL | Page now redirects to `/owner/activities` (was: redirect to `/activities`) | TASK-01 | Rollback: revert redirect target back to `/activities` |

## Tasks

---

### TASK-01: Update `/chat/activities/manage` redirect to `/owner/activities`

- **Type:** IMPLEMENT
- **Deliverable:** Updated redirect in `apps/prime/src/app/(guarded)/chat/activities/manage/page.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/prime/src/app/(guarded)/chat/activities/manage/page.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 96% — single prop change on `GuardedRouteRedirect`; current value (`/activities`) confirmed in fact-find
  - Approach: 95% — redirect is the established stub pattern; destination confirmed as `/owner/activities`
  - Impact: 95% — any staff bookmarking old URL will land on correct page
- **Acceptance:**
  - `GuardedRouteRedirect targetPath` is `/owner/activities` (not `/activities`).
  - No other changes to the file.
  - Expected user-observable behavior: navigating to `/chat/activities/manage` redirects to `/owner/activities`.
- **Engineering Coverage:**
  - UI / visual: N/A — redirect stub, no UI rendered
  - UX / states: N/A — redirect; no state
  - Security / privacy: N/A — redirect preserves existing guest session guard; no auth change
  - Logging / observability / audit: N/A — redirect only
  - Testing / validation: N/A — redirect tested implicitly via TASK-05 route test; no isolated unit needed
  - Data / contracts: N/A — no data change
  - Performance / reliability: N/A — single-line redirect
  - Rollout / rollback: Required — rollback: revert `targetPath` to `/activities`
- **Validation contract (TC-01):**
  - TC-01: Request to `/chat/activities/manage` → redirected to `/owner/activities` (status check in TASK-05 or manual verify)
- **Execution plan:**
  - Red: Not applicable (no test needed for a one-line redirect change).
  - Green: Change `targetPath="/activities"` to `targetPath="/owner/activities"` in `page.tsx`.
  - Refactor: None.
- **Planning validation (required for M/L):** None: S effort task
- **Scouts:** None: single-line change, no unknowns
- **Edge Cases & Hardening:** None: redirect stub; no logic
- **What would make this >=90%:** Already at 95%.
- **Rollout / rollback:**
  - Rollout: Ship with function + page (Wave 1); no guest risk.
  - Rollback: Revert `targetPath` to `/activities`.
- **Documentation impact:** None
- **Notes / references:**
  - Current file: `apps/prime/src/app/(guarded)/chat/activities/manage/page.tsx:6`

---

### TASK-02: New CF function `activity-manage.ts` — POST create + PATCH update

- **Type:** IMPLEMENT
- **Deliverable:** New file `apps/prime/functions/api/activity-manage.ts` — handles `GET` (list all instances), `POST` (create), and `PATCH` (update); all routes gated by `enforceStaffOwnerApiGate`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/prime/functions/api/activity-manage.ts`, `[readonly] apps/prime/functions/lib/staff-owner-gate.ts`, `[readonly] apps/prime/functions/lib/firebase-rest.ts`, `[readonly] apps/prime/functions/lib/firebase-custom-token.ts`, `[readonly] apps/prime/functions/lib/direct-telemetry.ts`, `[readonly] apps/prime/src/types/messenger/activity.ts`
- **Depends on:** -
- **Blocks:** TASK-04, TASK-05
- **Confidence:** 85%
  - Implementation: 87% — pattern fully established in `aggregate-kpis.ts` (service account → ID token → FirebaseRest write) and `staff-auth-token-gate.ts` (auth); new code is the composition of confirmed patterns
  - Approach: 85% — server-side write approach decisively chosen in analysis; `enforceStaffAuthTokenGate` confirmed as the correct auth utility
  - Impact: 83% — once deployed with correct env vars, function enables all RTDB writes; env var pre-ship check is the only real risk
- **Acceptance:**
  - `GET /api/activity-manage` with valid owner gate auth → 200, JSON object of all instances from `messaging/activities/instances` via `FirebaseRest.get()`.
  - `POST /api/activity-manage` with valid owner gate auth and valid payload → 201, RTDB write at `messaging/activities/instances/[newId]`.
  - `PATCH /api/activity-manage` with valid owner gate auth and valid `id` + payload → 200, RTDB update at existing path.
  - Request without CF Access header or `x-prime-access-token` (in production with feature disabled) → 403.
  - `durationMinutes: 0` or missing required field → 400.
  - Successful write emits `recordDirectTelemetry('write.success', ...)`.
  - Service account vars absent → 503 (environment not configured).
  - Expected user-observable behavior: staff form submits land, activity appears in guest list with accurate end time; owner list loads all instances on page load.
- **Engineering Coverage:**
  - UI / visual: N/A — server-side function only
  - UX / states: Required — function returns structured JSON error responses (400/401/403/503) that the form component renders
  - Security / privacy: Required — `enforceStaffOwnerApiGate` gates all requests (CF Access or `PRIME_STAFF_OWNER_GATE_TOKEN` secret token); no guest access; no Firebase client-side ID token required
  - Logging / observability / audit: Required — `recordDirectTelemetry('write.success')` + `console.log` structured event on successful write
  - Testing / validation: Required — unit tests in TASK-05: mock `FirebaseRest.set()`, `enforceStaffAuthTokenGate`, assert write path + payload shape, 401 unauthenticated, 400 invalid payload
  - Data / contracts: Required — payload validated before write: `id` (POST: auto-generated UUID or push key), `templateId`, `title`, `startTime`, `durationMinutes >= 1`, `status` required; `description`, `meetUpPoint`, `meetUpTime`, `createdBy` optional; PATCH requires `id`
  - Performance / reliability: N/A — infrequent staff-only write; no retry/timeout concern
  - Rollout / rollback: Required — additive new function file; rollback = delete function file
- **Validation contract (TC-02):**
  - TC-02a: Valid POST with `durationMinutes: 60`, all required fields → 201, `FirebaseRest.set` called with correct RTDB path `messaging/activities/instances/[id]` and payload including `durationMinutes: 60`
  - TC-02b: POST with `durationMinutes: 0` → 400 with error field
  - TC-02c: POST without owner gate auth (production + no CF Access + no secret token) → 403
  - TC-02d: Valid PATCH with existing `id` and updated `durationMinutes: 90` → 200, `FirebaseRest.update` called on `messaging/activities/instances/[id]`
  - TC-02e: PATCH without `id` in body → 400
  - TC-02f: Valid GET → 200, `FirebaseRest.get` called for `messaging/activities/instances`, returns instances object
- **Execution plan:**
  - Red: Write a test asserting TC-02c (403 on unauthenticated POST in production mode). The function doesn't exist yet → test imports fail → red confirmed.
  - Green: Implement `activity-manage.ts` using `enforceStaffOwnerApiGate` for auth on all methods (GET, POST, PATCH), payload validation on POST/PATCH, `exchangeCustomTokenForIdToken` (extracted to `apps/prime/functions/lib/firebase-id-token.ts`) + `FirebaseRest.get/set/update` for reads/writes, `recordDirectTelemetry` for audit. Handle `GET` (list all instances), `POST` (create with `crypto.randomUUID()`), and `PATCH` (update by `id`).
  - Refactor: Extract payload validation into a typed helper. Ensure error responses use `errorResponse()` from `firebase-rest.ts` for consistency.
- **Planning validation (required for M/L):**
  - Checks run: Confirmed `enforceStaffAuthTokenGate` returns `{ ok: true, identity }` or `{ ok: false, response }`. Confirmed `FirebaseRest.set(path, data, idToken)` and `FirebaseRest.update(path, data, idToken)` signatures in `firebase-rest.ts`. Confirmed `exchangeCustomTokenForIdToken` in `aggregate-kpis.ts:47-78` — needs local copy or import from lib.
  - Validation artifacts: `apps/prime/functions/lib/firebase-rest.ts`, `apps/prime/functions/lib/staff-auth-token-gate.ts`, `apps/prime/functions/api/aggregate-kpis.ts`
  - Unexpected findings: `exchangeCustomTokenForIdToken` is defined locally in `aggregate-kpis.ts`, not extracted to a lib. For TASK-02, either inline the exchange function or import from `aggregate-kpis` (not ideal). Build should extract it into `apps/prime/functions/lib/firebase-id-token.ts` as part of this task to avoid code duplication. This is a controlled expansion (same objective).
- **Scouts:**
  - Scout: Does `CF_FIREBASE_API_KEY` need to be in the function `Env` interface? → Yes; `enforceStaffAuthTokenGate` expects `StaffAuthTokenGateEnv.CF_FIREBASE_API_KEY` for the Firebase Lookup call. Add to `ActivityManageEnv`.
  - Scout: Does `CF_FIREBASE_DATABASE_URL` need to be present? → Yes; `FirebaseRest` reads it from env. Confirmed in `firebase-rest.ts`.
- **Edge Cases & Hardening:**
  - PATCH without an `id` field → 400 "id is required for update"
  - POST with `id` supplied by client → ignore client-supplied id; generate server-side to prevent path injection
  - `durationMinutes` as non-integer (e.g. 60.5) → round to integer or reject; plan: truncate and validate `>= 1`
  - `status` not in `['upcoming', 'live', 'archived']` → 400
  - Firebase ID token exchange failure (Identity Toolkit unavailable) → 503
- **What would make this >=90%:** Extracting `exchangeCustomTokenForIdToken` to a lib file (identified in Planning Validation above) removes the duplication risk. Confident this can be done cleanly in build. Would reach 90%+ with that resolved.
- **Rollout / rollback:**
  - Rollout: New function file; Pages automatically routes `functions/api/activity-manage.ts` to `/api/activity-manage`. No config change needed.
  - Rollback: Delete `activity-manage.ts`; owner page falls back to 404 on submit (recoverable).
- **Documentation impact:** None: staff-facing internal tool
- **Notes / references:**
  - Auth pattern: `apps/prime/functions/lib/staff-auth-token-gate.ts:184` — `enforceStaffAuthTokenGate`
  - Write pattern: `apps/prime/functions/api/aggregate-kpis.ts:80+` — service account → ID token → `FirebaseRest.set()`
  - Telemetry: `apps/prime/functions/lib/direct-telemetry.ts:41` — `recordDirectTelemetry`

---

### TASK-03: New `ActivityManageForm` component — create/edit mode

- **Type:** IMPLEMENT
- **Deliverable:** New file `apps/prime/src/components/activity-manage/ActivityManageForm.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/prime/src/components/activity-manage/ActivityManageForm.tsx`, `[readonly] apps/prime/src/types/messenger/activity.ts`
- **Depends on:** -
- **Blocks:** TASK-04, TASK-05
- **Confidence:** 88%
  - Implementation: 90% — React form with controlled inputs and fetch to CF function; fully standard pattern
  - Approach: 88% — create/edit mode distinction via `initialValues` prop; `durationMinutes` default 60, min 1 enforced
  - Impact: 87% — form is the primary staff UX surface; design quality matters
- **Acceptance:**
  - Component accepts `mode: 'create' | 'edit'` and `initialValues?: Partial<ActivityInstance>`.
  - Fields: title (required), startTime (datetime-local input, required), durationMinutes (number, min 1, default 60, required), status (select: upcoming/live/archived, required), description (optional text), meetUpPoint (optional text), meetUpTime (optional text).
  - On submit: POSTs to `/api/activity-manage` (create) or PATCHes (edit) with Authorization Bearer token from owner session.
  - Loading state: submit button disabled + spinner.
  - Error state: displays error message from function response.
  - Success state: calls `onSuccess()` callback prop.
  - Form rejects `durationMinutes <= 0` before submit (client-side validation).
  - Expected user-observable behavior: staff sees form with all fields, can fill and submit, sees loading indicator, then success/error feedback.
- **Engineering Coverage:**
  - UI / visual: Required — form layout using owner-area design conventions; labeled inputs, submit button, feedback areas
  - UX / states: Required — empty (create mode), pre-populated (edit mode), submitting, success, error states all handled
  - Security / privacy: Required — form sends requests to `/api/activity-manage`; auth is handled entirely at the function layer via `enforceStaffOwnerApiGate` (CF Access or secret token); form does not need to attach any client-side auth token (no Firebase Bearer token required)
  - Logging / observability / audit: N/A — logging handled at function layer (TASK-02)
  - Testing / validation: Required — form validation unit tests in TASK-05: required fields, durationMinutes min validation, mode switching
  - Data / contracts: Required — form output shape matches `ActivityInstance` required fields; `durationMinutes` typed as `number`
  - Performance / reliability: N/A — low-frequency staff form; no perf concern
  - Rollout / rollback: N/A — component only rendered from owner page; rollback = revert owner page
- **Validation contract (TC-03):**
  - TC-03a: Render in create mode → title field is empty, durationMinutes defaults to 60
  - TC-03b: Render in edit mode with `initialValues` → all fields pre-populated
  - TC-03c: Submit with `durationMinutes: 0` → client validation fires, no fetch call made
  - TC-03d: Submit with valid data → fetch called with correct method (POST/PATCH) and body shape
- **Execution plan:**
  - Red: Write test asserting TC-03c (zero durationMinutes triggers validation without fetch). No component yet → red.
  - Green: Build `ActivityManageForm.tsx` with controlled state, field definitions, client validation, fetch to `/api/activity-manage`, and state machine (idle/submitting/success/error).
  - Refactor: Extract field definitions to a typed config array if repetitive. Ensure accessibility (labels, error announcements).
- **Planning validation (required for M/L):**
  - Checks run: Confirmed `ActivityInstance` fields at `apps/prime/src/types/messenger/activity.ts:20-48`. Confirmed owner session provides access to Firebase ID token (owner page uses `canAccessStaffOwnerRoutes` server-side; client-side owner components access Firebase auth state for ID token). Need to confirm how the form client component obtains the ID token to pass as Bearer — likely via `getIdToken()` from Firebase client SDK (same SDK used by guest-facing components but for the owner session).
  - Validation artifacts: `apps/prime/src/types/messenger/activity.ts`, `apps/prime/src/app/owner/page.tsx`
  - Unexpected findings: The owner area has no `PinAuthProvider` or Firebase auth context for client components (confirmed: `grep PinAuthProvider apps/prime/src/app/owner/` returns empty). The function auth was updated to `enforceStaffOwnerApiGate` (CF Access or secret token) — no Firebase Bearer token needed from the form. The form submits plain `fetch()` calls; the auth gate at the function layer handles validation. No client-side auth attachment needed.
- **Scouts:** None: auth mechanism confirmed; no outstanding unknowns.
- **Edge Cases & Hardening:**
  - `startTime` in the past → allow submit (staff may create retroactive activities); no client-side block
  - Network failure on submit → error state shown; retry allowed without form reset
  - Long description → no client truncation; function will receive and write as-is
- **What would make this >=90%:** Confirming Firebase auth ID token access pattern in owner client components at build time. The existing pattern is expected to be straightforward.
- **Rollout / rollback:**
  - Rollout: Component is only imported by owner page (TASK-04); no guest exposure.
  - Rollback: Remove component import from owner page.
- **Documentation impact:** None
- **Notes / references:**
  - Activity type: `apps/prime/src/types/messenger/activity.ts:20-48`
  - Owner session auth context: confirmed via `canAccessStaffOwnerRoutes` in `apps/prime/src/lib/security/staffOwnerGate.ts`

---

### TASK-04: New owner page `/owner/activities` — list + create + edit

- **Type:** IMPLEMENT
- **Deliverable:** New file `apps/prime/src/app/owner/activities/page.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-14)
- **Build evidence:** `apps/prime/src/app/owner/activities/page.tsx` (server component + auth gate) and `apps/prime/src/app/owner/activities/ActivitiesPageClient.tsx` (client component: fetch instances, list, create/edit form toggle). TC-04a: `canAccessStaffOwnerRoutes()` gate applied — renders `StaffOwnerDisabledNotice` when denied. TC-04b–d: list, create/edit flow implemented. Committed as `f531d143b8`.
- **Affects:** `apps/prime/src/app/owner/activities/page.tsx`, `apps/prime/src/app/owner/activities/ActivitiesPageClient.tsx`, `[readonly] apps/prime/src/app/owner/page.tsx`, `[readonly] apps/prime/src/lib/security/staffOwnerGate.ts`
- **Depends on:** TASK-02, TASK-03
- **Blocks:** TASK-05
- **Confidence:** 82%
  - Implementation: 83% — owner page server component pattern established in `apps/prime/src/app/owner/page.tsx`; RTDB read for all instances is the main implementation detail
  - Approach: 82% — separate RTDB query (not ChatProvider) needed for owner list; query pattern for all instances (no filter by status, no 20-limit) is straightforward but unconfirmed in existing owner code
  - Impact: 82% — page is the only staff entry point for activity management; must work correctly for the feature to be usable
- **Acceptance:**
  - Page renders at `/owner/activities` for authenticated staff.
  - Lists all activity instances from RTDB (including archived); not filtered by status; not limited to 20.
  - Each instance shows: title, startTime, durationMinutes (or "120 (default)" if absent), status.
  - "Create Activity" button opens `ActivityManageForm` in create mode.
  - Each instance has an "Edit" button that opens `ActivityManageForm` in edit mode with pre-populated values.
  - `canAccessStaffOwnerRoutes` gate applied; unauthorized requests see `StaffOwnerDisabledNotice`.
  - Empty state shown when no instances exist.
  - Expected user-observable behavior: staff can navigate to `/owner/activities`, see all existing activities, create new ones, and edit existing ones.
- **Engineering Coverage:**
  - UI / visual: Required — page layout using owner-area conventions; table or card list of instances; create/edit buttons
  - UX / states: Required — loading (async RTDB fetch), empty state, list state, form open (modal or inline), form success (list refreshes)
  - Security / privacy: Required — `canAccessStaffOwnerRoutes` guards the server component; form Bearer token gates the function write
  - Logging / observability / audit: N/A — no additional logging at page layer; function handles write audit
  - Testing / validation: N/A — page integration tested manually (owner pages are server components; unit testing server component RTDB reads is not standard in this codebase)
  - Data / contracts: Required — RTDB read for all instances at `messaging/activities/instances`; no 20-limit; no status filter; returns `Record<string, ActivityInstance>`
  - Performance / reliability: Required — RTDB read is one-time page load (not real-time subscription); acceptable for low-frequency owner view; owner page does not need real-time updates
  - Rollout / rollback: Required — new additive page; rollback = delete page file; guest-facing area unaffected
- **Validation contract (TC-04):**
  - TC-04a: Unauthenticated request to `/owner/activities` → `StaffOwnerDisabledNotice` shown (same as other owner pages in production)
  - TC-04b: Authenticated staff navigates to page → list of activity instances rendered (manual verification post-deploy)
  - TC-04c: "Create" button clicked → `ActivityManageForm` rendered in create mode
  - TC-04d: "Edit" button on an instance clicked → `ActivityManageForm` rendered in edit mode with correct initial values
- **Execution plan:**
  - Red: Not applicable — server component page; manual walkthrough is the primary validation.
  - Green: Create `apps/prime/src/app/owner/activities/page.tsx` as async server component. Apply `canAccessStaffOwnerRoutes` gate. Fetch `messaging/activities/instances` from Firebase RTDB (using `FirebaseRest.get()` with service account ID token — same pattern as aggregate-kpis). Render list. Include client component for form toggle (modal or inline state machine).
  - Refactor: Ensure list renders correctly for both empty state and populated state. Confirm RTDB read uses the correct Firebase ID token path for server-component reads.
- **Planning validation (required for M/L):**
  - Checks run: Confirmed `canAccessStaffOwnerRoutes` in `apps/prime/src/lib/security/staffOwnerGate.ts`. Checked `FirebaseRest` for read methods — found `get()` not explicitly listed in the summary but `firebase-rest.ts` likely has it given it has set/update. Build should confirm `FirebaseRest.get()` exists or implement the read via `fetch` with Firebase REST API directly (same pattern as other functions).
  - Validation artifacts: `apps/prime/src/app/owner/page.tsx`, `apps/prime/functions/lib/firebase-rest.ts`
  - Unexpected findings: Owner page is a Next.js server component. RTDB read uses `GET /api/activity-manage` (added to TASK-02 scope) which returns all instances via `FirebaseRest.get()` (confirmed at `firebase-rest.ts:51`). This is simpler than server component direct Firebase reads and consistent with the function-based write pattern.
- **Scouts:** None: `FirebaseRest.get()` confirmed at `firebase-rest.ts:51`; `GET /api/activity-manage` added to TASK-02 scope. No outstanding unknowns.
- **Edge Cases & Hardening:**
  - Many instances (>100) — RTDB `GET /messaging/activities/instances` returns all; no pagination needed for staff view at this stage
  - Instance with no `durationMinutes` → display "120 (default)" so staff understands it was not explicitly set
  - RTDB read failure → show error state, not crash
- **What would make this >=90%:** Confirming `FirebaseRest.get()` exists before build; and confirming `GET /api/activity-manage` is added to TASK-02 scope. Both are low-risk resolutions.
- **Rollout / rollback:**
  - Rollout: New page at `/owner/activities`; zero guest exposure. Link from owner dashboard (`/owner`) optional but not required for launch.
  - Rollback: Delete page file.
- **Documentation impact:** None
- **Notes / references:**
  - Planning finding: TASK-02 should also expose `GET /api/activity-manage` to serve instance list to the owner page (rather than owner page doing direct RTDB reads as a server component). Build should confirm and expand TASK-02 scope accordingly.

---

### TASK-05: Unit tests — function validation and form validation

- **Type:** IMPLEMENT
- **Deliverable:** New test file `apps/prime/src/test/activity-manage/activity-manage.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Build evidence:** `apps/prime/functions/api/__tests__/activity-manage.test.ts` (TC-02a–f) and `apps/prime/src/components/activity-manage/__tests__/ActivityManageForm.test.tsx` (TC-03c–d). Committed as `98378acb72`.
- **Affects:** `apps/prime/functions/api/__tests__/activity-manage.test.ts`, `apps/prime/src/components/activity-manage/__tests__/ActivityManageForm.test.tsx`, `[readonly] apps/prime/functions/api/activity-manage.ts`, `[readonly] apps/prime/src/components/activity-manage/ActivityManageForm.tsx`
- **Depends on:** TASK-02, TASK-03
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 91% — mock patterns for Firebase and fetch well established in this codebase; no new test infrastructure needed
  - Approach: 90% — unit tests with mocked `FirebaseRest`, `enforceStaffAuthTokenGate`, and `fetch`; no RTDB emulator needed
  - Impact: 89% — tests provide regression guard on the most critical scenarios (auth rejection, payload validation, write shape)
- **Acceptance:**
  - TC-02a passes: valid POST → `FirebaseRest.set` called with correct path and payload shape including `durationMinutes`.
  - TC-02b passes: `durationMinutes: 0` → 400.
  - TC-02c passes: no Authorization header → 401.
  - TC-02d passes: valid PATCH → `FirebaseRest.update` called on correct path.
  - TC-02e passes: PATCH without `id` → 400.
  - TC-03c passes: form with `durationMinutes: 0` → client validation prevents fetch.
  - TC-03d passes: form submit with valid data → fetch called with correct POST body shape.
- **Engineering Coverage:**
  - UI / visual: N/A — tests cover logic, not visual rendering
  - UX / states: Required — form state machine tested (TC-03c, TC-03d)
  - Security / privacy: Required — TC-02c (401 on missing auth) is the security regression test
  - Logging / observability / audit: N/A — telemetry emit is a side effect; not unit-tested
  - Testing / validation: Required — this task IS the testing coverage
  - Data / contracts: Required — TC-02a asserts correct RTDB path and payload shape with `durationMinutes` field
  - Performance / reliability: N/A
  - Rollout / rollback: N/A
- **Validation contract (TC-05):**
  - TC-05: All TCs listed in Acceptance (TC-02a through TC-02f, TC-03c, TC-03d) run and pass under `pnpm --filter prime test` (governed Jest entrypoint per testing-policy.md)
  - TC-01 (redirect): manual verify — navigate to `/chat/activities/manage` → confirms redirect to `/owner/activities`
- **Execution plan:**
  - Red: Run `pnpm --filter prime test activity-manage` → file not found → red confirmed.
  - Green: Write test file. Mock `enforceStaffAuthTokenGate` to return `{ ok: false, response: 401 }` for unauthenticated tests and `{ ok: true, identity: { uid: 'staff_1', role: 'staff', claims: {} } }` for authenticated tests. Mock `FirebaseRest.set()` and `FirebaseRest.update()` as jest.fn(). Assert call args for correct path and payload. For form tests: mock `fetch` and assert call args.
  - Refactor: Consolidate mock setup into `beforeEach`. No test duplication.
- **Planning validation (required for M/L):** None: S effort task
- **Scouts:** None: established mock patterns in codebase
- **Edge Cases & Hardening:**
  - Test the `status` enum validation: invalid status string → 400.
  - Test telemetry call: `recordDirectTelemetry` called once on success (spy assertion).
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: Test file is CI-only; ships alongside implementation.
  - Rollback: Delete test file if implementation is reverted.
- **Documentation impact:** None
- **Notes / references:**
  - Testing policy: `docs/testing-policy.md` — governed Jest runner; run tests only in CI (push and `gh run watch`)

---

## Risks & Mitigations
- **Service account env vars not set in CF Pages:** Low likelihood (already required by `aggregate-kpis.ts` in production). Impact: High — function writes fail. Mitigation: pre-ship verification step; add to TASK-02 build evidence.
- **`PRIME_STAFF_OWNER_GATE_TOKEN` not set in CF Pages and CF Access not configured for owner APIs:** Medium likelihood (auth mechanism for owner APIs depends on environment setup). Impact: High in production — all `/api/activity-manage` calls fail with 403. Mitigation: verify CF Pages secrets for `PRIME_STAFF_OWNER_GATE_TOKEN` pre-ship; alternatively, enable `PRIME_ENABLE_STAFF_OWNER_ROUTES=true` to bypass gate (dev/staging only).
- **`FirebaseRest.get()` absent:** Low likelihood. Impact: Medium — owner page needs a GET endpoint on TASK-02 (already noted as a planned expansion). Mitigation: Build confirms and expands TASK-02 scope to add GET handler if needed.
- **Staff ID token unavailable in owner client component for form Bearer header:** Low likelihood — Firebase auth is initialized for owner session. Impact: Medium — form cannot authenticate. Mitigation: Confirm at TASK-03 build time; `firebase.auth().currentUser?.getIdToken()` is the standard path.
- **Firebase security rules block service account write to `messaging/activities/instances`:** Very low likelihood — service account bypasses client rules. Impact: High if triggered. Mitigation: test with real RTDB in staging before production deploy.

## Observability
- Logging: `console.log` structured event on every create/edit in `activity-manage.ts` (staff uid, action type, instance id).
- Metrics: `recordDirectTelemetry('write.success')` counter in KV via `RATE_LIMIT` namespace.
- Alerts/Dashboards: `direct-telemetry` metrics visible in `DirectTelemetryPanel` on owner dashboard.

## Acceptance Criteria (overall)
- [ ] Staff can navigate to `/owner/activities` and see all existing activity instances.
- [ ] Staff can create a new activity instance with `durationMinutes >= 1`; instance appears in guest activity list with correct end time.
- [ ] Staff can edit an existing activity instance including `durationMinutes`; guest view updates in real time.
- [ ] `POST /api/activity-manage` rejects unauthenticated requests with 401.
- [ ] `POST /api/activity-manage` rejects `durationMinutes: 0` with 400.
- [ ] Navigating to `/chat/activities/manage` redirects to `/owner/activities`.
- [ ] Unit tests pass for function auth, payload validation, and form validation.

## Decision Log
- 2026-03-14: Chosen approach is server-side CF function (Option B from analysis); client-side write (Option A) rejected due to unconfirmed Firebase security rules for `instances` path. See `docs/plans/prime-activity-duration/analysis.md`.
- 2026-03-14: TASK-02 scope expanded to include `GET /api/activity-manage` (serve instance list to owner page); cleaner than server component direct RTDB read. `FirebaseRest.get()` confirmed at `firebase-rest.ts:51`.
- 2026-03-14: `exchangeCustomTokenForIdToken` function (currently local to `aggregate-kpis.ts`) to be extracted to `apps/prime/functions/lib/firebase-id-token.ts` during TASK-02 build to avoid duplication. Controlled expansion within TASK-02 objective.
- 2026-03-14: Auth mechanism for `activity-manage.ts` changed from `enforceStaffAuthTokenGate` (Firebase Bearer ID token) to `enforceStaffOwnerApiGate` (CF Access or `PRIME_STAFF_OWNER_GATE_TOKEN` secret). Rationale: `PinAuthProvider` (which stores the Firebase ID token for client components) is in the messaging context tree and is not instantiated in the owner area — confirmed by grep. `enforceStaffOwnerApiGate` is the correct auth pattern for owner-area API calls and provides appropriate security without requiring a client-side Firebase ID token.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Update redirect | Yes — manage page confirmed as redirect stub; `GuardedRouteRedirect` component confirmed | None | No |
| TASK-02: CF function | Yes — `enforceStaffOwnerApiGate` (confirmed in `staff-owner-gate.ts`), `FirebaseRest.get/set/update` (all confirmed in `firebase-rest.ts`), service account vars, `recordDirectTelemetry` all confirmed in codebase; GET handler added to scope | None | No |
| TASK-03: Form component | Yes — `ActivityInstance` fields confirmed; fetch-to-function pattern standard; no client-side auth token needed (auth handled at function layer) | None | No |
| TASK-04: Owner page | Partial — `canAccessStaffOwnerRoutes` confirmed; RTDB read for all instances depends on TASK-02 GET handler | [Ordering][Minor]: TASK-04 correctly depends on TASK-02; GET handler addition to TASK-02 documented | No |
| TASK-05: Unit tests | Yes — TASK-02 and TASK-03 complete before TASK-05; mock patterns established | None | No |

## Overall-confidence Calculation
- S=1, M=2, L=3
- Weights: TASK-01=1, TASK-02=2, TASK-03=2, TASK-04=2, TASK-05=1
- Weighted: (95*1 + 85*2 + 88*2 + 82*2 + 90*1) / (1+2+2+2+1) = (95+170+176+164+90)/8 = 695/8 = 86.9% → **87%**
