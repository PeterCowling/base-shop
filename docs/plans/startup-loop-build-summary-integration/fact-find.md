---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: Business-OS
Workstream: Engineering
Created: 2026-02-25
Last-updated: 2026-02-25
Feature-Slug: startup-loop-build-summary-integration
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/startup-loop-build-summary-integration/plan.md
artifact: fact-find
Trigger-Source: direct-operator-decision: build-summary-integration-spec-2026-02-25
---

# Startup Loop Build Summary Integration Fact-Find Brief

## Scope
### Summary
Integrate a deterministic, auto-updating `Build Summary` section into the canonical registry page at `docs/business-os/startup-loop-output-registry.user.html`, backed by generated JSON at `docs/business-os/_data/build-summary.json`, with client-side business/timeframe filters and explicit empty/error states.

### Goals
- Add in-page `#build-summary` section and matching header nav anchor.
- Generate `build-summary.json` via a reproducible script at `scripts/src/startup-loop/generate-build-summary.ts`.
- Enforce deterministic source inclusion/exclusion, row dedupe, timestamp normalization, and stable JSON serialization.
- Render rows safely on the client with business and 1/3/7-day filters.
- Keep output static-site compatible and idempotent.

### Non-goals
- No backend/API service.
- No second parallel Build Summary page.
- No mandatory KPI fabrication when source artifacts do not contain measurable outcomes.

### Constraints & Assumptions
- Constraints:
  - Canonical UI surface stays in `docs/business-os/startup-loop-output-registry.user.html`.
  - Data file path is fixed: `docs/business-os/_data/build-summary.json`.
  - Link mapping is fixed to `"/" + sourcePath`.
  - Renderer must use DOM-safe text assignment (`textContent`) for textual cells.
- Assumptions:
  - Local server path `http://localhost:8080/docs/...` continues to serve repo-root-relative links.
  - Source artifacts are UTF-8 and parseable enough for conservative field extraction.

## Evidence Audit (Current State)
### Entry Points
- `docs/business-os/startup-loop-output-registry.user.html` - canonical page with existing nav and panel shell where Build Summary must be integrated.
- `package.json` - startup-loop script commands are registered at root; new generator command should follow this pattern.
- `docs/business-os/strategy/businesses.json` - declared business-unit catalog available for authoritative business IDs.

### Key Modules / Files
- `docs/business-os/startup-loop-output-registry.user.html` - existing nav markup, panel structure, and inline behavior.
- `docs/business-os/strategy/businesses.json` - business ID source (`PLAT`, `BRIK`, `BOS`, `PIPE`, `XA`, `HEAD`, `PET`, `HBAG`).
- `scripts/src/startup-loop/generate-stage-operator-views.ts` - deterministic generator precedent (`JSON.stringify(..., null, 2) + "\n"`).
- `scripts/src/startup-loop/manifest-update.ts` - deterministic ordering precedent (sorted keys, stable emit behavior).
- `scripts/src/startup-loop/__tests__/generate-stage-operator-views.test.ts` - byte-identical determinism tests precedent.
- `scripts/src/startup-loop/__tests__/manifest-update.test.ts` - idempotent re-derivation and failure-mode test pattern.
- `docs/plans/_templates/fact-find-planning.md` - required fact-find structure template.
- `docs/business-os/startup-loop/loop-output-contracts.md` - formal fact-find artifact contract and frontmatter requirements.

### Patterns & Conventions Observed
- Startup-loop generators favor deterministic serialization and explicit test coverage for repeatability.
- Root `package.json` uses `node --import tsx` for script execution in this domain.
- `startup-loop-output-registry.user.html` currently has no `Build Summary` section and no `_data` fetch path.
- `docs/business-os/_data/` does not currently exist, so this feature introduces a new data directory.

### Data & Contracts
- Fact-find contract requires canonical artifact path and frontmatter routing fields (`docs/business-os/startup-loop/loop-output-contracts.md`).
- Business IDs are structured JSON with stable `id` fields (`docs/business-os/strategy/businesses.json`).
- Proposed row contract is explicit and implementation-ready:
  - `date`, `business`, `domain`, `what`, `why`, `intended`, `links`, `sourcePath`.
- Deterministic dedupe precedence required across extensions:
  - `.user.md` > `.md` > `.user.html`.

### Dependency & Impact Map
- Upstream dependencies:
  - Artifact directories under `docs/business-os/strategy`, `site-upgrades`, `market-research`, and `startup-baselines`.
  - Git metadata for timestamp resolution (`git log -1 --format=%cI`).
- Downstream dependents:
  - `docs/business-os/startup-loop-output-registry.user.html` reader flow via localhost.
  - Future planning/build tasks relying on visible recent-work summaries.
- Likely blast radius:
  - `package.json` (script entry)
  - `scripts/src/startup-loop/generate-build-summary.ts` (new)
  - `docs/business-os/_data/build-summary.json` (new generated artifact)
  - `docs/business-os/startup-loop-output-registry.user.html` (UI integration)
  - `scripts/src/startup-loop/__tests__/...` (new targeted tests)

