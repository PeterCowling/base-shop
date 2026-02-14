---
Type: Plan
Status: Active
Domain: Agents / DevEx
Workstream: Engineering
Created: 2026-02-14
Last-updated: 2026-02-14
Feature-Slug: agent-web-browsing-superpower
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: /lp-build
Supporting-Skills: none
Overall-confidence: 82%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-OS-Integration: off
Business-Unit: PLAT
Card-ID:
---

# Agent Web Browsing Superpower - Plan

## Summary

Implement a robust, agent-friendly web browsing tool contract and backing implementation in Base-Shop's MCP server, so agents can reliably determine (1) what page/state they are on and (2) what actions are available, then execute workflows via an enforced observe -> act -> verify loop.

This plan focuses on shipping a v0.1 that is contract-correct, testable in CI (pure-function contract tests + fixtures), and safe by default (danger-action confirmation gates + redaction). Browser fidelity (real Chromium/Playwright integration) is included, but the plan avoids making CI dependent on having a browser binary available.

## Re-plan Update (2026-02-14)

This plan was replanned to reduce churn during build by locking contracts and making TDD-friendly seams explicit.

- Add a `packages/mcp-server/jest.config.cjs` (scoped to the package) and run all browser-tool tests with it.
  - Evidence (E2): running Jest with the repo-root config can fail when `.open-next` artifacts exist (haste-map duplicate packages). We hit this when running governed tests: `tool-policy-gates` passed, but `template-ranker` failed due to a duplicate `@acme/lib` package coming from an `.open-next` output directory.
- Decompose `browser_observe` / `browser_act` into (a) pure contract logic tasks and (b) tool-handler integration tasks.
- Expand validation contracts to meet minimum case counts (M >= 3, L >= 5) so `/lp-build` has an executable contract per task.

## Goals

- Provide MCP tools for stateful browsing sessions: `browser_*`.
- Implement the BIC v0.1 schema from `docs/plans/agent-web-browsing-superpower/fact-find.md`.
- Enforce observation epochs (`observationId`), cursor paging, and tool-verified expectations.
- Enforce safety gates (risk classification + confirmation protocol + redaction).
- Ship a deterministic contract test harness (fixtures + unit tests) and a local smoke runner.

## Non-goals

- Full cross-site robustness for every anti-bot / CAPTCHA environment.
- Vision mode (OCR/bbox) in v0.1.
- Long-lived "page object memory" and per-site adapters in v0.1.

## Constraints & Assumptions

- Constraints:
  - Must integrate with existing MCP server tool architecture in `packages/mcp-server/src/tools/*`.
  - Must not rely on removed Playwright APIs: `page.accessibility.snapshot()` is not present in current Playwright versions in-repo.
  - CI-safe testing: core correctness must be provable without launching a real browser.
  - Safety gates must be enforced at the tool layer, not prompt-layer.
- Assumptions:
  - Chromium-only is acceptable for the a11y-first extraction layer (uses CDP domains available in Chromium).

## Fact-Find Reference

- Related brief: `docs/plans/agent-web-browsing-superpower/fact-find.md`
- Key findings:
  - Reliability requires stable page identity + enumerated affordances.
  - `actionId` is observation-epoch scoped; stale `observationId` must be rejected.
  - Tool must enforce observe -> act -> verify and safety confirmation for danger actions.

## Existing System Notes (Repo Evidence)

- MCP tool dispatch is centralized in `packages/mcp-server/src/tools/index.ts` (tool definitions array + `handleToolCall`).
- Existing browser automation pattern uses Playwright CDP and local Chrome resolution in `packages/mcp-server/src/tools/octorate.ts`.
- Playwright in repo does not expose `page.accessibility.snapshot()`; accessibility-first extraction must use CDP (`Accessibility.*`) and/or role-based querying.
  - Verified via local probe in `packages/mcp-server`: CDP `Accessibility.getFullAXTree` returns `backendDOMNodeId`, and `DOM.getDocument` + `DOM.pushNodesByBackendIdsToFrontend` allows mapping to DOM nodes.
