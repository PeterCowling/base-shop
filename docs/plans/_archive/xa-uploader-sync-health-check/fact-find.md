---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: API
Workstream: Engineering
Created: 2026-02-28
Last-updated: 2026-02-28
Feature-Slug: xa-uploader-sync-health-check
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/xa-uploader-sync-health-check/plan.md
Trigger-Why: Dispatch IDEA-DISPATCH-20260228-0070 — catalog contract misconfiguration causes a full pipeline run (validate + sync, up to 5 min) before returning 503; no way to check config completeness before attempting sync.
Trigger-Intended-Outcome: type: operational | statement: Extend the existing GET /api/catalog/sync readiness endpoint to report catalog contract config status, so operators can detect misconfiguration before triggering a sync. | source: auto
---

# XA Uploader Sync Health Check Fact-Find Brief

## Scope
### Summary
The existing GET `/api/catalog/sync` endpoint provides a readiness check before sync, but only inspects whether the sync scripts are present on disk. It does NOT check whether `XA_CATALOG_CONTRACT_BASE_URL` or `XA_CATALOG_CONTRACT_WRITE_TOKEN` are configured.

When either env var is unset, the POST sync endpoint runs the full validate + sync pipeline (up to ~5 minutes) and only then fails with HTTP 503 `catalog_publish_unconfigured`. The 503 has a structured JSON body (`{ ok: false, error: "catalog_publish_unconfigured", recovery: "configure_catalog_contract" }`), so it is not "silent" in content, but it is wasteful and disorienting — the operator waits through a full pipeline run only to be told to configure an env var.

The fix is to extend the GET handler to also check and report contract config completeness, making the readiness response actionable before any sync is attempted.

### Goals
- Extend `GET /api/catalog/sync` to check `XA_CATALOG_CONTRACT_BASE_URL` and `XA_CATALOG_CONTRACT_WRITE_TOKEN` presence
- Add `contractConfigured: boolean` and `contractConfigErrors: string[]` to the readiness response
- Make `ready` reflect both scripts and contract config (`scriptsReady && contractConfigured`)
- Update the TypeScript types, hook state, and UI display accordingly
- Add tests covering the new branches (configured and unconfigured)

### Non-goals
- Adding a separate `/api/health` endpoint (the existing GET endpoint is the right place)
- Validating the contract URL is reachable (connectivity check is out of scope; presence check only)
- Changing the POST sync pipeline logic

