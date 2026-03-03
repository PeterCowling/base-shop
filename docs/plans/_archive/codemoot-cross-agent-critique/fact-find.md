---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Agents
Workstream: Engineering
Created: 2026-02-26
Last-updated: 2026-02-26
Feature-Slug: codemoot-cross-agent-critique
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/codemoot-cross-agent-critique/plan.md
Trigger-Why: Cross-agent critique (Claude produces, Codex reviews; Codex produces, Claude reviews) dramatically improves fact-find and plan quality. The operator has been doing this manually. Automating it removes the manual step and keeps quality gains without extra operator effort.
Trigger-Intended-Outcome: type: operational | statement: v1 — critique calls in lp-do-fact-find (Phase 7a) and lp-do-plan (Phase 9) are routed to Codex via codemoot with zero operator intervention. Build execution by Codex requires one manual trigger per plan (operator starts Codex session). v2 — automated build trigger via codemoot. | source: operator
---

# Codemoot Cross-Agent Critique — Fact-Find Brief

## Scope

### Summary

Wire codemoot into the lp-do-ideas → lp-do-fact-find → lp-do-plan → lp-do-build pipeline so that:

1. **Critique** (currently Claude-inline): routed through `codemoot review <artifact> --json` → Codex performs the review → Claude normalises the score and applies autofixes.
2. **Build**: after lp-do-plan writes an approved plan.md, Codex executes lp-do-build rather than Claude.

codemoot (v0.2.14, MIT) is a Node.js CLI orchestrator that spawns Claude Code and Codex CLI as subprocesses. The canonical flow it enforces is: Claude (host) → codemoot (orchestrator) → Codex (subprocess).

### Goals

- Automate cross-agent critique without manual operator intervention.
- Keep the existing pipeline gates and confidence-scoring rules intact.
- Introduce no new breaking changes to CI, Node version, or existing skill files.
- Avoid additional API costs where possible (browser auth preferred over API key).

### Non-goals

- Replacing the lp-do-critique autofix phase (Claude continues to apply fixes; codemoot supplies the finding list).
- Using codemoot's MCP server (explicitly experimental, unstable).
- Using codemoot's background job queue (worker not implemented in v0.2.14).
- Installing skills via `codemoot install-skills` (appends to CLAUDE.md and adds hooks — manual integration is safer).
- Changing `.nvmrc` or CI Node version (stays on 20.19.4 everywhere except the codemoot call itself).

### Constraints & Assumptions

- Constraints:
  - `.nvmrc` pinned to 20.19.4; CI hardcoded to 20.19.4 — must not change.
  - codemoot requires Node 22+ (uses `globSync` from `node:fs`, added in Node 22). Resolve path dynamically at invocation: `CODEMOOT="$(nvm exec 22 which codemoot 2>/dev/null)"`. Never hardcode the absolute path — it varies across Node 22 patch versions and machines.
  - Node 22.x is already installed locally (v22.15.0, v22.15.1, v22.16.0 available via nvm).
  - codemoot review returns a 0–1 score; lp-do-critique uses a 0–5 scale — score mapping required.
  - codemoot review does not apply autofixes to skill files — Claude continues to handle AF-1 through AF-4.
  - Writer lock must still be respected by Codex when executing lp-do-build.
  - v1 build handoff trigger: operator manually starts a Codex session after Claude sets plan Status: Active. Automated Codex trigger via codemoot is a follow-on (v2 scope).
- Assumptions:
  - Codex CLI browser auth is sufficient (no OPENAI_API_KEY env var required for interactive sessions).
  - codemoot `review --json` output format is stable at v0.2.14: `{ score: number, verdict: 'approved'|'needs_revision', feedback: string[] }`.
  - DLP path normalisation (Stage 3, absolute → relative) is low-risk because fact-find and plan artifacts already use relative paths.

## Outcome Contract

