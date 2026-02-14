---
Type: Fact-Find
Outcome: Planning
Status: Archived
Domain: Agents / DevEx
Workstream: Engineering
Created: 2026-02-14
Last-updated: 2026-02-14
Last-reviewed: 2026-02-14
Foundation-Complete: 2026-02-14
Feature-Slug: agent-web-browsing-superpower
Deliverable-Type: multi-deliverable
Execution-Track: mixed
Primary-Execution-Skill: /lp-build
Supporting-Skills: none
Related-Plan: docs/plans/archive/agent-web-browsing-superpower/plan.md
Business-OS-Integration: off
Business-Unit: PLAT
Card-ID:
---

# Agent Web Browsing Superpower - Fact-Find Brief

## Scope

### Summary

Agents are currently unreliable at browsing and operating web UIs (example: Claude Sonnet often cannot follow multi-step instructions; agents also struggle to determine what page they are on and what actions are available). The dominant failure mode is not model capability alone; it is that the agent is not given a stable, explicit representation of:

- Page identity ("what page/state am I on?")
- Enumerated, targetable affordances ("what can I do next, concretely?")

This fact-find proposes a long-term-quality browsing interface for agents: a structured, accessibility-first "page map" returned on every step, plus a strict action protocol (observe -> act -> verify) that prevents guess-click loops.

### Goals

- Make agents reliably answer: "What page am I on?" and "What can I do next?" for arbitrary websites.
- Make agents reliably execute UI workflows by selecting actions from enumerated affordances rather than guessing.
- Make browsing parity achievable across models by improving the tool contract (weaker models benefit most).
- Provide a planning-ready approach implementable inside Base-Shop tooling (MCP server / Playwright scripts) with tests and measurable outcomes.

### Non-goals

- Building a full general-purpose agent orchestration platform.
- Bypassing authentication, CAPTCHAs, or anti-bot protections.
- Replacing existing product E2E testing infrastructure; this is for agent browsing, not user-facing test automation.
- "Prompt-only" fixes that paper over missing page state or affordances.

### Constraints and Assumptions

- Must follow Base-Shop "no shortcuts" principle: introduce a stable interface and tests, not ad-hoc scraping.
- Must be safe: prevent accidental destructive actions (pay, delete, publish) via tool-layer gates, not prompt-only policy.
- Must work on modern SPAs (no H1, stable title, route changes without URL changes), modals, and (where possible) iframes.
- Assumes we can run a real browser (Playwright/Chromium) for any "full-fidelity" browsing mode.

## Evidence (Repo-Verified)

Base-Shop already has the primitives required to implement a robust browsing layer:

- Playwright is a dependency in the repo root (`package.json`).
- Chromium automation exists in production-adjacent tooling:
  - `packages/mcp-server/src/tools/octorate.ts` (Playwright-based browser automation).
  - `apps/product-pipeline/scripts/runner.ts` (optional Playwright/Chromium capture path).
  - `scripts/__tests__/user-testing-audit-booking-transaction.browser.test.ts` (browser-based tests).

This reduces risk: we are not introducing browser automation from scratch; we are standardizing an agent-facing introspection/interaction contract.

## Findings

### Finding 1: The dominant browsing failure is missing "page identity" + missing "affordance list"

When an agent is given raw HTML, partial text, or a screenshot, it often cannot:

- Identify the current app state (redirected vs logged out vs error state).
- Know which controls are actually actionable (buttons vs divs, hidden vs visible).
- Understand required inputs and constraints.
- Reliably refer to a specific target element ("click the blue button") without a stable identifier.

This drives repeated misclicks, dead ends, and "I can't find it" failures.

### Finding 2: Accessibility-first extraction is the most stable cross-site representation

The best general-purpose "what can I do here" representation is the accessibility tree:

- Roles and accessible names are closer to how humans perceive the UI.
- They are less sensitive to CSS/layout and less brittle than raw selectors.
- They work better across component libraries and SPAs.

