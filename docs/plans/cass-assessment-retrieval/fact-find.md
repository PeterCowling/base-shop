---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Startup-Loop
Workstream: Engineering
Created: 2026-03-02
Last-updated: 2026-03-02
Feature-Slug: cass-assessment-retrieval
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: startup-loop-gap-fill
Loop-Gap-Trigger: bottleneck
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/cass-assessment-retrieval/plan.md
---

# CASS Assessment Retrieval Fact-Find Brief

## Scope

### Summary

CASS retrieval — the context-injection step at the start of every fact-find and plan — searches `docs/plans`, `docs/business-os/startup-loop`, and `.claude/skills`. It does not search `docs/business-os/strategy/`, which holds 104 strategic reference docs across 9 businesses (brand identity dossiers, solution decisions, business plans, naming shortlists, etc.). As a result, agents starting a new fact-find or plan for any business have no automatic access to prior strategic decisions already made in that business's assessment layer. The fix is a single-element addition to `DEFAULT_SOURCE_ROOTS` in `cass-retrieve.ts`.

### Goals
- Add `docs/business-os/strategy` to `DEFAULT_SOURCE_ROOTS` so all CASS invocations automatically include assessment context
- Add unit tests for the updated defaults
- Update the runbook to document the new coverage

### Non-goals
- Semantic/vector CASS backend (current system uses keyword-based fallback-rg)
- Per-business scoping via a `--business` flag (deferred; topK=8 bound already limits noise; revisit if cross-business contamination is observed in telemetry)
- Section-level granularity (rg returns 280-char snippets; full-file indexing is not the model; current approach is sufficient)

### Constraints & Assumptions
- Constraints:
  - `topK=8` (default) bounds total hits from the fallback-rg provider regardless of corpus size — adding a large directory does not expand output beyond 8 snippets
  - `--max-count` in the rg command limits per-file matches; `lines.slice(0, topK)` limits total output (`cass-retrieve.ts:405`)
  - Cannot add failing tests; must follow `docs/testing-policy.md` (governed jest runner, no local test runs)
  - No existing unit tests for `cass-retrieve.ts` — new tests must be the first