- **Why:** Operator has been manually running cross-agent critique (if Codex produces, Claude reviews; if Claude produces, Codex checks). Results are dramatically better. Automating this removes the manual step.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** v1 — critique calls in lp-do-fact-find (Phase 7a) and lp-do-plan (Phase 9) route to Codex via codemoot automatically; zero operator intervention for critique. Build execution by Codex requires one manual trigger per plan (operator starts Codex session after Claude sets Status: Active). v2 scope — automated build trigger via codemoot.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `.claude/skills/_shared/critique-loop-protocol.md` — calls `/lp-do-critique` inline (Claude self-critiques); this is the primary integration point to modify.
- `.claude/skills/lp-do-plan/SKILL.md` — Phase 9 loads `critique-loop-protocol.md`; Phase 10 auto-invokes lp-do-build. Build handoff is the secondary integration point.
- `CODEX.md` — Codex agent context; needs codemoot setup/usage section added.

### Key Modules / Files

- `.claude/skills/_shared/critique-loop-protocol.md` — **MODIFY**: replace `/lp-do-critique` inline call with Bash subprocess to `nvm exec 22 codemoot review <artifact> --json`; add score normalisation and verdict mapping.
- `CODEX.md` — **MODIFY**: add codemoot prerequisites (install, auth), invocation pattern, and writer-lock reminder.
- `AGENTS.md` — **READ-ONLY**: already documents skill locations and workflow; no changes needed.
- `docs/plans/_templates/fact-find-planning.md` — unchanged; template is unaffected.
- `.claude/skills/lp-do-build/SKILL.md` — unchanged; Codex already reads and follows it per CODEX.md.

### Patterns & Conventions Observed

- Critique loop protocol is a shared file loaded by both lp-do-fact-find (Phase 7a) and lp-do-plan (Phase 9). A single change to `critique-loop-protocol.md` covers both skills. Evidence: `critique-loop-protocol.md` lines 1–3.
- Codex already invokes skills by reading SKILL.md directly (no slash-command loader). File-based handoff from Claude to Codex for lp-do-build already works — no new mechanism required. Evidence: `CODEX.md` lines 156–186.
- nvm exec availability is environment-dependent, not a categorical fact. In interactive shells it works reliably; in non-interactive shells (e.g. agent Bash subprocess) nvm may not be sourced. The dynamic resolution pattern handles this: `CODEMOOT="$(nvm exec 22 which codemoot 2>/dev/null)"` returns empty if nvm is unavailable → fallback to inline critique activates. Empty result is correct behaviour, not an error. Never hardcode path. Evidence: nvm 0.39.7 confirmed installed locally.
- codemoot spawns Codex via `codex exec --skip-git-repo-check --json` with prompt via stdin. Output is JSONL: `thread.started`, `item.completed`, `turn.completed`. Evidence: codemoot `cli-adapter.ts` source.

### Data & Contracts

- Types/schemas/events:
  - codemoot review CLI output (assumed): `{ score: number (0–1), verdict: 'approved' | 'needs_revision', feedback: string[] }`. **Status: inferred, not confirmed.** `cli-adapter.ts` JSONL parsing verified (internal Codex output parser); `review.ts` `--json` output wrapper not read directly due to pre-existing TS build errors in that file. Treat as assumption; confirmed in TASK-01 smoke test.
  - lp-do-critique score scale: 0–5.0 (6 weighted dimensions)
  - **Score mapping**: `codemoot_score × 5 → lp_score`. Gate classification: apply the canonical score bands defined in `critique-loop-protocol.md` (credible ≥4.0; partially credible 3.0–3.5; not credible <3.0). Do not redefine bands here — critique-loop-protocol.md is the authority.
  - **Score-verdict conflict resolution**: **score takes precedence over verdict** for all pipeline gate decisions. If `verdict: 'approved'` but mapped lp_score <4.0 → treat as partially credible. If `verdict: 'needs_revision'` but lp_score ≥4.0 → treat as credible. Verdict field is advisory context only; never used as the gate signal.
  - The feedback array replaces the fix-list produced by lp-do-critique Steps 1–7. Claude's autofix phase (AF-1 through AF-4) consumes it.
