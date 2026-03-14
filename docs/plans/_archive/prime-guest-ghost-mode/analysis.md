---
Type: Analysis
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: prime-guest-ghost-mode
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/prime-guest-ghost-mode/fact-find.md
Related-Plan: docs/plans/prime-guest-ghost-mode/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Prime Guest Ghost Mode Analysis

## Decision Frame

### Summary

Guests have no way to stop incoming DMs without fully opting out of chat (`chatOptIn: false`), which also prevents them from sending messages. The operator has requested a targeted "ghost mode" toggle: active ghost-mode guests cannot receive DMs, disappear from the guest directory, but retain full outbound messaging capability.

The decision is: how should ghost mode be structured — as an additional flat boolean field on `GuestProfile` (matching the existing `chatOptIn`/`socialOptIn` pattern) or as a nested `privacySettings` object for future extensibility?

### Goals

- Add `ghostMode: boolean` to the guest profile type and RTDB persistence.
- Enforce ghost mode in the server-side DM gate (`canSendDirectMessage` in `direct-message.ts`).
- Hide ghost-mode guests from the guest directory (`isVisibleInDirectory`).
- Surface the toggle in `GuestProfileForm` with i18n labels (EN + IT).
- Fix the Firebase security rules gap that allows any authenticated user to write any guest's profile.

### Non-goals

- Staff-visible ghost mode indicators.
- Ghost mode persisting across stays.
- Notification suppression for ghost guests.

### Constraints & Assumptions

- Constraints:
  - RTDB is the sole persistence layer for guest profiles; no D1 record needed.
  - Write path is client-side Firebase SDK (`update()` via `useGuestProfileMutator`) — no new API endpoint required.
  - Server-side enforcement must remain in `direct-message.ts`; client-side is advisory only.
  - Both EN and IT locales must be updated in the same commit (CI enforces completeness).
- Assumptions:
  - Ghost mode defaults to `false` (opt-in model — ghost is off by default).
  - The `effectiveProfile` explicit spread in `useFetchGuestProfile` requires a deliberate per-field addition for any new `GuestProfile` field.

## Inherited Outcome Contract

- **Why:** Guests want a way to be in the chat system without being open to incoming DMs — useful for solo travellers who want to read broadcasts and send one-off messages without being reachable.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A guest can toggle ghost mode on their profile. While ghost mode is on, no other guest can initiate a DM with them, and they do not appear in other guests' directories.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/prime-guest-ghost-mode/fact-find.md`
- Key findings used:
  - `GuestProfile` has `chatOptIn` and `socialOptIn` as flat booleans; no `ghostMode` field exists.
  - `canSendDirectMessage` in `messagingPolicy.ts` is the authoritative gate, called at `direct-message.ts:163`.
  - `isVisibleInDirectory` is a separate function in `GuestDirectory.tsx:72` — not called by `direct-message.ts`; must be updated independently.
  - `useFetchGuestProfile.effectiveProfile` (lines 107-117) uses an explicit field spread — new fields are silently dropped unless explicitly added with `fieldName: data.fieldName ?? default`.
  - Firebase `guestProfiles/{uuid}` has no per-user write restriction in `database.rules.json` — required fix to prevent malicious ghost-flagging.
  - `useGuestProfileMutator.updateProfile(Partial<GuestProfile>)` writes via `update(ref(db, 'guestProfiles/${uuid}'), payload)` — no changes needed to the mutator once `GuestProfile` includes `ghostMode`.

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Pattern consistency | Minimises cognitive overhead and prevents novel failure modes | High |
| Consumer update burden | Each consumer of `GuestProfile` that is not updated is a silent-skip risk | High |
| Firebase rules correctness | Rules gap is a security precondition for ghost mode correctness | High |
| Rollback safety | Additive changes that can be reverted without data loss are strongly preferred | Medium |
| Test seam quality | Can the approach be proven correct with automation? | Medium |
| Future extensibility | Room for a future `doNotDisturb` or similar toggle without a schema rewrite | Low |

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A — Flat boolean field | Add `ghostMode: boolean` directly to `GuestProfile` alongside `chatOptIn` and `socialOptIn`. Update type, default, effectiveProfile spread, policy functions, form, i18n, and Firebase rules. | Exact match to existing pattern; all consumers follow the same `profile.ghostMode` access path; trivially rollbackable | None materially — the pattern is already proven | Silent-drop risk in `effectiveProfile` spread (must explicitly add `ghostMode: data.ghostMode ?? false`) | Yes |
| B — Nested privacy object | Add `privacySettings: { ghostMode: boolean }` as a new nested object on `GuestProfile`. | Extensibility for future privacy fields without polluting the top-level type | Introduces a new access pattern (`profile.privacySettings?.ghostMode`); null-safety required throughout; inconsistent with `chatOptIn`/`socialOptIn`; adds migration complexity if future fields differ | Null-safety failures when `privacySettings` absent on old profiles; no existing pattern to follow; higher consumer update burden | No |