Limitations: some apps have sparse/poor accessible naming; the tool must surface "unnamed" elements explicitly (rather than hiding them) and provide fallback signals (nearby text, structure, DOM fallback).

### Finding 3: Agents need an enforced interaction protocol, not just better observations

Even with good observations, models can still take "creative" actions. A strict loop prevents this:

- Observe (return page identity + affordances)
- Choose exactly one action by ID from the latest observation
- Act
- Verify expected change (tool-checked, not interpretation-only)

If verification fails, the tool forces a re-observe before allowing further actions.

### Finding 4: Superpowered browsing comes from diffs, memory, and evaluation harnesses

Once the agent can reliably observe and act, the next performance jump comes from:

- Diffs between observations (what changed since last action).
- Site-specific "page objects" / adapters for frequently used sites (Stripe, Cloudflare, Google Sheets).
- An evaluation harness with deterministic fixtures and metrics so regressions are caught quickly.

## Key Contracts (Lock These Before /lp-plan)

These are the decisions that, if left vague, will cause interface churn mid-implementation.

- **BIC schema versioning**: `schemaVersion` string, backward compatibility rules, and deprecation policy.
- **Observation epoch semantics**: `observationId` is required; `actionId` is only valid for the referenced `observationId`. Tool rejects stale `observationId`.
- **Affordance ranking and truncation**: explicit `maxAffordances` and deterministic ranking rules; support paging.
- **Observation sizing controls**: explicit observe options (`mode`, `scope`, includeHidden/disabled, cursor paging).
- **Action taxonomy**: supported action types and payload shapes (even if v0.1 implements a subset).
- **Verification API**: tool-supported expectations and structured verification results.
- **Safety gating protocol**: risk classification, confirmation mechanics, and logging/redaction rules.

## Proposed Solution (Planning-Ready)

### A. Define a Browser Introspection Contract (BIC)

Every `observe()` returns a structured object with:

- **Envelope**
  - `schemaVersion`: e.g. `"0.1"`
  - `observationId`: monotonic int or UUID
  - `createdAt`: ISO timestamp
- **Page identity (redundant, SPA-friendly)**
  - `url`, `finalUrl`, `domain`
  - `lang` (best-effort from `document.documentElement.lang`)
  - `title`, `primaryHeading` (best-effort)
  - `routeKey` (best-effort): derived from URL + main landmark heading + selected nav (aria-current) + top-level view container accessible name
  - `loadState`: `"loading" | "interactive" | "network-idle"`
  - `blockingOverlay`: `{ present: boolean, label?: string }`
  - `blockers[]`: machine-checkable blockers like cookie consent, geo wall, login requirement (shape: `{ type: string, present: boolean, text?: string }`)
    - example types: `cookieConsent | geoWall | ageGate | loginRequired`
  - `banners[]`: cookie/consent banners and global error/warn banners with severity and text
  - `modals[]`: modal stack with title/name + excerpt
  - `frames[]`: `frameId`, `frameUrl`, `frameName` (treat iframes as first-class)
- **Affordances**: interactive elements, ranked and truncated
  - `actionId`: stable within *this* observation only
  - `role`, `name` (accessible name or visible label)
  - `visible`, `disabled`
  - `risk`: `"safe" | "caution" | "danger"`
  - `landmark`: `main | nav | footer | modal | banner | unknown` (coarse context)
  - `href` (links)
  - `required` + basic constraints (email/pattern/min length) where detectable
  - `value?: string` (only when safe)
  - `valueRedacted?: boolean` (true when value is intentionally omitted)
  - `sensitive?: boolean` (best-effort classification)
  - `frameId`
  - `nearText`: small nearby context
  - `fingerprint` (best-effort): intended to help matching across steps but not guaranteed (e.g., role+name+domPath hash)
- **Forms**: presentation layer derived from affordances
  - `forms[].fields[]` reference fields by `actionId` only (avoid duplicating the element spec in two places)

Hard guarantees:

