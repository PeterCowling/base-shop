---
Type: Plan
Status: Archived
Domain: API
Workstream: Engineering
Created: 2026-02-28
Last-reviewed: 2026-02-28
Last-updated: 2026-02-28 (TASK-01 complete)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-sync-health-check
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# XA Uploader Sync Health Check Plan

## Summary

The GET `/api/catalog/sync` readiness endpoint currently only checks whether the sync scripts are present on disk. When `XA_CATALOG_CONTRACT_BASE_URL` or `XA_CATALOG_CONTRACT_WRITE_TOKEN` are unset, the operator discovers this only after running the full sync pipeline (~5 minutes) and receiving a 503. This plan extends the readiness endpoint to also surface catalog contract configuration status, so operators can detect misconfiguration before any sync is attempted.

The backbone change (TASK-01) adds a new exported `getCatalogContractReadiness()` helper to `catalogContractClient.ts`, extends the GET handler response with `contractConfigured` and `contractConfigErrors`, and propagates those fields through the TypeScript types and hook state. TASK-02 updates the `CatalogSyncPanel` UI to display contract config errors. TASK-03 adds test cases for the new GET branches.

## Active tasks
- [x] TASK-01: Add getCatalogContractReadiness export + extend GET handler + types + hook state — Complete (2026-02-28)
- [x] TASK-02: Update CatalogSyncPanel display for contract config errors + i18n keys — Complete (2026-02-28)
- [x] TASK-03: Add TC-00e and TC-00f to route.test.ts — Complete (2026-02-28)

## Goals
- Extend GET `/api/catalog/sync` to check and report `XA_CATALOG_CONTRACT_BASE_URL` and `XA_CATALOG_CONTRACT_WRITE_TOKEN` presence
- Make `ready` reflect both scripts and contract config (`scriptsReady && contractConfigured`)
- Surface contract config errors to the operator via `CatalogSyncPanel` before any sync is attempted
- Add test coverage for the new GET branches

## Non-goals
- Adding a separate `/api/health` endpoint
- Connectivity test for the contract URL (presence check only)
- Changing the POST sync pipeline logic
- Validating the contract token format

## Constraints & Assumptions
- Constraints:
  - `getCatalogContractBaseUrl()` and `getCatalogContractWriteToken()` are private — must add a new exported helper rather than exporting the raw getters
  - `SyncReadinessResponse` new fields must be optional for backward compatibility
  - All new i18n keys must be added to both `en` and `zh` translations in `uploaderI18n.ts`
- Assumptions:
  - Non-empty string after trim is sufficient to consider env var "configured" — no connectivity test needed
  - `CurrencyRatesPanel.client.tsx` does not need updating (structural typing passes extra optional fields safely; it only uses `ready` and `checking`)

## Inherited Outcome Contract

- **Why:** Operators deploying xa-uploader may not discover a missing catalog contract config until after a full sync pipeline run, wasting time and producing a confusing error. A pre-flight config check makes deployment readiness visible before any sync is attempted.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Extend GET /api/catalog/sync to surface catalog contract config status; operators see a clear readiness signal (including contract config) before triggering sync.
- **Source:** auto

## Fact-Find Reference
- Related brief: `docs/plans/xa-uploader-sync-health-check/fact-find.md`
- Key findings used:
  - GET handler (route.ts:467) checks scripts only; does not check contract config env vars
  - `getCatalogContractBaseUrl()` and `getCatalogContractWriteToken()` are private functions (catalogContractClient.ts:36,40)
  - `SyncReadinessResponse` (catalogConsoleFeedback.ts:49) — all fields optional except `ok`; safe to add new optional fields
  - `handleSync` guard (useCatalogConsole.client.ts:366) uses `state.syncReadiness.ready` — will automatically block sync when `ready` is set to `scriptsReady && contractConfigured`
  - `route.test.ts` already mocks the whole `catalogContractClient` module — adding one new export follows the same pattern

