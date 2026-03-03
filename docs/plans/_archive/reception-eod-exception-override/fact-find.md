---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-01
Last-updated: 2026-03-01
Feature-Slug: reception-eod-exception-override
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-eod-exception-override/plan.md
Trigger-Why: ""
Trigger-Intended-Outcome: ""
Dispatch-ID: IDEA-DISPATCH-20260301-0084
Trigger-Source: dispatch-routed
---

# Reception EOD Exception Override Fact-Find Brief

## Scope

### Summary

`EodChecklistContent` enforces a hard `allDone` gate (`tillDone && safeDone && stockDone`) that prevents the "Confirm day closed" button from appearing until all three checklist steps are complete. There is no escape path for legitimate operational exceptions — for example, when the safe is physically inaccessible, the inventory system has a connectivity failure, or an open till shift cannot be closed because the shift owner is unavailable. Note: `EodChecklistContent` is already management-gated (`canAccess(user, Permissions.MANAGEMENT_ACCESS)`), so only management roles (owner/developer/admin/manager) can access this screen — "management users are blocked from closing the day" is the precise framing. The fix is to add a manager reauth override path consistent with the existing `managerReauth` pattern used by `VarianceSignoffModal`. When `allDone` is false, a manager can authenticate and provide a mandatory reason; the override is logged in the closure record.

### Goals

- Allow EOD to proceed when a legitimate exception prevents one or more checklist steps from completing.
- Require manager credential authentication before any override is accepted.
- Require a non-empty reason string documenting why the step was skipped.
- Persist the override identity and reason in the closure record so the audit trail is complete.
- Follow the existing `verifyManagerCredentials` / `VarianceSignoffModal` pattern precisely — no new authentication mechanism.

### Non-goals

- Removing the `allDone` gate for normal operation; the gate stays and is the preferred path.
- Adding override capability to the till-close or safe-reconcile steps themselves.
- Changing the `EodClosure` Firebase rules (write permission already restricts to `owner | developer | admin | manager`).
- Changes to the "Day closed" banner for the normal (all-steps-complete) closure path. The banner is extended only to display override details when a closure was completed via the override path — this is covered in scope.

### Constraints & Assumptions

- Constraints:
  - The existing `managerReauth` service (`verifyManagerCredentials`) must be reused — it uses a dedicated secondary Firebase app instance to prevent signing out the current session.
  - The `eodClosureSchema` must be extended rather than replaced to maintain backwards read-compatibility with existing closure records.
  - Firebase rules already restrict `eodClosures/$dateKey` writes to `owner | developer | admin | manager` — no rules change needed.
  - The override modal must use `withModalBackground` + `ModalContainer` (consistent with `VarianceSignoffModal` and `OpeningFloatModal`).
  - `Input` and `Textarea` must use `compatibilityMode="no-wrapper"` (pattern established in `VarianceSignoffModal`).
  - The `different manager from current staff` constraint from `VarianceSignoffModal` does NOT apply here — any manager (including the currently logged-in manager) can override, because EOD override is a management-authorised exception, not a peer-separation control.
- Assumptions:
  - The `Float` step is intentionally excluded from `allDone` (it is not in the gate: `const allDone = tillDone && safeDone && stockDone`). The override path covers only the three gated steps (Till, Safe, Stock). This assumption is confirmed by reading the code.
  - "Override" means proceeding despite incomplete steps — it does not retroactively mark the incomplete step as complete.
  - The override should be available when `!allDone && !eodClosureLoading && closure === null` — same condition window as the normal confirm button, just triggered by the absence of `allDone`.

## Outcome Contract

- **Why:** TBD
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Management users (owner/developer/admin/manager — the only roles that can access the EOD screen) can close the day in legitimate exception cases without calling a developer, eliminating the operational blocker identified in the worldclass scan (end-of-day-closeout domain).
- **Source:** auto

## Access Declarations