- Persistence:
  - `critique-history.md` — written by the autofix phase; unchanged by this integration.
  - codemoot uses SQLite (WAL mode) at its own data directory — transparent to the pipeline.
- API/contracts:
  - codemoot → Codex: dynamic path resolution at runtime (`CODEMOOT="$(nvm exec 22 which codemoot 2>/dev/null)"`). Codex spawned as `codex exec --skip-git-repo-check --json` via stdin.
  - Output capped at 512 KB per subprocess call. Artifacts are typically 5–30 KB — within limit.

### Dependency & Impact Map

- Upstream dependencies:
  - lp-do-fact-find Phase 7a → critique-loop-protocol.md → (currently) lp-do-critique → (after) codemoot review → Codex.
  - lp-do-plan Phase 9 → same path.
- Downstream dependents:
  - critique-loop-protocol.md score gate: score ≥4.0 required for fact-find auto-handoff to plan; score ≤2.5 blocks plan auto-handoff to build. Score mapping must preserve these thresholds correctly.
  - **Gap bands in shared protocol (unresolved upstream):** critique-loop-protocol.md leaves 2.6–2.9 and 3.6–3.9 undefined. Interim rules for this implementation: 2.6–2.9 → treat as partially credible (same outcome as 3.0–3.5: proceed with Critique-Warning in plan+auto mode); 3.6–3.9 → treat as credible (same outcome as ≥4.0). TASK-02 must implement these interim rules explicitly, and a separate plan task must close the gap in critique-loop-protocol.md itself.
  - lp-do-build: Codex executes instead of Claude. CODEX.md already describes how. Writer lock via `scripts/agents/integrator-shell.sh -- codex` must be respected.
- Likely blast radius:
  - Two files modified: `critique-loop-protocol.md`, `CODEX.md`. No production code, no app changes, no CI changes, no `.nvmrc` changes.
  - If codemoot is unavailable (not installed, auth fails), the critique-loop-protocol.md change must fail gracefully — fallback to lp-do-critique inline. This is a TASK-level concern for the plan.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (apps), no automated tests for skill files.
- Commands: skill files are agent-instruction markdown — tested via dry-run agent invocation.
- CI integration: CI does not test skill files.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| critique-loop-protocol.md | None | — | Agent instruction file; not unit-testable |
| CODEX.md | None | — | Agent instruction file; not unit-testable |
| codemoot review path | Manual | — | Must be smoke-tested post-install |

#### Coverage Gaps

- No automated regression test for the critique path. Manual smoke test is the only gate.
- Testability constraint: a live Codex auth session is required to test the end-to-end path.

#### Recommended Test Approach

- Smoke test: after install, run `nvm exec 22 codemoot review docs/plans/codemoot-cross-agent-critique/fact-find.md --json` and verify JSON output shape.
- Score mapping unit test: can be verified manually against the formula (codemoot_score × 5, verdict thresholds).
- Integration test: run one full fact-find → critique cycle with the new protocol and confirm score gate behaviour matches expectation.

### Recent Git History (Targeted)

- `57a99f5033` — `refactor(critique): extract Section A + B to modules — fact-find-lens.md and plan-lens.md` — critique skill was recently modularised; confirms `critique-loop-protocol.md` is the right single file to modify.
- `9214ceffdb` — `refactor(critique): remove --no-autofix option — was never called by any upstream skill` — autofix is now always on; confirms AF-1 through AF-4 is Claude's responsibility and will remain so.
- `ff2d26043c` — `feat(plans-lint): hard-gate planning frontmatter fields and IMPLEMENT task structure + critique preflight trust policy` — plans-lint is a gating step; changes to critique-loop-protocol.md must not break this gate.

## Questions

### Resolved

- Q: Does switching to Node 22 break CI or other packages?
  - A: No. Keep `.nvmrc` at 20.19.4. CI stays on Node 20. Invoke codemoot only via `nvm exec 22 codemoot` or the absolute binary path. Node version change is scoped entirely to the codemoot subprocess call.
  - Evidence: `.nvmrc` = 20.19.4; CI workflows hardcode `node-version: 20.19.4`; root `package.json` engines = `>=20.9.0` (permits 22).