- `actionId` validity is **single observation epoch**.
- All `act()` calls must include `observationId`.
- Tool rejects any action with a stale `observationId` (error `STALE_OBSERVATION`).

### B. Observation sizing controls, paging, and ranking

Modern pages can have thousands of interactive nodes; observation must be controllable and pageable.

Observe options:

- `observe({ mode, scope, maxAffordances, includeDisabled, includeHidden, cursor })`
  - `mode`: `"a11y" | "dom" | "vision"` (default `"a11y"`)
  - `scope`: `"viewport" | "document" | "modalOnly"` (default `"document"`)
  - default: `maxAffordances=200`, `includeHidden=false`, `includeDisabled=false`
  - `cursor`: fetch the next page of affordances from the same ranking stream (best-effort stable ordering)

Observe response should include:

- `nextCursor?: string`
- `hasMore: boolean`

Cursor stability rules:

- Cursor ordering is best-effort stable for the same page state.
- Any navigation or major UI state transition (route change, modal open/close, consent accepted) may invalidate cursors.

Deterministic ranking rules (high to low):

- If a modal is open:
  - For `scope="modalOnly"`, return modal affordances only.
  - For other scopes, modal affordances rank first.
- Prefer visible + enabled elements.
- Prefer elements in the `main` landmark.
- De-prioritize repeated nav/footer duplicates.
- Treat cookie/consent banners as first-class blocking UI and elevate their affordances.

### C. Extraction strategy (ordered)

1. **A11y snapshot (preferred)**: build affordances from roles/names.
2. **DOM fallback**: enumerate interactive elements, derive best-effort roles/names, and attach fingerprints.
3. **Vision fallback (last resort)**: only when role/name cannot be recovered (canvas widgets, custom components).

### D. Action taxonomy (v0.1)

Define supported action types and payloads now to avoid interface churn.

Minimum set to support real workflows:

- `navigate`: `{ url: string }` (page-targeted)
- `click`: `{}`
- `fill`: `{ value: string }` (replace value)
- `selectOption`: `{ value?: string, label?: string }`
- `check`: `{}`
- `uncheck`: `{}`
- `pressKey`: `{ key: "Enter" | "Escape" | string }`
- `scrollIntoView`: `{}`
- `waitFor`: `{ state: "interactive" | "network-idle" | "selector" | "timeout", selector?: string, timeoutMs?: number }`

Interaction semantics:

- Tool should auto-scroll into view before interaction (Playwright generally does this; still define it).
- Tool should refuse interacting with `visible=false` unless action type is `scrollIntoView`.

`waitFor` mapping rules:

- `network-idle`: map to Playwright `networkidle`.
- `interactive`: define as `domcontentloaded` AND main landmark exists AND `blockingOverlay.present=false`.
  - This is an internal computed state; it is not a Playwright native load state.

### E. Tool-supported verification (not interpretation-only)

Verification must be first-class in the tool protocol.

Formalize element-targeted vs page-targeted actions to avoid pseudo-actionIds.

Proposed request shape:

```ts
type ActTarget =
  | { kind: "element"; actionId: string }
  | { kind: "page" };

type ActRequest = {
  observationId: string;
  target: ActTarget;
  actionType:
    | "navigate"
    | "click"
    | "fill"
    | "selectOption"
    | "check"
    | "uncheck"
    | "pressKey"
    | "scrollIntoView"
    | "waitFor";
  payload?: unknown;
  expect?: {
    urlChanged?: boolean;
    urlContains?: string;
    titleContains?: string;
    headingContains?: string;
    modalOpened?: boolean;
    modalClosed?: boolean;
    modalTitleContains?: string;
    bannerContains?: string;
    elementAppeared?: { role?: string; name?: string; fingerprint?: string };
    elementDisappeared?: { role?: string; name?: string; fingerprint?: string };
    inputValueEquals?: { actionId: string; value: string };
  };
  confirm?: true;
  confirmationText?: string;
};
```

Tool returns (v0.1 hard rule):