### Delivery & Channel Landscape
- Audience/recipient:
  - Operator reading startup-loop registry in browser.
- Channel constraints:
  - Static HTML + client-side JS only.
- Existing templates/assets:
  - Existing nav and page styles in `startup-loop-output-registry.user.html`.
- Approvals/owners:
  - Repo-local implementation; no external approval gate identified.
- Compliance constraints:
  - Avoid unsafe HTML injection when rendering extracted text.
- Measurement hooks:
  - Not investigated: no runtime analytics requirement in requested scope.

### Hypothesis & Validation Landscape
#### Key Hypotheses
| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | Deterministic generator + stable sort rules produce byte-identical JSON across reruns. | Stable source files and sort rules | Low | Minutes |
| H2 | Client-side filters (business + 1/3/7d) are sufficient for operator scanning without backend. | Correct date normalization and filter logic | Low | Minutes |
| H3 | Conservative extraction (`"—"` fallback) avoids fabricated claims while keeping rows readable. | Robust fallback chain for missing sections | Medium | Minutes-hours |

#### Existing Signal Coverage
| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | Existing startup-loop generators test deterministic output hashes and exact string equality | `scripts/src/startup-loop/__tests__/generate-stage-operator-views.test.ts` | High |
| H2 | Registry page already runs lightweight client-side tab logic without server dependency | `docs/business-os/startup-loop-output-registry.user.html` | High |
| H3 | Source corpus contains mixed formats and missing explicit outcome sections; fallback behavior needed | `docs/business-os/strategy/*`, `site-upgrades/*`, `market-research/*` | Medium |

#### Falsifiability Assessment
- Easy to test:
  - JSON idempotence via repeated generator runs + hash compare.
  - Filter monotonicity (`c1 <= c3 <= c7`) with controlled fixtures.
- Hard to test:
  - Uniform high-quality semantic extraction across heterogeneous HTML artifacts.
- Validation seams needed:
  - Isolated parser helpers for markdown/frontmatter/heading extraction.

#### Recommended Validation Approach
- Quick probes:
  - Run generator twice and compare SHA256.
  - Open page and verify nav anchor scroll + empty/error states.
- Structured tests:
  - Unit tests for dedupe precedence, timestamp normalization, domain classification, and text truncation.
  - Renderer tests for filter invariants and safe text rendering.
- Deferred validation:
  - Deep NLP-quality extraction beyond heading-based deterministic heuristics.

### Test Landscape
#### Test Infrastructure
- Frameworks:
  - Jest (`@jest/globals`) for startup-loop script tests.
- Commands:
  - Targeted tests via `pnpm --filter <pkg> test -- <file>` policy; broad root `pnpm test` blocked by guard.
- CI integration:
  - Startup-loop contract and script tests run in repository CI lanes.

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Deterministic generator output | Unit/integration | `scripts/src/startup-loop/__tests__/generate-stage-operator-views.test.ts` | Verifies byte-identical output and drift checks |
| Idempotent manifest regeneration | Unit/integration | `scripts/src/startup-loop/__tests__/manifest-update.test.ts` | Verifies repeated runs produce identical manifest artifacts |
| Contract path rules | Unit | `scripts/src/startup-loop/__tests__/contract-lint.test.ts` | Validates canonical artifact path constraints |

#### Coverage Gaps
- Untested paths:
  - New Build Summary source discovery and exclusion rules.
  - New row extraction logic (`what`, `why`, `intended`) across markdown and HTML.
  - New client-side filter logic and error-state rendering.
- Extinct tests:
  - None identified in this scope.

#### Testability Assessment
- Easy to test:
  - Pure helper functions (dedupe, sorting, normalization, mapping).
- Hard to test:
  - HTML section extraction in arbitrary artifact structures.
- Test seams needed:
  - Keep extraction and transform logic separate from file I/O and DOM rendering.

#### Recommended Test Approach
- Unit tests for:
  - stem precedence, include/exclude filters, business inference, timestamp normalization, domain mapping.
- Integration tests for:
  - generator full run on fixture tree -> exact JSON snapshot.
- E2E/DOM tests for:
  - Build Summary section rendering, filter monotonicity, empty/error states, link prefix contract.
- Contract tests for:
  - JSON row schema and required field presence.

### Recent Git History (Targeted)
- `docs/business-os/startup-loop-output-registry.user.html`
  - `54eea24a5d` (2026-02-25) chore: commit pending brik and startup-loop workspace updates
  - `c6651c7447` (2026-02-24) feat(startup-loop): overhaul ideas layer, decision quality, and monitoring
  - `4d962cb4ed` (2026-02-23) refactor(startup-loop): migrate lp skill namespace and refresh artifacts
  - Implication: file is active and frequently touched; changes should be narrow and deterministic.
