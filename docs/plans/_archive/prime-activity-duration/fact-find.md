---
Type: Fact-Find
Status: Ready-for-analysis
Domain: Engineering
Workstream: Engineering
Created: 2026-03-13
Last-reviewed: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: prime-activity-duration
Dispatch-ID: IDEA-DISPATCH-20260313200000-PRIME-008
Outcome: planning
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Loop-Gap-Trigger: none
Primary-Execution-Skill: lp-do-build
---

# Fact-Find: Prime Activity Duration (prime-activity-duration)

## Scope

The prime guest app shows activity cards with a calculated finish time and lifecycle state (upcoming/live/ended). Both calculations hard-code the duration as 2 hours (120 minutes). Staff running activities of different lengths — a 30-minute yoga session or a 3-hour boat trip — cannot adjust the displayed finish time without a code change. This fact-find establishes what needs to change to make duration data-driven.

## Access Declarations

None. Investigation is code-only (TypeScript source + Firebase RTDB type contracts). No live database access required.

## Outcome Contract

- **Why:** The prime guest app shows activity finish times based on a fixed 2-hour assumption. Staff-run activities vary in length. Without a configurable duration field, every activity incorrectly shows the same finish time, and the live/ended lifecycle is wrong for any activity that isn't exactly 2 hours.
- **Intended Outcome:** Activity finish times and lifecycle states reflect the real planned duration stored per instance, defaulting to 120 minutes when no duration is set.
- **Source:** auto

## Evidence Audit (Current State)

### 1. ActivityInstance type — no duration field

**File:** `apps/prime/src/types/messenger/activity.ts` (lines 20-41)

```typescript
export interface ActivityInstance {
  id: string;
  templateId: string;
  title: string;
  description?: string;
  meetUpPoint?: string;
  meetUpTime?: string;
  imageUrl?: string;
  startTime: number;           // Epoch ms
  price?: number | string;
  initialMessages?: string[];
  rsvpUrl?: string;
  status: 'live' | 'upcoming' | 'archived';
  createdBy: string;
  updatedAt?: number;
  // NO durationMinutes field
}
```

`ActivityTemplate` (lines 1-19 of same file) also has no duration field.

### 2. Hardcoded 2-hour duration — three call sites

**File 1:** `apps/prime/src/app/(guarded)/activities/ActivitiesClient.tsx`

**Call site 1 — `formatFinishTime` (line 58):**
```typescript
function formatFinishTime(startTime: number): string {
  const finish = new Date(startTime + 2 * 60 * 60 * 1000);  // hardcoded 2h
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric', minute: '2-digit',
  }).format(finish);
}
```
One call site for `formatFinishTime`: `ActivitiesClient.tsx:139` — `formatFinishTime(activity.startTime)`. No other callers (`grep -rn "formatFinishTime" apps/prime/src` → single result).

**Call site 2 — `resolveLifecycle` in `ActivitiesClient.tsx` (line 69):**
```typescript
function resolveLifecycle(activity: ActivityInstance, now: number): ActivityLifecycle {
  const start = activity.startTime;
  const end = start + 2 * 60 * 60 * 1000;  // hardcoded 2h
  if (now >= end || activity.status === 'archived') return 'ended';
  if (now >= start || activity.status === 'live') return 'live';
  return 'upcoming';
}
```

**File 2:** `apps/prime/src/app/(guarded)/chat/channel/page.tsx`

**Call site 3 — `resolveLifecycle` copy in `chat/channel/page.tsx` (line 46):**
```typescript
function resolveLifecycle(activity: ActivityInstance, now: number): ActivityLifecycle {
  const start = activity.startTime;
  const end = start + 2 * 60 * 60 * 1000;  // hardcoded 2h — SAME constant
  if (now >= end || activity.status === 'archived') { return 'ended'; }
  if (now >= start || activity.status === 'live') { return 'live'; }
  return 'upcoming';
}
```
This is a copy-paste of the `ActivitiesClient` function — same signature, same hardcoded constant. It controls the lifecycle display in the activity chat channel view. **Both files must be updated.**

`formatFinishTime` takes `startTime: number` only — to use per-instance duration, the signature must change to accept the full `ActivityInstance` object.

### 3. Activity fetch path — Firebase RTDB, no API function layer

**Hook:** `useChat()` in `apps/prime/src/contexts/messaging/ChatProvider.tsx` (lines 294-335)

