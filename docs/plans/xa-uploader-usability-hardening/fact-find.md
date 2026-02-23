---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-02-23
Last-updated: 2026-02-23
Last-reviewed: 2026-02-23
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-usability-hardening
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Loop-Gap-Trigger: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-design-qa, lp-refactor
Related-Plan: docs/plans/xa-uploader-usability-hardening/plan.md
Business-OS-Integration: off
Business-Unit: none
Card-ID: none
artifact: fact-find
direct-inject: true
direct-inject-rationale: Operator requested direct usability hardening for apps/xa-uploader.
---

# XA Uploader Usability Hardening Fact-Find Brief

## Scope
### Summary
Investigate concrete improvements that make `apps/xa-uploader` easier and safer for operators to use day-to-day (catalog editing, submission export/upload, and sync), with evidence sufficient for `/lp-do-plan` tasking.

### Goals
- Remove high-friction or broken paths in the current uploader flow.
- Improve operator feedback loops (errors, success states, recoverability).
- Reduce avoidable mistakes in product form and submission workflow.
- Define a test strategy that covers UI + API behavior, not only utility libraries.

### Non-goals
- Replatforming uploader to a different framework.
- Redesigning the XA catalog schema.
- Building new storefront business logic outside uploader and its sync/submission boundaries.

### Constraints & Assumptions
- Constraints:
  - This is an internal operations console and must remain local-file aware for image packaging (`apps/xa-uploader/src/lib/submissionZip.ts:63`, `apps/xa-uploader/src/lib/fileGlob.ts:70`).
  - Auth/session behavior differs by mode and must preserve vendor/internal semantics (`apps/xa-uploader/src/lib/uploaderAuth.ts:8`, `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts:495`).
  - CSV is still the source of truth for product drafts (`apps/xa-uploader/src/lib/catalogCsv.ts:40`).
- Assumptions:
  - Internal mode remains the main operator mode; vendor mode remains supported but secondary.
  - `xa-b` is the current active storefront target (`apps/xa-uploader/src/lib/catalogStorefront.ts:8`).

## Evidence Audit (Current State)
### Entry Points
- `apps/xa-uploader/src/app/page.tsx:14` - app route entry rendering the uploader client shell.
- `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx:18` - top-level authenticated console UI branch.
- `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts:493` - state and handlers for login, CRUD, submission, and sync.
- `apps/xa-uploader/src/app/api/catalog/products/route.ts:13` - list/save product drafts.
- `apps/xa-uploader/src/app/api/catalog/products/[slug]/route.ts:28` - delete product by slug.
- `apps/xa-uploader/src/app/api/catalog/submission/route.ts:18` - builds ZIP payload for selected products.
- `apps/xa-uploader/src/app/api/catalog/sync/route.ts:49` - validate + sync pipeline trigger.

### Key Modules / Files
- `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts` - monolithic state/flow coordinator (auth + CRUD + submission + sync).
- `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx` - central form shell with global error surface.
- `apps/xa-uploader/src/components/catalog/CatalogProductsList.client.tsx` - product discovery + submission selection UX.
- `apps/xa-uploader/src/components/catalog/CatalogSubmissionPanel.client.tsx` - ZIP export and optional upload UI.
- `apps/xa-uploader/src/components/catalog/CatalogSyncPanel.client.tsx` - sync controls and log output.
- `apps/xa-uploader/src/lib/catalogAdminSchema.ts` - zod validation rules and message payloads.
- `apps/xa-uploader/src/lib/catalogCsv.ts` - CSV persistence and optimistic concurrency revisions.
- `apps/xa-uploader/src/lib/submissionZip.ts` - file resolution, image checks, ZIP packaging and manifest.
- `apps/xa-uploader/src/lib/uploaderAuth.ts` - token/session auth boundary.
- `apps/xa-uploader/src/app/api/catalog/sync/route.ts` - bridge to external validation/sync scripts.

### Patterns & Conventions Observed
- Single-hook orchestration pattern for most UI behavior (`apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts:792`).
- Schema-first validation on save via zod with client-side error map projection (`apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts:257`, `apps/xa-uploader/src/components/catalog/catalogConsoleUtils.ts:1`).
- CSV-backed persistence with id/slug collision protection and revision hashes (`apps/xa-uploader/src/lib/catalogCsv.ts:35`, `apps/xa-uploader/src/lib/catalogCsv.ts:89`).
- Broad temporary lint waivers indicate known design/i18n/security debt across uploader modules (`apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx:3`, `apps/xa-uploader/src/lib/catalogCsv.ts:1`).

