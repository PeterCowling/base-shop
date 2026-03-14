---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: Platform
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: prime-guest-ghost-mode
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/prime-guest-ghost-mode/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260314173000-BRIK-001
---

# Prime Guest Ghost Mode Fact-Find Brief

## Scope

### Summary

Guests currently have no way to prevent other guests from sending them direct messages without fully opting out of chat. The only option is `chatOptIn: false`, which also prevents the guest from sending DMs and hides them from the guest directory entirely. Ghost mode is a targeted privacy toggle: a guest who enables it stops receiving incoming DMs from other guests while remaining able to send messages. Ghost-mode guests also disappear from the visible directory, matching the "ghost" metaphor.

### Goals

- Add a `ghostMode: boolean` field to the `GuestProfile` type and Firebase RTDB schema.
- Enforce ghost mode in `canSendDirectMessage` (server-side and client-side) so no DM can be sent to a ghost guest.
- Hide ghost-mode guests from the guest directory (`isVisibleInDirectory`).
- Surface the toggle in `GuestProfileForm` on the profile page.
- Add i18n keys for the toggle label (EN + IT).
- Fix the Firebase security rules gap: `guestProfiles/{uuid}` currently allows any authenticated user to write any profile; restrict to own profile only (required to prevent a guest ghost-flagging another guest).

### Non-goals

- Staff-visible ghost mode indicators (not requested; no staff inbox implication).
- Ghost mode persisting across stays (per-stay scope is already enforced via `bookingId` check).
- Notifications or read-receipts changes (outside scope; no notification infrastructure today).
- Push notification suppression for ghost guests (no push notification system in scope).

### Constraints & Assumptions

- Constraints:
  - RTDB is the sole persistence layer for guest profiles; no D1 record is needed.
  - The write path is client-side Firebase SDK (`update()` via `useGuestProfileMutator`) — no new API endpoint required.
  - Policy enforcement against DMs must remain server-side in `direct-message.ts` (the authoritative gate); client-side filtering is advisory only.
  - i18n must cover both EN and IT locales (the two active locales in `apps/prime/public/locales/`).
- Assumptions:
  - Ghost mode defaults to `false` for all guests (opt-in model — ghost is off unless the guest enables it).
  - Ghost mode is independent of `chatOptIn`; a guest can have `chatOptIn: true` and `ghostMode: true` simultaneously (opted into chat, but not receiving DMs).
  - A ghost guest retains the ability to send DMs to other opted-in guests — ghost means "don't bother me", not "I can't communicate".
  - Ghost-mode guests are hidden from the directory (you cannot start a conversation with someone you cannot see).

## Outcome Contract

- **Why:** Guests want a way to be in the chat system without being open to incoming DMs — useful for solo travellers who want to read broadcasts and send one-off messages without being reachable.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A guest can toggle ghost mode on their profile. While ghost mode is on, no other guest can initiate a DM with them, and they do not appear in other guests' directories.
- **Source:** operator

## Current Process Map

- Trigger: Guest A attempts to send a DM to Guest B.
- End condition: Message is written to RTDB or request is rejected with 403.

### Process Areas

| Area | Current step-by-step flow | Owners / systems / handoffs | Evidence refs | Known issues |
|---|---|---|---|---|
| Guest profile write | Guest opens `/account/profile`, edits preferences, taps "Save preferences" → `GuestProfileForm.handleSave()` → `useGuestProfileMutator.updateProfile(partial)` → Firebase `update(ref(db, 'guestProfiles/{uuid}'), payload)` | Prime app + RTDB | `apps/prime/src/app/(guarded)/account/profile/page.tsx`, `apps/prime/src/hooks/mutator/useGuestProfileMutator.ts` | No per-user write restriction in `database.rules.json` — any auth'd user can write any guest's profile |
| Guest profile read | `useFetchGuestProfile` fetches `guestProfiles/{uuid}` via React Query (5min stale) → returns `effectiveProfile` with explicit field mapping | Prime app + RTDB | `apps/prime/src/hooks/pureData/useFetchGuestProfile.ts` | `effectiveProfile` uses explicit field spread — new fields not added to the spread are silently dropped |
| DM write enforcement | `POST /api/direct-message` → validates token → rate-limit → fetches sender/peer profiles from RTDB → calls `canSendDirectMessage(senderProfile, senderUuid, peerProfile, peerUuid)` → if false, returns 403 | Cloudflare Pages Function + RTDB | `apps/prime/functions/api/direct-message.ts:163` | No ghost mode check in `canSendDirectMessage` today |
| Directory filtering | `GuestDirectory.tsx` renders list of guests → `isVisibleInDirectory(profile, uuid, currentProfile, currentUuid)` — filters on mutual `chatOptIn` + bilateral block list | Prime app | `apps/prime/src/app/(guarded)/chat/GuestDirectory.tsx:72` | No ghost mode check in `isVisibleInDirectory` today |

