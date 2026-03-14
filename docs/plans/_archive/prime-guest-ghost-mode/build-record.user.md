---
Type: Build-Record
Status: Complete
Domain: Platform
Last-reviewed: 2026-03-14
Feature-Slug: prime-guest-ghost-mode
Execution-Track: code
Completed-date: 2026-03-14
artifact: build-record
Build-Event-Ref: docs/plans/prime-guest-ghost-mode/build-event.json
---

# Build Record: Prime Guest Ghost Mode

## Outcome Contract

- **Why:** Guests want a way to be in the chat system without being open to incoming DMs — useful for solo travellers who want to read broadcasts and send one-off messages without being reachable.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A guest can toggle ghost mode on their profile. While ghost mode is on, no other guest can initiate a DM with them, and they do not appear in other guests' directories.
- **Source:** operator

## What Was Built

**TASK-01 — Type foundation:** Added `ghostMode: boolean` to the `GuestProfile` interface in `apps/prime/src/types/guestProfile.ts` and set it to `false` in `DEFAULT_GUEST_PROFILE`. Extended the `effectiveProfile` explicit per-field spread in `apps/prime/src/hooks/pureData/useFetchGuestProfile.ts` to include `ghostMode: data.ghostMode ?? false`, preventing silent `undefined` propagation for legacy RTDB nodes that lack the field.

**TASK-02 — Policy enforcement:** Added ghost mode checks to both `canSendDirectMessage` and `isVisibleInDirectory` in `apps/prime/src/lib/chat/messagingPolicy.ts`. Each check is placed immediately after the existing null guard so the parameter is already narrowed to `GuestProfile`. Ghost blocks inbound DMs only — a ghost guest can still send outbound messages. `isThreadReadOnly` inherits the ghost check automatically via its delegation to `canSendDirectMessage`.

**TASK-03 — Form toggle + i18n + Firebase rules (co-committed):** Added a `ghostMode` checkbox to `GuestProfileForm.tsx` following the existing `chatOptIn`/`socialOptIn` pattern with `disabled={isBusy}` guard and `handleSave` payload inclusion. Added `guestProfile.ghostModeLabel` to both `apps/prime/public/locales/en/Onboarding.json` and `apps/prime/public/locales/it/Onboarding.json` in the same commit (CI enforces translation parity). Also co-committed a Firebase security rules fix to `apps/prime/database.rules.json` restricting `guestProfiles/$uuid` writes to `auth.uid == $uuid` — this closes a gap where any authenticated guest could set another guest's ghost flag.

**TASK-04 — Tests:** Created `apps/prime/src/lib/chat/__tests__/messagingPolicy.test.ts` with ghost mode test cases covering recipient ghost blocks inbound DMs, ghost sender can still send outbound, `isVisibleInDirectory` hides ghost profiles from other guests' views, and `isThreadReadOnly` inherits ghost behaviour. Added TC-10 to `apps/prime/functions/__tests__/direct-message.test.ts` verifying a 403 response when the recipient has `ghostMode: true`. Created `apps/prime/src/components/profile/__tests__/GuestProfileForm.test.tsx` covering checkbox render, initial state (false and true), payload inclusion on save, and enabled state when idle. Created `apps/prime/src/hooks/pureData/__tests__/useFetchGuestProfile.test.ts` (TC-09) verifying that `effectiveProfile.ghostMode` defaults to `false` when a legacy RTDB node omits the field.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `scripts/validate-engineering-coverage.sh docs/plans/prime-guest-ghost-mode/plan.md` | Pass | `{ "valid": true, "skipped": false, "artifactType": "plan", "track": "code" }` |
| Unit tests in `messagingPolicy.test.ts` | Pass (CI) | Ghost mode test cases added to existing suite |
| Unit tests in `GuestProfileForm.test.tsx` | Pass (CI) | New file; 5 test cases |
| Unit tests in `useFetchGuestProfile.test.ts` | Pass (CI) | TC-09: legacy RTDB node ghostMode default = false |
| TC-10 in `direct-message.test.ts` | Pass (CI) | 403 when recipient has ghostMode: true |

## Workflow Telemetry Summary

Full pipeline recorded: 4 stages (lp-do-fact-find → lp-do-analysis → lp-do-plan → lp-do-build), 6 modules loaded, 7 deterministic checks across the pipeline.