## Proposed Approach
- Option A: Export `getCatalogContractBaseUrl()` and `getCatalogContractWriteToken()` directly and call them from the GET handler
- Option B: Add a dedicated exported `getCatalogContractReadiness(): { configured: boolean; errors: string[] }` to `catalogContractClient.ts` and call it from the GET handler
- Chosen approach: **Option B** — keeps raw getters private, encapsulates "what counts as configured" in one place, easier to mock in tests (single mock target vs two). The raw getter implementation detail need not leak to the route layer.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add getCatalogContractReadiness + extend GET handler + types + hook | 90% | M | Complete (2026-02-28) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Update CatalogSyncPanel display + i18n keys | 85% | S | Complete (2026-02-28) | TASK-01 ✓ | - |
| TASK-03 | IMPLEMENT | Add TC-00e and TC-00f to route.test.ts | 90% | S | Complete (2026-02-28) | TASK-01 ✓ | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Backbone: new export + GET extension + types + hook |
| 2 | TASK-02, TASK-03 | TASK-01 complete | TASK-02 and TASK-03 are independent; run in parallel |

## Tasks

---

### TASK-01: Add getCatalogContractReadiness + extend GET handler + update types + hook state
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `catalogContractClient.ts`, `route.ts`, `catalogConsoleFeedback.ts`, `useCatalogConsole.client.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-28)
- **Build-evidence:**
  - Codex offload executed under writer lock (`--full-auto`, absolute codex path)
  - All 4 Affects files modified; `getCatalogContractReadiness()` exported at catalogContractClient.ts:44
  - GET handler extended with `contractReadiness` check, `ready` gated on both scripts + contract
  - `SyncReadinessResponse` and `SyncReadinessState` types extended; all `setSyncReadiness` call sites updated
  - Typecheck: `pnpm --filter @apps/xa-uploader typecheck` — clean exit (23/23 turbo cached)
  - Lint: `pnpm --filter @apps/xa-uploader lint` — 0 errors, 5 warnings all pre-existing in currency-rates/route.ts (out-of-scope)
  - Committed: `1a66e17e68` via writer lock
- **Affects:**
  - `apps/xa-uploader/src/lib/catalogContractClient.ts`
  - `apps/xa-uploader/src/app/api/catalog/sync/route.ts`
  - `apps/xa-uploader/src/components/catalog/catalogConsoleFeedback.ts`
  - `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 90%
  - Implementation: 90% — all 4 files confirmed; private getter pattern confirmed; export location clear; integration with GET handler is a straightforward 4-line check
  - Approach: 90% — Option B (dedicated helper) is clean and matches existing module style; no ambiguity
  - Impact: 90% — `handleSync` guard at useCatalogConsole.client.ts:366 uses `ready`; extending `ready` to include `contractConfigured` automatically gates the sync button
  - Held-back test (90% Implementation): "What single unresolved unknown would push below 80?" — The only risk is the TypeScript mock pattern in route.test.ts needing updating. Since the module is already mocked as a whole, adding one new export requires only adding the mock return value. This is minor and well-understood.
- **Acceptance:**
  - `catalogContractClient.ts` exports a new `getCatalogContractReadiness(): { configured: boolean; errors: string[] }` function
  - Function returns `{ configured: true, errors: [] }` when both env vars are non-empty after trim
  - Function returns `{ configured: false, errors: ["XA_CATALOG_CONTRACT_BASE_URL not set", "XA_CATALOG_CONTRACT_WRITE_TOKEN not set"] }` (or individual errors) when one or both are unset/empty
  - GET `/api/catalog/sync` response includes `contractConfigured: boolean` and `contractConfigErrors: string[]`
  - GET `ready` field = `syncReadiness.ready && contractConfigured`
  - `SyncReadinessResponse` type has `contractConfigured?: boolean`, `contractConfigErrors?: string[]`
  - `SyncReadinessState` type has `contractConfigured: boolean`, `contractConfigErrors: string[]`
  - `loadSyncReadiness()` reads and propagates the new fields from the API response to state
  - `setSyncReadiness` initialization state includes `contractConfigured: false`, `contractConfigErrors: []`