## Discovery Contract Output

- **Gap Case ID:** n/a
- **Recommended First Prescription:** n/a
- **Required Inputs:** none
- **Expected Artifacts:** none
- **Expected Signals:** none

### Prescription Candidates
None — this is a direct feature request, not a self-evolving prescription.

## Evidence Audit (Current State)

### Entry Points

- `apps/prime/src/app/(guarded)/account/profile/page.tsx` — profile settings page (the natural home for the ghost mode toggle)
- `apps/prime/functions/api/direct-message.ts` — server-side DM write gate; the authoritative enforcement point for `canSendDirectMessage`

### Key Modules / Files

1. `apps/prime/src/types/guestProfile.ts` — `GuestProfile` interface (add `ghostMode: boolean`) and `DEFAULT_GUEST_PROFILE` (add `ghostMode: false`)
2. `apps/prime/src/lib/chat/messagingPolicy.ts` — `canSendDirectMessage` and `isVisibleInDirectory` (add `ghostMode` checks)
3. `apps/prime/src/hooks/pureData/useFetchGuestProfile.ts` — `effectiveProfile` explicit field mapping (must add `ghostMode` to spread, else new field is dropped on stale/default path)
4. `apps/prime/src/hooks/mutator/useGuestProfileMutator.ts` — `updateProfile(Partial<GuestProfile>)` — accepts any partial; no changes needed here once `GuestProfile` gains `ghostMode`
5. `apps/prime/src/components/profile/GuestProfileForm.tsx` — add `ghostMode` state, include in `handleSave`, render toggle (follow `chatOptIn` checkbox pattern)
6. `apps/prime/public/locales/en/Onboarding.json` — add `guestProfile.ghostModeLabel` key
7. `apps/prime/public/locales/it/Onboarding.json` — add `guestProfile.ghostModeLabel` key (IT translation)
8. `apps/prime/database.rules.json` — add `guestProfiles/$uuid { ".write": "auth != null && auth.uid == $uuid" }` to prevent cross-profile writes
9. `apps/prime/src/lib/chat/__tests__/messagingPolicy.test.ts` — add ghost mode test cases
10. `apps/prime/src/app/(guarded)/chat/__tests__/guest-directory.test.tsx` — add ghost mode directory filtering tests

### Patterns & Conventions Observed

- **Explicit field spread in `effectiveProfile`**: `useFetchGuestProfile` does not use `...data`; it explicitly names every field. Adding `ghostMode` to `GuestProfile` without also adding it to this spread causes a silent default — the toggle would save to RTDB but never be read back into the form or messaging policy inputs. Evidence: `apps/prime/src/hooks/pureData/useFetchGuestProfile.ts:106-118`.
- **Checkbox toggle pattern in `GuestProfileForm`**: `chatOptIn` and `socialOptIn` both use `<label><input type="checkbox"/></label>` with Tailwind styling. Ghost mode follows the same pattern. Evidence: `apps/prime/src/components/profile/GuestProfileForm.tsx:199-229`.
- **Server-side + client-side policy layering**: `canSendDirectMessage` is enforced in `direct-message.ts` (server, authoritative) and `chat/channel/page.tsx` (client, advisory). **Note:** `GuestDirectory.tsx` uses `isVisibleInDirectory`, not `canSendDirectMessage` — directory hiding is a separate required code change. Both `canSendDirectMessage` and `isVisibleInDirectory` must be updated independently. Changes to one do not propagate to the other.
- **Direct Firebase SDK write**: `useGuestProfileMutator` writes directly to RTDB via `update()` — no API endpoint intermediary. Adding a new boolean field to the partial update payload requires no server changes.
- **i18n namespace**: Profile form strings live in `Onboarding` namespace. Both EN and IT locales exist and are parity-checked by `translations-completeness.test.ts`. Both must be updated.