- Jest policy/error envelope patterns exist and are covered by tests in `packages/mcp-server/src/tools/policy.ts` and `packages/mcp-server/src/__tests__/tool-policy-gates.test.ts`.
- Validation baseline (E2): `pnpm --filter @acme/mcp-server typecheck` passes.

## Proposed Approach

### Option A (Chosen): Chromium CDP-based a11y-first extraction + deterministic fixtures

- Use Playwright's Chromium CDP session (`context.newCDPSession(page)`) to obtain accessible roles/names via `Accessibility.getFullAXTree`.
- Resolve `backendDOMNodeId` to DOM `nodeId` with `DOM.getDocument` + `DOM.pushNodesByBackendIdsToFrontend` + `DOM.describeNode`.
- Build best-effort selectors (prefer `#id`, stable attributes, else nth-child path) and treat selectors as ephemeral within the observation epoch.
- Keep the core BIC transformation logic pure, and unit-test with recorded fixture JSON from CDP (CI-safe).

Pros: closest to true a11y model; deterministic tests; aligns with fact-find "a11y-first".

Cons: Chromium-only; selector generation is non-trivial.

### Option B: DOM-only affordance extraction

- Enumerate interactive elements by DOM heuristics and approximate accessible name.

Pros: simpler.

Cons: misses semantic roles/names; worse cross-site robustness; conflicts with "a11y-first" intent.

Chosen: Option A.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | BIC v0.1 types + errors + risk/redaction (pure) + mcp-server Jest config | 88% | M | Complete (2026-02-14) | - | TASK-02, TASK-03, TASK-04, TASK-05 |
| TASK-02 | IMPLEMENT | Session + observation epoch engine (stateful) | 82% | M | Complete (2026-02-14) | TASK-01 | TASK-06, TASK-07 |
| TASK-03 | SPIKE | CDP AX extraction + backend node resolution + selector builder (fixtures + unit tests) | 82% | L | Pending | TASK-01 | TASK-06 |
| TASK-04 | IMPLEMENT | Observe shaping (ranking + paging + forms derivation) (pure) | 85% | M | Pending | TASK-01 | TASK-06 |
| TASK-05 | IMPLEMENT | Act shaping (expect evaluation + safety confirmation protocol) (pure) | 85% | M | Pending | TASK-01 | TASK-07 |
| TASK-06 | IMPLEMENT | `browser_observe` tool handler (session + CDP + ranking/paging) | 78% | L | Pending | TASK-02, TASK-03, TASK-04 | TASK-07, TASK-08 |
| TASK-07 | IMPLEMENT | `browser_act` tool handler (actions + verification + safety + nextObservation) | 74% | L | Pending | TASK-02, TASK-05, TASK-06 | TASK-08 |
| TASK-08 | IMPLEMENT | MCP tool wiring + integration tests + local smoke runner | 80% | M | Pending | TASK-06, TASK-07 | TASK-09 |
| TASK-09 | CHECKPOINT | Horizon checkpoint: validate against real sites, adjust plan | 95% | S | Pending | TASK-08 | - |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Parallelism Guide

Execution waves for subagent dispatch. Tasks within a wave can run in parallel.

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | TASK-01 | - | Contract types + pure helpers + Jest scoping |
| 2 | TASK-02, TASK-03, TASK-04, TASK-05 | Wave 1: TASK-01 | Session, CDP spike, observe shaping, act shaping |
| 3 | TASK-06 | Wave 2: TASK-02, TASK-03, TASK-04 | Observe handler |
| 4 | TASK-07 | Wave 3: TASK-06; Wave 2: TASK-05, TASK-02 | Act handler |
| 5 | TASK-08 | Wave 3: TASK-06; Wave 4: TASK-07 | Tool wiring + smoke |
| 6 | TASK-09 | Wave 5: TASK-08 | Checkpoint gate |

**Max parallelism:** 4 (Wave 2) | **Critical path:** TASK-01 -> TASK-02 -> TASK-06 -> TASK-07 -> TASK-08 -> TASK-09 (6 waves) | **Total tasks:** 9

## Tasks

