---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Engineering
Created: 2026-03-14
Last-reviewed: 2026-03-14
Last-updated: 2026-03-14
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: prime-guest-ghost-mode
Dispatch-ID: IDEA-DISPATCH-20260314173000-BRIK-001
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/prime-guest-ghost-mode/analysis.md
---

# Prime Guest Ghost Mode Plan

## Summary

This plan implements a guest-level "ghost mode" toggle that allows guests to opt out of receiving incoming direct messages from other guests while retaining full outbound messaging capability. Ghost-mode guests are also hidden from the guest directory. The change adds a single flat boolean field (`ghostMode`) to the `GuestProfile` type following the existing `chatOptIn`/`socialOptIn` pattern, enforces the flag in the server-side DM gate and client-side directory filter, surfaces a form toggle with EN+IT i18n, and fixes a Firebase security rules gap that would otherwise allow any authenticated guest to set another guest's ghost flag maliciously. Four tasks are sequenced so TASK-01 (type foundation) unblocks TASK-02 (policy) and TASK-03 (form + Firebase rules, co-committed), and TASK-04 (tests) runs after both are complete.

## Active tasks

- [x] TASK-01: Add `ghostMode` field to type, default, and `effectiveProfile` spread — Complete (2026-03-14)
- [ ] TASK-02: Enforce ghost mode in `canSendDirectMessage` and `isVisibleInDirectory`
- [ ] TASK-03: Ghost mode toggle in `GuestProfileForm` + i18n (EN+IT) + Firebase rules fix [co-committed]
- [ ] TASK-04: Tests — messaging policy, form component, server DM gate

## Goals

- Add `ghostMode: boolean` to the `GuestProfile` type and `DEFAULT_GUEST_PROFILE`.
- Extend `effectiveProfile` explicit spread in `useFetchGuestProfile` to include `ghostMode: data.ghostMode ?? false`.
- Enforce ghost mode in `canSendDirectMessage` (server-side) so no DM can be sent to a ghost guest.
- Hide ghost-mode guests from `isVisibleInDirectory` (client-side directory).
- Surface the toggle in `GuestProfileForm` with i18n labels in EN and IT locales.
- Fix the Firebase security rules gap: restrict `guestProfiles/$uuid` writes to `auth.uid == $uuid`.

## Non-goals

- Staff-visible ghost mode indicators.
- Ghost mode persisting across stays.
- Notification or read-receipt suppression for ghost guests.
- D1 persistence (RTDB is the sole persistence layer).

## Constraints & Assumptions

- Constraints:
  - RTDB is the sole persistence layer for guest profiles; no D1 record needed.
  - Write path is client-side Firebase SDK (`update()` via `useGuestProfileMutator`) — no new API endpoint required.
  - Server-side enforcement must remain in `direct-message.ts`; client-side is advisory only.
  - Both EN and IT locales must be updated in the same commit (CI enforces completeness via `translations-completeness.test.ts`).
  - **TASK-03 (form toggle) and Firebase rules fix must be co-committed** — this is a hard constraint. Deploying the form without the rules fix creates a window where any authenticated guest can ghost-flag another guest.
- Assumptions:
  - Ghost mode defaults to `false` for all guests (opt-in model — ghost is off by default).
  - The `effectiveProfile` explicit spread in `useFetchGuestProfile` at lines 107-117 requires a deliberate per-field addition for any new `GuestProfile` field; there is no `...data` spread.

## Inherited Outcome Contract

- **Why:** Guests want a way to be in the chat system without being open to incoming DMs — useful for solo travellers who want to read broadcasts and send one-off messages without being reachable.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A guest can toggle ghost mode on their profile. While ghost mode is on, no other guest can initiate a DM with them, and they do not appear in other guests' directories.
- **Source:** operator

## Analysis Reference

- Related analysis: `docs/plans/prime-guest-ghost-mode/analysis.md`
- Selected approach inherited:
  - Option A: flat boolean field addition, following the established `chatOptIn`/`socialOptIn` pattern.
  - `ghostMode: boolean` added directly to `GuestProfile` (not nested under `privacySettings`).
- Key reasoning used:
  - All existing preference/privacy fields are flat booleans; Option A matches exactly.
  - Nested object (Option B) adds null-safety overhead and inconsistent access pattern with no concrete near-term benefit.
  - `effectiveProfile` silent-drop risk is the single highest-risk implementation detail — must be covered by a dedicated test.

## Selected Approach Summary

- What was chosen:
  - Flat boolean field `ghostMode` on `GuestProfile`, default `false`.
  - Two independent policy function updates: `canSendDirectMessage` and `isVisibleInDirectory`.
  - Firebase rules fix co-committed with form toggle (TASK-03).
- Why planning is not reopening option selection:
  - Analysis decisively eliminated Option B (nested `privacySettings`) with explicit downside rationale.
  - No open operator questions remain.
  - All consumers identified and accounted for in task structure.