### Data & Contracts

- Types/schemas/events:
  - `GuestProfile` interface at `apps/prime/src/types/guestProfile.ts:44-56` — `ghostMode: boolean` must be added.
  - `GuestProfiles = IndexedById<GuestProfile>` at same file — inherits automatically.
  - `DEFAULT_GUEST_PROFILE` at `apps/prime/src/types/guestProfile.ts:62-71` — `ghostMode: false` must be added.
  - `GuestProfilePayload = Partial<GuestProfile>` in `useGuestProfileMutator.ts:14` — inherits automatically once `GuestProfile` gains `ghostMode`.
  - `effectiveProfile` return type in `UseFetchGuestProfileResult` is `Omit<GuestProfile, 'bookingId' | 'createdAt' | 'updatedAt'>` — will include `ghostMode` automatically once added to `GuestProfile`; but the runtime value must also be added to the explicit spread at line 107-117 using `ghostMode: data.ghostMode ?? false` (not bare `data.ghostMode`) because existing RTDB profiles missing the field return `undefined`, which would be `undefined` in the form toggle state rather than the correct `false` boolean.

- Persistence:
  - RTDB path: `guestProfiles/{uuid}` — schema is unversioned JSON, additive changes are safe (RTDB does not validate fields, `ghostMode` will be `undefined` for existing profiles until updated, which reads as falsy → correct default).
  - No migration needed — RTDB is schemaless; missing `ghostMode` on read returns `undefined`, which coerces to `false` in the `canSendDirectMessage` boolean check.

- API/contracts:
  - `canSendDirectMessage(senderProfile, senderUuid, recipientProfile, recipientUuid): boolean` — needs `if (recipientProfile.ghostMode) return false;` before the `chatOptIn` checks.
  - `isVisibleInDirectory(profile, profileUuid, viewerProfile, viewerUuid): boolean` — needs `if (profile.ghostMode) return false;` to hide ghost guests from the directory.
  - `POST /api/direct-message` — inherits the policy fix via `canSendDirectMessage`; no direct changes needed.

### Dependency & Impact Map

- Upstream dependencies:
  - Firebase RTDB (`guestProfiles/{uuid}`) — single source of truth for guest profiles
  - `useGuestProfileMutator` — write path; no changes needed once type is updated
  - `useFetchGuestProfile` — read path; requires explicit spread update

- Downstream dependents:
  - `canSendDirectMessage` → `direct-message.ts` (server, authoritative); `chat/channel/page.tsx` (client, advisory)
  - `isVisibleInDirectory` → `GuestDirectory.tsx` (client, directory rendering)
  - `GuestProfileForm` — renders toggle; submits `ghostMode` in update payload
  - `translations-completeness.test.ts` — parity-checks EN/IT locales; will fail CI if only one locale is updated

- Likely blast radius:
  - **Narrow**: changes are confined to the guest messaging and profile surface. No staff-side or booking-side code is touched. The only breakage risk is silent-drop if `effectiveProfile` spread is not updated.

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest (unit/component), React Testing Library
- Commands: `pnpm -w run test:governed` (CI only; do not run locally per `docs/testing-policy.md`)
- CI integration: governed Jest runner with path-filtered CI

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Messaging policy | Unit | `apps/prime/src/lib/chat/__tests__/messagingPolicy.test.ts` | Exhaustive coverage of `canSendDirectMessage`, `isVisibleInDirectory`, `isBlocked`; no ghost mode cases |
| Guest directory | Component | `apps/prime/src/app/(guarded)/chat/__tests__/guest-directory.test.tsx` | 321 lines; covers mutual opt-in filtering, blocking, empty states; no ghost mode case |
| Chat opt-in controls | Component | `apps/prime/src/components/onboarding/__tests__/chat-optin-controls.test.tsx` | 162 lines; covers `ChatOptInControls` component — **different component from `GuestProfileForm`**; no `GuestProfileForm` test file exists today |
| Profile hook (directory) | Unit | `apps/prime/src/hooks/data/__tests__/useGuestProfiles.test.tsx` | Covers booking-scoped directory profiles, not `useFetchGuestProfile.effectiveProfile` — **no existing test asserts the explicit field spread** |
| i18n completeness | Unit | `apps/prime/src/__tests__/translations-completeness.test.ts` | Checks EN/IT parity — will catch missing ghost mode label |