Firebase onValue listener:
```
ref(db, `${MSG_ROOT}/activities/instances`)
  orderByChild('status')  startAt('live')  endAt('upcoming')  limitToFirst(20)
```

`MSG_ROOT` is `messaging` (from `apps/prime/src/utils/messaging/dbRoot.ts`).

No Express/Pages-function layer for activities — all reads/writes go directly through the Firebase SDK. The RTDB schema is document-style (NoSQL); adding a new optional field to instances requires no migration — existing records simply lack the field and will fall back to the default.

### 4. Complete RTDB instance schema (current)

Path: `messaging/activities/instances/{instanceId}`

| Field | Type | Notes |
|---|---|---|
| `id` | string | Document key |
| `templateId` | string | |
| `title` | string | |
| `description` | string? | |
| `meetUpPoint` | string? | |
| `meetUpTime` | string? | HH:mm |
| `imageUrl` | string? | |
| `startTime` | number | Epoch ms |
| `price` | number\|string? | |
| `initialMessages` | string[]? | |
| `rsvpUrl` | string? | |
| `status` | 'live'\|'upcoming'\|'archived' | |
| `createdBy` | string | |
| `updatedAt` | number? | |
| `durationMinutes` | — | **MISSING** |

### 5. Test landscape

**File:** `apps/prime/src/app/(guarded)/activities/__tests__/attendance-lifecycle.test.tsx` (151 lines)

The test renders `ActivitiesClient` with mock activities that have no `durationMinutes`. The lifecycle resolution is covered by mock timing (using `Date.now()` offsets). No explicit reference to the 2-hour constant in the tests. Adding `durationMinutes?: number` to `ActivityInstance` is a non-breaking type change; existing test fixtures remain valid. Tests will need updating only if the `resolveLifecycle` test adds a case for non-default durations (not required for the baseline fix).

### 6. `formatFinishTime` signature impact

Current call: `formatFinishTime(activity.startTime)`. After fix, it needs access to `durationMinutes`. Two options:
- A) Change signature to `formatFinishTime(activity: ActivityInstance)` — reads both `startTime` and `durationMinutes ?? 120` internally.
- B) Change signature to `formatFinishTime(startTime: number, durationMinutes = 120)` — explicit parameters.

Option A is cleaner since `resolveLifecycle` already takes the full `ActivityInstance`.

### 7. No activity creation/edit UI in prime

There is no in-app UI for creating or editing activity instances — staff create them directly via Firebase console or an admin tool. Adding `durationMinutes` to the type is sufficient; no form UI changes are needed in prime.

## Confidence Inputs

| Dimension | Score | Notes |
|---|---|---|
| Problem confirmed | High | Hardcoded constant verified at exact lines |
| Solution path clear | High | Type addition + two call-site fixes; schemaless RTDB needs no migration |
| Test impact | High | One test file; non-breaking addition |
| Scope boundary | High | 4 files maximum (type, 2 UI components, test) |
| External risk | Low | No external data source changes required |

**Overall delivery readiness:** 90%

## Key Files

| File | Role |
|---|---|
| `apps/prime/src/types/messenger/activity.ts` | `ActivityInstance` type — add `durationMinutes?: number` |
| `apps/prime/src/app/(guarded)/activities/ActivitiesClient.tsx` | Call sites 1 + 2: `formatFinishTime` and `resolveLifecycle` |
| `apps/prime/src/app/(guarded)/chat/channel/page.tsx` | Call site 3: copy-paste `resolveLifecycle` — same fix needed |
| `apps/prime/src/app/(guarded)/activities/__tests__/attendance-lifecycle.test.tsx` | Lifecycle tests (non-breaking; may add coverage) |
| `apps/prime/src/contexts/messaging/ChatProvider.tsx` | Activity fetch hook (read-only) |

## Current Process Map

None: local code path only. This change does not alter any multi-step process, workflow, lifecycle state, CI/deploy/release lane, approval path, or operator runbook. It modifies two utility functions within a single UI component and one TypeScript interface.

## Engineering Coverage Matrix