## Fact-Find Support

- Supporting brief: `docs/plans/prime-guest-ghost-mode/fact-find.md`
- Evidence carried forward:
  - `GuestProfile` type at `apps/prime/src/types/guestProfile.ts` — no `ghostMode` field; `DEFAULT_GUEST_PROFILE` omits `bookingId`, `createdAt`, `updatedAt`.
  - `effectiveProfile` explicit spread at `useFetchGuestProfile.ts:107-117` — confirmed no `...data`; new fields silently dropped.
  - `canSendDirectMessage` and `isVisibleInDirectory` are separate functions in `messagingPolicy.ts` — both need independent updates.
  - `database.rules.json` `guestProfiles` node has no per-user write restriction — confirmed.
  - `GuestProfileForm.tsx` has `chatOptIn`/`socialOptIn` checkbox pattern with `isBusy` guard and `handleSave` payload — ghost mode follows same pattern.
  - `direct-message.test.ts` at `apps/prime/functions/__tests__/` (679 lines) uses `FirebaseRest.prototype.get` spy pattern.
  - `activity-message.ts` confirmed to be hostel-wide broadcast sender, not a DM path — no additional enforcement needed.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add `ghostMode` to type, default, and `effectiveProfile` spread | 90% | S | Complete (2026-03-14) | - | TASK-02, TASK-03, TASK-04 |
| TASK-02 | IMPLEMENT | Enforce ghost mode in `canSendDirectMessage` + `isVisibleInDirectory` | 90% | S | Complete (2026-03-14) | TASK-01 | TASK-04 |
| TASK-03 | IMPLEMENT | Ghost mode toggle in `GuestProfileForm` + i18n EN+IT + Firebase rules [co-committed] | 85% | S | Complete (2026-03-14) | TASK-01 | TASK-04 |
| TASK-04 | IMPLEMENT | Tests — messaging policy, form component, server DM gate | 80% | M | Complete (2026-03-14) | TASK-02, TASK-03 | - |

## Engineering Coverage

| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | Ghost mode checkbox in `GuestProfileForm` following `chatOptIn` pattern | TASK-03 | No layout changes; follows existing toggle pattern |
| UX / states | Loading/saving/error states inherited from `isBusy` guard; no extra null-state branch | TASK-03 | Same `disabled={isBusy}` pattern as existing toggles |
| Security / privacy | Firebase rules fix restricts `guestProfiles/$uuid` writes to own profile; `ghostMode` check added to `canSendDirectMessage` server-side gate | TASK-02, TASK-03 | Rules fix co-committed with form toggle — hard constraint |
| Logging / observability / audit | Ghost mode DM rejections counted in existing `write.denied_policy` telemetry; no new metric needed | TASK-02 | `recordDirectTelemetry(env, 'write.denied_policy')` already called on `canSendDirectMessage` returning false |
| Testing / validation | Unit tests for `canSendDirectMessage`/`isVisibleInDirectory`; new `GuestProfileForm.test.tsx`; ghost mode 403 test in `direct-message.test.ts` | TASK-04 | `GuestProfileForm.test.tsx` must be created from scratch |
| Data / contracts | `ghostMode` added to `GuestProfile` interface, `DEFAULT_GUEST_PROFILE`, and `effectiveProfile` explicit spread | TASK-01 | Silent-drop risk in spread is highest-risk item — covered by dedicated test |
| Performance / reliability | N/A — boolean field on in-memory profile object; no new queries | N/A | No performance impact |
| Rollout / rollback | Additive RTDB field; stale `ghostMode: true` nodes on rollback are harmless dead data | TASK-01, TASK-03 | Clean rollback: remove type field + form toggle; Firebase rules restriction can remain without harm |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | — | Foundation: type, default, effectiveProfile spread |
| 2 | TASK-02, TASK-03 | TASK-01 complete | Independent of each other; TASK-03 must co-commit Firebase rules in same commit |
| 3 | TASK-04 | TASK-02 + TASK-03 complete | Full test suite |