#### Coverage Gaps

- Untested paths:
  - Ghost mode check in `canSendDirectMessage` — no tests yet
  - Ghost mode filter in `isVisibleInDirectory` — no tests yet
  - `GuestProfileForm` ghost mode toggle render + save — no tests yet
  - `useFetchGuestProfile` `effectiveProfile` including `ghostMode` — no existing test asserts this field's value; `useGuestProfiles.test.tsx` covers directory profiles, not this hook
  - `POST /api/direct-message` server enforcement for ghost recipient — no existing integration test asserts 403 for ghost recipient (acceptance contract requires this)

#### Testability Assessment

- Easy to test:
  - `canSendDirectMessage` with `ghostMode: true` — pure function, `createProfile()` helper already in test file
  - `isVisibleInDirectory` with ghost profile — same pattern
  - `GuestProfileForm` toggle — RTL render with `effectiveProfile` prop
- Hard to test:
  - Firebase security rules enforcement — rules are evaluated server-side by Firebase emulator; not in Jest scope. Recommend: documented manually.
- Test seams needed:
  - None — existing seams (`jest.mock` for Firebase hooks, pure function structure) are sufficient.

#### Recommended Test Approach

- Unit tests for: `canSendDirectMessage(sender, uuid, ghostRecipient, uuid)` → `false`; `isVisibleInDirectory(ghostProfile, ...)` → `false` (add to `messagingPolicy.test.ts`)
- Component tests for: `GuestProfileForm` renders ghost mode toggle; saving with `ghostMode: true` calls `updateProfile` with `ghostMode: true` (add to `GuestProfileForm` test, not `chat-optin-controls.test.tsx` which tests `ChatOptInControls`, a different component)
- Integration tests for: `POST /api/direct-message` returns 403 when `recipientProfile.ghostMode === true` — add to `apps/prime/functions/__tests__/direct-message.test.ts` (confirmed exists); this is the authoritative server gate
- i18n: covered by existing `translations-completeness.test.ts` — just add the keys to both locales

### Recent Git History (Targeted)

- `apps/prime/src/lib/chat/messagingPolicy.ts`, `apps/prime/src/types/guestProfile.ts` — `1496cbf9e3`: `feat(prime): implement channel messaging UI and privacy-safe opt-in controls (TASK-45, TASK-46)`. This is the commit that established the current `GuestProfile`, `canSendDirectMessage`, `isVisibleInDirectory`, and the test suite. Ghost mode extends this foundation directly.

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | `GuestProfileForm.tsx` has toggle pattern for `chatOptIn` and `socialOptIn` | No ghost mode toggle exists | Add ghost mode checkbox following chatOptIn pattern; include i18n label |
| UX / states | Required | Profile form has loading, error, success, and saving states | Ghost mode toggle needs same disabled-while-saving and save-error handling as other fields | Ensure `ghostMode` is included in `handleSave` payload and gated by `isBusy` |
| Security / privacy | Required | `canSendDirectMessage` enforced server-side in `direct-message.ts`; Firebase rules currently allow any auth'd user to write any guest's profile | (1) Ghost mode check missing from policy → blocked by adding to `canSendDirectMessage`. (2) RTDB rules gap → any guest could set another guest's `ghostMode: true` maliciously | Must fix `database.rules.json` to restrict `guestProfiles/$uuid` writes to `auth.uid == $uuid` |
| Logging / observability / audit | Required | `recordDirectTelemetry(env, 'write.denied_policy')` is already called when `canSendDirectMessage` returns false in `direct-message.ts` | Ghost mode rejections will be counted in `write.denied_policy` (no separate metric needed unless operator wants isolation) | No new telemetry required; `write.denied_policy` covers it |
| Testing / validation | Required | 3 existing test suites cover messaging policy, directory, and form | No ghost mode test cases in any suite | Add unit tests to `messagingPolicy.test.ts` and component tests to `guest-directory.test.tsx` |
| Data / contracts | Required | `GuestProfile` type + `DEFAULT_GUEST_PROFILE` + RTDB `guestProfiles/{uuid}` | `effectiveProfile` spread in `useFetchGuestProfile` does NOT auto-include new fields — silent drop risk | Add `ghostMode` to type, default, and explicit spread; RTDB is schemaless so no migration |
| Performance / reliability | N/A | Ghost mode is a boolean field on an existing in-memory profile object; no new queries or network calls | No performance concern | None |
| Rollout / rollback | Required | RTDB write is direct; no migration; `ghostMode` defaults to falsy for all existing profiles | Rollback: remove field from type and form; existing RTDB nodes with `ghostMode: true` become dead data (safe) | No rollback tooling needed; additive change is inherently safe |