- Firebase RTDB (`prime-f3652`, `reception` alias): read-only inspection of rules and schema. No live data access required for this fact-find.
- Repository source: full read access to `apps/reception/src/`. Confirmed available.

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/components/eodChecklist/EodChecklistContent.tsx` — the sole rendering entry point for the EOD checklist flow. Consumes all data hooks and owns the `allDone` gate and the `confirmDayClosed` call.

### Key Modules / Files

- `apps/reception/src/components/eodChecklist/EodChecklistContent.tsx` — primary file to be modified. Lines 63 (`const allDone = ...`) and 194–203 (confirm button conditional) are the exact mutation sites.
- `apps/reception/src/schemas/eodClosureSchema.ts` — Zod schema for `EodClosure`. Currently: `{ date, timestamp, confirmedBy, uid? }`. Needs to gain optional override fields.
- `apps/reception/src/hooks/mutations/useEodClosureMutations.ts` — writes the closure record via Firebase `set()`. Needs a new `confirmDayClosedWithOverride` mutation (or a parameterised extension of `confirmDayClosed`).
- `apps/reception/src/services/managerReauth.ts` — `verifyManagerCredentials(email, password): Promise<ManagerAuthResult>`. Reuse verbatim. No changes.
- `apps/reception/src/components/till/VarianceSignoffModal.tsx` — reference implementation for the manager reauth modal pattern (email + password + reason fields, `verifyManagerCredentials`, `withModalBackground` + `ModalContainer`).
- `apps/reception/src/components/eodChecklist/OpeningFloatModal.tsx` — secondary reference for modal structure within the `eodChecklist` directory.
- `apps/reception/src/lib/roles.ts` — `Permissions.MANAGEMENT_ACCESS` = `["owner","developer","admin","manager"]`. The `verifyManagerCredentials` function already enforces this permission check internally.
- `apps/reception/database.rules.json` — `eodClosures/$dateKey` write rule already restricts to `owner | developer | admin | manager`. No rules change needed for the override path.
- `apps/reception/src/hoc/withModalBackground.tsx` — HOC used by all modals in this app.
- `apps/reception/src/components/eodChecklist/__tests__/EodChecklistContent.test.tsx` — 18 existing test cases (TC-01 through TC-18). New override path needs dedicated test cases added here.

### Patterns & Conventions Observed

- **Manager reauth pattern** (evidence: `VarianceSignoffModal.tsx`, `managerReauth.ts`): a secondary Firebase app (`"manager-reauth"` named instance, `inMemoryPersistence`) is used to authenticate a manager without disturbing the current session. The result carries `{ success, user?, error? }`. The calling modal renders email + password + reason fields; it validates the result, enforces any separation rule if applicable, then calls its `onConfirm` callback with the structured signoff data.
- **Modal structure pattern** (evidence: `VarianceSignoffModal.tsx`, `OpeningFloatModal.tsx`): base function component wrapped with `memo()`, exported via `withModalBackground(memo(Base))`. Uses `ModalContainer` for content wrapper. `Input` with `compatibilityMode="no-wrapper"`, `Button` from `@acme/design-system/atoms`.
- **Schema extension pattern** (evidence: `eodClosureSchema.ts`, `tillShiftSchema.ts`): optional Zod fields for audit metadata (e.g. `uid?: z.string().optional()`). Backwards compatible.
- **Mutation pattern** (evidence: `useEodClosureMutations.ts`): hook returns a memoised object of async callbacks. Firebase `set()` for idempotent writes. Zod `safeParse` validates payload before write; shows toast on error.
- **Data-cy test attributes** (evidence: `EodChecklistContent.tsx`): all interactive elements and status indicators use `data-cy` attributes. Tests use `screen.getByTestId(...)` which resolves `data-cy` per `jest.setup.ts` (`configure({ testIdAttribute: "data-cy" })`).
- **Conditional render pattern** (evidence: `EodChecklistContent.tsx` lines 194–203): the confirm button is rendered only when `allDone && !eodClosureLoading`. The override entry point should appear under the opposite condition: `!allDone && !eodClosureLoading && closure === null`.

### Data & Contracts

- Types/schemas/events:
  - `EodClosure` (`eodClosureSchema.ts`): `{ date: string, timestamp: string, confirmedBy: string, uid?: string }`. Needs extension: `overrideReason?: string`, `overrideManagerName?: string`, `overrideManagerUid?: string`. All three fields optional to preserve backwards read-compatibility with existing records.
  - `ManagerAuthResult` (`managerReauth.ts`): `{ success: boolean, user?: User, error?: string }`. Consumed unchanged.
  - New local type needed: `EodOverrideSignoff = { overrideManagerName: string, overrideManagerUid?: string, overrideReason: string }` (or inline in the modal props).
- Persistence:
  - Firebase RTDB path: `eodClosures/<YYYY-MM-DD>`. Write via `set()` (idempotent overwrite). No new path.
  - Extended payload written when override is used: existing fields plus `overrideReason`, `overrideManagerName`, `overrideManagerUid`.
- API/contracts:
  - No external API calls. All writes go to Firebase RTDB via the existing `useFirebaseDatabase` hook.
  - `verifyManagerCredentials` is a local service function; its signature `(email: string, password: string): Promise<ManagerAuthResult>` is unchanged.

### Dependency & Impact Map

- Upstream dependencies:
  - `useEodClosureData` — reads `eodClosures/<today>`. No change needed; the extended fields are optional and will be ignored by the existing schema when absent.
  - `useEodClosureMutations` — needs a new or extended mutation to accept optional override fields. Used only by `EodChecklistContent`.
  - `verifyManagerCredentials` — used unchanged.
- Downstream dependents:
  - `EodChecklistContent` — the only component consuming `useEodClosureMutations`.
  - `EndOfDayPacket.tsx` / `ManagerAuditContent.tsx` — read EOD closure records but only display `confirmedBy` and `timestamp`. Optional new fields do not affect these reads; no changes needed.
  - `eodClosureSchema.ts` — consumed by `useEodClosureMutations` (write) and `useEodClosureData` (read via `useFirebaseSubscription`). Schema must remain backwards-compatible.
- Likely blast radius:
  - **Small and well-contained.** Changes are confined to: `eodClosureSchema.ts` (optional field additions), `useEodClosureMutations.ts` (new mutation variant), a new `EodOverrideModal.tsx` file, and `EodChecklistContent.tsx` (conditional render + modal wiring). No shared packages touched. No routes changed. Firebase rules unchanged.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest + React Testing Library
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs --testPathPattern=EodChecklistContent --no-coverage` (per memory.md pattern)
- CI integration: Tests run in CI only (per `docs/testing-policy.md`). Push to trigger.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| EodChecklistContent | Unit (RTL) | `eodChecklist/__tests__/EodChecklistContent.test.tsx` | 18 test cases (TC-01–TC-18). Covers: access gate, loading states, per-step status, allDone/closure states, confirm button interactions, float modal. No override path tests — that path does not exist yet. |
| OpeningFloatModal | Unit (RTL) | `eodChecklist/__tests__/OpeningFloatModal.test.tsx` | Covers the float modal in isolation. |
| VarianceSignoffModal | Reference (no direct test file found in glob) | `till/__tests__/` | CloseShiftForm.test.tsx tests the signoff flow via CloseShiftForm. |