## Delivered Processes

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| Ghost mode toggle | Guest opens `/account/profile` and taps Save | Guest sees ghost mode checkbox → toggles on/off → taps Save → `handleSave` collects payload including `ghostMode` → `useGuestProfileMutator.updateProfile(partial)` → Firebase `update(ref(db, 'guestProfiles/{uuid}'), payload)` → RTDB updated | TASK-01 (type), TASK-03 (form + Firebase rules) | Firebase write restricted to own profile after TASK-03 deploys; rollback removes checkbox and type field; stale RTDB ghost flags are safe dead data |
| DM write enforcement | `POST /api/direct-message` called by any guest | Auth + rate-limit checks → fetch sender + peer profiles from RTDB → `canSendDirectMessage(senderProfile, senderUuid, peerProfile, peerUuid)` → if `recipientProfile.ghostMode === true` return `false` → 403 with `write.denied_policy` telemetry | TASK-01 (type propagates to `direct-message.ts`), TASK-02 (policy) | `isThreadReadOnly` inherits ghost check automatically via `canSendDirectMessage` delegation; no other DM paths require update |
| Directory filtering | `GuestDirectory.tsx` renders guest list | `isVisibleInDirectory(profile, uuid, viewerProfile, viewerUuid)` returns `false` when `profile.ghostMode === true` → ghost guest absent from rendered list | TASK-01 (type), TASK-02 (policy) | Client-side only; `direct-message.ts` remains authoritative server gate; no seam |
| Firebase security rules | Any authenticated user calls Firebase `update()` on `guestProfiles/{other-uuid}` | `database.rules.json` new `guestProfiles` rule: `"$uuid": { ".write": "auth != null && auth.uid == $uuid" }` → write rejected unless caller's UID matches the profile UUID | TASK-03 (co-committed with form toggle) | Hard constraint: must not deploy form without rules fix; deploying rules fix alone is safe (all correct existing writes already use own UID) |

## Tasks

---

### TASK-01: Add `ghostMode` field to `GuestProfile` type, default, and `effectiveProfile` spread

