---
Type: Startup-Loop-CASS-Context
Status: Active
Mode: plan
Generated: 2026-03-09T08:21:44.615Z
Provider: cass
Slug: prime-normalize-locale-constants
---

# CASS Context Pack

- Query: startup loop plan; feature slug prime-normalize-locale-constants; topic prime normalizeLocale shared @acme/i18n refactor; prior evidence, reusable decisions, blockers, mitigations
- Top-K target: 8
- Source roots: docs/plans, docs/business-os/startup-loop, .claude/skills, docs/business-os/strategy
- Provider used: cass

## Retrieval Warnings

- CASS_RETRIEVE_COMMAND is not configured; using built-in CASS session-history provider. Set CASS_RETRIEVE_COMMAND to use an external CASS backend.

## CASS Output

### Built-in CASS Provider (session-history retrieval)
- query: startup loop plan; feature slug prime-normalize-locale-constants; topic prime normalizeLocale shared @acme/i18n refactor; prior evidence, reusable decisions, blockers, mitigations
- roots: ~/.claude/projects, ~/.codex/sessions
- hits: 8

| Session File | Line | Snippet |
|---|---:|---|
| ~/.claude/projects/-Users-petercowling-base-shop/4852ea4e-e49c-4260-bd20-04d1c6c2a50b/tool-results/toolu_01EcZoA9zsBiYReKBysCh3NT.txt | 38 | docs/plans/archive/agent-safety-net-hardening-plan.md:31:The canonical source of truth for all deny/ask/allow decisions is **`docs/git-safety.md` § Command Policy Matrix**. All enforcement points reference that matrix; changes flow from the matrix outward. |
| ~/.claude/projects/-Users-petercowling-base-shop/4852ea4e-e49c-4260-bd20-04d1c6c2a50b/tool-results/toolu_01EcZoA9zsBiYReKBysCh3NT.txt | 90 | docs/plans/archive/agent-safety-net-hardening-plan.md:724:Create a single Jest test file that validates both enforcement points against a shared table of test cases derived from the Command Policy Matrix. |
| ~/.claude/projects/-Users-petercowling-base-shop/4852ea4e-e49c-4260-bd20-04d1c6c2a50b/tool-results/toolu_01EcZoA9zsBiYReKBysCh3NT.txt | 104 | docs/plans/archive/agent-safety-net-hardening-fact-find.md:116:See **`docs/git-safety.md` § Command Policy Matrix** — that is the canonical, stable source of truth for all deny/ask/allow decisions. The fact-find brief does not duplicate the matrix; all enforcement points refer... |
| ~/.claude/projects/-Users-petercowling-base-shop/4852ea4e-e49c-4260-bd20-04d1c6c2a50b/tool-results/toolu_01EcZoA9zsBiYReKBysCh3NT.txt | 106 | docs/plans/archive/agent-safety-net-hardening-fact-find.md-118-Key decisions captured there: |
| ~/.claude/projects/-Users-petercowling-base-shop/4852ea4e-e49c-4260-bd20-04d1c6c2a50b/tool-results/toolu_01EcZoA9zsBiYReKBysCh3NT.txt | 110 | docs/plans/archive/agent-safety-net-hardening-fact-find.md:163:- **Table-driven Jest harness:** A single test file using `child_process.spawnSync` against a shared table of `{ command, expectedDecision }` cases derived from the Command Policy Matrix. Tests both the PreToolUse ... |
| ~/.claude/projects/-Users-petercowling-base-shop/4852ea4e-e49c-4260-bd20-04d1c6c2a50b/tool-results/toolu_01EcZoA9zsBiYReKBysCh3NT.txt | 134 | docs/plans/archive/agent-safety-net-hardening-fact-find.md:269: - What would raise to 90%: the test harness covering all patterns in the Command Policy Matrix with a shared test case table that also serves as a drift-detection mechanism. |
| ~/.claude/projects/-Users-petercowling-base-shop/4852ea4e-e49c-4260-bd20-04d1c6c2a50b/tool-results/toolu_01EcZoA9zsBiYReKBysCh3NT.txt | 153 | docs/plans/archive/agent-safety-net-hardening-fact-find.md:332:8. **Create table-driven Jest test harness** — A single test file (`scripts/__tests__/git-safety-policy.test.ts`) using `child_process.spawnSync` against a shared table of `{ command, expectedDecision }` cases deri... |
| ~/.claude/projects/-Users-petercowling-base-shop/4852ea4e-e49c-4260-bd20-04d1c6c2a50b/tool-results/toolu_01EcZoA9zsBiYReKBysCh3NT.txt | 162 | scripts/__tests__/git-safety-policy.test.ts-6- * Tests BOTH enforcement points against a shared policy table: |

## How To Use

- Treat this as advisory context only.
- Keep canonical evidence links in fact-find/plan artifacts.
- If retrieval quality is low, refine the query and re-run.