- **Validation contract (TC-XX):**
  - TC-01: `getCatalogContractReadiness()` with both env vars set → `{ configured: true, errors: [] }`
  - TC-02: `getCatalogContractReadiness()` with `XA_CATALOG_CONTRACT_BASE_URL` empty → `{ configured: false, errors: ["XA_CATALOG_CONTRACT_BASE_URL not set"] }`
  - TC-03: `getCatalogContractReadiness()` with both empty → `{ configured: false, errors: ["...", "..."] }`
  - TC-04: TypeScript: `SyncReadinessResponse` accepts `contractConfigured?: boolean` without error
  - TC-05: TypeScript: `SyncReadinessState` includes `contractConfigured: boolean`, `contractConfigErrors: string[]`
  - TC-06: `loadSyncReadiness()` sets `syncReadiness.contractConfigured: true` and `contractConfigErrors: []` when API returns configured=true
  - TC-07: `loadSyncReadiness()` sets `syncReadiness.contractConfigured: false` and `ready: false` when API returns configured=false
- **Execution plan:**
  - **Red:** Confirm existing GET route test passes `ready: true` when scripts present (establishes baseline); then note that no test covers contractConfigured field (gap confirmed)
  - **Green:**
    1. Add `export function getCatalogContractReadiness(): { configured: boolean; errors: string[] }` to `catalogContractClient.ts` — reads `getCatalogContractBaseUrl()` and `getCatalogContractWriteToken()`, builds errors array, returns `{ configured: errors.length === 0, errors }`
    2. In `route.ts` GET handler: call `getCatalogContractReadiness()`, set local `contractReadiness`; change `ready` to `syncReadiness.ready && contractReadiness.configured`; add `contractConfigured: contractReadiness.configured` and `contractConfigErrors: contractReadiness.errors` to response JSON
    3. In `catalogConsoleFeedback.ts`: add `contractConfigured?: boolean` and `contractConfigErrors?: string[]` to `SyncReadinessResponse`
    4. In `useCatalogConsole.client.ts`: add `contractConfigured: boolean` and `contractConfigErrors: string[]` to `SyncReadinessState`; initialize to `{ contractConfigured: false, contractConfigErrors: [] }`; in `loadSyncReadiness` `setSyncReadiness` call, add `contractConfigured: Boolean(data.contractConfigured)` and `contractConfigErrors: data.contractConfigErrors ?? []`
  - **Refactor:** Verify TypeScript types compile cleanly; confirm `CurrencyRatesPanel` prop compatibility (structural typing); run `pnpm --filter @apps/xa-uploader typecheck` and `pnpm --filter @apps/xa-uploader lint`
- **Planning validation (required for M/L):**
  - Checks run: Read `catalogContractClient.ts` — confirmed `getCatalogContractBaseUrl()` and `getCatalogContractWriteToken()` at lines 36 and 40 are private functions; confirmed both trim the env var; emptiness check done in callers
  - Checks run: Read `route.ts` GET handler lines 467–506 — confirmed response shape; confirmed import from `catalogContractClient` exists
  - Checks run: Read `catalogConsoleFeedback.ts:49–56` — confirmed `SyncReadinessResponse` shape
  - Checks run: Read `useCatalogConsole.client.ts:55–61, 115–118, 148–167` — confirmed `SyncReadinessState` and `setSyncReadiness` call
  - Unexpected findings: None
- **Scouts:** `getCatalogContractBaseUrl()` trimming confirmed; empty check after trim is correct (`!trimmed` catches both empty string and whitespace-only)
- **Edge Cases & Hardening:**
  - Whitespace-only env var (e.g., `"  "`) treated as unset after trim → reported as `not set` error
  - Both vars unset → `errors` array has 2 entries; `configured: false`
  - `contractConfigErrors` defaults to `[]` in hook state initialization to avoid `undefined` display issues
- **Consumer tracing:**
  - New `getCatalogContractReadiness()` export: consumed by GET handler (TASK-01 scope) and route.test.ts mock (TASK-03 scope) ✓
  - New `contractConfigured` on response: consumed by `loadSyncReadiness()` in hook (TASK-01 scope) ✓
  - New `contractConfigured`/`contractConfigErrors` on `SyncReadinessState`: consumed by `CatalogSyncPanel.client.tsx` (TASK-02 scope) ✓; `CurrencyRatesPanel.client.tsx` unchanged (only reads `ready` + `checking`, structural typing safe) ✓
  - `ready` semantics change: `handleSync` guard at useCatalogConsole.client.ts:366 uses `state.syncReadiness.ready` — inherits new semantics automatically; sync button disabled when contract unconfigured ✓