- `ok: boolean`
- `verification: { matched: boolean, reason: string, observedDelta: {...} }`
- `delta: {...}` (diff summary)
- `nextObservation: BIC` (always present)

Rationale: always returning `nextObservation` reduces tool-call count and makes observe -> act -> verify discipline easier to enforce.

### F. Safety gating (concrete protocol)

Policy must be enforced at the tool boundary.

- Each affordance includes `risk: "safe" | "caution" | "danger"`.
- `danger` actions require explicit confirmation fields in the `act()` call:
  - `confirm: true`
  - `confirmationText`: must echo exact target + domain, e.g. `CONFIRM delete "Payment method" on example.com`
- Hard rule: **never auto-pay** (or any irreversible money movement) without user-provided confirmation.
  - If the environment cannot guarantee user confirmation (agent-only), enforce a two-step confirmation: tool returns `SAFETY_CONFIRMATION_REQUIRED` with the required `confirmationText` to be re-submitted.
- Logging/redaction rules:
  - Never log typed values for password-like fields.
  - When `sensitive=true`, omit `value` and set `valueRedacted=true`.
  - Redact or omit values for inputs with `type=password`, common payment fields, or fields flagged as sensitive.

Risk classification (conservative, explainable):

- Mark as `danger` if role/name/nearText matches patterns like: `pay`, `place order`, `confirm`, `delete`, `remove`, `publish`, `merge`, `submit payment`, `refund`, or if element is within a form whose heading contains `payment` / `billing`.
- Prefer false positives (gated safe actions) over false negatives (unguarded destructive actions).

### G. Vision fallback boundary and cost control

Vision mode should be explicit and constrained.

- `observe({ mode: "vision" })` returns `regions[]`:
  - `regionId`, `bbox`, `label`, `confidence`, `allowedActions` (usually `click` only)
- Vision-mode actions should default to `risk="caution"` and be gateable; if risk cannot be classified, require explicit confirmation.

## BIC Example (v0.1, Illustrative)

```json
{
  "schemaVersion": "0.1",
  "observationId": "obs_000123",
  "createdAt": "2026-02-14T19:22:00.000Z",
  "page": {
    "domain": "example.com",
    "url": "https://example.com/checkout",
    "finalUrl": "https://example.com/checkout",
    "lang": "en",
    "title": "Checkout",
    "primaryHeading": "Checkout",
    "routeKey": "checkout|Shipping|nav:Checkout",
    "loadState": "interactive",
    "blockingOverlay": { "present": false },
    "blockers": [{ "type": "cookieConsent", "present": true }],
    "banners": [{ "severity": "warning", "text": "Cookies required" }],
    "modals": [],
    "frames": [{ "frameId": "main", "frameUrl": "https://example.com/checkout" }]
  },
  "nextCursor": "cur_0001",
  "hasMore": false,
  "affordances": [
    {
      "actionId": "a_17",
      "role": "button",
      "name": "Place order",
      "visible": true,
      "disabled": false,
      "risk": "danger",
      "landmark": "main",
      "nearText": "Total EUR 42.00",
      "frameId": "main",
      "fingerprint": { "kind": "roleNameNearText", "value": "button|Place order|Total" }
    },
    {
      "actionId": "a_08",
      "role": "textbox",
      "name": "Email",
      "visible": true,
      "disabled": false,
      "risk": "safe",
      "landmark": "main",
      "required": true,
      "constraints": { "type": "email" },
      "valueRedacted": true,
      "sensitive": false,
      "frameId": "main"
    }
  ],
  "forms": [
    {
      "section": "Shipping",
      "fields": [{ "actionId": "a_08" }]
    }
  ]
}
```

## Error Taxonomy (Machine-Checkable)

Define tool errors as codes so agents behave deterministically:

- `STALE_OBSERVATION`
- `ACTION_NOT_FOUND`
- `ELEMENT_NOT_VISIBLE`
- `ELEMENT_DISABLED`
- `NAVIGATION_BLOCKED` (new tab, download, popup)
- `CAPTCHA_BLOCKED`
- `SAFETY_CONFIRMATION_REQUIRED`
- `TIMEOUT`

