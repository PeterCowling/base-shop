---
Type: Analysis
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: prime-activity-duration
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/prime-activity-duration/fact-find.md
Related-Plan: docs/plans/prime-activity-duration/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Prime Activity Duration — Analysis

## Decision Frame

### Summary

Staff cannot set custom durations on activity instances in the Prime guest app without directly editing Firebase RTDB via the console. `durationMinutes` is already defined in the `ActivityInstance` type and RTDB schema, but is optional with a silent 120-minute hardcoded fallback. No admin UI or API endpoint exists for activity CRUD. The decision is which approach to use to expose duration management to staff.

### Goals

- Staff can create and edit activity instances (including `durationMinutes`) through an in-app UI.
- Activity cards display accurate end times derived from data, not the silent 2-hour default.

### Non-goals

- Guest-facing UI changes.
- Type changes to `ActivityInstance` (field already present).
- Migration of existing Firebase records.
- Full activity management dashboard with analytics or bulk operations.

### Constraints & Assumptions

- Constraints:
  - Activity management must be staff-only; must not be accessible from the guest session.
  - Firebase RTDB is the persistence layer.
  - Cloudflare Pages Functions (`functions/api/`) are the established server-side layer for privileged operations.
- Assumptions:
  - `PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL` and `PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY` are set in the CF Pages environment (same env vars used by `aggregate-kpis.ts`).
  - `durationMinutes` remains optional in the type for backward compatibility with existing records.

## Inherited Outcome Contract