### TASK-01: BIC v0.1 Types, Errors, Risk/Redaction (Pure) + Jest Scoping

- **Type:** IMPLEMENT
- **Deliverable:** TypeScript BIC v0.1 types + helper functions + unit tests; package-scoped Jest config for reliable governed runs
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `packages/mcp-server/jest.config.cjs`
  - `packages/mcp-server/src/tools/browser/bic.ts`
  - `packages/mcp-server/src/tools/browser/errors.ts`
  - `packages/mcp-server/src/tools/browser/risk.ts`
  - `packages/mcp-server/src/tools/browser/redaction.ts`
  - `packages/mcp-server/src/__tests__/browser-bic.contract.test.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-04, TASK-05
- **Confidence:** 88%
  - Implementation: 90% -- pure TS + existing tool-policy patterns (`packages/mcp-server/src/tools/policy.ts`).
  - Approach: 88% -- matches fact-find contract; no runtime coupling yet.
  - Impact: 85% -- isolated new module; no tool registration changes yet.
- **Acceptance:**
  - `packages/mcp-server/jest.config.cjs` exists and is scoped to `packages/mcp-server` so governed runs do not scan `.open-next` artifacts from other apps.
  - BIC v0.1 TypeScript types exist and encode: schemaVersion, observationId epoch semantics, paging (`nextCursor`, `hasMore`), affordance redaction flags, blockers shape, risk enum.
  - Browser error taxonomy codes are enumerated and reusable by tool handlers.
  - `risk="danger"` classification function is conservative and explainable.
- **Test contract:**
  - TC-01: BIC example object conforms to TypeScript type and runtime contract guard (if added) -> pass
  - TC-02: Sensitive affordance omits `value` and sets `valueRedacted=true` -> pass
  - TC-03: Risk classifier marks "Place order" as `danger` -> pass
  - **Test type:** unit
  - **Test location:** `packages/mcp-server/src/__tests__/browser-bic.contract.test.ts`
  - **Run:** `pnpm -w run test:governed -- jest -- --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/browser-bic.contract.test.ts --runInBand`
- **Execution plan:** Red -> Green -> Refactor
- **Rollout / rollback:**
  - Rollout: internal-only tool; no production traffic gating.
  - Rollback: remove tool registration entry from `packages/mcp-server/src/tools/index.ts`.
- **Documentation impact:** `docs/plans/agent-web-browsing-superpower/fact-find.md` remains the contract reference; add brief usage notes to `packages/mcp-server/README.md` in later task.
- **Re-plan Update (2026-02-14):**
  - Previous: tests referenced repo-root Jest config.
  - Update: add package-scoped Jest config after E2 evidence of haste-map duplicate packages from `.open-next` artifacts.

#### Build Completion (2026-02-14)

- **Status:** Complete (2026-02-14)
- **Commit:** 066f309f96
- **Validation evidence:**
  - `pnpm -w run test:governed -- jest -- --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/browser-bic.contract.test.ts --runInBand` -- PASS
  - `pnpm --filter @acme/mcp-server typecheck` -- PASS
  - `pnpm --filter @acme/mcp-server lint` -- PASS (warnings only)

### TASK-02: Session + Observation Epoch Engine

- **Type:** IMPLEMENT
- **Deliverable:** In-memory session manager + observation epoch enforcement + basic navigation
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `packages/mcp-server/src/tools/browser/session.ts`
  - `packages/mcp-server/src/tools/browser/driver.ts`
  - `packages/mcp-server/src/__tests__/browser-session.unit.test.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-06, TASK-07
- **Confidence:** 82%
  - Implementation: 85% -- session maps + epoch rejection are straightforward.
  - Approach: 82% -- stateful MCP sessions are new in this repo; needs careful lifecycle/cleanup.
  - Impact: 82% -- contained to new tool; risk is memory leaks.
- **Acceptance:**
  - Tool-level sessions exist (`sessionId`) with lifecycle: open -> navigate -> observe/act -> close.
  - Each session maintains a single current `observationId` and rejects stale actions with `STALE_OBSERVATION`.
  - Closing a session releases browser/context resources.