- **Type:** IMPLEMENT
- **Deliverable:** Code change — updated `guestProfile.ts` and `useFetchGuestProfile.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Affects:** `apps/prime/src/types/guestProfile.ts`, `apps/prime/src/hooks/pureData/useFetchGuestProfile.ts`
- **Depends on:** —
- **Blocks:** TASK-02, TASK-03, TASK-04
- **Confidence:** 90%
  - Implementation: 90% — exact files identified; `GuestProfile` interface and `DEFAULT_GUEST_PROFILE` are simple type additions; `effectiveProfile` spread at lines 107-117 is confirmed with no `...data` shortcut. Held-back test: no single unknown would drop below 80 — the only risk is forgetting the `?? false` fallback, which is explicitly required and covered by TASK-04.
  - Approach: 95% — flat boolean follows established `chatOptIn`/`socialOptIn` pattern exactly; analysis decisive.
  - Impact: 95% — this is the type foundation all downstream tasks depend on; it is blocked from being incomplete by TASK-04 test coverage.
- **Acceptance:**
  - `GuestProfile` interface includes `ghostMode: boolean`.
  - `DEFAULT_GUEST_PROFILE` includes `ghostMode: false`.
  - `effectiveProfile` object in `useFetchGuestProfile` includes `ghostMode: data.ghostMode ?? false`.
  - TypeScript compilation passes (`pnpm typecheck`).
- **Engineering Coverage:**
  - UI / visual: N/A — no UI change in this task.
  - UX / states: N/A — no UX change in this task.
  - Security / privacy: N/A — no security enforcement in this task; enforcement is TASK-02.
  - Logging / observability / audit: N/A — no observability change in this task.
  - Testing / validation: Required — TASK-04 adds a dedicated unit test asserting `effectiveProfile.ghostMode` defaults to `false` when absent from RTDB data.
  - Data / contracts: Required — `GuestProfile` interface, `DEFAULT_GUEST_PROFILE`, and `effectiveProfile` explicit spread all updated.
  - Performance / reliability: N/A — boolean field on in-memory object; no queries.
  - Rollout / rollback: Required — additive field; rollback removes the field; stale RTDB `ghostMode: true` nodes become harmless dead data.
- **Validation contract (TC-01):**
  - TC-01: `GuestProfile` interface includes `ghostMode: boolean` → TypeScript accepts `profile.ghostMode` without error.
  - TC-02: `DEFAULT_GUEST_PROFILE` includes `ghostMode: false` → default profile has ghost mode off.
  - TC-03: `effectiveProfile` when RTDB data has no `ghostMode` key → `effectiveProfile.ghostMode` equals `false` (not `undefined`).
  - TC-04: `effectiveProfile` when RTDB data has `ghostMode: true` → `effectiveProfile.ghostMode` equals `true`.
- **Execution plan:**
  - Red: No tests yet; confirm `effectiveProfile` returns `undefined` for `ghostMode` currently (missing field confirms the gap).
  - Green: Add `ghostMode: boolean` to `GuestProfile`; add `ghostMode: false` to `DEFAULT_GUEST_PROFILE`; add `ghostMode: data.ghostMode ?? false` to `effectiveProfile` spread.
  - Refactor: Typecheck passes; verify no consumers of `GuestProfile` break.
- **Consumer tracing (new outputs):**
  - `ghostMode` field on `GuestProfile` is consumed by:
    - `direct-message.ts` (reads `GuestProfile` type) — no code change needed; type update propagates.
    - `GuestProfileForm.tsx` (reads `effectiveProfile`) — updated in TASK-03.
    - `messagingPolicy.ts` (receives `GuestProfile` objects) — updated in TASK-02.
    - `isVisibleInDirectory` in `GuestDirectory.tsx` (receives profile objects) — updated in TASK-02.
    - `useGuestProfileMutator.ts` (writes `Partial<GuestProfile>`) — no change needed; existing write path handles any partial update.
  - All consumers accounted for.
- **Scouts:** None — all file locations and patterns confirmed in fact-find.
- **Edge Cases & Hardening:** `data.ghostMode ?? false` handles both `undefined` (new field absent on old profile) and explicit `false`; `null` from RTDB would also be coerced to `false` via `??`.
- **What would make this >=90%:** Already at 90%. Reaching 95% would require running the full test suite locally to confirm no consumer breakage.
- **Rollout / rollback:**
  - Rollout: Additive type change; deployed with any subsequent commit that includes it.
  - Rollback: Remove `ghostMode` from interface, default, and spread; stale RTDB nodes with `ghostMode: true` are ignored (missing type field means they are never read).
- **Documentation impact:** None: internal type change only.
- **Notes / references:**
  - `effectiveProfile` spread confirmed at `apps/prime/src/hooks/pureData/useFetchGuestProfile.ts:107-117`.
  - `DEFAULT_GUEST_PROFILE` at `apps/prime/src/types/guestProfile.ts` — omits `bookingId`, `createdAt`, `updatedAt` (runtime-only fields); `ghostMode: false` is a user preference default and must be included.

---

### TASK-02: Enforce ghost mode in `canSendDirectMessage` and `isVisibleInDirectory`

- **Type:** IMPLEMENT
- **Deliverable:** Code change — updated `messagingPolicy.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Affects:** `apps/prime/src/lib/chat/messagingPolicy.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 90%
  - Implementation: 90% — exact function signatures confirmed; ghost check logic is a single `if` guard. Both `canSendDirectMessage` and `isVisibleInDirectory` are in the same file. Held-back test: no single unknown would drop below 80 — ghost check logic is trivial boolean test, no async or edge case.
  - Approach: 95% — analysis decisively chose flat boolean; implementation is a single condition prepended to existing checks.
  - Impact: 90% — server-side gate (`direct-message.ts`) calls `canSendDirectMessage`; client-side `GuestDirectory.tsx` calls `isVisibleInDirectory`; both independently enforce ghost mode as required.
- **Acceptance:**
  - `canSendDirectMessage` returns `false` when `recipientProfile.ghostMode === true`, regardless of other conditions.
  - `isVisibleInDirectory` returns `false` when the viewed `profile.ghostMode === true`.
  - `isThreadReadOnly` inherits the ghost check automatically via delegation to `canSendDirectMessage`.
  - TypeScript compilation passes.
- **Engineering Coverage:**
  - UI / visual: N/A — no UI change in this task.
  - UX / states: N/A — existing 403 handling in the DM compose UI is unchanged; this task adds no new state.
  - Security / privacy: Required — `canSendDirectMessage` is the authoritative server-side enforcement point; ghost check added before (or alongside) `chatOptIn` check.
  - Logging / observability / audit: Required — ghost mode rejections flow through existing `write.denied_policy` telemetry; no new metric needed.
  - Testing / validation: Required — TASK-04 adds ghost mode test cases to `messagingPolicy.test.ts` and `direct-message.test.ts`.
  - Data / contracts: Required — `GuestProfile` type includes `ghostMode` after TASK-01; function signatures unchanged.
  - Performance / reliability: N/A — boolean field check; no new queries.
  - Rollout / rollback: Required — removing ghost check on rollback restores prior DM behaviour; directory visibility also restored.
- **Validation contract (TC-02):**
  - TC-01: `canSendDirectMessage(senderProfile, senderUuid, { ...recipientProfile, ghostMode: true }, peerUuid)` → returns `false`.
  - TC-02: `canSendDirectMessage(senderProfile, senderUuid, { ...recipientProfile, ghostMode: false, chatOptIn: true }, peerUuid)` → respects other checks (not short-circuited by ghost mode).
  - TC-03: `isVisibleInDirectory({ ...profile, ghostMode: true }, uuid, viewerProfile, viewerUuid)` → returns `false`.
  - TC-04: `isVisibleInDirectory({ ...profile, ghostMode: false, chatOptIn: true }, uuid, { ...viewerProfile, chatOptIn: true }, viewerUuid)` → returns `true` (when other conditions pass).
  - TC-05: `isThreadReadOnly` with a ghost-mode recipient → returns `true` (via delegation).
- **Execution plan:**
  - Red: Confirm existing tests pass without ghost mode check; note the gap.
  - Green: Add `if (recipientProfile.ghostMode) return false;` in `canSendDirectMessage` **immediately after the null guard** (after line 34 in current source, before the `chatOptIn` check — `recipientProfile` is narrowed to non-null at that point). Add `if (profile.ghostMode) return false;` in `isVisibleInDirectory` **immediately after its null guard** (after line 71, before the `chatOptIn` check).
  - Refactor: Confirm `isThreadReadOnly` still delegates correctly; no other callers affected.
- **Consumer tracing (modified behavior):**
  - `canSendDirectMessage` callers: `direct-message.ts:163` (server-side); `messagingPolicy.ts` internally via `isThreadReadOnly`. No other callers found.
  - `isVisibleInDirectory` callers: `GuestDirectory.tsx:72` (client-side). No other callers found.
  - Both consumers are accounted for; behaviour change is intentional.
- **Scouts:** None — function signatures and call sites confirmed in fact-find.
- **Edge Cases & Hardening:** Ghost sender DMing non-ghost recipient — allowed (ghost mode only blocks incoming DMs). Ghost sender sees own ghost mode toggle but can still send. Both sender and recipient are ghost — sender check not needed (only recipient check matters for inbound gate). `ghostMode: undefined` on old profiles defaults to falsy — existing check safe.
- **What would make this >=90%:** Already at 90%. Reaching 95% would require running ghost mode integration flow end-to-end in emulator.
- **Rollout / rollback:**
  - Rollout: Deployed as part of the same release as TASK-01.
  - Rollback: Remove `ghostMode` checks from both functions; prior behaviour restored immediately.
- **Documentation impact:** None: internal policy function change.
- **Notes / references:**
  - `canSendDirectMessage` actual signature: `(senderProfile: GuestProfile | null | undefined, senderUuid: string | null | undefined, recipientProfile: GuestProfile | null | undefined, recipientUuid: string | null | undefined): boolean`. After the null guard at lines 32-34, `recipientProfile` is narrowed to `GuestProfile` — place the ghost check there.
  - `isVisibleInDirectory` actual signature: `(profile: GuestProfile | null | undefined, profileUuid: string | null | undefined, viewerProfile: GuestProfile | null | undefined, viewerUuid: string | null | undefined): boolean`. After the null guard at lines 69-71, `profile` is narrowed — place the ghost check there.
  - Both functions are pure — testable without RTDB mock.

---

### TASK-03: Ghost mode toggle in `GuestProfileForm` + i18n (EN+IT) + Firebase rules fix [co-committed]

- **Type:** IMPLEMENT
- **Deliverable:** Code change — updated `GuestProfileForm.tsx`, `en/Onboarding.json`, `it/Onboarding.json`, `database.rules.json` (all in one commit)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Affects:** `apps/prime/src/components/profile/GuestProfileForm.tsx`, `apps/prime/public/locales/en/Onboarding.json`, `apps/prime/public/locales/it/Onboarding.json`, `apps/prime/database.rules.json`
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 85% — `GuestProfileForm.tsx` pattern confirmed via `chatOptIn` toggle; i18n key pattern confirmed; Firebase rules syntax confirmed. Co-commit constraint adds execution risk (must not forget any of the 4 files). Held-back test: if i18n key structure differs from expected in the IT locale, could cause `translations-completeness.test.ts` failure — but the existing EN/IT parallel key structure makes this unlikely.
  - Approach: 90% — directly follows established patterns; analysis decisive.
  - Impact: 90% — form toggle is the user-visible surface; Firebase rules fix resolves the security precondition.
- **Acceptance:**
  - Ghost mode checkbox appears in `GuestProfileForm` below `chatOptIn` toggle, disabled while `isBusy`.
  - `handleSave` payload includes `ghostMode` with the current toggle state.
  - `en/Onboarding.json` contains a `ghostModeLabel` key (or equivalent) under the `guestProfile` namespace.
  - `it/Onboarding.json` contains the matching Italian translation in the same commit.
  - `database.rules.json` contains `"guestProfiles": { "$uuid": { ".write": "auth != null && auth.uid == $uuid" } }`.
  - `translations-completeness.test.ts` passes (EN/IT parity confirmed).
  - TypeScript compilation passes.
- **Expected user-observable behavior:**
  - Guest opens the Profile page → sees a "Ghost mode" (EN) / equivalent Italian label checkbox below the existing chat toggle.
  - Guest toggles ghost mode on → taps Save → profile updates, ghost mode state persists on reload.
  - Guest toggles ghost mode off → taps Save → profile updates, guest re-appears in directory.
  - While saving, all preference toggles (including ghost mode) are disabled.
- **Engineering Coverage:**
  - UI / visual: Required — ghost mode checkbox added to `GuestProfileForm` following `chatOptIn` pattern; no layout changes beyond adding a new checkbox row.
  - UX / states: Required — checkbox disabled when `isBusy`; save error handling inherited from existing form flow.
  - Security / privacy: Required — Firebase rules fix included in this task's co-commit; must not be split to a separate commit.
  - Logging / observability / audit: N/A — no new telemetry in this task.
  - Testing / validation: Required — TASK-04 creates `GuestProfileForm.test.tsx` covering the toggle and save payload.
  - Data / contracts: Required — `handleSave` payload must include `ghostMode`; i18n keys must match `t()` calls in the component.
  - Performance / reliability: N/A — no new queries or async operations.
  - Rollout / rollback: Required — Firebase rules restriction safe to leave deployed on rollback (all correct existing writes already use own UID); form toggle removed on rollback.
- **Validation contract (TC-03):**
  - TC-01: Ghost mode checkbox renders in `GuestProfileForm` with correct label from i18n key.
  - TC-02: Ghost mode checkbox is disabled when `isBusy === true`.
  - TC-03: Ghost mode checkbox reflects `effectiveProfile.ghostMode` initial value.
  - TC-04: `handleSave` called after toggling ghost mode → payload includes `ghostMode: true`.
  - TC-05: `handleSave` called with ghost mode off → payload includes `ghostMode: false`.
  - TC-06: EN and IT locale keys for ghost mode exist and are non-empty.
  - TC-07: `database.rules.json` `guestProfiles.$uuid.write` evaluates to `auth != null && auth.uid == $uuid`.
- **Execution plan:**
  - Red: Confirm ghost mode key absent from i18n files; confirm `handleSave` payload does not include `ghostMode`; confirm `database.rules.json` has no per-user write rule.
  - Green: Add `useState<boolean>(effectiveProfile.ghostMode)` to `GuestProfileForm`; add checkbox JSX following `chatOptIn` pattern; add `ghostMode: ghostMode` to `handleSave` payload; add i18n keys to EN and IT; add Firebase rules restriction.
  - Refactor: Verify all 4 files committed together; verify `translations-completeness.test.ts` would pass; verify Firebase rules JSON is valid.
- **Consumer tracing (new outputs):**
  - `handleSave` payload now includes `ghostMode` — consumed by `useGuestProfileMutator.updateProfile()` which accepts `Partial<GuestProfile>`; no change needed to mutator.
  - i18n keys consumed only by `GuestProfileForm` via `t()` call — no other consumers.
  - Firebase rules change affects all write attempts to `guestProfiles/{uuid}`; all correct existing writes (via `useGuestProfileMutator`) already use own UUID — no breakage.
- **Scouts:** None — all patterns confirmed in fact-find.
- **Edge Cases & Hardening:**
  - Co-commit enforcement: all 4 files must be staged and committed together. If Firebase rules are accidentally committed separately, the security gap re-opens briefly — build must treat this as a hard failure.
  - i18n CI failure if locales split: `translations-completeness.test.ts` will fail between commits if EN/IT not in same commit. Both must be in the same commit.
- **What would make this >=90%:** Eliminating the co-commit execution risk (reaching 90% would require confirmed atomic commit including all 4 files). Automated commit validation that blocks if any of the 4 files is missing.
- **Rollout / rollback:**
  - Rollout: All 4 files deployed together. Firebase rules restriction is safe regardless of order; form toggle provides user value.
  - Rollback: Remove checkbox from `GuestProfileForm`; remove i18n keys; Firebase rules restriction can remain (safe dead rule without the form).
- **Documentation impact:** None: internal form change.
- **Notes / references:**
  - `GuestProfileForm.tsx` existing `socialOptIn` and `chatOptIn` state pattern: `const [chatOptIn, setChatOptIn] = useState<boolean>(effectiveProfile.chatOptIn)`.
  - `handleSave` current payload: `{ intent, interests, stayGoals, pace, socialOptIn, chatOptIn, profileStatus, bookingId }` — add `ghostMode`.
  - Firebase rules syntax reference: `"guestProfiles": { "$uuid": { ".write": "auth != null && auth.uid == $uuid" } }`.

---

### TASK-04: Tests — messaging policy, form component, server DM gate

- **Type:** IMPLEMENT
- **Deliverable:** Code change — updated `messagingPolicy.test.ts`, new `GuestProfileForm.test.tsx`, updated `direct-message.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-14)
- **Affects:** `apps/prime/src/lib/chat/__tests__/messagingPolicy.test.ts`, `apps/prime/src/components/profile/__tests__/GuestProfileForm.test.tsx` (new), `apps/prime/functions/__tests__/direct-message.test.ts`, `apps/prime/src/hooks/pureData/__tests__/useFetchGuestProfile.test.ts` (new)
- **Depends on:** TASK-02, TASK-03
- **Blocks:** —
- **Confidence:** 80%
  - Implementation: 80% — `messagingPolicy.test.ts` and `direct-message.test.ts` patterns confirmed; `GuestProfileForm.test.tsx` must be created from scratch with no existing file to extend, which adds setup burden (React Query mock, profile form render, handler mock). Held-back test: if the GuestProfileForm requires non-trivial React Query or modal context setup that doesn't follow standard brikette Jest patterns, setup effort could increase. But `chatOptIn` toggle already exists in the form and provides a direct template — no fundamental unknown.
  - Approach: 85% — unit test approach is standard; pure functions and React component testing are well-understood.
  - Impact: 90% — tests provide CI coverage for the effectiveProfile silent-drop risk (highest-risk item) and server-gate ghost check.
