---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: UI
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: prime-activity-duration
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/prime-activity-duration/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260313200000-PRIME-008
---

# Prime Activity Duration — Fact-Find Brief

## Scope

### Summary

Staff cannot set custom durations on activity instances through any app UI. The `durationMinutes` field already exists in the TypeScript type and Firebase RTDB schema, but is optional with a silent 120-minute default baked into the app. There is no admin form for creating or editing activity instances — the only route is Firebase console, which most staff do not use. The fix is to build a minimal staff-facing activity management form that includes a `durationMinutes` field.

### Goals

- Enable staff to create and edit activity instances (including `durationMinutes`) through an in-app UI, without needing Firebase console access.
- Make the 120-minute default explicit and visible, not silent.

### Non-goals

- Guest-facing UI changes.
- Changes to the Firebase RTDB schema or `ActivityInstance` type (both already support duration).
- Full activity management dashboard with analytics, bulk operations, or template editing.
- Migration of existing Firebase records that lack `durationMinutes` (old records remain at 120-minute default; fix is forward-only for new and edited instances).

### Constraints & Assumptions

- Constraints:
  - Activity management must be staff-only (owner/staff auth guard, not guest session).
  - Firebase RTDB is the persistence layer — no new backend API endpoint needed; direct client write with proper security rules.
  - The existing stub page at `/chat/activities/manage` already exists as a redirect placeholder; it can be repurposed.
- Assumptions:
  - `durationMinutes` will remain optional in the type (no breaking change to existing records).
  - Staff creating new instances will always set a duration via the form (form validation enforces non-zero).

## Outcome Contract

- **Why:** Guests can be sent links to activity events that appear to end after exactly 2 hours regardless of how long the activity actually runs. Staff have no way to adjust this without a code change. Adding a duration field to the staff activity form means new activities will display accurate end times.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Staff can create and edit activity instances via the Prime app UI, setting a custom duration in minutes. Activity cards show accurate end times derived from data, not a hardcoded default.
- **Source:** operator

## Current Process Map

### Process Areas

| Area | Current step-by-step flow | Owners / systems / handoffs | Evidence refs | Known issues |
|---|---|---|---|---|
| Staff creates an activity | Staff logs into Firebase console → navigates to `messaging/activities/instances` → manually constructs a JSON node with all required fields → saves | Staff / Firebase console | `apps/prime/src/types/messenger/activity.ts:20-48` (fields to populate) | No in-app form; `durationMinutes` is assumed to be frequently omitted since it is optional and the JSDoc comment directs staff to the Firebase console — no RTDB data export was inspected to confirm this; when omitted, activities default to 120 min |
| Guest views activity | App loads instances from `messaging/activities/instances` via real-time query → resolves lifecycle based on `startTime + (durationMinutes ?? 120) * 60000` → displays start/end time on card | Guest / Firebase RTDB / ActivitiesClient | `ActivitiesClient.tsx:61,74`; `chat/channel/page.tsx:49` | Displayed end time is always `startTime + 2h` for any instance without `durationMinutes` set |
| `/chat/activities/manage` route | Renders `GuardedRouteRedirect` → immediately redirects to `/activities` | Guest app | `apps/prime/src/app/(guarded)/chat/activities/manage/page.tsx:6` | Stub — no management UI |

## Evidence Audit (Current State)

### Entry Points

- `apps/prime/src/app/(guarded)/chat/activities/manage/page.tsx` — redirect stub; candidate location for the new management form
- `apps/prime/src/app/(guarded)/activities/ActivitiesClient.tsx` — guest-facing activity list; renders lifecycle from `durationMinutes ?? 120`
- `apps/prime/src/app/(guarded)/chat/channel/page.tsx:48-49` — lifecycle resolution in chat channel; same `durationMinutes ?? 120` pattern

### Key Modules / Files