- **Test contract:**
  - TC-01: act() with stale observationId -> returns `STALE_OBSERVATION`
  - TC-02: close() disposes session and subsequent observe/act -> returns `SESSION_NOT_FOUND`
  - TC-03: multiple sessions do not share observation epochs -> pass
  - **Test type:** unit (mock driver)
  - **Test location:** `packages/mcp-server/src/__tests__/browser-session.unit.test.ts`
  - **Run:** `pnpm -w run test:governed -- jest -- --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/browser-session.unit.test.ts --runInBand`
- **Execution plan:** Red -> Green -> Refactor
- **What would make this >=90%:** add a minimal integration smoke that opens Chrome and validates resource cleanup (optional).

#### Build Completion (2026-02-14)

- **Status:** Complete (2026-02-14)
- **Commit:** 92352a6ead
- **Validation evidence:**
  - `pnpm -w run test:governed -- jest -- --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/browser-session.unit.test.ts --runInBand` -- PASS
  - `pnpm --filter @acme/mcp-server typecheck` -- PASS
  - `pnpm --filter @acme/mcp-server lint` -- PASS (warnings only)

### TASK-03: SPIKE - CDP AX Extraction + Node Resolution + Selector Builder

- **Type:** SPIKE
- **Deliverable:** CDP adapter functions + fixture-based tests proving we can extract role/name and resolve nodes deterministically
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `packages/mcp-server/src/tools/browser/cdp.ts`
  - `packages/mcp-server/src/tools/browser/selectors.ts`
  - `packages/mcp-server/src/__tests__/fixtures/browser/cdp-ax-tree.json`
  - `packages/mcp-server/src/__tests__/fixtures/browser/cdp-dom-describe.json`
  - `packages/mcp-server/src/__tests__/browser-cdp.contract.test.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-06
- **Confidence:** 82%
  - Implementation: 85% -- CDP methods are available; verified locally that `Accessibility.getFullAXTree` and `DOM.pushNodesByBackendIdsToFrontend` work.
  - Approach: 82% -- selector generation needs careful heuristics and uniqueness checks.
  - Impact: 82% -- affects downstream observe/act reliability.
- **Acceptance:**
  - Given fixture AX nodes + DOM node descriptions, the adapter produces candidate affordances with role + name + backendDOMNodeId.
  - Nodes without backend DOM IDs are surfaced but marked non-targetable.
  - Selector builder prefers stable selectors and can produce a unique selector when possible.
  - Fixtures are recorded in-repo and deterministic.
- **Test contract:**
  - TC-01: AX fixture contains a button "Place order" -> extracted affordance includes role=button, name="Place order" -> pass
  - TC-02: backendDOMNodeId resolves to DOM node with attributes -> pass
  - TC-03: selector builder yields `#id` when present -> pass
  - TC-04: when no `id`, selector builder falls back to stable attribute selector when available -> pass
  - TC-05: when no stable selector exists, selector builder falls back to nth-child path and marks selector as best-effort -> pass
  - **Test type:** unit/contract
  - **Test location:** `packages/mcp-server/src/__tests__/browser-cdp.contract.test.ts`
  - **Run:** `pnpm -w run test:governed -- jest -- --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/browser-cdp.contract.test.ts --runInBand`
- **Exit criteria:** fixtures + tests demonstrate extraction + resolution are viable for downstream IMPLEMENT tasks.
- **What would make this >=90%:** add a local smoke script that records fixtures from a real page and replays them (deferred unless needed).
- **Re-plan Update (2026-02-14):** expanded TC list to meet L-effort minimums.

### TASK-04: Observe Shaping - Ranking + Paging + Forms Derivation (Pure)