- Q: Should codemoot MCP server or Bash subprocess be used for the critique call?
  - A: Bash subprocess. The MCP server is explicitly marked experimental in codemoot's own README and dogfood log. Bash call to `nvm exec 22 codemoot review <file> --json` is simpler, debuggable, and adds no new MCP server dependency. Resolved.

- Q: Should autofix (AF-1 through AF-4) still be done by Claude after Codex critique?
  - A: Yes. codemoot review returns findings (score, verdict, feedback array) but does not modify our skill files. Claude's autofix phase consumes the feedback array as its fix list. No change to autofix ownership. Resolved.

- Q: Should `codemoot install-skills` be run?
  - A: No. It appends a static block to CLAUDE.md and adds a PostToolUse hook to `.claude/settings.json`. Manual integration to only the required files is safer and avoids any CLAUDE.md conflicts. Resolved.

- Q: Will DLP path normalisation mangle artifact content?
  - A: Low risk. DLP Stage 3 converts absolute paths to relative. Fact-find and plan artifacts already use relative paths (e.g. `docs/plans/.../fact-find.md`). No absolute paths expected in artifact content. Resolved.

- Q: Does lp-do-build need a new handoff mechanism, or does file-based handoff already work?
  - A: File-based handoff already works. Codex reads plan.md via CODEX.md workflow instructions. lp-do-plan sets Status: Active; Codex picks it up. No new tooling required for the build step. A codemoot-orchestrated build handoff (calling `codemoot run` from lp-do-plan) is a follow-on enhancement, not required for v1. Resolved.

- Q: Is `nvm exec 22` available in agent shells (non-interactive)?
  - A: No — nvm is a shell function unavailable in non-interactive shells. Correct pattern: `CODEMOOT="$(nvm exec 22 which codemoot 2>/dev/null)"` resolved dynamically at runtime. Never hardcode the path. Resolved.

- Q: Should Codex execute ALL lp-do-build tasks, or only code-track tasks?
  - A: All tracks in v1. CODEX.md workflow instructions already cover all tracks via lp-do-build SKILL.md. Constraining to code-track only would require adding a filter condition to CODEX.md — add if problems arise post-v1. No design change required now.
  - Evidence: CODEX.md lines 156–186; lp-do-build SKILL.md is track-agnostic.

- Q: Does the operator have a ChatGPT Pro/Plus account for Codex CLI browser auth, or will an API key be needed?
  - A: Resolved. Operator confirmed Codex CLI is already installed via the VS Code extension and is logged in. Auth is not a blocker. The `codex` binary accessibility from a terminal PATH (outside VS Code) is a minor remaining check, not an auth question. No extra cost.
  - Decision owner: Peter

### Open (Operator Input Required)

None.


## Confidence Inputs

- Implementation: 73%
  - Evidence: file change locations are confirmed (critique-loop-protocol.md, CODEX.md); score mapping formula is straightforward; codemoot review JSON output format documented in source (cli-adapter.ts JSONL parsing + review.ts return shape). Uncertainty: live output format unverified until codemoot installed and run.
  - Raises to ≥80%: run `nvm exec 22 codemoot review <file> --json` on a real artifact post-install and confirm output shape matches expected schema.
  - Raises to ≥90%: additionally verify fallback path (codemoot unavailable → graceful degradation to inline critique) works as designed.

- Approach: 80%
  - Evidence: Bash subprocess avoids experimental MCP; file-based build handoff avoids bidirectionality gap; Node 22 isolation via absolute path avoids version conflicts. All high-risk paths (install-skills, MCP server, background jobs) explicitly avoided.
  - Raises to ≥90%: successful smoke test of `codemoot review --json` with expected output.

- Impact: 88%
  - Evidence: only two files modified (critique-loop-protocol.md, CODEX.md); no production code, no app changes, no CI, no .nvmrc. Blast radius is agent instruction files only.
  - Raises to ≥90%: verify plans-lint gate still passes after critique-loop-protocol.md changes.