- **Acceptance:**
  - `messagingPolicy.test.ts` includes: ghost mode recipient blocks DM; ghost mode sender still allowed to send; non-ghost recipient with `chatOptIn: true` not blocked; `isVisibleInDirectory` returns false for ghost profile.
  - `GuestProfileForm.test.tsx` (new file) includes: ghost mode checkbox renders; checkbox reflects initial `ghostMode` value; save payload includes `ghostMode`; checkbox disabled when `isBusy`.
  - `direct-message.test.ts` includes: ghost mode 403 case (recipient profile with `ghostMode: true` → `getSpy` returns ghost profile → response status 403).
  - `useFetchGuestProfile` `effectiveProfile` unit test: RTDB data with no `ghostMode` key → `effectiveProfile.ghostMode` equals `false`.
  - All new tests pass in CI.
- **Engineering Coverage:**
  - UI / visual: Required — `GuestProfileForm.test.tsx` renders component and asserts checkbox presence.
  - UX / states: Required — `GuestProfileForm.test.tsx` asserts checkbox disabled when `isBusy`.
  - Security / privacy: Required — `direct-message.test.ts` ghost mode 403 case covers server-gate enforcement.
  - Logging / observability / audit: N/A — `write.denied_policy` telemetry already covered by existing rejection tests.
  - Testing / validation: Required — this task IS the testing validation layer for the entire feature.
  - Data / contracts: Required — `effectiveProfile` unit test covers the silent-drop risk.
  - Performance / reliability: N/A — test-only change.
  - Rollout / rollback: N/A — test files are not deployed.