| Stage | Avg context bytes | Avg artifact bytes |
|---|---:|---:|
| lp-do-fact-find | 55157 | 31278 |
| lp-do-analysis | 69348 | 14948 |
| lp-do-plan | 93875 | 39755 |
| lp-do-build | 117817 | 7902 |

Total context input: 336197 bytes. Total artifact output: 93883 bytes. Token measurement coverage: 0% (no session ID captured — normal for this run).

## Validation Evidence

### TASK-01
- TC-01-A: `guestProfile.ts` — `ghostMode: boolean` added to `GuestProfile` interface after `chatOptIn`; `ghostMode: false` added to `DEFAULT_GUEST_PROFILE`.
- TC-01-B: `useFetchGuestProfile.ts` — `ghostMode: data.ghostMode ?? false` present in `effectiveProfile` explicit spread; `?? false` default prevents silent-drop for legacy RTDB nodes.

### TASK-02
- TC-02-A: `canSendDirectMessage` — `if (recipientProfile.ghostMode) { return false; }` placed after null guard; TypeScript-safe.
- TC-02-B: `isVisibleInDirectory` — `if (profile.ghostMode) { return false; }` placed after null guard.
- TC-02-C: `isThreadReadOnly` inherits ghost check via `!canSendDirectMessage()` delegation — no additional change needed.

### TASK-03
- TC-03-A: `GuestProfileForm.tsx` — `ghostMode` state initialised from `effectiveProfile.ghostMode`; `handleSave` includes `ghostMode` in payload; checkbox renders with `disabled={isBusy}` guard.
- TC-03-B: `en/Onboarding.json` — `guestProfile.ghostModeLabel` present.
- TC-03-C: `it/Onboarding.json` — `guestProfile.ghostModeLabel` present (Italian translation).
- TC-03-D: `database.rules.json` — `guestProfiles.$uuid.write` restricted to `auth != null && auth.uid == $uuid`; co-committed with form toggle.

### TASK-04
- TC-09: `useFetchGuestProfile.test.ts` — legacy RTDB payload without `ghostMode` → `effectiveProfile.ghostMode === false`; payload with `ghostMode: true` → `true`; null profile → `DEFAULT_GUEST_PROFILE` fallback (`false`).
- TC-10: `direct-message.test.ts` — ghost-mode recipient returns 403; no `setSpy`/`updateSpy` calls.
- TC-form: `GuestProfileForm.test.tsx` — renders ghost mode label; initial false/true state; ghostMode included in `updateProfile` payload on save; checkbox not disabled when idle.
- TC-policy: `messagingPolicy.test.ts` — 3 ghost-specific cases added to `canSendDirectMessage` and `isVisibleInDirectory` suites; `isThreadReadOnly` ghost inheritance verified.

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | Ghost mode checkbox in `GuestProfileForm.tsx` following `chatOptIn` pattern — same `<section>` wrapper, `<label>` flex layout, `input[type=checkbox]` with `accent-primary` | No new layout changes; visually consistent with existing toggles |
| UX / states | `disabled={isBusy}` guard inherited from `chatOptIn`/`socialOptIn` pattern; loading/saving states covered | Same isBusy state as all other form toggles |
| Security / privacy | `canSendDirectMessage` server-side ghost check prevents any DM to ghost recipient; Firebase rules fix restricts profile writes to own UID | Co-commit hard constraint enforced — form and rules landed together |
| Logging / observability / audit | `recordDirectTelemetry(env, 'write.denied_policy')` already fires on all `canSendDirectMessage: false` paths — ghost rejections counted automatically | No new metric needed; existing telemetry covers it |
| Testing / validation | TC-09, TC-10, TC-form, TC-policy — 4 new test files/cases covering type spread, policy enforcement, form component, and server DM gate | All new files pass; see Tests Run table |
| Data / contracts | `GuestProfile` interface, `DEFAULT_GUEST_PROFILE`, and `effectiveProfile` spread all updated; `?? false` default guards legacy RTDB nodes | Silent-drop risk covered by dedicated TC-09 |
| Performance / reliability | N/A — boolean field on in-memory profile object; no new Firebase reads or queries | Ghost check is a single property access on already-loaded profile |
| Rollout / rollback | Additive RTDB field; stale `ghostMode: true` nodes on rollback are harmless dead data; Firebase rules restriction can remain without harm | Clean rollback: remove type field + form toggle |

## Scope Deviations

None. All four tasks completed within planned scope. No controlled scope expansions were required.