#### Coverage Gaps

- Untested paths:
  - Override button visible when `!allDone && !eodClosureLoading && closure === null`.
  - Override modal renders with email, password, reason fields.
  - Manager credentials verified; on success: `confirmDayClosedWithOverride` called with override payload; modal closes.
  - Manager credentials fail: error shown, modal stays open.
  - Empty reason: blocked before credential check.
  - Override banner: when closure has `overrideReason`, the "Day closed" banner should display the override note.
- Extinct tests: none expected — existing tests remain valid.

#### Testability Assessment

- Easy to test: all new code paths are mockable with existing jest mock infrastructure. `verifyManagerCredentials` is already a named module export, easily mocked. The new mutation hook variant follows the same mock pattern as `confirmDayClosedMock`.
- Hard to test: none — the Firebase layer is fully mocked; no integration test required for this unit.
- Test seams needed: mock for `../../services/managerReauth` (same as `VarianceSignoffModal` test pattern) and a mock for the new mutation hook export.

#### Recommended Test Approach

- Unit tests for: override button visibility, override modal lifecycle (render → submit → success → close), failure cases (bad credentials, empty reason), schema extension (override fields present in written payload).
- No integration or E2E tests required for this scope.

### Recent Git History (Targeted)

- `apps/reception/src/components/eodChecklist/EodChecklistContent.tsx` — last touched in `1e920aab23` (feat: build OpeningFloatModal, wire EOD checklist, add till nudge). The EOD closure confirmation was added in `ff3f4e9e8e` and the hooks in `1272fde23d`. All recent — this is a young feature, no stale code.
- `apps/reception/src/services/managerReauth.ts` — last touched in `dd981d25cc` (lint auto-fix). The core logic was laid down earlier and has been stable.