- **Validation contract (TC-04):**
  - TC-01: `canSendDirectMessage` with ghost recipient → `false`.
  - TC-02: `canSendDirectMessage` with ghost sender, non-ghost recipient → `true` (when recipient chatOptIn).
  - TC-03: `isVisibleInDirectory` with ghost profile → `false`.
  - TC-04: `isVisibleInDirectory` with non-ghost profile (chatOptIn: true) + viewer (chatOptIn: true) → `true`.
  - TC-05: `GuestProfileForm` with `effectiveProfile.ghostMode: true` → renders checked checkbox.
  - TC-06: `GuestProfileForm` save → handler called with payload including `ghostMode: true`.
  - TC-07: `GuestProfileForm` with `isBusy: true` → ghost mode checkbox is disabled.
  - TC-08: `direct-message.test.ts` ghost recipient → 403 response.
  - TC-09: `useFetchGuestProfile` `effectiveProfile` with no `ghostMode` in data → `effectiveProfile.ghostMode === false`.
- **Execution plan:**
  - Red: Confirm existing tests pass; confirm no ghost mode test cases exist yet.
  - Green: Add ghost mode test cases to `messagingPolicy.test.ts`; create `GuestProfileForm.test.tsx` (scaffold from `chatOptIn` toggle pattern); add ghost mode 403 case to `direct-message.test.ts`; add `effectiveProfile` unit test for ghost mode default.
  - Refactor: Ensure all new tests pass; check for any test isolation issues.