## Engineering Coverage Comparison

| Coverage Area | Option A (flat boolean) | Option B (nested object) | Chosen implication |
|---|---|---|---|
| UI / visual | Checkbox following `chatOptIn` pattern; no layout changes | Same UI but reads from `profile.privacySettings?.ghostMode` | Option A: existing pattern; no new component logic |
| UX / states | Loading/saving/error states inherited from existing `isBusy` guard | Same states; slightly more null-state handling for missing object | Option A: simpler; no extra null-state branch |
| Security / privacy | Firebase rules fix required (same for both); `ghostMode` check in `canSendDirectMessage` | Same rules fix; `privacySettings` null also needs handling in policy function | Option A: fewer null paths in policy enforcement |
| Logging / observability / audit | `write.denied_policy` telemetry covers ghost mode rejections; no new metric needed | Identical | Option A: no delta |
| Testing / validation | Unit tests on `canSendDirectMessage` + `isVisibleInDirectory`; component tests on form | Same, but tests must also cover `privacySettings: undefined` null case | Option A: simpler test matrix; fewer edge cases |
| Data / contracts | Add to `GuestProfile`, `DEFAULT_GUEST_PROFILE`, and `effectiveProfile` explicit spread | New `PrivacySettings` type required; all consumers access via optional chaining | Option A: minimal type surface; explicit spread gap is known and documented |
| Performance / reliability | N/A — boolean field on in-memory profile object; no new queries | N/A — same | N/A for both |
| Rollout / rollback | Additive RTDB field; rollback removes type + form; stale `ghostMode: true` RTDB nodes are harmless dead data | Additive but harder to reason about `privacySettings` null vs `{}` on rollback | Option A: clean rollback path |

## Chosen Approach

- **Recommendation:** Option A — flat boolean field addition, following the established `chatOptIn`/`socialOptIn` pattern.
- **Why this wins:** All existing privacy and preference fields on `GuestProfile` are flat booleans. Option A matches this pattern exactly, minimises consumer update burden, and produces the cleanest rollback path. Option B buys extensibility that has no concrete near-term requirement — the cost (null-safety overhead, new access pattern, inconsistency with existing fields) is not justified by speculative future fields.
- **What it depends on:**
  - `effectiveProfile` spread must explicitly include `ghostMode: data.ghostMode ?? false` — this is the single highest-risk implementation detail and must be covered by a dedicated test.
  - Firebase security rules must be fixed as a required companion step — not optional follow-up.

### Rejected Approaches

- **Option B (nested privacy object)** — rejected because it introduces a new access pattern inconsistent with existing `chatOptIn`/`socialOptIn`, adds null-safety overhead everywhere `privacySettings` is read, and provides extensibility with no near-term concrete requirement.

### Open Questions (Operator Input Required)

None. All approach decisions are agent-resolvable from codebase evidence and the established pattern.

## End-State Operating Model

| Area | Current state | Trigger | Delivered step-by-step end state | What remains unchanged | Risks / seams to carry into planning |
|---|---|---|---|---|---|
| Ghost mode toggle | No toggle exists; no `ghostMode` field on profile | Guest opens `/account/profile` and taps Save | Guest sees ghost mode checkbox → toggles → taps Save → `handleSave` payload includes `ghostMode` → `updateProfile` writes to RTDB at `guestProfiles/{uuid}` | All other profile fields and save flow unchanged | `effectiveProfile` spread must be explicitly extended; `handleSave` payload must include `ghostMode` |
| DM write enforcement | `canSendDirectMessage` checks mutual `chatOptIn` + bilateral block list only | `POST /api/direct-message` | Sender profile and peer profile fetched from RTDB → `canSendDirectMessage` checks `recipientProfile.ghostMode` first → returns `false` if true → 403 returned with `write.denied_policy` telemetry | Auth, rate-limit, and other `canSendDirectMessage` checks unchanged | Ghost check should be added before (or alongside) `chatOptIn` check to avoid confusion when both are set |
| Directory filtering | `isVisibleInDirectory` checks mutual `chatOptIn` + bilateral block list | `GuestDirectory.tsx` renders guest list | `isVisibleInDirectory` returns `false` when `profile.ghostMode === true` → ghost guest absent from rendered list | All non-ghost guests shown unchanged | Client-side only; server-side `direct-message.ts` remains the authoritative DM gate |
| Firebase security rules | `guestProfiles/{uuid}` inherits root `".write": "auth != null"` — any authenticated user can write any guest's profile | Any authenticated user calls Firebase `update()` with a `guestProfiles/{other-uuid}` path | `database.rules.json` adds `"guestProfiles": { "$uuid": { ".write": "auth != null && auth.uid == $uuid" } }` — write restricted to own profile | All other Firebase rules unchanged | Must be committed alongside the form toggle (TASK-03) — guests need the toggle to set their own ghost state; must not deploy as a standalone commit before the form lands. The restriction itself is safe to deploy at any time (all correct existing writes use own UUID) but has no user value without the form. |