### Data & Contracts
- Types/schemas/events:
  - Draft schema enforces required catalog fields and category-specific constraints (`apps/xa-uploader/src/lib/catalogAdminSchema.ts:89`).
  - Save flow requires schema pass before API POST (`apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts:257`).
- Persistence:
  - Draft source is `products.<storefront>.csv` with legacy fallback and atomic writes (`apps/xa-uploader/src/lib/catalogStorefront.server.ts:22`, `apps/xa-uploader/src/lib/catalogCsvFormat.ts:71`).
- API/contracts:
  - Session/login/logout endpoints gate console access (`apps/xa-uploader/src/app/api/uploader/login/route.ts:15`, `apps/xa-uploader/src/app/api/uploader/session/route.ts:7`).
  - Submission response contract uses headers `X-XA-Submission-Id` and `X-XA-Submission-R2-Key` consumed by client status display (`apps/xa-uploader/src/app/api/catalog/submission/route.ts:56`, `apps/xa-uploader/src/components/catalog/catalogSubmissionClient.ts:42`).

### Dependency & Impact Map
- Upstream dependencies:
  - Runtime secrets and mode toggles (`apps/xa-uploader/next.config.mjs:29`, `apps/xa-uploader/src/lib/uploaderAuth.ts:44`).
  - Local filesystem access for product CSV and images (`apps/xa-uploader/src/lib/catalogCsv.ts:118`, `apps/xa-uploader/src/lib/submissionZip.ts:117`).
  - External upload endpoint URL supplied by operator/env (`apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts:522`).
  - Sync route currently depends on script paths that are missing in the repo (`apps/xa-uploader/src/app/api/catalog/sync/route.ts:91` and `apps/xa-uploader/src/app/api/catalog/sync/route.ts:92`; no corresponding files under `scripts/src/xa/` as of 2026-02-23).
- Downstream dependents:
  - Sync writes into storefront catalog outputs (`apps/xa-uploader/src/lib/catalogStorefront.server.ts:56`).
  - Submission ZIP handoff affects downstream upload/fulfillment process (`apps/xa-uploader/src/lib/submissionZip.ts:168`).
- Likely blast radius:
  - UX changes in `useCatalogConsole` affect all console panels.
  - Validation rule adjustments in `catalogAdminSchema` affect save, CSV mapping, submission packaging, and localized error behavior.

### Delivery & Channel Landscape
- Audience/recipient:
  - Internal catalog operators maintaining product data and handoffs.
- Channel constraints:
  - Local runtime required for filesystem image paths (explicitly surfaced to users in UI copy).
- Existing templates/assets:
  - Two-language string bundle exists but validation/API error messaging is partially machine/English-first (`apps/xa-uploader/src/lib/uploaderI18n.ts:8`, `apps/xa-uploader/src/lib/catalogAdminSchema.ts:93`).
- Approvals/owners:
  - Product/ops owner needed for prioritizing throughput vs strict validation.
- Compliance constraints:
  - Internal auth token/session controls must remain intact.
- Measurement hooks:
  - No instrumentation for task completion time, failed save rate, or sync retry rate found.

### Test Landscape
#### Test Infrastructure
- Frameworks:
  - Jest (node env), zod validation/unit tests.
- Commands:
  - `pnpm --filter @apps/xa-uploader typecheck` (PASS)
  - `pnpm --filter @apps/xa-uploader lint` (PASS)
  - `pnpm exec jest --config ./jest.config.cjs --testPathPattern=src/lib/__tests__ --maxWorkers=2` from `apps/xa-uploader` (PASS)
- CI integration:
  - Package `test` script delegates to workspace governed runner (`apps/xa-uploader/package.json:8`).

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Draft schema rules | Unit | `apps/xa-uploader/src/lib/__tests__/catalogAdminSchema.test.ts` | Covers required/invalid schema branches. |
| CSV mapping normalization | Unit | `apps/xa-uploader/src/lib/__tests__/catalogCsvMapping.test.ts` | Covers list normalization + boolean parsing. |
| Submission ZIP creation | Unit/integration-lite (fs) | `apps/xa-uploader/src/lib/__tests__/submissionZip.test.ts` | Verifies packaging and filename randomization path. |
| Image dimension parsing | Unit (fs) | `apps/xa-uploader/src/lib/__tests__/imageDimensions.test.ts` | Covers PNG and WebP parsing paths. |

