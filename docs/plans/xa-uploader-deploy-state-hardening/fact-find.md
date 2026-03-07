---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Products
Workstream: Engineering
Created: 2026-03-07
Last-updated: 2026-03-07
Feature-Slug: xa-uploader-deploy-state-hardening
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/xa-uploader-deploy-state-hardening/plan.md
Trigger-Source: direct-inject
Trigger-Why: Fix the xa-uploader Make Live deploy path so deploy cooldown/pending state is enforced and operator feedback reflects real deploy outcomes.
Trigger-Intended-Outcome: "type: operational | statement: Make Live persists deploy cooldown state correctly, avoids repeated trigger spam during cooldown, and reports deploy-trigger failures truthfully to the operator. | source: operator"
---

# XA Uploader Deploy State Hardening Fact-Find Brief

## Scope
### Summary
`POST /api/catalog/publish` currently bypasses deploy cooldown persistence by calling the deploy hook with `kv: null` and no `statePaths`, even though the underlying deploy helper expects KV/filesystem state to enforce cooldown and pending-state tracking. The Make Live client also collapses failed deploy outcomes into the same success copy used for unconfigured deploy hooks. This work hardens the Make Live deploy state path so repeated publish clicks respect cooldown semantics and the operator sees truthful feedback when the deploy trigger fails.

### Goals
- Restore deploy cooldown and pending-state persistence for Make Live.
- Keep Make Live contract publish behavior unchanged while only debouncing deploy trigger state.
- Surface distinct Make Live feedback for deploy-trigger failure vs cooldown vs unconfigured cases.

### Non-goals
- Change xa-drop-worker environment configuration or external secrets.
- Change Cloudflare Pages vs GitHub dispatch provider selection.
- Rework the broader sync/status model beyond deploy-state propagation.

### Constraints & Assumptions
- Constraints:
  - No environment-secret inspection is available from repo state.
  - Repo policy forbids local Jest/e2e execution; validation must rely on scoped typecheck/lint and CI for tests.
  - Existing unrelated worktree changes must be preserved.
- Assumptions:
  - The highest-value in-repo fix is on the Make Live path itself, not worker-side infra configuration.
  - Existing deploy helper semantics (`triggered`, `skipped_cooldown`, `skipped_unconfigured`, `failed`) remain the source of truth.

## Access Declarations
- None for additional operator access. Runtime dependencies (`Cloudflare KV`, deploy hook endpoint, xa-drop-worker) are existing integration boundaries, but this fact-find uses repository evidence only.