## Planning Handoff

- Planning focus:
  - 5 tasks: (1) type + default + effectiveProfile spread, (2) policy functions (canSendDirectMessage + isVisibleInDirectory), (3) form toggle + i18n **[co-committed with TASK-05]**, (4) tests, (5) Firebase rules fix **[co-committed with TASK-03, not a sequential step after TASK-04]**.
  - Correct sequence: TASK-01 → TASK-02 + TASK-03/TASK-05 together → TASK-04. TASK-05 is NOT a final sequential step — it must be in the same commit as TASK-03 to avoid a deployment window where ghost mode exists in the codebase but any auth'd user can still write any guest's profile.
  - TASK-01 is the hard dependency for all other tasks (type must exist before policy, form, or test changes).
- Validation implications:
  - All policy changes are pure-function — unit-testable without RTDB mock.
  - `GuestProfileForm` component has no existing test file; a new `GuestProfileForm.test.tsx` must be created.
  - `apps/prime/functions/__tests__/direct-message.test.ts` is the authoritative server-gate test suite; a ghost mode 403 case must be added.
  - `translations-completeness.test.ts` enforces EN/IT parity — both locales must be updated in the same commit.
  - Firebase security rules are not unit-testable via Jest; manual evidence (or Firebase emulator test) is acceptable.
- Sequencing constraints:
  - TASK-01 (type + defaults) must complete before TASK-02 (policy), TASK-03 (form), or TASK-04 (tests).
  - **TASK-05 (Firebase rules) must be co-committed with TASK-03 (form toggle)** — this is a hard constraint, not a preference. TASK-05 must NOT be treated as a sequential step after TASK-04. The plan must reflect this as a co-commit pairing.
  - TASK-04 (tests) depends on TASK-02 and TASK-03 both complete.
- Risks to carry into planning:
  - `effectiveProfile` silent-drop: explicit `ghostMode: data.ghostMode ?? false` is TASK-01; if missed, all downstream tasks build on a broken foundation.
  - Firebase rules gap: TASK-05 is security-critical; it must not be deferred as an afterthought.
  - No `GuestProfileForm` test file today — TASK-04 must create it from scratch (slightly higher effort than extending an existing file).

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| `effectiveProfile` explicit spread not updated | Medium | High | Implementation detail — requires specific code edit in TASK-01 | Must be test-covered in TASK-04 with a unit test for `ghostMode` default in `effectiveProfile` |
| Firebase rules gap | High (gap exists today) | High | Requires rules deploy — out of scope for analysis to pre-fix | TASK-05 is required; plan must include it and flag deployment pairing with TASK-03 |
| `isVisibleInDirectory` missed as independent update | Low (now documented) | Medium | Implementation awareness gap documented and task-seeded | TASK-02 must explicitly cover both `canSendDirectMessage` AND `isVisibleInDirectory` |
| EN+IT locale parity CI failure | High if split across commits | Low (CI catches it) | Deployment order risk — not an architecture risk | TASK-03 must update both locales in the same commit |
| TASK-05 (Firebase rules) deployed separately from TASK-03 (form) | Medium | High | Sequencing risk — task presentation may imply independence | Plan must hard-enforce co-commit of TASK-05 with TASK-03; any PR that includes ghost mode form without the rules fix must be blocked |

## Planning Readiness

- Status: Go
- Rationale: Approach is decisive (Option A), all engineering coverage areas addressed, no open operator questions, Firebase rules risk explicitly captured as required task, effectiveProfile silent-drop risk documented and task-seeded. Ready for `/lp-do-plan`.