- **Type:** IMPLEMENT
- **Deliverable:** pure functions that (a) rank affordances deterministically and (b) page them via cursor, plus a derived forms representation referencing actionIds
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `packages/mcp-server/src/tools/browser/ranking.ts`
  - `packages/mcp-server/src/tools/browser/forms.ts`
  - `packages/mcp-server/src/__tests__/browser-observe-shaping.contract.test.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 90% -- pure functions with deterministic fixtures.
  - Approach: 85% -- makes the hard-to-iterate ranking logic testable without a browser.
  - Impact: 85% -- ranking/paging correctness is central to agent usability.
- **Acceptance:**
  - Ranking prefers visible + enabled affordances, and prioritizes modal/banner affordances when present.
  - Paging truncates to `maxAffordances`, returns `hasMore=true` + `nextCursor`, and ordering is stable within the same page state (best-effort).
  - Forms representation references `actionId` only (no duplicated target data).
- **Test contract:**
  - TC-01: ranking prioritizes modal affordances over main when a modal is open -> pass
  - TC-02: paging truncates affordances to `maxAffordances` and returns `hasMore=true` with `nextCursor` -> pass
  - TC-03: derived forms reference `actionId` only and include required/constraint metadata when present -> pass
  - **Test type:** unit/contract
  - **Test location:** `packages/mcp-server/src/__tests__/browser-observe-shaping.contract.test.ts`
  - **Run:** `pnpm -w run test:governed -- jest -- --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/browser-observe-shaping.contract.test.ts --runInBand`
- **Execution plan:** Red -> Green -> Refactor
- **What would make this >=90%:** add a second fixture for SPA-style nav/footer duplication to validate dedupe rules.
- **Re-plan Update (2026-02-14):** split out from `browser_observe` integration so ranking can be iterated under TDD.

### TASK-05: Act Shaping - Expectations + Safety Confirmation (Pure)

- **Type:** IMPLEMENT
- **Deliverable:** pure helpers for (a) deterministic expect evaluation and (b) safety confirmation protocol enforcement
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `packages/mcp-server/src/tools/browser/expect.ts`
  - `packages/mcp-server/src/tools/browser/safety.ts`
  - `packages/mcp-server/src/__tests__/browser-act-shaping.contract.test.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-07
- **Confidence:** 85%
  - Implementation: 90% -- mirrors existing strict error-envelope patterns in `packages/mcp-server/src/tools/policy.ts`.
  - Approach: 85% -- keeps verification logic tool-supported, not model-interpretation-only.
  - Impact: 85% -- safety gating is a high-severity boundary.
- **Acceptance:**
  - `expect` evaluation produces `matched: boolean` + diagnostic reason for mismatches.
  - Safety confirmation protocol is enforced for `danger` actions and produces `SAFETY_CONFIRMATION_REQUIRED` with a required `confirmationText`.
- **Test contract:**
  - TC-01: expect.urlContains mismatch -> matched=false with diagnostic reason -> pass
  - TC-02: expect.modalOpened / modalClosed checks -> pass
  - TC-03: danger action without confirm -> produces `SAFETY_CONFIRMATION_REQUIRED` + required `confirmationText` -> pass
  - **Test type:** unit/contract
  - **Test location:** `packages/mcp-server/src/__tests__/browser-act-shaping.contract.test.ts`
  - **Run:** `pnpm -w run test:governed -- jest -- --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/browser-act-shaping.contract.test.ts --runInBand`
- **Execution plan:** Red -> Green -> Refactor
- **What would make this >=90%:** add a deterministic mapping doc for expect states -> Playwright wait mapping (domcontentloaded/networkidle).
- **Re-plan Update (2026-02-14):** split out from `browser_act` integration so safety/expect logic is testable without a browser.

### TASK-06: Implement `browser_observe` (Tool Handler Integration)

- **Type:** IMPLEMENT
- **Deliverable:** `browser_observe` returns BIC v0.1 with identity + affordances + paging + derived forms (uses session + CDP + ranking)
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `packages/mcp-server/src/tools/browser/observe.ts`
  - `packages/mcp-server/src/__tests__/browser-observe.contract.test.ts`
- **Depends on:** TASK-02, TASK-03, TASK-04
- **Blocks:** TASK-07, TASK-08
- **Confidence:** 78% (-> 84% conditional on TASK-03 outcomes)
  - Implementation: 80% -- once CDP + selectors are proven, observe composition is straightforward.
  - Approach: 78% -- identity/blocker extraction and affordance sizing controls need iteration.
  - Impact: 78% -- wrong ranking/paging harms agent usability; must be tested.