- **Why:** Guests can be sent links to activity events that appear to end after exactly 2 hours regardless of how long the activity actually runs. Staff have no way to adjust this without a code change. Adding a duration field to the staff activity form means new activities will display accurate end times.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Staff can create and edit activity instances via the Prime app UI, setting a custom duration in minutes. Activity cards show accurate end times derived from data, not a hardcoded default.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/prime-activity-duration/fact-find.md`
- Key findings used:
  - `durationMinutes?: number` already present at `apps/prime/src/types/messenger/activity.ts:38` — no type change needed.
  - `/chat/activities/manage` is a redirect stub — safe to repurpose.
  - `FirebaseRest.set()` / `FirebaseRest.update()` established in `apps/prime/functions/lib/firebase-rest.ts` for server-side RTDB writes.
  - `aggregate-kpis.ts` shows the full pattern: service account → custom token → ID token → Firebase REST write.
  - Direct client RTDB write pattern also established (presence marking in `ActivitiesClient.tsx:287-290`).

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Auth correctness | Write access to `messaging/activities/instances` is a privileged operation; must be gated to authenticated staff only | Critical |
| Firebase security rule impact | Modifying Firebase security rules is a console-only operation, not versioned in repo; changes carry a risk of misconfiguration | High |
| Implementation effort | Plan scope should stay bounded; both options must be achievable in one small plan | High |
| Testability | The write path must be unit-testable without a live Firebase connection | High |
| Established pattern fit | New code should follow existing patterns to minimize maintenance surface | Medium |

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A — Client-side RTDB write | Staff form in owner area writes directly to Firebase RTDB via the browser client SDK (same pattern as presence marking) | Simpler implementation; no new Cloudflare function needed | Client writes require Firebase security rules covering `messaging/activities/instances` specifically. The presence write pattern (`messaging/activities/presence`) confirms rules exist for some paths; coverage of the `instances` path is unconfirmed and unversioned in repo | Rules for `instances` may not permit client writes; misconfiguration could expose RTDB to broader writes | Viable but riskier |
| B — Server-side Cloudflare Function | New `functions/api/activity-manage.ts` validates staff session, then writes to RTDB via `FirebaseRest.set()` using service account credentials | Privileged write stays server-side; same pattern as `aggregate-kpis.ts`; no Firebase security rule change needed for client-side; fully unit-testable | One additional file (function) + form must `fetch()` to endpoint | Service account env vars must be set (already required for aggregate-kpis) | Yes — chosen |
| C — Type tightening + documentation | Make `durationMinutes` required in type; document Firebase console process | Zero UI code | Does not solve the operational problem; staff still need Firebase console access | N/A | No — rejected |

## Engineering Coverage Comparison

| Coverage Area | Option A (client write) | Option B (server function) | Chosen (B) implication |
|---|---|---|---|
| UI / visual | Same — form needed in both | Same — form needed in both | Staff form at `/owner/activities`; list + create + edit; design system components |
| UX / states | Same | Same | Loading/saving/error/success states in form; optimistic update optional |
| Security / privacy | Requires Firebase rules permitting client writes from staff auth; rules not versioned | Validates staff session at function layer; service account write; no client rule change needed | Staff session validated server-side before any write; aligns with existing function auth pattern |
| Logging / observability / audit | Client write has no audit log unless manually added | Function layer can emit structured log + telemetry event on create/edit | Add `direct-telemetry` event from function on successful write; provides audit trail |
| Testing / validation | Client write in Jest needs Firebase emulator or mock; achievable but harder | Function is a plain async handler; easy to unit-test with mock `FirebaseRest` | Mock `FirebaseRest.set()` in Jest; assert correct path + payload |
| Data / contracts | Same — `ActivityInstance` already typed | Same — validate payload against type before write | Server function validates `durationMinutes >= 1`, required fields present; returns error 400 otherwise |
| Performance / reliability | Same — low-frequency write | Same — low-frequency write | N/A; infrequent staff-only operation |
| Rollout / rollback | Same | Same | New pages/function additive; rollback = revert form to redirect stub |

## Chosen Approach

- **Recommendation:** Option B — Server-side Cloudflare Function for RTDB writes.
- **Why this wins:**
  1. Privileged RTDB writes (creating/editing activity instances) should be server-side. Client-side writes for a staff operation require Firebase security rules to be updated in the Firebase console (unversioned) and tested — a non-trivial risk that is easy to misconfigure.
  2. The pattern is already established in `apps/prime/functions/api/aggregate-kpis.ts`: staff calls endpoint → function validates credentials → `FirebaseRest.set()` writes to RTDB using service account. This is identical to what is needed here, just with a different payload.
  3. The function layer enables proper payload validation (schema check, `durationMinutes >= 1`, required field presence) before any write reaches RTDB.
  4. Testability is cleaner: mock `FirebaseRest`, assert correct write path and payload shape in Jest without a live Firebase connection.
- **What it depends on:**
  - `PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL` and `PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY` set in Cloudflare Pages environment (already confirmed required by `aggregate-kpis.ts` — if that function works in production, these are available).
  - Staff auth session cookie readable from the function (established pattern in `staff-auth-session.ts`).

### Rejected Approaches

- **Option A (client-side direct write)** — Viable but rejected: requires unversioned Firebase security rule changes in the console; unclear if current rules allow it; risk of misconfiguration. The server-side approach is marginally more code but much safer.
- **Option C (type tightening + docs)** — Rejected: does not give staff any UI. The operational problem (no in-app creation flow) remains unsolved. Type tightening alone would break any existing Firebase records that lack `durationMinutes`.

### Open Questions (Operator Input Required)

None — all decisions are agent-resolvable from evidence and established patterns.

## End-State Operating Model

| Area | Current state | Trigger | Delivered step-by-step end state | What remains unchanged | Risks / seams to carry into planning |
|---|---|---|---|---|---|
| Staff creates an activity | Staff uses Firebase console → manual JSON | Staff navigates to `/owner/activities` → taps "Create activity" | Staff fills form (title, startTime, durationMinutes ≥ 1, status, optional: description/meetUpPoint/meetUpTime) → POSTs to `POST /api/activity-manage` → function validates staff session + payload → `FirebaseRest.set()` writes to `messaging/activities/instances/[newId]` → function returns 200 → form shows success | Guest-facing read path unchanged; `ChatProvider` real-time listener already picks up new instances automatically | Service account env vars must be verified in CF Pages; planning must include wrangler.toml secrets confirmation |
| Staff edits an activity | Staff uses Firebase console → direct JSON edit | Staff navigates to `/owner/activities` → taps "Edit" on an existing instance | Form pre-populated with existing data → staff edits → POSTs to `PATCH /api/activity-manage` → function validates session + payload → `FirebaseRest.update()` on existing path → 200 | Guest-facing real-time subscription propagates update automatically | Edit must not allow changing `id`; function must reject id mismatch |
| Guest views activity | `ActivitiesClient.tsx` renders `startTime + (durationMinutes ?? 120)` | Guest loads `/activities` | Same rendering — no change. For instances created via new form, `durationMinutes` will be present; guest sees accurate end time | Fallback `?? 120` remains for legacy instances | None; fully backward-compatible |
| `/chat/activities/manage` route | Redirect stub → `/activities` | Staff navigates to old URL | Permanent redirect to `/owner/activities` | N/A | Ensure redirect doesn't break any existing staff bookmark |

## Planning Handoff

- Planning focus:
  - New Cloudflare Function: `apps/prime/functions/api/activity-manage.ts` — POST (create) + PATCH (update) with staff session validation, payload schema validation, and `FirebaseRest` write.
  - New owner page: `apps/prime/src/app/owner/activities/page.tsx` — list existing instances + create/edit form.
  - New form component: `apps/prime/src/components/activity-manage/ActivityManageForm.tsx` — fields: title, startTime, durationMinutes (min 1, default 60), status, optional description/meetUpPoint/meetUpTime.
  - Redirect: update `/chat/activities/manage` page to redirect to `/owner/activities` instead of `/activities`.
  - Unit tests: mock `FirebaseRest.set()/update()`; assert payload shape; assert `durationMinutes < 1` returns 400.
- Validation implications:
  - TC: function rejects unauthenticated requests (401).
  - TC: function rejects `durationMinutes: 0` (400).
  - TC: function writes correct RTDB path on valid request.
  - TC: form renders correctly in create and edit modes.
  - TC: redirect from old URL resolves to `/owner/activities`.
- Sequencing constraints:
  - Function (server-side write) before form integration — form depends on the function for real responses.
  - Form component and owner page scaffold can be built in parallel with the function (using a mock endpoint); integration is the final step.
  - Owner activities page depends on the form component.
  - Redirect is independent; can be TASK-01.
- Risks to carry into planning:
  - Service account env vars: confirm `PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL` and `PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY` in `wrangler.toml` / CF Pages secrets. If absent, function cannot authenticate writes. (**Pre-ship check; not a planning blocker**.)
  - Staff session cookie validation: the function must use the same session-validation logic as other staff functions. Pattern exists in `staff-auth-session.ts` but exact cookie-checking utility must be confirmed at plan stage.
  - `durationMinutes` form default: plan should adopt 60 minutes as the form default (not the 120-minute code fallback); operator may adjust during build if needed.

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Service account env vars not set in CF Pages | Low (already required by aggregate-kpis) | High — function writes fail silently | Cannot verify CF Pages secrets from repo | Plan must include a pre-ship verification step or SPIKE task |
| Staff session cookie parsing: function may need a utility not yet extracted | Medium | Medium — could block build if pattern unclear | Auth utility approach only confirmed at function-level, not as a reusable module | Plan should confirm the exact staff session validation pattern at build time |
| Owner page RTDB query scope: `ChatProvider` only loads live/upcoming (20-limit) | Medium | Low — planning detail; owner page list needs all instances including archived | Cannot decide query pattern at analysis stage | Plan must choose query pattern for owner list view (separate RTDB read vs `ChatProvider`); consider pagination for the list |

## Planning Readiness

- Status: Go
- Rationale: Approach is decisive (Option B), all dependencies are confirmed or verifiable at plan stage, zero operator-only questions remain, and the implementation pattern is fully established in the codebase.