## Implementation Options (Within Base-Shop)

### Option 1: Implement as MCP server tools (recommended)

Add MCP tools in `packages/mcp-server` that wrap Playwright:

- `browser.navigate(url)`
- `browser.observe(options)` -> returns BIC
- `browser.act(request)` -> returns verification + next observation

Pros: best parity (any agent that can use MCP can get the same browsing interface). Cons: requires MCP tool plumbing in each agent runtime.

### Option 2: Implement as repo scripts (secondary)

Create `scripts/agent-web/` Playwright scripts that output BIC JSON and accept action commands.

Pros: simpler to run locally. Cons: weaker agent integration; harder to make interactive.

## Evaluation Harness (Prevent Regressions)

Define success metrics up front:

- Task success rate (% goals achieved on a curated set)
- Step count distribution
- Misclick-loop rate (repeating equivalent action targets across steps)
- Verification failure rate
- Observation payload size (bytes) and observe/act latency

Test layers:

- Contract tests on local fixtures:
  - deterministic local HTML fixtures and/or Storybook pages
  - golden snapshot tests for BIC output stability and truncation/ranking
- End-to-end flow tests on a small curated set:
  - assert the tool enforces observe -> act -> verify discipline
  - assert safety confirmation is required for `risk="danger"`

## Risks and Mitigations

- Risk: oversized observations (performance/payload bloat) on complex pages.
  - Mitigation: size controls, deterministic ranking, and cursor paging.
- Risk: i18n changes break name-based targeting (button names vary by locale).
  - Mitigation: include fingerprints and nearText; prefer role+structure; include `page.lang`; allow locale awareness in adapters.
- Risk: virtualization (lists not in DOM until scrolled) hides affordances.
  - Mitigation: `scrollIntoView` action, optional "enumerate by scrolling" helper, and clear tool hints.
- Risk: shadow DOM components with poor accessibility naming reduce a11y signal.
  - Mitigation: DOM fallback; surface unnamed elements; prefer nearText and structure.
- Risk: canvas-based UIs have no usable DOM/a11y nodes.
  - Mitigation: explicit vision mode with region IDs and stricter safety gates.
- Risk: cookie-consent / geo walls block flows.
  - Mitigation: treat as first-class banners/modals/blockers; elevate their affordances; expose `page.blockers[]`.
- Risk: anti-bot / CAPTCHA blocks automation.
  - Mitigation: treat as a hard stop; require manual intervention; document supported sites/flows.

## Test Landscape (Mixed Track)

### Test Infrastructure

- **Frameworks:** Jest (unit/integration), Playwright (E2E browser automation)
- **Commands:**
  - `pnpm test` - runs Jest unit/integration tests
  - Playwright tests run as `*.browser.test.ts` files (evidence: `scripts/__tests__/user-testing-audit-booking-transaction.browser.test.ts`)
- **CI integration:** Tests run on PR via GitHub Actions; Playwright tests exist but browser test patterns for new MCP tools need establishment
- **Coverage tools:** Not currently configured for MCP server package

### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|------|-----------|-------|----------------|
| `packages/mcp-server/src/tools/octorate.ts` | none | none found | Playwright browser automation exists but no tests |
| `apps/product-pipeline/scripts/runner.ts` | none | none found | Chromium capture path exists but not tested |
| `scripts/__tests__/user-testing-audit-booking-transaction.browser.test.ts` | E2E | browser test | Evidence of Playwright test pattern in repo |

### Test Patterns & Conventions

- **Unit tests:** Standard Jest patterns with mocks for external dependencies
- **E2E tests:** Playwright with `.browser.test.ts` naming convention (evidence: existing browser test in `scripts/__tests__/`)
- **Browser automation tests:** No established pattern for MCP tool testing yet
- **Test data:** Local HTML fixtures for deterministic BIC contract tests; external sites for integration validation