### Constraints & Assumptions
- Constraints:
  - `CurrencyRatesPanel` uses an inline prop type that only declares `{ checking: boolean; ready: boolean }`. Because TypeScript uses structural typing, additional fields on the passed object are accepted without change — `CurrencyRatesPanel` does not need updating unless it needs to display contract error details (which it doesn't per scope).
  - `SyncReadinessState` in `useCatalogConsole.client.ts` is a local type — can be extended without cross-package impact
  - `SyncReadinessResponse` in `catalogConsoleFeedback.ts` is the shared API response type — extend with optional fields
- Assumptions:
  - Presence check (non-empty string after trim) is sufficient — no connectivity test needed for this deliverable
  - `getCatalogContractBaseUrl()` and `getCatalogContractWriteToken()` in `catalogContractClient.ts` return trimmed env var values, with emptiness checks (`if (!baseUrl)` / `if (!writeToken)`) performed in their callers. These getters are currently **private** (not exported). The GET handler cannot call them directly; TASK-01 must either export them or add a new exported readiness helper.

## Outcome Contract

- **Why:** Operators deploying xa-uploader may not discover a missing catalog contract config until after a full sync pipeline run, wasting time and producing a confusing error. A pre-flight config check makes deployment readiness visible before any sync is attempted.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Extend GET /api/catalog/sync to surface catalog contract config status; operators see a clear readiness signal (including contract config) before triggering sync.
- **Source:** auto

## Evidence Audit (Current State)

### Entry Points
- `apps/xa-uploader/src/app/api/catalog/sync/route.ts` — GET handler (line 467) and POST handler (line 278)
- `apps/xa-uploader/src/lib/catalogContractClient.ts` — `getCatalogContractBaseUrl()` and `getCatalogContractWriteToken()` detection functions
- `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts` — `loadSyncReadiness()` consumer at line 141; `SyncReadinessState` type at line 55

### Key Modules / Files
- `apps/xa-uploader/src/app/api/catalog/sync/route.ts` — GET handler (lines 467–506): currently calls `getSyncReadiness(repoRoot)` and returns `{ ok, storefront, ready, missingScripts, recovery, checkedAt }`. Does NOT check contract config.
- `apps/xa-uploader/src/lib/catalogContractClient.ts` — `buildCatalogContractPublishUrl()` throws `CatalogPublishError("unconfigured")` if `XA_CATALOG_CONTRACT_BASE_URL` empty; `publishCatalogArtifactsToContract()` throws `CatalogPublishError("unconfigured")` if `XA_CATALOG_CONTRACT_WRITE_TOKEN` empty. Both use private `getCatalogContractBaseUrl()` / `getCatalogContractWriteToken()` helpers (line 36, 40). **These helpers are not exported.** A new `getCatalogContractReadiness()` export must be added here.
- `apps/xa-uploader/src/components/catalog/catalogConsoleFeedback.ts` — `SyncReadinessResponse` type (lines 49–56), `SyncRecoveryCode` union (line 13) — `"configure_catalog_contract"` is already a valid recovery code.
- `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts` — `SyncReadinessState` type (lines 55–61), `loadSyncReadiness` (lines 141–167), `setSyncReadiness` call (lines 152–158). Only reads `data.ready`, `data.missingScripts`, `data.checkedAt` from response.
- `apps/xa-uploader/src/components/catalog/CatalogSyncPanel.client.tsx` — renders readiness message using `syncReadiness.ready`, `syncReadiness.checking`, `syncReadiness.error`, `syncReadiness.missingScripts`. Inline prop type (lines 24–45) — must be extended if new fields are to be displayed.
- `apps/xa-uploader/src/components/catalog/CurrencyRatesPanel.client.tsx` — only reads `syncReadiness.ready` and `syncReadiness.checking`. Inline prop type (lines 25–26) minimal. No display of error details.
- `apps/xa-uploader/src/app/api/catalog/sync/__tests__/route.test.ts` — TC-00 (GET ready=true), TC-00b (GET ready=false, missingScripts). No test for GET checking contract config.

### Patterns & Conventions Observed
- GET response fields are all optional except `ok` in `SyncReadinessResponse` — new fields can be added without breaking existing consumers
- `SyncReadinessState` in the hook extends the API response with `checking: boolean` and `error: string | null` — same pattern for new fields
- Inline prop types in `CatalogSyncPanel` and `CurrencyRatesPanel` duplicate a subset of `SyncReadinessState` fields — must keep in sync manually (no shared exported type for prop)
- `SyncRecoveryCode` already includes `"configure_catalog_contract"` — no changes needed to the recovery code union

### Data & Contracts
- Types/schemas/events:
  - `SyncReadinessResponse` — `catalogConsoleFeedback.ts:49` — API response shape; extend with `contractConfigured?: boolean`, `contractConfigErrors?: string[]`
  - `SyncReadinessState` — `useCatalogConsole.client.ts:55` — hook state; extend with `contractConfigured: boolean`, `contractConfigErrors: string[]`
  - Inline prop types in `CatalogSyncPanel.client.tsx:24` and `CurrencyRatesPanel.client.tsx:25` — extend if UI display needs new fields (CurrencyRatesPanel does not)
- API/contracts:
  - GET `/api/catalog/sync?storefront=<id>` — add `contractConfigured: boolean`, `contractConfigErrors: string[]` to response; change `ready` to `scriptsReady && contractConfigured`
  - POST `/api/catalog/sync` — no changes; continues to throw 503 on unconfigured (now surfaced earlier via GET)

### Dependency & Impact Map
- Upstream dependencies:
  - `getCatalogContractBaseUrl()` — reads `XA_CATALOG_CONTRACT_BASE_URL`
  - `getCatalogContractWriteToken()` — reads `XA_CATALOG_CONTRACT_WRITE_TOKEN`
  - `getSyncReadiness(repoRoot)` — existing script check (unchanged)
- Downstream dependents:
  - `loadSyncReadiness()` in `useCatalogConsole.client.ts` — consumes GET response; must propagate new fields to state
  - `CatalogSyncPanel.client.tsx` — renders readiness message; needs updated inline prop type + new display branch for contract errors
  - `CurrencyRatesPanel.client.tsx` — reads only `ready` + `checking`; no display changes needed, but prop type must accept (or ignore) new fields
  - `useCatalogConsole.client.ts:366` — `handleSync` guard uses `state.syncReadiness.ready`; this automatically blocks sync when contract is unconfigured if `ready` is set to `scriptsReady && contractConfigured`
- Likely blast radius:
  - 6 files changed: `route.ts`, `catalogConsoleFeedback.ts`, `useCatalogConsole.client.ts`, `CatalogSyncPanel.client.tsx`, `route.test.ts`, `uploaderI18n.ts`
  - `CurrencyRatesPanel.client.tsx` — prop type needs accepting new optional fields (or no change if fields remain undeclared in inline type — TypeScript allows extra props via structural typing at the call site)
  - All changes within `apps/xa-uploader` — no cross-package impact

### Test Landscape
#### Test Infrastructure
- Frameworks: Jest + Testing Library (governed runner)
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/xa-uploader/jest.config.cjs --testPathPattern=<pattern>`
- CI integration: governed test runner in CI

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| GET /api/catalog/sync (scripts check) | Unit | `route.test.ts` | TC-00, TC-00b: ready=true and ready=false when scripts present/missing |
| POST /api/catalog/sync (unconfigured) | Unit | `route.test.ts` | TC-06: 503 catalog_publish_unconfigured when contract client rejects |
| CatalogSyncPanel rendering | Unit | `sync-feedback.test.tsx` | Tests readiness message display with ready=true/false |
| useCatalogConsole state | Unit | `action-feedback.test.tsx`, `useCatalogConsole-domains.test.tsx` | Checks `syncReadiness.ready` in rendered output |

#### Coverage Gaps
- Untested paths:
  - GET handler when `XA_CATALOG_CONTRACT_BASE_URL` is empty → no test
  - GET handler when `XA_CATALOG_CONTRACT_WRITE_TOKEN` is empty → no test
  - GET handler when both env vars are set → no test for `contractConfigured: true` path
  - `CatalogSyncPanel` display when `contractConfigErrors` is non-empty → no test

#### Testability Assessment
- Easy to test:
  - Route tests: `catalogContractClient` is already mocked in `route.test.ts`; can mock `getCatalogContractBaseUrl` and `getCatalogContractWriteToken` to return empty string for unconfigured cases
- Hard to test:
  - UI display of contract errors in `CatalogSyncPanel` — requires prop type update and new test case, but straightforward since pattern already exists for `missingScripts`
- Test seams needed:
  - None new — existing mock infrastructure is sufficient

#### Recommended Test Approach
- Unit tests for:
  - TC-00c (new): GET returns `contractConfigured: true`, `contractConfigErrors: []`, `ready: true` when both env vars set and scripts present
  - TC-00d (new): GET returns `contractConfigured: false`, `contractConfigErrors: ["XA_CATALOG_CONTRACT_BASE_URL not set", ...]`, `ready: false` when env vars unset
  - (Optional) TC-00e: GET returns `ready: false` when scripts present but contract unconfigured

### Recent Git History (Targeted)
- `apps/xa-uploader/src/app/api/catalog/sync/route.ts` — last changed in `86b65ed9b4 feat(xa-currency-conversion-rates)` — added `CurrencyRatesPanel` integration to the sync readiness consumer chain
- `apps/xa-uploader/src/lib/catalogContractClient.ts` — last changed in `2ac91e7e5a chore` — no functional changes to unconfigured detection logic

## Questions

### Resolved
- Q: Should `ready` be changed to `scriptsReady && contractConfigured`, or should contract config be a separate field only?
  - A: `ready` should reflect both. The guard in `useCatalogConsole.client.ts:366` uses `state.syncReadiness.ready` to block the sync button. If `ready` stays scripts-only, the button remains enabled even when the contract is unconfigured — defeating the purpose. Setting `ready = scriptsReady && contractConfigured` gates the sync button correctly without requiring extra logic in the UI.
  - Evidence: `useCatalogConsole.client.ts:366` — `!state.syncReadiness.ready || state.syncReadiness.checking ? undefined : ...`

- Q: Should the GET handler call the env var getters directly, or use a dedicated exported readiness helper?
  - A: Add a dedicated exported `getCatalogContractReadiness(): { configured: boolean; errors: string[] }` function to `catalogContractClient.ts`. This is preferable to exporting the raw getters because: (1) `getCatalogContractBaseUrl()` and `getCatalogContractWriteToken()` are intentionally private — exposing them leaks internals unnecessarily; (2) a single named helper encapsulates "what counts as configured" cleanly; (3) it is easier to mock in route tests (one mock target instead of two).
  - Evidence: `catalogContractClient.ts:36,40` — getters are private functions (no `export` keyword); `route.test.ts` already mocks the whole `catalogContractClient` module — adding one new export follows the same pattern

- Q: Does `CurrencyRatesPanel` need to display contract config errors?
  - A: No. It only uses `ready` and `checking` to gate a sync action. Contract config errors are informational content appropriate for `CatalogSyncPanel` (the dedicated sync status panel). `CurrencyRatesPanel` will automatically respect `ready: false` when contract is unconfigured.
  - Evidence: `CurrencyRatesPanel.client.tsx:25–26` and `:98` — only reads `checking` and `ready`

### Open (Operator Input Required)
- None: all questions resolved from evidence and architectural reasoning.

## Confidence Inputs
- Implementation: 92%
  - Evidence: entry points, consumer chain, and test seams all confirmed. 8% reserved for unforeseen TypeScript type conflicts across inline prop types.
- Approach: 95%
  - Evidence: pattern is a straightforward extension of the existing readiness check; mock infrastructure confirmed; no new abstractions needed.
- Impact: 90%
  - Evidence: `ready` gates the sync button and `handleSync` guard; making `ready = scriptsReady && contractConfigured` prevents sync attempts on misconfigured deployments.
- Delivery-Readiness: 92%
  - Evidence: all affected files identified; test coverage gaps mapped; i18n key pattern confirmed.
- Testability: 93%
  - Evidence: existing mock for `catalogContractClient` in `route.test.ts`; straightforward to add new TCs.

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `CurrencyRatesPanel` inline prop type incompatibility | Low | Low | New fields on `syncReadiness` are optional; structural typing won't break existing props |
| sync-feedback.test.tsx test failures if `SyncReadinessState` type changes break existing mocks | Low | Medium | Existing test mocks pass explicit `syncReadiness` objects; adding optional fields won't break them unless fields become required |
| Operator sees `ready: false` on contract-configured deployments where scripts are also present | Low | Low | Both conditions independently gate `ready`; operator can distinguish cause via `missingScripts` vs `contractConfigErrors` |

## Planning Constraints & Notes
- Must-follow patterns:
  - All new i18n keys must be added to both `en` and `zh` translations in `uploaderI18n.ts`
  - `SyncReadinessResponse` fields must remain optional for backward compat
  - Follow existing `route.test.ts` TC naming pattern (TC-00c, TC-00d)
- Rollout/rollback expectations:
  - No deployment gate risk — additive change; existing deployments with scripts present and contract configured will see `contractConfigured: true` and `ready: true` (same as before)
  - Deployments with contract unconfigured will now see `ready: false` before attempting sync — intended behaviour
- Observability expectations:
  - No new logging needed; the readiness response itself is the signal

## Suggested Task Seeds
- TASK-01 (IMPLEMENT): Add `getCatalogContractReadiness()` export to `catalogContractClient.ts` + extend GET handler + update response types + hook state — `catalogContractClient.ts`, `route.ts`, `catalogConsoleFeedback.ts`, `useCatalogConsole.client.ts`
- TASK-02 (IMPLEMENT): Update `CatalogSyncPanel` display for contract config errors + add i18n keys — `CatalogSyncPanel.client.tsx`, `uploaderI18n.ts`
- TASK-03 (IMPLEMENT): Add TC-00c and TC-00d to `route.test.ts` (mock new `getCatalogContractReadiness` export)

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| GET handler — contract config detection | Yes | None | No |
| `catalogContractClient.ts` detection points | Yes | None | No |
| `SyncReadinessResponse` type extension | Yes | None | No |
| `SyncReadinessState` hook type + setState call | Yes | None | No |
| `CatalogSyncPanel.client.tsx` display update | Yes | None | No |
| `CurrencyRatesPanel.client.tsx` prop compat | Yes | [Minor] Inline prop type does not declare new fields; but structural typing means extra fields are safe | No |
| Test coverage (route.test.ts TC-00c, TC-00d) | Yes | None | No |
| i18n strings (new contract config error keys) | Partial — keys not yet named | [Minor] Key names TBD at planning time | No |
| Cross-package impact check | Yes — none found | None | No |

No critical simulation issues. Two minor advisory items noted above (inline prop type, i18n key names).

## Evidence Gap Review

### Gaps Addressed
- Confirmed consumer chain fully: GET → `loadSyncReadiness` → `SyncReadinessState` → `CatalogSyncPanel` + `CurrencyRatesPanel`
- Confirmed mock infrastructure in `route.test.ts` is sufficient for new test cases
- Confirmed `ready` field semantics change is safe given `handleSync` guard
- Confirmed `SyncRecoveryCode` already includes `"configure_catalog_contract"`

### Confidence Adjustments
- No downward adjustments — all investigation targets confirmed
- Slight upward adjustment on Implementation (was 90% → 92%) after confirming no cross-package type changes needed

### Remaining Assumptions
- `getCatalogContractBaseUrl()` and `getCatalogContractWriteToken()` can be called in the GET handler without side effects or performance issues (they simply read env vars) — assessed as safe

## Planning Readiness
- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan xa-uploader-sync-health-check --auto`