- `apps/prime/src/types/messenger/activity.ts:20-48` — `ActivityInstance` type. `durationMinutes?: number` is optional; JSDoc comment says "Set via Firebase console when creating new instances"
- `apps/prime/src/contexts/messaging/ChatProvider.tsx:297-302` — reads from `MSG_ROOT/activities/instances` via `onValue()` paginated query; no write path
- `apps/prime/src/utils/messaging/dbRoot.ts` — defines `MSG_ROOT = 'messaging'`; activity RTDB path is `messaging/activities/instances/[id]`
- `apps/prime/functions/api/` — 22 functions; none create/edit activity instances (no `activity-create.ts`, `activity-update.ts`, etc.)
- `apps/prime/src/app/owner/page.tsx` — owner dashboard; no activity creation UI

### Patterns & Conventions Observed

- Firebase writes from client: pattern exists in `ActivitiesClient.tsx:287-290` (`set(dbRef(db, ...), { at: Date.now() })` for presence marking). Direct client RTDB writes are established.
- Staff authentication: `apps/prime/functions/api/staff-auth-session.ts` gates staff-only API actions (confirmed path). Owner pages use `apps/prime/src/app/owner/` with its own guard (exact guard HOC not inspected in this investigation).
- Hardcoded default: `?? 120` appears at exactly 3 locations in source (2 call sites + type JSDoc); no config constant extracted.

### Data & Contracts

- Types/schemas/events:
  - `ActivityInstance` (`apps/prime/src/types/messenger/activity.ts`) — `durationMinutes?: number`. Already present. No type change needed.
  - `ActivityTemplate` — does not include `durationMinutes`. Templates are reused across instances; per-instance duration is correct approach.
