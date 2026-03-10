---
Type: Results-Review
Status: Draft
Feature-Slug: ci-only-test-execution
Review-date: 2026-02-27
artifact: results-review
---

# Results Review

<!-- Note: codemoot inline route used (workflow file not found in codemoot v22 install; exit 2). -->

## Observed Outcomes

- `run-governed-test.sh` exits 1 with "BLOCKED: local test execution is disabled" when `BASESHOP_CI_ONLY_TESTS=1` and `CI` is not set. Verified via direct bash invocation during the TASK-08 CHECKPOINT.
- `validate-changes.sh` exits 1 with "BLOCKED: VALIDATE_INCLUDE_TESTS=1 is not permitted under CI-only test policy" when both `BASESHOP_CI_ONLY_TESTS=1` and `VALIDATE_INCLUDE_TESTS=1` are set without `CI=true`. Verified via bash.
- `integrator-shell.sh` now exports `BASESHOP_CI_ONLY_TESTS=1` into all agent shells. All agent-mediated test invocations going through the governed runner are automatically blocked without any per-agent configuration.
- `pnpm --filter scripts plans:lint` passes the full repo with "All plans passed basic structure checks." The new `checkLocalJestPatterns()` rule is active and correctly catches local Jest command patterns in new plan documents.
- `docs/testing-policy.md` and `AGENTS.md` have been rewritten to reflect CI-only policy; local test command rows are removed; `gh run watch` guidance is present.
- The test-execution-resource-governor plan is marked `Status: Superseded` with a rationale section. This removes an active plan from the planning board that would have required further work (Phases 2–3) now rendered unnecessary.
- No machine destabilisation from test processes during the build session — confirming the policy objective was met for the build cycle itself.

## Standing Updates

- `docs/testing-policy.md`: Already updated as part of this build (TASK-01). No further standing update needed — it is now the authoritative policy doc.
- `AGENTS.md`: Already updated as part of this build (TASK-02). Now reflects CI-only guidance.
- `docs/plans/test-execution-resource-governor-plan.md`: Marked Superseded. No further action; archived.
- Anti-loop rule check: the trigger domain (infra/test execution) was the subject of this build. No Layer A standing artifact in another domain needs updating as a consequence of these changes. The changes ARE the standing artifact updates.

## New Idea Candidates

1. New standing data source: None. No new external feeds or datasets were introduced.
2. New open-source package: None. No new libraries were added.
3. New skill — `plans-lint` rule extension pattern: The approach of adding a `checkXxxPatterns()` function with inline-exemption markers to `plans-lint.ts` is a repeatable pattern for new policy-enforcement lint rules (e.g., a future "no hardcoded URLs" rule or "no deprecated env var" rule). Trigger observation: TASK-07 extended plans-lint successfully in ~30 lines with path-based and inline exemptions, no schema changes needed. Suggested next action: defer — document the pattern in `plans-lint.ts` file comments when a second rule is added.
4. New loop process — CI-only build validation: This build validated that IMPLEMENT tasks can complete correctly using only grep/bash TCs (no local Jest run), confirming that CI-only policy does not impede the build loop. Trigger observation: all 9 acceptance criteria passed using non-Jest validation commands. Suggested next action: update `docs/testing-policy.md` TC examples to emphasise grep/bash-based TCs as the preferred form for policy tasks. Create card.
5. AI-to-mechanistic — Local Jest pattern detection: The `checkLocalJestPatterns()` function mechanistically detects what was previously a manual review concern ("did anyone add a local test command to a plan doc?"). Trigger observation: TASK-07 fully automates this check. The step is now mechanistic; no further AI intervention needed. Suggested next action: none — already completed by this build.

## Standing Expansion

Decision: No new standing artifact required. The `docs/testing-policy.md` rewrite and `AGENTS.md` update constitute the standing infrastructure changes. The lint rule in `plans-lint.ts` serves as the ongoing automated enforcement of the policy, preventing drift without requiring periodic manual review. Register no new trigger — the policy is now enforced structurally, not through a standing data source.

## Intended Outcome Check

- **Intended:** Establish a CI-only test policy with enforcement scoped to agent-mediated paths: a block rule via `BASESHOP_CI_ONLY_TESTS=1` in the governed runner (`run-governed-test.sh`) and validate-changes script, exported automatically from `integrator-shell.sh`. Direct-shell invocations (e.g., `pnpm test:affected`) are covered by policy only. Updates AGENTS.md and docs/testing-policy.md to reflect CI-only guidance; marks the resource governor plan Superseded (scheduler and admission phases no longer needed).
- **Observed:** All enforcement mechanisms are in place and verified. `run-governed-test.sh` blocks with `BASESHOP_CI_ONLY_TESTS=1`. `validate-changes.sh` blocks `VALIDATE_INCLUDE_TESTS=1`. `integrator-shell.sh` exports the env var to all agent shells. Policy docs updated. Resource governor plan Superseded. Plans-lint rule added. Direct-shell invocations remain policy-only (not technically blocked), as stated in the intended outcome. All 9 acceptance criteria PASS.
- **Verdict:** Met
- **Notes:** The two-layer model (technical enforcement for agent-mediated paths; policy-only for direct-shell) was explicitly stated in the intended outcome and is what was delivered. No scope gap.