- **Acceptance:**
  - `browser_observe({ mode, scope, maxAffordances, includeHidden, includeDisabled, cursor })` is implemented.
  - Response includes `nextCursor` + `hasMore` and stable ordering within same page state (best-effort).
  - Consent banners and modals are detected and prioritized.
  - `forms[].fields[]` reference `actionId` only.
- **Test contract:**
  - TC-01: observe() on fixture inputs returns BIC with expected `page.domain/url/lang/title` -> pass
  - TC-02: observe() truncates affordances to `maxAffordances` and returns `hasMore=true` with `nextCursor` -> pass
  - TC-03: when modal open (fixture), modal affordances rank before main -> pass
  - TC-04: observe({ includeHidden:false }) excludes hidden affordances (fixture) -> pass
  - TC-05: observe cursor paging returns stable ordering within the same fixture state -> pass
  - **Test type:** contract (fixtures + mock driver)
  - **Test location:** `packages/mcp-server/src/__tests__/browser-observe.contract.test.ts`
  - **Run:** `pnpm -w run test:governed -- jest -- --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/browser-observe.contract.test.ts --runInBand`
- **Execution plan:** Red -> Green -> Refactor
- **What would make this >=90%:** add one optional local integration snapshot test running headless Chromium if environment supports it (not CI-gating).
- **Re-plan Update (2026-02-14):** this task is now integration-only; ranking/paging/forms moved to TASK-04.

### TASK-07: Implement `browser_act` (Tool Handler Integration)

- **Type:** IMPLEMENT
- **Deliverable:** `browser_act` executes action taxonomy, enforces safety confirmation, tool-verifies expectations, and always returns `nextObservation`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `packages/mcp-server/src/tools/browser/act.ts`
  - `packages/mcp-server/src/__tests__/browser-act.contract.test.ts`
- **Depends on:** TASK-02, TASK-05, TASK-06
- **Blocks:** TASK-08
- **Confidence:** 74% (-> 82% conditional on TASK-06 contract stability)
  - Implementation: 78% -- action taxonomy is known; biggest risk is reliable element targeting via best-effort selectors.
  - Approach: 74% -- needs careful error taxonomy mapping + consistent verification deltas.
  - Impact: 74% -- incorrect gating or mis-targeted actions is high severity.
- **Acceptance:**
  - `ActRequest` supports `target.kind = element | page`.
  - `navigate` is page-targeted (no `actionId`).
  - `danger` affordances require two-step confirmation (`SAFETY_CONFIRMATION_REQUIRED` with required `confirmationText`).
  - `browser_act` always returns `nextObservation`.
  - Expectations are tool-verified for the deterministic set (`urlContains`, `modalOpened`, `bannerContains`, etc.).
- **Test contract:**
  - TC-01: danger action without confirm -> returns `SAFETY_CONFIRMATION_REQUIRED` + `nextObservation` -> pass
  - TC-02: confirm with correct `confirmationText` -> action proceeds -> pass
  - TC-03: stale observationId -> returns `STALE_OBSERVATION` -> pass
  - TC-04: navigate action does not require actionId and updates URL (mock driver) -> pass
  - TC-05: expect.urlContains mismatch -> `verification.matched=false` with diagnostic reason (still returns nextObservation) -> pass
  - **Test type:** unit/contract (mock driver)
  - **Test location:** `packages/mcp-server/src/__tests__/browser-act.contract.test.ts`
  - **Run:** `pnpm -w run test:governed -- jest -- --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/browser-act.contract.test.ts --runInBand`
- **Execution plan:** Red -> Green -> Refactor
- **What would make this >=90%:** add an integration smoke that runs act() against a local static fixture page and asserts DOM changes.
- **Re-plan Update (2026-02-14):** safety/expect shaping moved to TASK-05.

### TASK-08: MCP Tool Wiring + Integration Tests + Smoke Runner