### Coverage Gaps (Planning Inputs)

- **Untested paths:**
  - `packages/mcp-server/src/tools/octorate.ts` - existing Playwright automation has no test coverage
  - MCP server tools generally have no browser automation test infrastructure
- **Extinct tests:** None identified (new feature area)
- **Missing test infrastructure:**
  - No established pattern for testing MCP tools with browser automation
  - No fixtures or golden snapshot tests for structured outputs
  - No evaluation harness for agent browsing task success rates

### Testability Assessment

- **Easy to test:** BIC schema validation, action taxonomy typing, observation parsing/ranking, safety risk classification (pure functions)
- **Hard to test:** End-to-end agent task success on real websites (flaky, slow, requires external sites)
- **Test seams needed:**
  - Local HTML fixture server for deterministic contract tests
  - Golden snapshot mechanism for BIC output stability
  - Agent task evaluation harness with success/failure metrics

### Recommended Test Approach

- **Unit tests for:** BIC schema types, observation builders, affordance ranking logic, risk classification rules, verification matchers
- **Integration tests for:** Playwright observe/act cycle with local fixtures, observation epoch validation (stale rejection), safety confirmation enforcement
- **Contract tests for:** BIC output golden snapshots against deterministic fixtures, cursor paging stability, modal/banner/blocker detection
- **E2E validation tests for:** Small curated set of local fixtures with known successful task sequences (no external sites in CI)
- **Manual evaluation:** Agent task success rate on external sites (Stripe, Cloudflare) with metrics collection (step count, misclick rate)

## Delivery & Channel Landscape (Mixed Track)

### Audience/Recipient

- **Primary:** Agent runtimes that support MCP tools (Claude Code, Claude Desktop, other MCP clients)
- **Secondary:** Direct script users (developers testing/debugging agent browsing locally)

### Channel Constraints

- **MCP tool protocol:** Must conform to MCP tool schema (input/output JSON, error codes)
- **Tool response size limits:** MCP responses should be <100KB per observation (enforce via `maxAffordances` and cursor paging)
- **Session management:** Browser context must persist across observe/act calls within a session
- **Concurrency:** Single browser context per agent session (no multi-tab support in v0.1)

### Existing Templates/Assets

- **Playwright automation:** `packages/mcp-server/src/tools/octorate.ts` provides starting pattern
- **MCP tool structure:** Existing tools in `packages/mcp-server/src/tools/` provide registration/invocation pattern

### Approvals/Owners

- **Code owner:** Pete (Platform Engineering)
- **Review gate:** Standard PR review (typecheck, lint, tests must pass)
- **Deployment:** MCP server is not deployed externally; runs locally in agent runtime

### Compliance Constraints

- **Safety:** Must enforce confirmation protocol for `risk="danger"` actions (no auto-pay, no unguarded destructive actions)
- **Privacy:** Must redact sensitive input values (passwords, payment fields) from observations and logs
- **Anti-automation:** Must document which sites block automation (CAPTCHA, anti-bot); no bypass mechanisms

### Measurement Hooks

- **Agent task success rate:** Manual evaluation on curated task set (pre/post metrics)
- **Observation quality:** Affordance count, risk classification distribution, verification match rate
- **Performance:** Observe latency, act latency, observation payload size
- **Error rates:** Stale observation rejections, element-not-found errors, safety confirmation requirements

## Hypothesis & Validation Landscape (Mixed Track)

### Key Hypotheses

| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|-----------|-----------|-------------------|-------------------|
| H1 | Structured page identity + enumerated affordances reduce agent misclick loops by >=50% vs raw HTML | BIC v0.1 implemented, baseline task set defined | 2-4 dev days (build + eval) | 2 days |
| H2 | Tool-enforced observe->act->verify discipline prevents guess-click loops (stale observation rejection works) | H1 pass, action protocol implemented | 1 day (add tests) | <1 day |
| H3 | Accessibility-first extraction provides usable affordances on >=80% of modern SPAs | H1 pass, external site eval set | 1 day (manual eval) | 1 day |
| H4 | Safety risk classification correctly gates destructive actions (no false negatives on payment/delete buttons) | H2 pass, risk classifier implemented | 1 day (test on fixtures + manual review) | 1 day |