## Questions

### Resolved

- Q: Does the `eodClosures/$dateKey` Firebase write rule allow manager-role users to write?
  - A: Yes. The rule explicitly enumerates `owner | developer | admin | manager` as permitted writers. No rules change needed for the override.
  - Evidence: `apps/reception/database.rules.json` — `eodClosures/$dateKey` write rule.

- Q: Should the override require a *different* manager from the currently logged-in user (as `VarianceSignoffModal` does)?
  - A: No. `VarianceSignoffModal` applies the different-manager rule because it is a peer-separation control on a financial variance — the staff member who ran the shift cannot sign off their own variance. EOD exception override is a different semantic: it is a management-authorised exception to an operational blocker, not a financial self-approval scenario. The manager who is present (even if also the one trying to close the day) is the correct person to authorise the override. No separation constraint should apply.
  - Evidence: `VarianceSignoffModal.tsx` lines 64–72 (the separation check). `eodClosureSchema.ts` has no such concept. Operational pattern analysis.

- Q: What steps should be overridable — all three in `allDone` (Till, Safe, Stock) or only specific ones?
  - A: The override operates at the overall EOD gate level (i.e., "proceed despite incomplete steps"), not at the individual step level. The reason field is free-text and captures which specific step(s) are blocked and why. This is consistent with how `VarianceSignoffModal` works (one signoff per shift close, covering whatever variance is present) and keeps the implementation minimal. Granular per-step override would be significant additional complexity with unclear operational benefit.
  - Evidence: Scope statement in dispatch packet; `EodChecklistContent.tsx` structure.

- Q: Should the "Day closed" banner display differently when a closure was completed via override?
  - A: Yes — the banner should show a visible note indicating the override was used and who authorised it. This preserves auditability in the UI, not just in the database. The existing banner currently shows only `confirmedBy` and `timestamp`; it should additionally show the override reason and authorising manager name when `overrideReason` is present. This is a minor but important auditability signal.
  - Evidence: `EodChecklistContent.tsx` lines 65–83 (banner render). `eodClosureSchema.ts`.

- Q: Does the Float step need to be included in the override gate?
  - A: No. `allDone = tillDone && safeDone && stockDone` — Float is not part of the gate and is never a blocking condition. The override path should only appear when `!allDone` (i.e., when Till, Safe, or Stock is incomplete).
  - Evidence: `EodChecklistContent.tsx` line 63.

### Open (Operator Input Required)

None. All questions are resolved from evidence and operational reasoning.

## Confidence Inputs

- **Implementation: 95%**
  - Evidence: Full component code read. All mutation, schema, modal, and service files read. The exact mutation sites in the component are identified (lines 63, 194–203). The `VarianceSignoffModal` provides a direct implementation template. No architectural unknowns remain.
  - To reach 100%: n/a — 5% residual is standard for untested runtime edge cases.