- Assumptions:
  - The fallback-rg provider is the live path for all current invocations (no `CASS_RETRIEVE_COMMAND` configured in the operator's environment)
  - Cross-business contamination risk from adding `docs/business-os/strategy` is self-limiting: query terms in a BRIK fact-find ("booking", "rooms", "octorate") won't match HBAG brand identity terms ("handbag", "leather") unless the fact-find is explicitly about strategy topics
  - Strategy docs at `docs/business-os/strategy/` are stable enough to include — they change when strategic decisions change, which is exactly when fresh context is most valuable

## Outcome Contract

- **Why:** When a fact-find or plan runs for any business, it needs to know what strategic decisions have already been made (brand identity, solution selection, naming). CASS retrieval currently only surfaces prior loop artifacts, not the assessment layer. Every new planning cycle must manually rediscover the same strategic context instead of having it pre-loaded.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** CASS retrieval extended to index assessment containers, so fact-finds and plans for a business automatically receive relevant assessment-layer context (brand decisions, solution evaluations, naming specs) without manual retrieval steps.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points
- `scripts/src/startup-loop/cass-retrieve.ts:6-10` — `DEFAULT_SOURCE_ROOTS` array; the single point of change
- `package.json:146` — `startup-loop:cass-retrieve` npm script (root package.json)
- `.claude/skills/lp-do-fact-find/SKILL.md:75` — invocation: `pnpm startup-loop:cass-retrieve -- --mode fact-find --slug <slug> --topic "<topic>"`
- `.claude/skills/lp-do-plan/SKILL.md:74` — invocation: `pnpm startup-loop:cass-retrieve -- --mode plan --slug <slug> --topic "<topic>"`

### Key Modules / Files
- `scripts/src/startup-loop/cass-retrieve.ts` — full implementation, 548 lines
  - `DEFAULT_SOURCE_ROOTS` (line 6): `["docs/plans", "docs/business-os/startup-loop", ".claude/skills"]`
  - `parseArgs` (line 61): `--source-roots <csv>` flag overrides defaults
  - `runFallbackRg` (line 369): uses `options.sourceRoots`; rg pattern = `terms.join("|")`; bounded by `slice(0, topK)`
  - `collectTerms` (line 206): strips stop words including `"plan"`, `"find"`, `"fact"`, `"loop"`, `"startup"` — returns terms ≥3 chars
  - `topK` default: 8
- `docs/runbooks/startup-loop-cass-pilot.md` — operator runbook; documents source roots and fail-open behavior

### Patterns & Conventions Observed
- `DEFAULT_SOURCE_ROOTS` is the canonical list of directories searched in every CASS invocation — evidence: `cass-retrieve.ts:6-10`
- `--source-roots <csv>` already exists for ad-hoc overrides — evidence: `cass-retrieve.ts:128-130`
- Both skills use identical invocation pattern with no `--source-roots` argument — neither passes a custom root list; everything flows from the defaults
- The `topK=8` slice bounds output regardless of corpus size — evidence: `cass-retrieve.ts:405`

### Data & Contracts
- Types/schemas/events:
  - `CassRetrieveOptions.sourceRoots: string[]` — passed from `DEFAULT_SOURCE_ROOTS` unless overridden
  - `RetrievedHit: { path, line, snippet }` — 280-char truncated snippet
- Persistence:
  - Output: `docs/plans/<slug>/artifacts/cass-context.md` (written by `renderAndPersist`)

### Dependency & Impact Map
- Upstream dependencies:
  - `docs/business-os/strategy/` must exist on disk — confirmed (104 `.user.md` files)
  - `rg` (ripgrep) must be available — already used by existing fallback path
- Downstream dependents:
  - Every future `pnpm startup-loop:cass-retrieve` invocation from `lp-do-fact-find` and `lp-do-plan`
  - The `cass-context.md` advisory output consumed by agents
- Likely blast radius:
  - **Minimal**: change only affects which directories rg searches; output is bounded to topK=8; existing output format unchanged; `--source-roots` overrides still work

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest (governed runner, `scripts/jest.config.cjs`)
- Commands: `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs`
- CI integration: runs in CI only (testing policy)

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `cass-retrieve.ts` | Unit | None | No tests exist for this module |

#### Coverage Gaps
- Untested paths: entire `cass-retrieve.ts` module — `DEFAULT_SOURCE_ROOTS`, `parseArgs`, `collectTerms`, `runFallbackRg`, `makeDefaultQuery`
- Extinct tests: none (no prior tests to have gone stale)

#### Testability Assessment
- Easy to test:
  - `DEFAULT_SOURCE_ROOTS` value — simple array includes check
  - `parseArgs` with `--source-roots` flag — pure function
  - `collectTerms` — pure function, deterministic
  - `makeDefaultQuery` — pure function
- Hard to test:
  - `runFallbackRg` — spawns rg subprocess; can be tested with real file system (integration style) or mocked
- Test seams needed:
  - Export `DEFAULT_SOURCE_ROOTS` if not already exported (currently not exported — need to check)

#### Recommended Test Approach
- Unit tests for: `DEFAULT_SOURCE_ROOTS` value, `parseArgs`, `collectTerms`, `makeDefaultQuery`
- Integration tests for: None needed (fallback-rg is covered by the real file system)

### Recent Git History (Targeted)
- `scripts/src/startup-loop/cass-retrieve.ts` — only 1 commit: `3e549ddbf3` "chore: checkpoint pending workspace updates" (initial commit; no subsequent changes)

## Questions

### Resolved
- Q: Is `DEFAULT_SOURCE_ROOTS` exported from `cass-retrieve.ts`?
  - A: No — it is a module-level `const`, not exported. Plan must either export it or test the runtime behaviour by inspecting option values passed to `runFallbackRg`. The cleanest approach is to export it as part of this change.
  - Evidence: `cass-retrieve.ts:6` — `const DEFAULT_SOURCE_ROOTS = [...]` (no `export`)

- Q: Will adding `docs/business-os/strategy` to defaults cause excessive noise for non-strategy fact-finds?
  - A: No. The fallback-rg output is bounded to `topK=8` total by `lines.slice(0, options.topK)` at line 405. For a BRIK booking fact-find, query terms like `"booking"`, `"rooms"`, `"octorate"` won't match HBAG brand identity terms like `"handbag"`, `"leather"`. Cross-business noise is self-limiting via keyword matching.
  - Evidence: `cass-retrieve.ts:405` (slice), `cass-retrieve.ts:303` (rg pattern = terms joined by `|`)

- Q: Are any existing tests affected by this change?
  - A: No. There are zero existing tests for `cass-retrieve.ts`. New tests are additive only.
  - Evidence: `find scripts/src -name "*.test.ts" | xargs grep -l "cass"` — no matches

- Q: Does the `--source-roots` CLI override still work after this change?
  - A: Yes. `DEFAULT_SOURCE_ROOTS` initialises `sourceRoots` in `parseArgs`, and the `--source-roots` flag replaces it entirely (`cass-retrieve.ts:128-130`). Adding a new default does not affect override behaviour.

### Open (Operator Input Required)
None — all questions are answerable from available evidence.

## Confidence Inputs
- Implementation: 96% — one-element array addition + export + tests; all code paths are understood
- Approach: 92% — adding to defaults is the minimal-risk option; topK bound eliminates noise concern
- Impact: 88% — immediately benefits every fact-find/plan going forward; impact grows as more assessment work accumulates
- Delivery-Readiness: 95% — no new dependencies; `rg` already available; test framework established
- Testability: 90% — pure functions (DEFAULT_SOURCE_ROOTS, parseArgs, collectTerms) are trivially testable; subprocess functions are tested at integration level via the rest of the suite

For each to reach >=95: verify that `rg` handles `docs/business-os/strategy` with 104 files without timeout under topK=8 constraint (near-certain yes, given rg performance characteristics).

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Cross-business snippet contamination | Low | Low | topK=8 bound; keyword mismatch filters naturally; label as "advisory context only" |
| Strategy docs are very large; rg slow | Very Low | Very Low | rg processes 104 files in <100ms typically; topK=8 means early exit |
| alphabetical bias in fallback-rg hits | Medium | Low | First 8 lines alphabetically; advisory context is non-authoritative; acceptable for pilot phase |

## Planning Constraints & Notes
- Must-follow patterns:
  - Export `DEFAULT_SOURCE_ROOTS` so tests can assert the value directly
  - Test file: `scripts/src/startup-loop/__tests__/cass-retrieve.test.ts` (new)
  - Jest config: `scripts/jest.config.cjs`
  - Governed runner: `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs`
- Rollout/rollback expectations:
  - Rollout: zero-downtime; takes effect on next `pnpm startup-loop:cass-retrieve` invocation
  - Rollback: remove `"docs/business-os/strategy"` from `DEFAULT_SOURCE_ROOTS` array
- Observability expectations:
  - The `cass-context.md` output will now include strategy snippets when query terms match — visible in any future fact-find artifact

## Suggested Task Seeds (Non-binding)
- TASK-01: Export `DEFAULT_SOURCE_ROOTS` and add `docs/business-os/strategy` to the array; update runbook
- TASK-02: Add unit tests for `DEFAULT_SOURCE_ROOTS` value, `parseArgs --source-roots` override, and `collectTerms`

## Execution Routing Packet
- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `DEFAULT_SOURCE_ROOTS` includes `"docs/business-os/strategy"`
  - `DEFAULT_SOURCE_ROOTS` is exported from `cass-retrieve.ts`
  - `docs/runbooks/startup-loop-cass-pilot.md` updated to document the new source root
  - Unit tests pass for new defaults and `parseArgs` override
- Post-delivery measurement plan:
  - Next fact-find that touches a business with strategy docs should show strategy snippets in `cass-context.md`

## Access Declarations
None — no external data sources required. All investigation is internal repo file reads.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| `DEFAULT_SOURCE_ROOTS` definition and usage path | Yes — lines 6, 68, 161 | None | No |
| `--source-roots` override path | Yes — lines 128-130 | None | No |
| `runFallbackRg` search scope | Yes — line 376 uses `options.sourceRoots` | None | No |
| topK bound on fallback-rg output | Yes — line 405 (`slice(0, topK)`) | None | No |
| Test file discovery path | Yes — `scripts/jest.config.cjs` covers `__tests__/*.test.ts` | None | No |
| `DEFAULT_SOURCE_ROOTS` export needed for testing | Yes — currently unexported | [Minor] Needs `export` keyword added alongside the array change | No — trivial fix, same task |
| Strategy corpus size + rg performance | Yes — 104 files, rg typical <100ms | None | No |

## Scope Signal
- **Signal:** right-sized
- **Rationale:** One array element addition + export + tests + runbook update. All code paths are understood, blast radius is minimal (topK=8 bound), and no new dependencies. The deferred `--business` flag is explicitly out of scope with clear rationale.

## Evidence Gap Review

### Gaps Addressed
- `DEFAULT_SOURCE_ROOTS` usage path traced end-to-end through `parseArgs → runFallbackRg → rg command`
- topK bound confirmed at `lines.slice(0, options.topK)` (line 405) — noise concern fully addressed
- Zero existing CASS tests confirmed — new tests are additive with no regression risk
- `--source-roots` override confirmed compatible with the proposed change

### Confidence Adjustments
- Implementation raised to 96% (was 88% in dispatch payload) after confirming the change is a single array element addition + export
- Cross-business noise risk confirmed as non-issue by topK bound

### Remaining Assumptions
- rg is available in CI (safe assumption; already used by existing code paths in the scripts package)
- 104-file corpus does not cause rg timeouts (safe; rg exits at topK=8 matches)

## Planning Readiness
- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan cass-assessment-retrieval --auto`