### Existing Signal Coverage

| Hypothesis | Evidence available | Source | Confidence in signal |
|-----------|-------------------|--------|---------------------|
| H1 | Anecdotal: agents currently struggle with "what page am I on" and "what can I do" questions | Fact-find observation, no quantitative baseline | Low (no baseline metrics) |
| H2 | None - observe/act protocol not yet enforced | N/A | None |
| H3 | Partial: a11y tree extraction is a known technique, but no Base-Shop testing on real sites | Industry practice (Playwright, WebDriver) | Medium (technique known, app-specific fit untested) |
| H4 | None - risk classification not yet implemented | N/A | None |

### Falsifiability Assessment

- **Easy to test (clear signal, low cost):**
  - H2 - stale observation rejection can be unit tested with synthetic observations
  - H4 - risk classification can be tested against a fixture set with known-dangerous buttons
- **Hard to test (noisy signal, high cost, long feedback loop):**
  - H1 - requires building BIC + evaluation harness + baseline measurement + comparison (multi-day investment)
  - H3 - requires external site testing (flaky, site changes break tests, CAPTCHA/anti-bot blocks)
- **Validation seams needed:**
  - Task success rate measurement harness (task definition, success criteria, step logging, metrics aggregation)
  - Baseline agent runs with current tooling (raw HTML or screenshot-only) for comparison

### Recommended Validation Approach

- **Quick probes for:** H2 (unit tests for epoch validation), H4 (fixture-based risk classification tests)
- **Structured tests for:** H1 (requires full BIC + eval harness; defer quantitative validation until v0.1 is built)
- **Deferred validation for:** H3 (requires external site access; start with local fixtures and Storybook, defer external site eval until post-v0.1)
- **Note:** This informs VC-XX design in `/lp-plan` - H2 and H4 get early VC checks (unit tests), H1 gets deferred VC (post-build eval harness)

## Confidence Inputs (for /lp-plan)

### Implementation Confidence: 75%

**Why:**
- Playwright dependency exists and is used in production-adjacent code (`mcp-server`, `product-pipeline`, existing browser tests)
- MCP tool registration pattern exists (`packages/mcp-server/src/tools/`)
- Core primitives are well-understood (a11y snapshots, DOM traversal, action execution)

**What's missing to reach >=80%:**
- No established test pattern for MCP tools with browser automation (coverage gap)
- Observation payload sizing and cursor paging need prototyping (unknown: stable ranking across steps)
- Verification protocol needs concrete implementation design (how to check "modalOpened" or "elementAppeared" reliably)

**What would raise to >=90%:**
- Spike: build minimal observe() that returns a11y snapshot + test on 3 local fixtures (2 days)
- Spike: prove cursor paging works with stable ordering on a fixture with 500+ affordances (1 day)
- Design doc: verification matcher implementation (0.5 days)

### Approach Confidence: 85%

**Why:**
- BIC contract design is comprehensive and addresses known agent browsing failure modes (page identity, affordance enumeration, action epochs)
- Safety gating protocol is explicit and enforceable at tool layer (not prompt-only)
- Industry precedent: accessibility-first extraction is a known reliable pattern (Playwright, WebDriver)

**What's missing to reach >=90%:**
- Unknown: will a11y extraction provide sufficient signal on sites with poor accessible naming? (need external site testing)
- Unknown: will deterministic affordance ranking prevent "important button buried on page 3" failures? (need real-world validation)

**What would raise to >=90%:**
- External site eval: test BIC extraction on 5 real sites (Stripe, Cloudflare, Google Sheets, GitHub, example SPA) and measure affordance coverage (2 days)
- User testing: have another engineer attempt 3 agent browsing tasks with BIC v0.1 and collect qualitative feedback (1 day)