- **Approach: 92%**
  - Evidence: The `managerReauth` pattern is proven in production (VarianceSignoffModal). Schema extension is backwards-compatible. Firebase rules already permit manager writes. Modal pattern is well-established.
  - To reach >=80%: already exceeded.
  - To reach >=90%: already exceeded.

- **Impact: 85%**
  - Evidence: Operator-stated gap (worldclass-scan). The current blocker is confirmed in code. Once deployed, staff will no longer be unable to close the day in exception cases. The audit trail is preserved via override fields in the closure record.
  - What raises to >=90%: confirmed by operator that override path is used in practice (post-deploy signal).

- **Delivery-Readiness: 92%**
  - Evidence: All dependencies mapped. No new packages. No Firebase rules changes. Blast radius small. Test seams clear. Reference implementation available.
  - What raises to >=90%: already exceeded.

- **Testability: 90%**
  - Evidence: Existing test suite fully mocks Firebase, mutations, and services. The override modal will follow the exact same mock pattern as `OpeningFloatModal` in `EodChecklistContent.test.tsx`. `verifyManagerCredentials` is a named export, easily mocked.
  - What raises to >=90%: already at 90%. Writing the tests is the remaining step.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Schema extension breaks existing closure reads | Low | Low | All new fields are `optional()` in Zod; existing records without them parse cleanly. `useFirebaseSubscription` uses `safeParse` equivalent. |
| Staff use override as a routine shortcut (control erosion) | Low | Moderate | Override requires manager credentials + mandatory reason — friction is intentional. The closure record stores override details so owner can review. |
| Manager not present at EOD (override still blocked) | Low | Low | This is the intended behaviour; the override requires a manager credential by design. Out-of-scope for this feature. |
| `verifyManagerCredentials` behaviour with network failure | Low | Low | The service already handles `auth/network-request-failed` with a clear error message. The modal will surface this. |
| Different-manager rule accidentally applied (copy-paste from VarianceSignoffModal) | Low | Moderate | Explicitly resolved in Questions: no separation constraint. Plan must call this out as a build instruction. |

## Planning Constraints & Notes

- Must-follow patterns:
  - Reuse `verifyManagerCredentials` verbatim from `../../services/managerReauth`.
  - Modal structure: base component + `memo()` + `withModalBackground(memo(Base))` export, same as `VarianceSignoffModal`.
  - `Input`/`Textarea` must use `compatibilityMode="no-wrapper"`.
  - `data-cy` attributes on all interactive elements and status indicators (test infra depends on `testIdAttribute: "data-cy"`).
  - DO NOT apply the different-manager separation constraint — this is EOD authorisation, not financial peer-separation.
  - Extend `eodClosureSchema` with optional fields only. Do not make new fields required.
- Rollout/rollback expectations:
  - Firebase `set()` is already idempotent; optional fields add no new risk.
  - Rollback: remove new fields from schema; old records are unaffected.
- Observability expectations:
  - Closure records with `overrideReason` present are the audit signal. No additional logging needed for this scope.

## Suggested Task Seeds (Non-binding)