- **Planning validation:**
  - Checks run: `direct-message.test.ts` reviewed (679 lines, `FirebaseRest.prototype.get` spy pattern, `jest.spyOn` usage confirmed); `messagingPolicy.test.ts` existence confirmed; no `GuestProfileForm.test.tsx` exists.
  - Validation artifacts: `apps/prime/functions/__tests__/direct-message.test.ts` (679 lines, read in planning); `apps/prime/src/lib/chat/__tests__/messagingPolicy.test.ts` (existence confirmed).
  - Unexpected findings: `GuestProfileForm.test.tsx` must be created from scratch — slightly higher effort than extending an existing file, but the component pattern is fully known from fact-find.
- **Scouts:** None — all test file locations and patterns confirmed.
- **Edge Cases & Hardening:**
  - `effectiveProfile` test must use a raw RTDB data object (without `ghostMode` key) to exercise the `?? false` fallback — not a `GuestProfile` object with `ghostMode: undefined`.
  - `direct-message.test.ts` ghost mode case must mock the recipient profile fetch (not sender) returning `ghostMode: true`.
- **What would make this >=90%:** Reaching 90% would require verified working `GuestProfileForm.test.tsx` scaffold (React Query mock + render setup confirmed working in CI). Currently 80% due to fresh test file creation uncertainty.
- **Rollout / rollback:**
  - Rollout: Tests deployed to CI on commit.
  - Rollback: Remove ghost mode test cases; revert test files to pre-change state.