| Coverage Area | Applicable | Treatment | Notes |
|---|---|---|---|
| UI / visual | Required | Update `formatFinishTime` to show correct finish time | `ActivityCard` displays finish time via this function |
| UX / states | Required | `resolveLifecycle` must use `durationMinutes ?? 120` | Affects live/ended state boundary |
| Security / privacy | N/A | No new data exposure | `durationMinutes` is display metadata |
| Logging / observability / audit | N/A | No new metrics | Duration is display-only |
| Testing / validation | Required | Existing lifecycle test passes; optional: add non-default duration case | Test file at `__tests__/attendance-lifecycle.test.tsx` |
| Data / contracts | Required | `ActivityInstance` type updated; RTDB schemaless — no migration | Old instances fall back to 120 min |
| Performance / reliability | N/A | Trivial arithmetic change | No performance impact |
| Rollout / rollback | Required | Additive type change; backwards compatible; rollback = revert type + calc | No DB state to roll back |

## Open Questions

No open questions remain.

| # | Question | Status | Resolution |
|---|---|---|---|
| 1 | Should `durationMinutes` live on `ActivityTemplate` as a default, with `ActivityInstance` inheriting or overriding? | Resolved | Instance-only for now. Staff need per-instance control. Template default is a future enhancement outside this scope. |
| 2 | Is there a staff activity creation/edit UI that needs updating? | Resolved | No in-app creation UI exists — staff use Firebase console. No form changes required. |
| 3 | Does any other component besides `ActivitiesClient` use the hardcoded 2h constant? | Resolved | `grep -rn "2 \* 60 \* 60" apps/prime/src` — three call sites total: two in `ActivitiesClient.tsx` (lines 58, 69) and one in `chat/channel/page.tsx` (line 46). All three must be updated. |

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Type definition (`activity.ts`) | Yes | None | No |
| UI call sites (`ActivitiesClient.tsx`) | Yes | `formatFinishTime` takes `startTime` only — signature change needed | No (noted in plan) |
| RTDB schema (no migration) | Yes | None — schemaless; old records safe | No |
| Test file | Yes | None — non-breaking type addition | No |
| Third call site (`chat/channel/page.tsx:46`) | Yes | Major: copy-paste `resolveLifecycle` with same constant — added to scope | No (fixed in fact-find) |

## Scope Signal

**Signal:** right-sized

**Rationale:** The change is 4 files (type + 2 UI components + 1 test), all within the same guarded routes. The type addition is non-breaking. The three call-site fixes are well-understood. No database migration. No form UI. The scope is as narrow as the problem allows.

## Evidence Gap Review

### Gaps Addressed
- Confirmed exact file/line for both hardcoded call sites
- Confirmed RTDB is schemaless (no migration needed)
- Confirmed all three consumers of the 2-hour constant: two in `ActivitiesClient.tsx` and one copy-paste in `chat/channel/page.tsx`
- Confirmed no staff creation UI exists in prime

### Confidence Adjustments
None — all key claims verified.

### Remaining Assumptions
- Staff are aware that existing activity instances will show the 120-minute default until they set `durationMinutes` when creating new instances via the Firebase console. This is acceptable: the change is additive and backwards-compatible.
- No Zod/runtime schema validates `ActivityInstance` reads from Firebase (`grep -rn "ActivityInstance" apps/prime/src | grep "z\.object\|zod\|parse"` → no results). The type is TypeScript-only; no runtime schema update is needed.
- The plan should guard against `durationMinutes <= 0` inputs (e.g., use `Math.max(1, activity.durationMinutes ?? 120)`) or document that 0/negative is invalid. An unguarded 0 would immediately mark any activity as ended at start time.

## Analysis Readiness

**Ready for analysis.** All blockers resolved.

- Entry points confirmed: `apps/prime/src/app/(guarded)/activities/ActivitiesClient.tsx` and `apps/prime/src/app/(guarded)/chat/channel/page.tsx`
- Type to update: `ActivityInstance` in `apps/prime/src/types/messenger/activity.ts`
- Call sites: 3 — `formatFinishTime` (ActivitiesClient:58), `resolveLifecycle` (ActivitiesClient:69), `resolveLifecycle` copy (chat/channel/page.tsx:46)
- RTDB: schemaless, no migration required
- No Zod schema on `ActivityInstance` — TypeScript-only type update sufficient
- Tests: 1 test file, non-breaking change
- Execution track: code
- Delivery readiness: 90% (adjusted from 92% to reflect the third call site and zero-guard consideration)

**Recommended approach:** Add `durationMinutes?: number` to `ActivityInstance`. Update `formatFinishTime` to accept the full `ActivityInstance`. Update both `resolveLifecycle` functions (in two files) to use `Math.max(1, activity.durationMinutes ?? 120)`. 4 files total.