- **Type:** IMPLEMENT
- **Deliverable:** `browser_*` tools exposed via MCP server; minimal end-to-end smoke runner for local verification
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `packages/mcp-server/src/tools/browser.ts`
  - `packages/mcp-server/src/tools/index.ts`
  - `packages/mcp-server/src/__tests__/browser-tools.integration.test.ts`
  - `packages/mcp-server/scripts/browser-smoke.mjs`
- **Depends on:** TASK-06, TASK-07
- **Blocks:** TASK-09
- **Confidence:** 80%
  - Implementation: 82% -- tool registration/dispatch is well-understood (see `packages/mcp-server/src/tools/index.ts`).
  - Approach: 80% -- smoke runner is a pragmatic verification path without making CI depend on Chrome.
  - Impact: 80% -- limited blast radius: one new tool family.
- **Acceptance:**
  - Tool definitions exported as `browser_*` and wired into `toolDefinitions` and `handleToolCall`.
  - Jest integration test confirms:
    - tool definitions include `browser_*`
    - calling handler with bad args returns structured error
  - Local smoke runner demonstrates open -> observe -> act -> verify on a simple HTML fixture.
- **Test contract:**
  - TC-01: toolDefinitions contains `browser_observe` and `browser_act` -> pass
  - TC-02: handler rejects missing `sessionId` / malformed args -> returns `CONTRACT_MISMATCH` or equivalent -> pass
  - TC-03: calling `browser_observe` / `browser_act` with unknown session -> returns `SESSION_NOT_FOUND` (wiring check; no browser required) -> pass
  - **Test type:** integration (no browser required)
  - **Test location:** `packages/mcp-server/src/__tests__/browser-tools.integration.test.ts`
  - **Run:** `pnpm -w run test:governed -- jest -- --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/browser-tools.integration.test.ts --runInBand`
- **Execution plan:** Red -> Green -> Refactor
- **Re-plan Update (2026-02-14):** expanded TC list to meet M-effort minimums.

### TASK-09: Horizon Checkpoint - Validate Against Real Sites, Adjust Plan

- **Type:** CHECKPOINT
- **Depends on:** TASK-08
- **Blocks:** -
- **Confidence:** 95%
- **Acceptance:**
  - Run a local end-to-end workflow on at least:
    - a local fixture page (deterministic)
    - one real SPA site where allowed (e.g., Stripe dashboard page without destructive actions)
  - Validate:
    - observation payload sizing behaves (no 10k affordance dumps)
    - stale observation rejection works in practice
    - safety confirmation is impossible to bypass
  - If issues found: run `/lp-replan` on remaining tasks and update this plan.
- **Horizon assumptions to validate:**
  - Selector generation is sufficiently reliable within an observation epoch.
  - CDP AX extraction captures enough interactive affordances for common UIs.
  - Verification expectations cover the most common "did it work?" checks.

## Risks & Mitigations

- Risk: Playwright API mismatch with prior assumptions ("page.accessibility.snapshot").
  - Mitigation: use Chromium CDP `Accessibility.*` + deterministic fixtures (TASK-03).
- Risk: Selector generation is brittle on dynamic SPAs.
  - Mitigation: observation-epoch scoping; prefer stable attributes; verify uniqueness; fall back to nth-child paths.
- Risk: CI cannot run real browser.
  - Mitigation: contract/fixture tests for core; optional smoke runner for local.
- Risk: Safety confirmation bypass.
  - Mitigation: tool-layer two-step confirmation enforced in `browser_act` (TASK-05 + TASK-07).
- Risk: Repo-root Jest config fails when `.open-next` artifacts exist (haste-map duplicate packages).
  - Mitigation: package-scoped Jest config in TASK-01 for all tests in this plan.

## Observability

- Emit structured logs for:
  - session lifecycle (open/close)
  - act() safety gating decisions
  - verification failures (expected vs observed delta)

## Decision Log

- 2026-02-14: Choose Chromium CDP AX extraction (Option A) over DOM-only enumeration (Option B) because Playwright no longer exposes page-level accessibility snapshots and CDP provides role/name with backend DOM mapping.
- 2026-02-14: Use a package-scoped Jest config for `@acme/mcp-server` browser-tool tests to avoid haste-map duplicate package errors when `.open-next` artifacts exist.