- **What would make this >=90%:** Already at 90%. Reaches 95% after TASK-03 TCs pass in build.
- **Rollout / rollback:**
  - Rollout: Additive response fields; backward compatible. Deployed instances with both env vars set: `contractConfigured: true`, `ready` unchanged. Deployed instances with missing vars: `ready: false`, sync disabled — intended.
  - Rollback: Revert 4 file changes; no data migration, no config change.
- **Documentation impact:**
  - None: `wrangler.toml` and `.env.example` already document these env vars (xa-uploader-deployment-config plan).
- **Notes / references:**
  - `catalogContractClient.ts:36,40` — private `getCatalogContractBaseUrl()` and `getCatalogContractWriteToken()`
  - `route.ts:467` — existing GET handler
  - `useCatalogConsole.client.ts:366` — `handleSync` guard that uses `ready`

---

### TASK-02: Update CatalogSyncPanel display for contract config errors + i18n keys
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `CatalogSyncPanel.client.tsx`, `uploaderI18n.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-28)
- **Build-evidence:**
  - `CatalogSyncPanel.client.tsx`: inline prop type extended with `contractConfigured?: boolean; contractConfigErrors?: string[]`; new `else if` branch added displaying `syncPublishContractUnconfigured` + `syncRecoveryConfigureCatalogContract` messages (reused existing en/zh keys — satisfies "or equivalent" from plan)
  - `uploaderI18n.ts`: no new keys added; existing keys in both locales cover the scenario exactly
  - Typecheck: clean; Lint: 0 errors, pre-existing warnings only
  - Committed: `f21cd5fdb3` (Wave 2, shared with TASK-03)
- **Affects:**
  - `apps/xa-uploader/src/components/catalog/CatalogSyncPanel.client.tsx`
  - `apps/xa-uploader/src/lib/uploaderI18n.ts`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — panel display pattern is clear (follows `missingScripts` display); inline prop type needs extending
  - Approach: 90% — existing `readinessMessage` conditional chain; add a new `else if (syncReadiness.contractConfigErrors?.length)` branch
  - Impact: 85% — operator sees contract config errors in the sync panel; unclear how prominent the error display will be (depends on the existing CSS pattern)
- **Acceptance:**
  - `CatalogSyncPanel` displays a message when `syncReadiness.contractConfigErrors` is non-empty (e.g., "Contract not configured: XA_CATALOG_CONTRACT_BASE_URL not set")
  - Inline prop type for `syncReadiness` includes `contractConfigured?: boolean` and `contractConfigErrors?: string[]`
  - `uploaderI18n.ts` has new keys `contractNotConfigured` (or equivalent) in both `en` and `zh` translations
  - Sync button remains disabled when `contractConfigErrors.length > 0` (inherits from `ready: false` via TASK-01)
- **Validation contract (TC-XX):**
  - TC-01: `CatalogSyncPanel` with `syncReadiness.contractConfigErrors: ["XA_CATALOG_CONTRACT_BASE_URL not set"]` → displays contract error message, sync button disabled
  - TC-02: `CatalogSyncPanel` with `syncReadiness.contractConfigErrors: []` and `ready: true` → displays "Sync dependencies are ready." (existing behavior unchanged)
  - TC-03: TypeScript: `CatalogSyncPanel` prop type accepts new optional fields without error
- **Execution plan:**
  - **Red:** Note that `CatalogSyncPanel` currently has no display branch for contract errors; existing tests pass (baseline)
  - **Green:**
    1. In `uploaderI18n.ts`: add `contractNotConfigured` key to both `en` and `zh` with appropriate message
    2. In `CatalogSyncPanel.client.tsx`: extend inline prop type to include `contractConfigured?: boolean; contractConfigErrors?: string[]`; add `else if (!syncReadiness.checking && syncReadiness.contractConfigErrors?.length)` branch to the `readinessMessage` conditional, displaying error list
  - **Refactor:** Verify both i18n locales have the key; verify message reads naturally in context
- **Planning validation (required for M/L):** None: S effort — exempt
- **Scouts:** `CatalogSyncPanel.client.tsx:47–59` — existing `readinessMessage` conditional confirms the pattern to extend
- **Edge Cases & Hardening:**
  - `contractConfigErrors` is `[]` (empty) → no display change (condition `length > 0` is falsy)
  - Multiple errors (both env vars unset) → display joined or first error (implementation detail; choose at build time — most common is just first error for brevity)
- **What would make this >=90%:** Confirmed CSS class for error message will match existing danger styling (assessed at 90 after TASK-01 review shows `readinessClassName = "text-sm text-danger-fg"` for existing errors — same class applies here)
- **Rollout / rollback:**
  - Rollout: UI-only change; additive display branch.
  - Rollback: Revert 2 file changes.
- **Documentation impact:** None.
- **Notes / references:**
  - `CatalogSyncPanel.client.tsx:47–59` — readiness message display logic
  - `uploaderI18n.ts:106–109` — existing sync readiness string keys (pattern to follow)

---

### TASK-03: Add TC-00e and TC-00f to route.test.ts
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `route.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-28)
- **Build-evidence:**
  - `getCatalogContractReadinessMock` added to module-level declarations; added to `catalogContractClient` mock factory
  - `beforeEach` default: `getCatalogContractReadinessMock.mockReturnValue({ configured: true, errors: [] })` — preserves all existing GET/POST tests (TC-00 now correctly passes with contract configured)
  - TC-00e: scripts ready + contract configured → `{ ready: true, contractConfigured: true, contractConfigErrors: [] }`
  - TC-00f: scripts ready + contract unconfigured → `{ ready: false, contractConfigured: false, contractConfigErrors: ["XA_CATALOG_CONTRACT_BASE_URL not set"], recovery: "configure_catalog_contract" }`
  - Typecheck: clean; Lint: 0 errors
  - Committed: `f21cd5fdb3` (Wave 2, shared with TASK-02)
  - CI test confirmation pending push (CI-only policy)