#### Coverage Gaps
- Untested paths:
  - No React component tests for form usability, error visibility, keyboard flow, or locale behavior.
  - No API route tests for login/session/logout/products/submission/sync.
  - No tests for `useCatalogConsole` action state transitions (`busy`, `error`, success status).
  - No test that sync script paths exist before attempting spawn.
- Extinct tests:
  - Not identified in this run.

#### Testability Assessment
- Easy to test:
  - Hook-level behavior in `useCatalogConsole` with mocked fetch.
  - API route request/response contracts for products/submission/sync.
- Hard to test:
  - Full filesystem + sync pipeline integration due missing script dependencies and environment coupling.
- Test seams needed:
  - Script-path resolver abstraction in sync route.
  - Notification/status abstraction separate from form render location.

#### Recommended Test Approach
- Unit tests for:
  - Error localization mapping and field-level message translation.
  - Script existence preflight for sync route.
- Integration tests for:
  - Save/delete/product selection lifecycle in `useCatalogConsole`.
  - Submission upload branch with non-200 responses.
- E2E tests for:
  - Login -> create product -> export ZIP happy path.
  - Failed sync and recovery flow with actionable UI feedback.
- Contract tests for:
  - API route status/error contract normalization across locales.

### Recent Git History (Targeted)
- `4d962cb4ed` (2026-02-20): touches `apps/xa-uploader/tsconfig.json`; no functional UX change, low risk to runtime behavior.
- `98f42ad762` (2026-02-18): adds uploader-local Jest config (`apps/xa-uploader/jest.config.cjs`) to stabilize node env tests.
- `5e27a4655c` (2026-02-14): keeps `next --webpack` path in package scripts (`apps/xa-uploader/package.json`) with legacy webpack dependency.
- `9a3cac3601` (2026-02-13): design-token migration across uploader components; visual consistency improved but did not address flow-level usability.

## Questions
### Resolved
- Q: Is sync currently operational with repository defaults?
  - A: Not reliably. Sync route references `scripts/src/xa/validate-xa-inputs.ts` and `scripts/src/xa/run-xa-pipeline.ts`, which are absent in this workspace.
  - Evidence: `apps/xa-uploader/src/app/api/catalog/sync/route.ts:91`, `apps/xa-uploader/src/app/api/catalog/sync/route.ts:92`.
- Q: Is there meaningful automated coverage for utility-layer logic?
  - A: Yes, four library test files pass when run directly in the app package.
  - Evidence: `apps/xa-uploader/src/lib/__tests__/submissionZip.test.ts:92`, `apps/xa-uploader/src/lib/__tests__/catalogAdminSchema.test.ts:28`.
- Q: Does uploader currently expose contextual success feedback for save/delete?
  - A: Not explicitly; only submission actions set positive status text.
  - Evidence: `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts:285`, `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts:329`, `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts:423`.
- Q: Can scoped package tests leak into unrelated workspaces via the default script path?
  - A: Yes. Running package `test` with `--testPathPattern` matched unrelated suites and failed on `apps/xa-b` in this workspace.
  - Evidence: `apps/xa-uploader/package.json:8` and observed command behavior on 2026-02-23.

### Open (User Input Needed)
- Q: Should uploader remain token-only auth, or move to shared identity/session UX for operators?
  - Why it matters: Determines login UX scope and secure usability features (masked token, expiry warnings, role messaging).
  - Decision impacted: Authentication UX hardening task scope.
  - Decision owner: Product/operations owner.
  - Default assumption (if any) + risk: Keep token auth; risk is persistent operator friction and handling mistakes.
- Q: Is sync expected to stay in uploader, or should uploader become submission-only with external sync orchestration?
  - Why it matters: Affects whether we fix route-local script orchestration vs remove/deprecate sync UI.
  - Decision impacted: Sync panel roadmap and backend dependencies.
  - Decision owner: Engineering owner.
  - Default assumption (if any) + risk: Keep sync in uploader; risk is recurring breakage if script boundaries keep moving.
- Q: Which KPI defines "usable as possible" for this tool (time-to-publish, error rate, onboarding time)?
  - Why it matters: Needed to prioritize improvements and validate impact.
  - Decision impacted: Task sequencing and acceptance criteria.
  - Decision owner: Operations lead.
  - Default assumption (if any) + risk: Optimize for operator error-rate reduction first; risk is slower throughput than expected.

## Confidence Inputs
### Implementation: 82%
- Evidence basis:
  - Core flows and pain points are directly inspectable in code and routes.
  - Local validation gate and persistence boundaries are clear and test-backed for libs.
- What raises this to >=80:
  - Already above threshold.