- Persistence:
  - Firebase RTDB path: `messaging/activities/instances/[id]`
  - Fields required when creating: `id`, `templateId`, `title`, `startTime`, `status`, `createdBy`
  - `durationMinutes` is optional but meaningful; a management form should default to `60` and require a positive non-zero value. (60 chosen rather than the code's implicit 120-minute fallback to avoid inadvertently creating activities that run longer than intended; operator may adjust this default in planning.)
- API/contracts:
  - No API endpoint for activity CRUD exists. Direct RTDB write from authenticated client is the existing pattern.

### Test Landscape

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `durationMinutes` lifecycle — non-default | Unit | `attendance-lifecycle.test.tsx:174-234` | TC-P09/TC-P10 cover 30-min activity showing as live (25 min elapsed) and ended (35 min elapsed). Solid. |
| `durationMinutes` lifecycle — default (absent) | Unit | `attendance-lifecycle.test.tsx` | Tests for absent `durationMinutes` exist implicitly (earlier TCs pass no field → 120-min default) |
| Management form | Unit | None | No tests — stub page redirects |
| Firebase write (activity create) | Unit | None | No tests — no write path exists yet |

#### Coverage Gaps

- No tests for the create/edit form component or the Firebase write.
- No test asserting that creating an instance without `durationMinutes` causes the 120-min default to apply (integration gap, acceptable given existing TC-P09/P10).

#### Testability Assessment

- Easy to test: form validation (required fields, non-zero `durationMinutes`), form state transitions.
- Hard to test: Firebase RTDB write in Jest without a real database.
- Test seams needed: Abstract the RTDB write behind a testable function to enable unit tests on the write logic.

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | `/chat/activities/manage` is a redirect stub; no form exists | Full staff management form needs design (create + edit + duration field) | Yes — form design choices |
| UX / states | Required | Guest activity cards display `startTime + 2h` for instances without `durationMinutes` | Form needs: empty/loading/error/save-success states; duration field needs validation feedback | Yes |
| Security / privacy | Required | Owner pages use staff auth guard; direct RTDB writes from client require matching Firebase security rules | Firebase rules for `messaging/activities/instances` must allow writes only for authenticated staff; unknown if rules exist | Yes — rules verification needed |
| Logging / observability / audit | Required | Presence writes have no audit log. No existing activity-create audit trail | No create/edit event logged — staff won't know if a write was applied silently incorrectly | Yes — recommend `direct-telemetry` on create/edit |
| Testing / validation | Required | TC-P09/TC-P10 cover lifecycle display; no form tests | Need form validation unit tests + at least 1 test asserting `durationMinutes` is written to RTDB shape | Yes |
| Data / contracts | Required | `ActivityInstance.durationMinutes?: number` already present | No runtime validation that new instances include a valid duration; form must enforce | Yes |
| Performance / reliability | N/A | RTDB writes are low-frequency (staff-only infrequent create/edit) | None | No |
| Rollout / rollback | Required | No feature flag pattern currently; management page is already accessible but noop | New page can ship behind a feature flag or staff-only guard with no guest impact; rollback = revert to redirect stub | Yes |

## Questions

### Resolved

- Q: Does `durationMinutes` need to be added to the Firebase RTDB schema or TypeScript type?
  - A: No. The field already exists as `durationMinutes?: number` in `ActivityInstance` (`apps/prime/src/types/messenger/activity.ts:38`). Firebase RTDB is schema-free; the field just needs to be written.
  - Evidence: `apps/prime/src/types/messenger/activity.ts:32-38`
- Q: Are there existing Firebase security rules governing writes to `messaging/activities/instances`?
  - A: Not confirmed from repo inspection (no `*.rules` file found in `apps/prime`). Rules are set in the Firebase console. This is an open question for staff/infra but does not block planning — the form can be built and rules verified pre-ship.
  - Evidence: `find apps/prime -name "*.rules"` → no results
- Q: Is there an existing admin API endpoint for creating/editing activities?
  - A: No. `apps/prime/functions/api/` contains 22 endpoints, none for activity CRUD. Direct RTDB client write is the only path.
  - Evidence: `ls apps/prime/functions/api/` — no `activity-*.ts` files
- Q: Does the `ActivityTemplate` type store duration?
  - A: No. Templates store `meetUpPoint`, `meetUpTime`, `price`, `initialMessages` — no duration. Duration is per-instance, not per-template. Correct design.
  - Evidence: `apps/prime/src/types/messenger/activity.ts:6-18`
- Q: What authentication is required for a staff activity management form?
  - A: Owner/staff session. The `apps/prime/src/app/owner/` directory houses staff-only pages. The manage form should live there or behind the same guard rather than in the guest-session-guarded `(guarded)` area.
  - Evidence: `apps/prime/src/app/owner/` — owner session guard; `apps/prime/functions/api/staff-auth-session.ts` — staff auth
- Q: Should the `/chat/activities/manage` URL be preserved, or should activity management move to `/owner/activities`?
  - A: Place management in `/owner/activities` (consistent with other staff-only tools in the owner area), and add a permanent redirect from `/chat/activities/manage` → `/owner/activities`. This is safe: the current manage page is already a redirect stub with no bookmarkable content. No operator input required — analysis should adopt this as the chosen route.
  - Evidence: `apps/prime/src/app/(guarded)/chat/activities/manage/page.tsx` — redirect stub with no UI; `apps/prime/src/app/owner/` — owner area convention

### Open (Operator Input Required)

None — all questions are agent-resolvable from available evidence and documented conventions.

## Confidence Inputs

- Implementation: 87% — type and schema already correct; only UI and write logic needed; Firebase write pattern established
- Approach: 85% — direct RTDB write with owner guard is clearly right; form location TBD but defaultable
- Impact: 80% — eliminates the 120-min hardcoded appearance for new activities; existing data unchanged
- Delivery-Readiness: 82% — Firebase rules need verification before ship but don't block development
- Testability: 75% — form validation testable; RTDB write needs test seam abstraction

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Firebase security rules don't allow client writes to `messaging/activities/instances` | Medium | High — form writes silently fail or throw | Verify rules in Firebase console before ship; add write test that catches RTDB permission errors |
| Staff create activities with `durationMinutes: 0` | Low | Medium — lifecycle shows activity as ended immediately | Form validation: require `durationMinutes >= 1`; code already guards with `Math.max(1, ...)` |
| Existing live activity instances without `durationMinutes` continue showing 2h default | Medium | Low — existing data is not migrated | Acceptable. Fix is forward-only. Operator can manually set `durationMinutes` in Firebase for important upcoming instances. |
| No audit trail for activity creation | Low | Low — staff error hard to diagnose | Recommend logging create/edit event via `direct-telemetry` endpoint |

## Planning Constraints & Notes

- Must-follow patterns:
  - Staff UI must use owner session guard, not guest session
  - Direct RTDB client write is established pattern; no new API endpoint needed
  - `durationMinutes` must remain optional in the type (backward-compat with existing instances)
  - Form must default duration to 60 minutes and enforce positive non-zero value
- Rollout/rollback expectations:
  - New management page is additive; rollback = revert manage page to redirect stub
  - No guest-facing changes; zero guest risk
- Observability expectations:
  - Log create/edit events via `direct-telemetry` or similar

## Suggested Task Seeds (Non-binding)

- TASK-01: Build `ActivityManageForm` component (create + edit mode; fields: title, startTime, durationMinutes, description, meetUpPoint, meetUpTime, status)
- TASK-02: Wire manage page at `/owner/activities` — list existing instances + "Create" + edit button per instance
- TASK-03: Firebase RTDB write function for create/update activity instance, with runtime validation
- TASK-04: Unit tests for form validation and RTDB write shape
- TASK-05: Add redirect `/chat/activities/manage` → `/owner/activities`

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - Staff can navigate to `/owner/activities`, see existing activity instances, create a new one with a `durationMinutes` value, and see it appear in the guest-facing activity list with the correct end time
  - Form rejects `durationMinutes <= 0`
  - Unit tests cover form validation and write shape
- Post-delivery measurement plan:
  - Verify a newly created activity instance in RTDB contains `durationMinutes` field
  - Verify guest activity card shows correct end time based on set duration

## Scope Signal

Signal: right-sized
Rationale: The field and schema already exist. The change is purely additive UI — a staff form in an existing owner area, writing to an existing RTDB path, using an established direct-write pattern. No type changes, no schema migrations, no guest-facing risk.

## Evidence Gap Review

### Gaps Addressed

- Confirmed `durationMinutes` is already in the type and RTDB schema — no data model work needed.
- Confirmed no existing API endpoint or admin form for activity creation — full gap.
- Confirmed Firebase client write pattern exists (presence marking in ActivitiesClient) — approach is validated.
- Confirmed the manage page is a stub redirect — safe to repurpose.
- Firebase security rules for activity instances are not confirmed from repo — flagged as a pre-ship risk.

### Confidence Adjustments

- Raised implementation confidence (87%) because: type + schema + write pattern all exist; only UI layer is missing.
- Left testability at 75% because: RTDB write testing in Jest requires a test seam; not complex but needs explicit design.

### Remaining Assumptions

- Firebase security rules permit authenticated staff writes to `messaging/activities/instances` — must verify before ship.
- Duration default of 60 minutes is a reasonable form default (shorter than the current 120-min code default, more likely to match real activities).

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| `ActivityInstance` type and RTDB schema | Yes | None — field already present | No |
| Consumer code (lifecycle resolution) | Yes | None — `?? 120` fallback is correct; test coverage exists | No |
| Staff authentication path for form | Partial | Owner session pattern exists; exact guard HOC not verified in `/owner/` routing | No — defaultable to same guard as `owner/page.tsx` |
| Firebase security rules | No | Rules not in repo; cannot verify from code | No — blocking for ship, not for planning |
| Write path (client → RTDB) | Yes | No existing write for activity create; pattern confirmed from presence write | No |
| Test coverage | Partial | Lifecycle tests exist; form/write tests do not | No — new tests in plan scope |

## Analysis Readiness

- Status: Ready-for-analysis
- Blocking items: none
- Recommended next step: `/lp-do-analysis prime-activity-duration`