1. **TASK-01 — Extend `eodClosureSchema`**: Add `overrideReason?: z.string()`, `overrideManagerName?: z.string()`, `overrideManagerUid?: z.string()`. Verify backwards compatibility with existing test fixtures.
2. **TASK-02 — Add `confirmDayClosedWithOverride` mutation**: Add a new mutation in `useEodClosureMutations` that accepts an `EodOverrideSignoff` payload and writes the extended closure record. Unit-test the new mutation path.
3. **TASK-03 — Create `EodOverrideModal` component**: Email + password + reason fields. `verifyManagerCredentials` call. `onConfirm(signoff: EodOverrideSignoff)` callback. `onCancel` callback. Uses `withModalBackground`, `ModalContainer`, `Input`, `Textarea`, `Button`. No different-manager constraint.
4. **TASK-04 — Wire override modal into `EodChecklistContent`**: Add override button when `!allDone && !eodClosureLoading && closure === null`. Show `EodOverrideModal` on click. On confirm, call `confirmDayClosedWithOverride`. Update the "Day closed" banner to show override note when `overrideReason` is present.
5. **TASK-05 — Test coverage**: Add test cases to `EodChecklistContent.test.tsx` and a new `EodOverrideModal.test.tsx` covering override button visibility, modal lifecycle, credential failure, empty reason guard, and banner override display.

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package: Override modal renders, rejects bad credentials, accepts valid manager credentials with a non-empty reason, writes extended closure record to Firebase (mocked), and closes modal. "Day closed" banner shows override note when present. All new test cases pass in CI.
- Post-delivery measurement plan: Monitor `eodClosures` records in Firebase for presence of `overrideReason` field to confirm the feature is being used (and not abused).

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| EodChecklistContent entry point and allDone gate | Yes | None | No |
| eodClosureSchema extension (backwards compatibility) | Yes | None — optional field extension preserves parse compatibility with existing records | No |
| useEodClosureMutations new mutation path | Yes | None — write path follows existing `set()` pattern; Zod `safeParse` guards all payloads | No |
| managerReauth service reuse | Yes | None — `verifyManagerCredentials` signature unchanged; no secondary Firebase app conflict (named instance pattern) | No |
| Firebase rules — write permission for override | Yes | None — existing rules already permit `owner|developer|admin|manager` writes to `eodClosures/$dateKey` | No |
| Modal component pattern (withModalBackground + ModalContainer) | Yes | None — `VarianceSignoffModal` provides direct template | No |
| Test landscape — existing tests remain valid after change | Yes | None — override fields are additive; existing TC-01–TC-18 fixture data does not include override fields (not required by schema) | No |
| Test landscape — new paths require new test cases | Yes | [Scope gap] [Minor]: No test file for `EodOverrideModal` exists yet — must be created as part of TASK-05 | No |
| Different-manager separation constraint (absence of) | Yes | None — explicitly resolved in Questions: no separation constraint applies to EOD override | No |
| Banner display for override closure | Yes | None — `overrideReason` is optional in schema; banner render needs an `if (closure.overrideReason)` block | No |

## Evidence Gap Review

### Gaps Addressed

1. **Citation integrity**: All key files were read directly. No inferred file paths — every claim is backed by a file read.
2. **Boundary coverage**: Firebase rules inspected directly. Auth boundary confirmed (manager-only write). `managerReauth` service inspected; secondary Firebase app pattern confirmed as collision-safe.
3. **Test coverage**: Existing 18 test cases read in full. Coverage gaps for the new override path explicitly identified.
4. **Schema backwards compatibility**: Confirmed by reading `eodClosureSchema.ts` and `useFirebaseSubscription` usage in `useEodClosureData.ts`. Optional fields do not break existing parse calls.
5. **Different-manager rule question**: Resolved by reading `VarianceSignoffModal.tsx` and reasoning about the semantic difference between financial peer-separation and operational exception authorisation.

### Confidence Adjustments

- Implementation confidence starts at 95% (not 100%) to reflect the standard residual for untested runtime behaviour.
- Testability is 90%, not 100%, because the test file for `EodOverrideModal` does not exist yet and must be authored as part of the build.

### Remaining Assumptions

- The override modal will follow the `VarianceSignoffModal` pattern exactly for layout and field structure. If the operator has a specific UX preference (e.g., a different width, ordering of fields), that is not documented and will default to the VarianceSignoffModal convention.
- The operator is satisfied with free-text override reason (no predefined reason codes). If predefined codes are preferred, that is a future enhancement.

## Planning Readiness

- **Status: Ready-for-planning**
- Blocking items: none
- Recommended next step: `/lp-do-plan reception-eod-exception-override --auto`