## Questions

### Resolved

- Q: Should ghost-mode guests appear in the guest directory?
  - A: No. If a guest cannot receive DMs, showing them in the directory where others would attempt to start a conversation would be misleading. Ghost guests are hidden from `isVisibleInDirectory` results.
  - Evidence: `GuestDirectory.tsx` — directory is the DM initiation surface; showing unreachable guests creates a dead end. Hiding is consistent with the ghost metaphor.

- Q: Can a ghost guest still send DMs to others?
  - A: Yes. Ghost mode is "I don't want to be contacted", not "I don't want to communicate". The operator description says "not available for communication by other guests" — this is about inbound, not outbound. `canSendDirectMessage` checks `recipientProfile.ghostMode`, not `senderProfile.ghostMode`.
  - Evidence: Operator description: "guests have no way to stop other guests from messaging them" — focus is inbound.

- Q: Does `ghostMode` need to be reset between stays?
  - A: No. `GuestProfile` is already scoped to a booking via `bookingId`. A stale profile (different `bookingId`) returns `DEFAULT_GUEST_PROFILE` via `isStale` check, which has `ghostMode: false`. Per-stay reset is already handled.
  - Evidence: `useFetchGuestProfile.ts:102-118` — stale profile returns `DEFAULT_GUEST_PROFILE`.

- Q: Is a new API endpoint needed to write `ghostMode`?
  - A: No. `useGuestProfileMutator.updateProfile(payload)` accepts `Partial<GuestProfile>` and writes directly to RTDB via Firebase SDK. Adding `ghostMode` to `GuestProfile` makes it automatically accepted.
  - Evidence: `useGuestProfileMutator.ts:54-55` — `await update(profileRef, { ...payload, updatedAt: Date.now() })`.

- Q: Do Firebase security rules need to change for ghost mode to work correctly?
  - A: Yes — this is a required security fix. The current `database.rules.json` has no explicit rules for `guestProfiles`, falling through to the root `".write": "auth != null"`. Any authenticated user can write any guest's profile. If left unfixed, a guest could set `ghostMode: true` on another guest's profile, effectively silencing them without their knowledge. The `guestProfiles.$uuid` rule must be restricted to `auth.uid == $uuid`.
  - Evidence: `apps/prime/database.rules.json` — `guestProfiles` node absent from explicit rules; root catch-all at lines 3-4.

- Q: Where should the ghost mode toggle be placed in the UI?
  - A: In the existing `GuestProfileForm.tsx` on `/account/profile`, immediately below the `chatOptIn` section. Ghost mode is a direct companion to `chatOptIn` — it makes sense to group all guest communication preferences together. A separate privacy screen would require an additional route, navigation link, and layout entry — unjustified overhead for a single toggle.
  - Evidence: `GuestProfileForm.tsx:215-229` — `chatOptIn` checkbox is the exact pattern to follow; the form already groups communication preferences.

- Q: Will existing profiles missing `ghostMode` break at runtime?
  - A: No. RTDB returns `undefined` for missing fields. `canSendDirectMessage` checks `recipientProfile.ghostMode` — `undefined` is falsy, so existing profiles behave as `ghostMode: false` (not ghost). Safe.
  - Evidence: RTDB is schemaless; `messagingPolicy.ts` uses boolean truthiness checks.

### Open (Operator Input Required)

None. All questions resolved by reasoning from scope and existing code patterns.

## Confidence Inputs

- **Implementation: 90%**
  - All file locations identified, all integration points understood, write and read paths confirmed. UI placement resolved: `GuestProfileForm` inline with `chatOptIn` pattern.
  - Raises to 95%: analysis confirms no edge case around concurrent reads during toggle.