- Delivery-Readiness: 62%
  - Evidence: Codex CLI not installed; codemoot not installed; auth not verified. These are mechanical tasks (install + auth check) with no design uncertainty — just execution required.
  - Raises to ≥80%: TASK-01 complete (Codex CLI installed, codemoot installed under Node 22, auth verified, smoke test passed).
  - Raises to ≥90%: full integration test with a real fact-find artifact complete.

- Testability: 75%
  - Evidence: smoke test and score-mapping validation are straightforward; full integration test requires live Codex auth session.
  - Raises to ≥80%: define explicit acceptance criteria for the integration test before TASK-03.
  - Raises to ≥90%: add a documented manual test script to the plan directory.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Codex CLI browser auth not supported; API key required | Low-Medium | High — blocks all Codex-dependent tasks | Verify in TASK-01 before writing any critique-loop-protocol.md changes; if API key required, operator decides whether to proceed |
| codemoot review.ts pre-existing TS errors cause runtime failure | Medium | High — critique path broken silently | Smoke test (`nvm exec 22 codemoot review <file> --json`) is TASK-01 acceptance criteria; do not proceed to TASK-02 if smoke test fails |
| Score granularity loss (codemoot: 1 dimension vs lp-do-critique: 6 weighted dimensions) | Certain | Medium — critique is less targeted; autofix phase has less section-level specificity | Accepted tradeoff; Claude autofix phase compensates using feedback array as fix list |
| Hardcoded codemoot path breaks across Node 22 patch versions or machines | Low | Medium — command not found in non-interactive shells | Resolve dynamically at runtime: `CODEMOOT="$(nvm exec 22 which codemoot 2>/dev/null)"` — never hardcode |
| codemoot API changes in patch versions (project is 2 weeks old) | Medium | Medium — JSON output format may change | Pin codemoot to installed version; do not auto-upgrade |
| DLP entropy filter redacts high-entropy strings in artifact content | Low | Low — artifacts don't contain secrets; relative paths not redacted | Pre-validate: run `nvm exec 22 codemoot review <file> --json` on a real artifact and check output is not mangled |
| Writer lock not acquired when Codex runs lp-do-build | Medium | High — concurrent writes corrupt working tree | CODEX.md already documents `integrator-shell.sh -- codex`; emphasise in updated CODEX.md codemoot section |
| Calibration drift — codemoot/Codex scores systematically harsher or softer than lp-do-critique | Medium | High — pipeline stalls (too harsh) or rubber-stamps (too lenient) | Run baseline comparison on 2–3 existing artifacts post-TASK-01 before enabling in live pipeline; adjust score mapping multiplier if systematic bias detected |
| Score-verdict conflict mis-implemented in TASK-02 | Low | High — wrong gate decision if precedence rule not followed | Score-precedence rule defined in Data & Contracts; TASK-02 acceptance criteria must verify gate behaviour on a conflict case |

## Planning Constraints & Notes

- Must-follow patterns:
  - critique-loop-protocol.md is a **shared** file — any change affects both lp-do-fact-find and lp-do-plan simultaneously. Must not break either skill's gate behaviour.
  - Score gate thresholds (≥4.0 for fact-find handoff; >2.5 for plan build-handoff) must be preserved exactly. Score mapping must be applied before these comparisons.
  - Fallback behaviour is required: if codemoot is not installed or auth fails, critique-loop-protocol.md must fall back to inline Claude critique. This prevents hard breakage in environments without codemoot.
  - Codex must acquire writer lock before any file write in lp-do-build.
- Rollout/rollback expectations:
  - v1 scope: critique via codemoot only. Build handoff (codemoot-orchestrated) is a follow-on.
  - Rollback: revert critique-loop-protocol.md and CODEX.md. No database changes, no migration.
- Observability expectations:
  - codemoot review JSON output should be logged to the plan directory (e.g. `critique-raw-output.json`) per critique round for auditability.

## Suggested Task Seeds (Non-binding)