### Impact Confidence: 70%

**Why:**
- Blast radius is contained: new MCP tools, no changes to existing product code
- Risk is low: agents can't break production systems via browsing (read-only observation, gated actions)

**What's missing to reach >=80%:**
- Unknown: will agents use the tools correctly, or will prompt engineering be required? (need agent testing)
- Unknown: will observation payload size cause MCP response limits or latency issues? (need sizing validation)

**What would raise to >=90%:**
- Load test: generate BIC observations for 10 real pages and measure payload size distribution (0.5 days)
- Agent integration test: wire up BIC tools in Claude Code and attempt 2 tasks end-to-end, measure usability and error modes (1 day)
- Rollback plan: BIC tools are opt-in (no forced migration), so rollback is trivial (remove tools from MCP server manifest)

### Delivery-Readiness Confidence: 80%

**Why:**
- Clear execution owner (Pete, Platform Engineering)
- Clear channel (MCP server, local agent runtime - no external deployment required)
- Clear quality gate (typecheck, lint, unit tests, contract tests)

**What's missing to reach >=90%:**
- Measurement plan is qualitative only (no automated metrics collection for agent task success rate)
- External site evaluation set is not yet defined (which sites, which tasks, which success criteria)

**What would raise to >=90%:**
- Define: curated task set (5-10 tasks) with success criteria and baseline measurement protocol (1 day)
- Build: metrics collection layer (log observations/actions/verification results to structured format for analysis) (1 day)

### Testability Confidence: 70%

**Why:**
- Unit test seams are clear (BIC builders, risk classifiers, verification matchers - all pure functions)
- Integration test strategy is defined (local fixtures + Playwright)
- Existing Playwright test pattern exists in repo (`*.browser.test.ts`)

**What's missing to reach >=80%:**
- No established MCP tool test infrastructure (need to prove MCP tools can be tested in CI)
- No fixture server or golden snapshot mechanism yet (need to build test infrastructure first)

**What would raise to >=90%:**
- Build: local HTML fixture server + 3 deterministic fixtures (login form, checkout, modal flow) (1 day)
- Build: golden snapshot test for BIC output (prove observation stability) (0.5 days)
- Prove: run a Playwright MCP tool test in CI successfully (unblock CI integration) (0.5 days)

## Open Questions (To Resolve In /lp-plan)

- Which agents must be supported first (Claude Code, Codex, other CLIs), and what are their available tool channels?
- Where should observation logs live (local artifacts vs repo files vs ephemeral storage)?
- What is the minimal external-site evaluation set (Stripe, Cloudflare, Google) vs local fixtures only?
- Do we want headful runs for debugging by default, or headless with an opt-in capture mode?

## Planning Readiness

Status: Ready-for-planning.

**Foundation completion (2026-02-14):**
- [x] Test Landscape: Existing Playwright patterns documented, coverage gaps identified, testability assessment complete
- [x] Delivery & Channel Landscape: MCP tool delivery mechanics, approval path, measurement hooks defined
- [x] Hypothesis & Validation Landscape: 4 key hypotheses with falsifiability assessment and validation approach
- [x] Confidence Inputs: All 5 dimensions scored (Implementation 75%, Approach 85%, Impact 70%, Delivery-Readiness 80%, Testability 70%) with clear >=90% paths

**Blocking items:** None. Open questions are non-blocking (agent priority, log location, external eval set, headful mode) - can be resolved during planning or deferred to implementation.

**Suggested next step:** `/lp-plan` to produce an implementation plan that (1) formalizes BIC `schemaVersion=0.1` as a TypeScript type, (2) implements MCP-backed Playwright `observe/act` with tool-supported verification and safety gating, (3) adds the evaluation harness and metrics so we can measure improvement across models, and (4) includes confidence-gated task sequencing with early validation checks for H2 (epoch validation) and H4 (risk classification).