## Outcome Contract
- **Why:** Fix the xa-uploader Make Live deploy path so deploy cooldown/pending state is enforced and operator feedback reflects real deploy outcomes.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Make Live persists deploy cooldown state correctly, avoids repeated trigger spam during cooldown, and reports deploy-trigger failures truthfully to the operator.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts` - `handlePublishImpl()` posts the current draft to `/api/catalog/publish` and derives operator-facing success copy from `deployStatus`.
- `apps/xa-uploader/src/app/api/catalog/publish/route.ts` - Make Live server entry point; authenticates, acquires cloud sync lock, builds catalog artifacts, publishes contract payload, persists updated draft snapshot, then triggers xa-b deploy.

### Key Modules / Files
- `apps/xa-uploader/src/app/api/catalog/publish/route.ts` - passes `kv: null` and no `statePaths` into deploy-state helpers.
- `apps/xa-uploader/src/lib/deployHook.ts` - cooldown/pending-state logic; reads/writes state only when KV or `statePath` is supplied.
- `apps/xa-uploader/src/app/api/catalog/deploy-drain/route.ts` - existing correct pattern for resolving `kv` plus local-fs deploy state paths before calling deploy helpers.
- `apps/xa-uploader/src/lib/syncMutex.ts` - `getUploaderKv()` returns bound KV in Cloudflare runtime and `null` in local-fs mode.
- `apps/xa-uploader/src/lib/localFsGuard.ts` - local-fs runtime switch used by deploy-drain route.
- `apps/xa-uploader/src/lib/repoRoot.ts` - current helper used to resolve the uploader data directory for filesystem-backed state.
- `apps/xa-uploader/src/lib/uploaderI18n.ts` - current Make Live copy supports triggered, cooldown, and a generic “no deploy hook configured” branch only.
- `apps/xa-uploader/src/app/api/catalog/publish/__tests__/route.publish.test.ts` - current route tests cover success/cooldown/failure branches but do not assert deploy-state context propagation.
- `apps/xa-uploader/src/components/catalog/__tests__/action-feedback.test.tsx` - current feedback tests cover triggered/cooldown/error API failures, but not successful publish with `deployStatus: failed`.

### Patterns & Conventions Observed
- Deploy-state persistence is best-effort and dual-mode: KV in Cloudflare runtime, filesystem paths in local runtime. Evidence: `apps/xa-uploader/src/lib/deployHook.ts`
- Route handlers return explicit structured error codes instead of throwing raw errors to the client. Evidence: `apps/xa-uploader/src/app/api/catalog/publish/route.ts`
- The uploader already has a correct deploy-state-context resolution pattern in deploy-drain instead of duplicating raw path strings throughout the app. Evidence: `apps/xa-uploader/src/app/api/catalog/deploy-drain/route.ts`

### Data & Contracts
- Types/schemas/events:
  - `DeployTriggerResult` carries `status`, optional `nextEligibleAt`, `reason`, `httpStatus`, and `attempts`. Evidence: `apps/xa-uploader/src/lib/deployHook.ts`
- Persistence:
  - Cooldown state key: `xa-deploy-cooldown:<storefront>`.
  - Pending state key: `xa-deploy-pending:<storefront>`.
  - Filesystem fallback paths come from `resolveDeployStatePaths(uploaderDataDir, storefrontId)`. Evidence: `apps/xa-uploader/src/lib/deployHook.ts`
- API/contracts:
  - Make Live request body: `{ storefront, draft }`.
  - Make Live response currently returns `{ ok, deployStatus, warnings }` without deploy failure reason. Evidence: `apps/xa-uploader/src/app/api/catalog/publish/route.ts`

### Dependency & Impact Map
- Upstream dependencies:
  - Uploader session auth.
  - Cloud draft snapshot read/write.
  - Catalog contract publish.
  - Deploy hook runtime config and state backends.
- Downstream dependents:
  - Make Live operator feedback UI in `catalogConsoleActions.ts`.
  - xa-b rebuild trigger cadence.
  - Deploy-drain reconciliation behavior for pending deploys.
- Likely blast radius:
  - `publish/route.ts` response shape.
  - Make Live success-copy handling.
  - Route and UI tests for publish feedback.

### Security and Performance Boundaries
- Auth/authz:
  - `hasUploaderSession()` guards Make Live before any publish/deploy work.
- Untrusted input:
  - `readJsonBodyWithLimit()` and `catalogProductDraftSchema` validate request payloads.
- Performance/hot path:
  - Cooldown persistence exists specifically to prevent repeated deploy dispatches on rapid operator clicks.

### Test Landscape
#### Test Infrastructure
- Frameworks: Jest for unit/integration tests.
- Commands:
  - `pnpm --filter @apps/xa-uploader typecheck`
  - `pnpm --filter @apps/xa-uploader lint`
- CI integration:
  - GitHub Actions `xa.yml` runs xa-uploader tests in CI.

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Make Live route | Unit/integration | `apps/xa-uploader/src/app/api/catalog/publish/__tests__/route.publish.test.ts` | Covers success, cooldown, publish failure, auth, lock contention, media warnings. |
| Make Live operator feedback | Component/harness | `apps/xa-uploader/src/components/catalog/__tests__/action-feedback.test.tsx` | Covers triggered, cooldown, and API failure messaging. |
| Deploy helper cooldown semantics | Unit | `apps/xa-uploader/src/lib/__tests__/deployHook.test.ts` | Confirms cooldown works when KV is actually supplied. |

#### Coverage Gaps
- `publish/route.ts` does not currently prove that Make Live resolves deploy-state context the same way as deploy-drain.
- No UI test covers successful publish where `deployStatus === "failed"` and the route still returns `ok: true`.

#### Recommended Test Approach
- Update publish route tests to assert `maybeTriggerXaBDeploy()` and `reconcileDeployPendingState()` receive resolved deploy-state context.
- Update action-feedback tests to cover `deployStatus: "failed"` and verify distinct operator copy.

### Recent Git History (Targeted)
- `65bbeca9f2 feat(xa-uploader): TASK-02 add handlePublish client action + expose on useCatalogConsole`
  - Introduced current Make Live client feedback branching.
- `ab820aa094 feat(xa-uploader): TASK-01 extract cloud media helpers + create POST /api/catalog/publish route`
  - Introduced the current Make Live route and the incorrect assumption that deploy cooldown remained enforced.
- `08a4c4e1d1 feat: harden staging publish/deploy workflow`
  - Earlier deploy workflow hardening in adjacent XA infra; useful context, but not the Make Live route itself.

## Questions
### Resolved
- Q: Is the Make Live cooldown bypass claim confirmed from repo state?
  - A: Yes. `publish/route.ts` passes `kv: null` and no `statePaths` into `maybeTriggerXaBDeploy()` and `reconcileDeployPendingState()`, while `deployHook.ts` only persists state when one of those backends is supplied.
  - Evidence: `apps/xa-uploader/src/app/api/catalog/publish/route.ts`, `apps/xa-uploader/src/lib/deployHook.ts`
- Q: Is there already an in-repo pattern for resolving deploy-state context correctly?
  - A: Yes. `deploy-drain/route.ts` resolves KV plus filesystem fallback paths before invoking the same deploy helpers.
  - Evidence: `apps/xa-uploader/src/app/api/catalog/deploy-drain/route.ts`
- Q: Does the current Make Live UI surface deploy-trigger failures distinctly?
  - A: No. Any non-triggered, non-cooldown successful response falls into the “No deploy hook configured” success branch.
  - Evidence: `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts`, `apps/xa-uploader/src/lib/uploaderI18n.ts`

## Confidence Inputs
- Implementation: 92%
  - Evidence basis: exact failing call sites and the correct adjacent pattern are both identified.
  - What raises to >=80: already above threshold.
  - What raises to >=90: already above threshold; only validation remains.
- Approach: 90%
  - Evidence basis: bounded route/client fix with no schema or infra migration.
  - What raises to >=80: already above threshold.
  - What raises to >=90: keep scope on Make Live + tests only.
- Impact: 88%
  - Evidence basis: directly fixes repeated deploy-trigger spam and misleading operator copy.
  - What raises to >=80: already above threshold.
  - What raises to >=90: CI confirmation on updated tests.
- Delivery-Readiness: 90%
  - Evidence basis: all touched surfaces are in one app with existing tests.
  - What raises to >=80: already above threshold.
  - What raises to >=90: no additional runtime/env blockers emerge during typecheck/lint.
- Testability: 86%
  - Evidence basis: route and client harness tests already exist for the relevant branches.
  - What raises to >=80: already above threshold.
  - What raises to >=90: CI green on updated route/UI tests.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Make Live route fix diverges from deploy-drain state-resolution pattern over time | Medium | Medium | Reuse the same context-resolution pattern and keep test assertions on passed context. |
| UI copy change still obscures useful deploy failure detail | Medium | Medium | Return `deployReason` from route and map failed status distinctly in the client. |
| Adjacent sync-route helper retains similar state-path omission | Medium | Low | Keep current task scoped to Make Live; log adjacent follow-up if needed after code review. |

## Planning Constraints & Notes
- Must-follow patterns:
  - Preserve current Make Live response/error contract style.
  - Do not introduce local test execution outside lint/typecheck due repo policy.
- Rollout/rollback expectations:
  - Rollout is code-only; rollback is a normal revert of the bounded task commit.
- Observability expectations:
  - Preserve deploy status in Make Live responses; add failure reason for operator-facing truthfulness.

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Make Live route entry point | Yes | None | No |
| Deploy helper persistence contract | Yes | None | No |
| Operator feedback branch logic | Yes | None | No |
| External infra behavior (worker secrets, Pages hook runtime) | Partial | Minor: environment-dependent and not fixable from repo state | No |

## Scope Signal
- Signal: right-sized
- Rationale: The confirmed defects are in one route and one client action path with existing adjacent patterns and test coverage. Worker-side environment hypotheses are excluded from this build.

## Suggested Task Seeds (Non-binding)
- TASK-01: Harden Make Live deploy-state propagation and operator feedback.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - `none`
- Deliverable acceptance package:
  - Code change in xa-uploader route/client/tests.
  - Scoped `@apps/xa-uploader` typecheck + lint.
  - CI to validate Jest coverage changes.

## Evidence Gap Review
### Gaps Addressed
- Verified that cooldown bypass is a code-path issue, not just an environment hypothesis.
- Verified that truthful failure messaging is an in-repo UI problem.

### Confidence Adjustments
- Increased implementation confidence after finding the existing deploy-drain state-resolution pattern.

### Remaining Assumptions
- CI will remain the source of truth for updated Jest assertions because local Jest execution is policy-blocked.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None
- Recommended next step:
  - `/lp-do-build xa-uploader-deploy-state-hardening`