- TASK-01 (INVESTIGATE, ≥60%): Install prerequisites and verify auth. Install Codex CLI and codemoot under Node 22. Verify Codex auth (browser or API key). Resolve codemoot binary path dynamically (`nvm exec 22 which codemoot`). Run smoke test: `$CODEMOOT review docs/plans/codemoot-cross-agent-critique/fact-find.md --json`. Confirm output shape matches assumed schema. Gate: do not proceed if smoke test fails or path resolution returns empty.
- TASK-02 (IMPLEMENT, ≥80%): Modify `critique-loop-protocol.md`. Add codemoot Bash subprocess path. Add score normalisation (×5) and verdict mapping. Add graceful fallback to inline critique if codemoot not available. Log raw JSON output per round.
- TASK-03 (IMPLEMENT, ≥80%): Modify `CODEX.md`. Add codemoot prerequisites section (install commands, auth instructions, writer-lock reminder). Add dynamic resolution invocation pattern (`CODEMOOT="$(nvm exec 22 which codemoot 2>/dev/null)"`). Document fallback: if CODEMOOT is empty, skip codemoot and use inline critique.
- TASK-05 (IMPLEMENT, ≥80%): Close gap bands in `critique-loop-protocol.md`. Define handling for scores 2.6–2.9 (partially credible) and 3.6–3.9 (credible) so no score can produce an undefined outcome.
- TASK-04 (INVESTIGATE, ≥60%): Integration test. Run a full fact-find → critique cycle (on this plan's own fact-find.md or a new test artifact). Confirm: score gate behaviour correct, fallback works, critique-history.md written correctly, no DLP mangling.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `.claude/skills/_shared/critique-loop-protocol.md` — modified, fallback-safe, score mapping included
  - `CODEX.md` — codemoot section added
  - `docs/plans/codemoot-cross-agent-critique/critique-raw-output.json` — sample smoke test output (evidence of working install)
- Post-delivery measurement plan:
  - Run one full fact-find cycle post-integration and compare critique quality (feedback specificity, score calibration) against a manually-run lp-do-critique baseline.

## Evidence Gap Review

### Gaps Addressed

- **codemoot JSON output format**: inferred from source (`cli-adapter.ts` JSONL parsing verified; `review.ts` `--json` output wrapper not directly read). Shape `{ score: number, verdict: string, feedback: string[] }` is an assumption, not a confirmed fact. Runtime verification is TASK-01 acceptance criteria.
- **Node version isolation**: confirmed safe. `.nvmrc`, CI, and all existing tooling unaffected. Dynamic resolution pattern handles non-interactive shells by returning empty and activating fallback — no hard dependency on nvm availability.
- **Score mapping**: derived from first principles (linear normalisation). Thresholds recalculated and verified to preserve existing pipeline gate behaviour.
- **install-skills risk**: confirmed by reading full source. Appends to CLAUDE.md and adds PostToolUse hook. Decision: manual integration only.
- **DLP risk**: confirmed low. Stage 3 converts absolute paths — not present in artifact content. Secrets not present in planning docs.

### Confidence Adjustments

- Delivery-Readiness reduced to 62% (from initial 75% estimate) because Codex CLI auth is unverified — browser auth may or may not work without API key. This is resolvable in TASK-01 but is a genuine pre-build uncertainty.
- Implementation held at 73% because live codemoot review output format is source-confirmed but not runtime-verified.

### Remaining Assumptions

- Codex CLI supports browser-based auth without `OPENAI_API_KEY` env var for interactive sessions.
- codemoot `review --json` output format matches the source-level documentation (`{ score, verdict, feedback }`).
- codemoot path resolves dynamically at runtime via `CODEMOOT="$(nvm exec 22 which codemoot 2>/dev/null)"`. No hardcoded path assumed.
- Operator manually triggers Codex to run lp-do-build for v1. No automated trigger exists; operator starts a Codex session after Claude sets plan Status: Active.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none (TASK-01 investigate gate handles auth verification before TASK-02/03 build tasks)
- Recommended next step: `/lp-do-plan codemoot-cross-agent-critique --auto`