- What raises this to >=90:
  - Add passing route and hook tests covering login/save/delete/submission/sync failures.
  - Confirm sync dependency strategy (fix paths or deprecate feature) and lock with tests.

### Approach: 78%
- Evidence basis:
  - Clear usability defects identified (broken sync dependency, non-contextual errors, weak success feedback, localization gaps).
- What raises this to >=80:
  - Confirm operator priority ordering for fixes (throughput vs safety vs localization).
- What raises this to >=90:
  - Capture 3-5 real operator journeys and map each to acceptance checks.

### Impact: 70%
- Evidence basis:
  - Defects likely affect usability, but no baseline metrics are instrumented.
- What raises this to >=80:
  - Define one baseline operational KPI and current value.
- What raises this to >=90:
  - Add instrumentation and compare before/after for at least one release cycle.

### Delivery-Readiness: 68%
- Evidence basis:
  - Typecheck/lint/tests pass for known utility scope, but sync path currently points to missing scripts.
  - Package-level test invocation can unintentionally execute unrelated suites.
- What raises this to >=80:
  - Resolve sync script dependency contract and add route-level test coverage.
  - Provide app-local test command path in plan tasks.
- What raises this to >=90:
  - Stabilize E2E happy/failure flow tests and CI-safe scoped test commands.

### Testability: 74%
- Evidence basis:
  - Utility seams are testable and already covered.
  - UI/action-state and API-route seams currently under-tested.
- What raises this to >=80:
  - Add `useCatalogConsole` tests for action states and error surfacing.
- What raises this to >=90:
  - Add end-to-end regression suite for primary operator workflows.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Sync remains nonfunctional due missing script dependencies | High | High | Decide sync ownership boundary, then enforce script path preflight + tests. |
| UX hardening changes accidentally break CSV/schema compatibility | Medium | High | Keep schema as source of truth; add contract tests for mapping and save API. |
| Error copy remains mixed machine/English in zh locale | High | Medium | Normalize API/user-facing error mapping and localize schema messages. |
| Success feedback improvements become inconsistent across panels | Medium | Medium | Introduce unified status/notification model in hook + panel-level render contracts. |
| Test commands continue to leak to unrelated packages in developer workflow | Medium | Medium | Document and enforce app-local jest invocation in validation contracts. |
| Security/usability tradeoff in auth changes causes lockouts or weak handling | Medium | High | Confirm auth strategy early; stage with backward-compatible transition. |

## Planning Constraints & Notes
- Must-follow patterns:
  - Preserve zod-first validation and CSV row mapping contracts.
  - Preserve same-site session cookie boundaries in internal mode.
- Rollout/rollback expectations:
  - Changes should be behind reversible UI/state boundaries (no destructive data migrations).
- Observability expectations:
  - Add minimal operational telemetry (success/error counters per major action) to validate usability claims.

## Suggested Task Seeds (Non-binding)
- Define and implement a sync dependency contract: preflight script existence + actionable operator error if missing.
- Split global `error` into scoped error/status channels (login, save/delete, submission, sync).
- Add positive success feedback for save/delete with contextual detail.
- Localize schema and API error presentation for both EN and ZH.
- Add accessibility/usability refinements: token input masking, focus/error targeting, keyboard flow checks.
- Extract and test `useCatalogConsole` sub-domains (auth, draft CRUD, submission, sync) for predictable state transitions.
- Add API route tests for auth/session, products, submission, and sync failure contracts.
- Add an end-to-end operator happy path (login -> create/edit -> export ZIP) with one failure recovery scenario.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - `lp-design-qa`, `lp-refactor`
- Deliverable acceptance package:
  - Updated uploader UX behavior + targeted tests + validation evidence from package-scoped commands.
- Post-delivery measurement plan:
  - Track operator-visible success/error counts and time-to-complete for core flows.

## Evidence Gap Review
### Gaps Addressed
- Verified code-path evidence for each core flow (auth, CRUD, submission, sync) with concrete file anchors.
- Ran app-scoped validation commands (typecheck/lint/tests) to replace assumption-based readiness claims.
- Verified sync dependency references against current repo state and identified missing script boundary.

### Confidence Adjustments
- Delivery-Readiness reduced due sync route dependency gap and test-command leakage risk.
- Impact kept conservative due missing baseline instrumentation.

### Remaining Assumptions
- Operator priorities for “most usable” are inferred, not directly captured.
- Sync feature is assumed to remain in scope until owner confirms otherwise.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None (open questions are preference/priority decisions, not hard technical blockers).
- Recommended next step:
  - `/lp-do-plan`