- **Affects:**
  - `apps/xa-uploader/src/app/api/catalog/sync/__tests__/route.test.ts`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — existing mock pattern is clear; TC-00 and TC-00b show exact structure to follow; TC-00c and TC-00d are POST tests (confirmed — lines 130 and 157); TC-00e/TC-00f are the next available GET test IDs
  - Approach: 95% — mock `getCatalogContractReadiness` on the existing `catalogContractClient` module mock; test both configured and unconfigured paths
  - Impact: 90% — TCs directly validate the new GET behavior; increases coverage of the change from TASK-01
- **Acceptance:**
  - TC-00e: GET with scripts ready and contract configured → `{ ok: true, ready: true, contractConfigured: true, contractConfigErrors: [] }`
  - TC-00f: GET with scripts ready but contract unconfigured → `{ ok: true, ready: false, contractConfigured: false, contractConfigErrors: ["..."] }`
  - All existing TCs continue to pass
- **Validation contract (TC-XX):**
  - TC-01: New test TC-00e in route.test.ts passes with `getCatalogContractReadinessMock.mockReturnValue({ configured: true, errors: [] })`
  - TC-02: New test TC-00f in route.test.ts passes with `getCatalogContractReadinessMock.mockReturnValue({ configured: false, errors: ["XA_CATALOG_CONTRACT_BASE_URL not set"] })`
  - TC-03: All pre-existing GET and POST tests still pass (no regression)
- **Execution plan:**
  - **Red:** Review TC-00 and TC-00b (GET baseline) and note the absence of TC-00e/TC-00f for contract config branches in the existing file. No existing coverage for `getCatalogContractReadiness`.
  - **Green:**
    1. Add `getCatalogContractReadiness` to the existing `jest.mock("../../../../../lib/catalogContractClient", ...)` mock object, with a jest mock function
    2. In the beforeEach (or per-test), configure default mock return `{ configured: true, errors: [] }` to preserve existing test behavior
    3. Add TC-00e: mock returns configured=true; assert response includes `contractConfigured: true`, `contractConfigErrors: []`, `ready: true`
    4. Add TC-00f: mock returns `{ configured: false, errors: ["XA_CATALOG_CONTRACT_BASE_URL not set"] }`; assert response includes `contractConfigured: false`, `ready: false`
  - **Refactor:** Confirm mock setup/teardown doesn't leak into other TCs; run `pnpm --filter @apps/xa-uploader typecheck` and `pnpm --filter @apps/xa-uploader lint`; push and monitor CI via `gh run watch` for test regression confirmation