- **Approach: 88%**
  - One viable approach: add boolean field, update policy checks, update form, fix rules. No meaningful alternative architecture (e.g. a separate ghost-mode D1 table) is warranted given the existing RTDB profile pattern.
  - Raises to 93%: analysis confirms no edge case around concurrent reads during toggle.

- **Impact: 90%**
  - `canSendDirectMessage` is called server-side in `direct-message.ts` — the authoritative gate. Ghost mode enforcement is complete on DM creation. Directory visibility is client-side but backed by the server enforcement. `activity-message.ts` is a hostel-wide broadcast channel sender (not a DM path) — confirmed no bypass risk.
  - Raises to 95%: analysis confirms `direct-message.ts` is the sole DM write path.

- **Delivery-Readiness: 88%**
  - All touched files identified, pattern established, tests exist as seams, i18n pipeline known. UI placement resolved; all questions answered.
  - Raises to 93%: analysis confirms no concurrent-write edge case on ghost mode toggle.

- **Testability: 92%**
  - Pure-function policy changes are trivially testable. Component tests for the form toggle follow existing RTL patterns. The only untestable area (Firebase security rules) is handled by documentation.
  - Already at 90%+.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| `effectiveProfile` spread not updated → ghost mode silently dropped | Medium | High | Identified as known gap; task must explicitly add `ghostMode` to spread at `useFetchGuestProfile.ts:107-117` |
| Firebase security rules not updated → any guest can ghost another guest | High (rules gap exists today) | High | Required task: add `guestProfiles/$uuid { ".write": "auth != null && auth.uid == $uuid" }` |
| `handleSave` in `GuestProfileForm` does not include `ghostMode` → toggle saves nothing | Medium | Medium | Task must add `ghostMode` state var and include in `handleSave` update payload |
| `translations-completeness.test.ts` fails if one locale updated and not the other | High (auto-detected by CI) | Low (CI catches it) | Update both EN and IT locales in same commit |
| `isVisibleInDirectory` client-side filter only — ghost guest could still appear if client JS fails | Low | Low | Server-side `direct-message.ts` blocks DM send regardless; directory client filter is defence-in-depth |

## Planning Constraints & Notes

- Must-follow patterns:
  - Use `useGuestProfileMutator.updateProfile(partial)` for writing ghost mode — consistent with all other profile field writes.
  - Follow `chatOptIn` toggle pattern in `GuestProfileForm` (label + checkbox, disabled while saving).
  - Add both EN and IT i18n keys in the same task to avoid `translations-completeness.test.ts` failure.
  - `ghostMode: false` must be in `DEFAULT_GUEST_PROFILE` to ensure correct fallback on stale/absent profiles.
- Rollout/rollback expectations:
  - Additive RTDB field — inherently safe to deploy. Rollback: remove field from type and form. RTDB nodes with `ghostMode: true` become dead data on rollback (harmless; policy check reverts to previous behaviour).
- Observability expectations:
  - No new telemetry required. `write.denied_policy` in `direct-telemetry.ts` already covers rejected DMs regardless of reason.

## Suggested Task Seeds (Non-binding)

- TASK-01: Add `ghostMode: boolean` to `GuestProfile`, `DEFAULT_GUEST_PROFILE`, and `useFetchGuestProfile.effectiveProfile` spread. Add unit test for `ghostMode` field default.
- TASK-02: Update `canSendDirectMessage` (reject if `recipientProfile.ghostMode`) and `isVisibleInDirectory` (hide ghost profiles). Update `messagingPolicy.test.ts` with ghost mode cases.
- TASK-03: Add ghost mode toggle to `GuestProfileForm` (state, `handleSave` payload, checkbox UI). Create a new `GuestProfileForm.test.tsx` test — no existing file covers this component (nearest is `chat-optin-controls.test.tsx` which tests a different component). Add test for toggle render and save behavior.
- TASK-04: Add `guestProfile.ghostModeLabel` to EN + IT `Onboarding.json`.
- TASK-05: Fix Firebase security rules — add `guestProfiles/$uuid` write restriction to `database.rules.json`.
- Note: `activity-message.ts` is a hostel-wide broadcast channel sender, not a DM path — confirmed no bypass risk. No CHECKPOINT task needed.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `ghostMode: true` on recipient profile → `canSendDirectMessage` returns `false` → `POST /api/direct-message` returns 403
  - Ghost guest absent from `GuestDirectory` rendered list
  - Ghost mode toggle visible and saveable on `/account/profile`
  - Both EN and IT locale files contain `guestProfile.ghostModeLabel`
  - `database.rules.json` restricts `guestProfiles.$uuid` writes to own uid