- **Documentation impact:** None.
- **Notes / references:**
  - `direct-message.test.ts` spy pattern: `jest.spyOn(FirebaseRest.prototype, 'get')`.
  - Ghost mode 403 case: mock `getSpy` to return `{ ...validRecipientProfile, ghostMode: true }` for the recipient UUID.
  - `GuestProfileForm.test.tsx` location: `apps/prime/src/components/profile/__tests__/GuestProfileForm.test.tsx` (create directory if needed).
  - TC-09 (`effectiveProfile` ghost mode default) is hosted in the new `useFetchGuestProfile.test.ts` file at `apps/prime/src/hooks/pureData/__tests__/useFetchGuestProfile.test.ts`. This file must be created in TASK-04. The test should exercise the `effectiveProfile` transformation with a raw RTDB data object missing the `ghostMode` key and assert that the returned value is `false` (not `undefined`).

---

## Risks & Mitigations

- **`effectiveProfile` silent-drop** — TASK-01 must explicitly add `ghostMode: data.ghostMode ?? false` to the spread; TASK-04 must add a unit test asserting the default. Risk: Medium. Mitigation: explicit annotation in TASK-01 acceptance criteria and dedicated TC-09 in TASK-04.
- **TASK-03/TASK-05 co-commit split** — if Firebase rules accidentally committed separately from the form toggle, a window exists where any authenticated guest can ghost-flag another. Risk: Medium. Mitigation: hard constraint in TASK-03 notes; build executor must stage all 4 files together.
- **`GuestProfileForm.test.tsx` from scratch** — slightly higher setup burden; React Query mock pattern may have gotchas. Risk: Low. Mitigation: `chatOptIn` checkbox in existing form provides direct template; existing brikette Jest patterns documented in MEMORY.md.
- **i18n CI failure if locales split** — `translations-completeness.test.ts` fails between commits if EN and IT keys are not in the same commit. Risk: Low (CI catches it). Mitigation: both locale files in TASK-03 `Affects` list; must be committed together.

## Observability

- Logging: Ghost mode DM rejections counted in existing `write.denied_policy` telemetry (`recordDirectTelemetry(env, 'write.denied_policy')`); no new metric needed.
- Metrics: None: `write.denied_policy` count will naturally include ghost mode rejections.
- Alerts/Dashboards: None: no new alerting required.

## Acceptance Criteria (overall)

- [ ] `GuestProfile` type includes `ghostMode: boolean`; `DEFAULT_GUEST_PROFILE` has `ghostMode: false`.
- [ ] `effectiveProfile` in `useFetchGuestProfile` includes `ghostMode: data.ghostMode ?? false`.
- [ ] `canSendDirectMessage` returns `false` for ghost-mode recipients.
- [ ] `isVisibleInDirectory` returns `false` for ghost-mode profiles.
- [ ] Ghost mode checkbox renders in `GuestProfileForm`, disabled while saving.
- [ ] Save payload includes `ghostMode`.
- [ ] EN and IT locale keys for ghost mode label present and non-empty.
- [ ] `database.rules.json` restricts `guestProfiles/$uuid` writes to `auth.uid == $uuid`.
- [ ] All new and existing tests pass in CI.
- [ ] TypeScript compilation passes (`pnpm typecheck`).

## Decision Log

- 2026-03-14: Option A (flat boolean) chosen over Option B (nested `privacySettings` object). Rationale in `analysis.md`. No option reopened in planning.
- 2026-03-14: Firebase rules fix included as a co-commit requirement within TASK-03 (not a separate sequential task). Hard constraint: form toggle and Firebase rules must land in the same commit to prevent a deployment window where any authenticated guest can ghost-flag another. See TASK-03 co-commit constraint.

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Add `ghostMode` to type, default, effectiveProfile | Yes — no dependencies | None — type, default, and spread locations all confirmed with exact line references | No |
| TASK-02: Policy enforcement in `canSendDirectMessage` + `isVisibleInDirectory` | Partial — requires TASK-01 complete | None — function signatures confirmed; ghost check is a simple boolean guard prepended to existing checks; `isThreadReadOnly` delegation confirmed | No |
| TASK-03: Form toggle + i18n + Firebase rules (co-committed) | Partial — requires TASK-01 complete | [Ordering inversion] [Moderate]: if any of the 4 files committed separately, either i18n CI fails or Firebase rules gap re-opens. Mitigation: hard constraint documented in task and plan notes. | No — mitigated by explicit co-commit constraint |
| TASK-04: Tests | Partial — requires TASK-02 + TASK-03 complete | [Scope gap] [Minor]: `GuestProfileForm.test.tsx` must be created from scratch; TC-09 (`effectiveProfile` ghost mode default) is a new test in a non-obvious location (`useFetchGuestProfile` hook test vs form test). Must confirm test file path exists or is created. | No — documented in task notes |

## Overall-confidence Calculation

- S=1, M=2, L=3
- TASK-01: 90% × 1 = 90
- TASK-02: 90% × 1 = 90
- TASK-03: 85% × 1 = 85
- TASK-04: 80% × 2 = 160
- Weighted sum: 90 + 90 + 85 + 160 = 425
- Total effort weight: 1 + 1 + 1 + 2 = 5
- **Overall-confidence: 425 / 5 = 85%**