- **Planning validation (required for M/L):** None: S effort — exempt
- **Scouts:** `route.test.ts` mock pattern — existing `catalogContractClientMock` confirms the whole module is mocked with individual function mocks; TC-00c/TC-00d confirmed as POST tests at lines 130/157; TC-00e/TC-00f are available IDs
- **Edge Cases & Hardening:**
  - Existing TC-06 (POST unconfigured) mocks `publishCatalogArtifactsToContract` throwing — unrelated to `getCatalogContractReadiness`; must not interfere
  - Default mock return for GET tests must include `getCatalogContractReadiness` returning `{ configured: true, errors: [] }` so all existing POST tests are unaffected
- **What would make this >=90%:** Already at 90%. Reaches 95% when all TCs pass in build execution.
- **Rollout / rollback:**
  - Rollout: Test-only change; no production impact.
  - Rollback: Revert route.test.ts.
- **Documentation impact:** None.
- **Notes / references:**
  - `route.test.ts:85,106` — TC-00 and TC-00b (GET test pattern); TC-00c (line 130) and TC-00d (line 157) are POST tests
  - `jest.mock("../../../../../lib/catalogContractClient", ...)` — existing module mock

---

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: getCatalogContractReadiness + GET + types + hook | Yes — all 4 files confirmed; private getters at lines 36,40; GET handler at line 467; SyncReadinessResponse at catalogConsoleFeedback.ts:49; SyncReadinessState at useCatalogConsole.client.ts:55 | None | No |
| TASK-02: CatalogSyncPanel display + i18n | Partial — depends on TASK-01 providing `contractConfigErrors` on `SyncReadinessState` | [Ordering Inversion] [Minor]: dependency on TASK-01 declared; no issue at execution time | No |
| TASK-03: route.test.ts TC-00e/TC-00f | Partial — depends on TASK-01 exporting `getCatalogContractReadiness` | [Ordering Inversion] [Minor]: dependency on TASK-01 declared; no issue at execution time | No |

No Critical or Major simulation findings. Two Minor ordering notes — both resolved by declared dependency on TASK-01.

## Risks & Mitigations
- `sync-feedback.test.tsx` or `CurrencyRatesPanel.test.tsx` may need mock updates if `SyncReadinessState` type changes cause TypeScript errors in test prop objects — Low risk; optional fields in TypeScript don't break existing call sites
- Existing `action-feedback.test.tsx` and `useCatalogConsole-domains.test.tsx` render `syncReadiness.ready` in output — these depend on the mock value from `loadSyncReadiness`; if default mock isn't updated to include `getCatalogContractReadiness` returning configured=true, these tests may fail — mitigated by TASK-03 defaulting the mock to configured=true

## Observability
- Logging: None required — readiness check result is visible in GET response body
- Metrics: None required
- Alerts/Dashboards: None

## Acceptance Criteria (overall)
- [ ] GET `/api/catalog/sync` returns `contractConfigured: boolean` and `contractConfigErrors: string[]`
- [ ] `ready` field is `false` when contract env vars are unset
- [ ] `CatalogSyncPanel` displays contract config error when `contractConfigErrors` is non-empty
- [ ] TC-00e and TC-00f pass in `route.test.ts`
- [ ] All existing tests continue to pass

## Decision Log
- 2026-02-28: Chose Option B (dedicated `getCatalogContractReadiness()` export) over Option A (exposing raw getters) — keeps private implementation detail encapsulated, easier to mock

## Overall-confidence Calculation
- TASK-01: M (weight=2), confidence=90% → 180
- TASK-02: S (weight=1), confidence=85% → 85
- TASK-03: S (weight=1), confidence=90% → 90
- Overall = (180+85+90) / (2+1+1) = 355/4 = 88.75% → **90%** (nearest 5)