- Post-delivery measurement plan:
  - `write.denied_policy` telemetry counter (existing KV aggregation via `direct-telemetry.ts`) — will naturally include ghost-mode rejections; no new metric needed

## Evidence Gap Review

### Gaps Addressed

1. **Ghost mode field existence**: Confirmed absent from `GuestProfile`, `DEFAULT_GUEST_PROFILE`, and RTDB schema.
2. **Write path**: Confirmed as client-side Firebase SDK `update()` — no API endpoint change needed.
3. **Read path gap**: Identified that `effectiveProfile` explicit spread will silently drop `ghostMode` if not added — this is the highest-risk implementation detail.
4. **Server enforcement point**: Confirmed `canSendDirectMessage` is called in `direct-message.ts:163` — changing the function propagates enforcement to all DM writes automatically.
5. **Firebase rules gap**: Identified that `guestProfiles` has no per-user write restriction — any authenticated user can write any profile; this is a required fix for ghost mode correctness.
6. **i18n requirement**: Both EN and IT locales confirmed; `translations-completeness.test.ts` will enforce parity.
7. **Test seams**: All existing test helpers (`createProfile()`, RTL render patterns) are suitable for ghost mode cases.

### Confidence Adjustments

- Implementation raised from estimated 70% to 90% due to confirmed write path, read path, and exact file locations.
- Security risk added (Firebase rules gap) — noted as a required task, not a blocker for analysis.

### Remaining Assumptions

- RTDB treats missing `ghostMode` as falsy (safe default). Not tested against a live RTDB emulator — standard RTDB schemaless behaviour.
- `activity-message.ts` does not call `canSendDirectMessage` — not verified; flagged as a recommended CHECKPOINT task.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| `GuestProfile` type and defaults | Yes | None | No |
| `canSendDirectMessage` — server enforcement | Yes | None | No |
| `isVisibleInDirectory` — client directory | Yes | None | No |
| `useFetchGuestProfile.effectiveProfile` spread | Yes | [Type contract gap] [Major]: new field on `GuestProfile` silently dropped in `effectiveProfile` return value unless explicitly added to spread at lines 107-117 | Yes — addressed in task seeds as TASK-01 |
| `GuestProfileForm` toggle and save | Yes | None — pattern confirmed via `chatOptIn` checkbox; `handleSave` must include `ghostMode` | No |
| i18n — EN + IT locale keys | Yes | [Ordering inversion] [Minor]: if locales are updated in separate commits, `translations-completeness.test.ts` CI fails between commits | No — single-commit update resolves |
| Firebase security rules | Yes | [Missing precondition] [Major]: `guestProfiles/$uuid` write rule absent — ghost mode flag can be written to any guest's profile by any auth'd user | Yes — addressed as TASK-05 |
| `activity-message.ts` (secondary DM path) | Partial | [Scope gap] [Minor]: not confirmed whether `activity-message.ts` calls `canSendDirectMessage` | No — flagged as CHECKPOINT task |

## Rehearsal-Blocking-Waiver

- **Blocking finding:** `useFetchGuestProfile.effectiveProfile` silently drops new `GuestProfile` fields — risk rated Major.
- **False-positive reason:** This is not a false positive; the risk is real and confirmed. However, it is addressed by explicit task scope: TASK-01 includes adding `ghostMode` to the explicit spread.
- **Evidence of missing piece:** `apps/prime/src/hooks/pureData/useFetchGuestProfile.ts:107-117` — the spread is identified; the fix is concrete and bounded. No planning gap exists; the waiver records that the risk is explicitly handled by TASK-01, not that the risk was incorrectly identified.

## Scope Signal

- **Signal:** right-sized
- **Rationale:** All affected files are identified, the change is confined to the guest messaging profile surface, there is one open operator question (UI placement) that does not block analysis, and the implementation has a clear path with existing patterns for every component.

## Analysis Readiness

- Status: Ready-for-analysis
- Blocking items: none
- Recommended next step: `/lp-do-analysis prime-guest-ghost-mode` — confirm approach (single-field addition vs richer privacy model), resolve UI placement question via default assumption, produce plan.
