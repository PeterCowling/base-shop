# Build Record — prime-activity-duration

**Date:** 2026-03-14
**Plan:** `docs/plans/prime-activity-duration/plan.md`
**Status:** All tasks complete

## Outcome Contract

- **Why:** Guests receive activity links showing end times that are always exactly 2 hours after start, regardless of the real activity length, because staff had no way to set duration without editing Firebase directly. Adding a staff form with a duration field means new activities will show accurate end times.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Staff can create and edit activity instances via the Prime app UI, setting a custom duration in minutes. Activity cards show accurate end times derived from data, not a hardcoded default.
- **Source:** operator

## Tasks Completed

| Task | Description | Commit |
|---|---|---|
| TASK-01 | Updated `/chat/activities/manage` redirect to `/owner/activities` | `5b5a5de3b4` (Wave 1) |
| TASK-02 | New CF function `activity-manage.ts` — GET/POST/PATCH with owner gate + FirebaseRest | `5b5a5de3b4` (Wave 1) |
| TASK-03 | New `ActivityManageForm` component — create/edit mode | `5b5a5de3b4` (Wave 1) |
| TASK-04 | New owner page `/owner/activities` — list + create + edit | `f531d143b8` |
| TASK-05 | Unit tests (TC-02a–f, TC-03c–d) | `98378acb72` |

## Deliverables

- `apps/prime/functions/api/activity-manage.ts` — new Cloudflare Pages Function (GET/POST/PATCH, owner gate auth, Firebase RTDB writes via service account)
- `apps/prime/functions/lib/firebase-id-token.ts` — extracted shared `exchangeCustomTokenForIdToken` helper
- `apps/prime/src/components/activity-manage/ActivityManageForm.tsx` — staff form component (create/edit mode, client-side validation, all ActivityInstance fields)
- `apps/prime/src/app/owner/activities/page.tsx` — server component with `canAccessStaffOwnerRoutes` gate
- `apps/prime/src/app/owner/activities/ActivitiesPageClient.tsx` — client component: fetches instances, renders list + form toggle
- `apps/prime/src/app/(guarded)/chat/activities/manage/page.tsx` — updated redirect from `/activities` to `/owner/activities`
- `apps/prime/functions/api/__tests__/activity-manage.test.ts` — function unit tests (TC-02a–f)
- `apps/prime/src/components/activity-manage/__tests__/ActivityManageForm.test.tsx` — form unit tests (TC-03c–d)

## Engineering Coverage Evidence

| Coverage Area | Delivered |
|---|---|
| UI / visual | Owner page + form component with full field set, status badge, loading/empty/error states |
| UX / states | Loading → empty / list; form idle → submitting → success/error; create/edit mode distinction |
| Security / privacy | `enforceStaffOwnerApiGate` (CF Access or secret token) on all function routes; `canAccessStaffOwnerRoutes` server guard on owner page |
| Logging / observability | `recordDirectTelemetry('write.success')` + `console.info` structured log on every create/edit |
| Testing / validation | TC-02a–f (function validation + auth), TC-03c–d (form validation + fetch shape); no RTDB emulator needed |
| Data / contracts | `durationMinutes` written to RTDB on every create/edit; `durationMinutes >= 1` enforced server-side; legacy records without field show "120 (default)" in owner list |
| Performance / reliability | N/A — infrequent staff-only write; one-shot RTDB GET on page load |
| Rollout / rollback | Additive new function + pages; rollback = delete files; zero guest exposure |

## Workflow Telemetry Summary

| Stage | Records | Modules | Context Input Bytes | Artifact Bytes |
|---|---|---|---|---|
| lp-do-fact-find | 1 | 1.00 | 38572 | 18449 |
| lp-do-analysis | 1 | 1.00 | 53914 | 14575 |
| lp-do-plan | 1 | 1.00 | 124436 | 43163 |
| lp-do-build | 1 | 2.00 | 101113 | 0 |

Total context input: 318,035 bytes. Token measurement not captured (auto-capture not available in this session).