- `scripts/src/startup-loop/*`
  - `41e37b2e3f` (2026-02-24) stage/container refactors
  - `58bc697c59` (2026-02-23) signals container additions
  - Implication: startup-loop script area already supports deterministic script+test workflow; Build Summary should align.

## Questions
### Resolved
- Q: Should Build Summary live as a second page or inside the canonical registry page?
  - A: Inside the canonical registry page only (`startup-loop-output-registry.user.html`) to prevent drift.
  - Evidence: operator spec states no parallel page.
- Q: Should links use multiple environment-dependent mappings?
  - A: No. Use one canonical rule: `href = "/" + sourcePath`.
  - Evidence: revised spec section 9 and deterministic acceptance requirement.
- Q: How to handle missing measurable outcomes in source docs?
  - A: Use `intended` field with exact fallback `"—"`; do not fabricate KPIs.
  - Evidence: revised schema and acceptance rule.

### Open (Operator Input Required)
None.

## Confidence Inputs
- Implementation: 86%
  - Evidence basis: concrete target files, deterministic source rules, and established script/test precedents.
  - To reach >=80: already met.
  - To reach >=90: implement parser fixtures covering markdown+HTML edge cases and pass deterministic hash test in CI.
- Approach: 89%
  - Evidence basis: clear separation between generator and client renderer; no backend dependency.
  - To reach >=80: already met.
  - To reach >=90: validate on full real corpus and confirm acceptable row quality across all businesses.
- Impact: 82%
  - Evidence basis: addresses operator visibility gap for recent build outputs; directly improves registry utility.
  - To reach >=80: already met.
  - To reach >=90: collect one cycle of operator usage feedback and confirm section is actively used in weekly flow.
- Delivery-Readiness: 92%
  - Evidence basis: explicit acceptance criteria, deterministic contracts, and narrow blast radius.
  - To reach >=80: already met.
  - To reach >=90: already met; remaining risk is implementation quality, not delivery coordination.
- Testability: 84%
  - Evidence basis: logic decomposable into pure functions with existing Jest patterns.
  - To reach >=80: already met.
  - To reach >=90: add DOM-level regression tests for filtering and state messages.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Link path contract mismatches localhost serving behavior | Medium | Medium | Enforce single `"/" + sourcePath` rule and verify with page smoke check at localhost URL. |
| Timestamp heterogeneity (offset vs UTC) causes unstable ordering | Medium | Medium | Normalize both git and mtime timestamps through `toISOString()` before serialization. |
| HTML extraction brittleness yields noisy `why/intended` values | Medium | Medium | Keep extraction conservative; fallback to `"—"`; cap text length to 320 chars. |
| Large source scan + per-file git log impacts generator latency | Medium | Low-Medium | Scope globs tightly, dedupe first, and avoid repeated git calls for duplicate stems. |
| Unsafe DOM rendering from extracted text | Low | High | Render text with `textContent`; never inject extracted text with `innerHTML`. |
| Existing registry nav/layout regressions | Low | Medium | Insert section/nav surgically; validate existing tabs still function. |

## Planning Constraints & Notes
- Must-follow patterns:
  - Deterministic serialization and sorted output.
  - Startup-loop script location and command style (`node --import tsx ...`).
- Rollout/rollback expectations:
  - Feature is additive; rollback is single-file reversion of new script/data/render block.
- Observability expectations:
  - Deterministic checksum check is primary regression signal for generator correctness.

## Suggested Task Seeds (Non-binding)
- Implement `generate-build-summary.ts` with deterministic discovery, dedupe, extraction, and serialization.
- Add targeted tests for deterministic output and schema/field behavior.
- Add `startup-loop:build-summary` script entry to `package.json`.
- Integrate Build Summary section + nav anchor + client renderer into `startup-loop-output-registry.user.html`.
- Run targeted validation: generator idempotence, UI filter behavior, empty/error states.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - none
- Deliverable acceptance package:
  - Updated registry HTML with Build Summary UI
  - New deterministic generator script
  - Generated `docs/business-os/_data/build-summary.json`
  - Targeted tests and validation evidence
- Post-delivery measurement plan:
  - Not investigated: no analytics requirement in current spec.

## Evidence Gap Review
### Gaps Addressed
- Confirmed current canonical page structure and insertion points.
- Confirmed business catalog presence and IDs.
- Confirmed startup-loop deterministic generator/testing patterns.
- Confirmed `_data` directory absence and no existing Build Summary implementation.

### Confidence Adjustments
- Increased Implementation confidence after validating deterministic script precedents and existing test patterns.
- Reduced Impact confidence below 90 due to absence of observed operator usage data post-launch.

### Remaining Assumptions
- Localhost routing preserves `/docs/...` link behavior for generated `href` values.
- Heading-based extraction is sufficient for first iteration without semantic parser escalation.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None
- Recommended next step:
  - `/lp-do-plan startup-loop-build-summary-integration --auto`
