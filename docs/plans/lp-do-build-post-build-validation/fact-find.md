---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-02-25
Last-updated: 2026-02-25 (critique Round 2 autofix applied)
Feature-Slug: lp-do-build-post-build-validation
Execution-Track: business-artifact
Deliverable-Family: doc
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: skill-update
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/lp-do-build-post-build-validation/plan.md
Trigger-Source: direct-operator-decision: BOS dispatch DISPATCH-BOS-2026-02-25-002 — post-build validation absent from lp-do-build identified as operational gap
Trigger-Why: Post-build validation is absent from lp-do-build. Cross-agent critique was considered but rejected in favour of strengthening single-agent verification — a simulated walkthrough of each built item to confirm it actually works as intended before the task is marked done.
Trigger-Intended-Outcome: operational | A new post-build validation phase in lp-do-build that runs a type-appropriate walkthrough (screenshots for UI, data simulation for code, document review for business artifacts), surfaces failures, and requires fix+retry proof before task completion.
artifact: fact-find
Decision-Owner: platform-skill-maintainer (operator to confirm named individual before plan approval)
---

# lp-do-build: Post-Build Validation Phase

## Scope

### Summary

`lp-do-build` currently validates work through tests, typecheck, lint, and VC checks. These confirm the code/artifact is internally consistent but do not verify that the built item works end-to-end from the user's or data's perspective. This fact-find scopes a new post-build validation phase: a type-adaptive walkthrough that simulates or observes the completed item and requires proof of fix before a task is marked done.

### Goals

- Add a mandatory post-build validation phase to IMPLEMENT tasks in `build-code.md` and `build-biz.md`.
- Define three validation modes keyed to deliverable type: visual (screenshots), data simulation, document review.
- Gate task completion on validation passing; if it fails, fix and re-run validation before marking complete.
- Keep the phase lightweight by default — it should add signal, not bureaucracy.

### Non-goals

- Replacing existing test/typecheck/lint gates (those remain and run first).
- Automated end-to-end test suite generation (out of scope here — separate concern).
- Cross-agent critique (explicitly rejected — this is single-agent verification).
- Validating SPIKE, INVESTIGATE, or CHECKPOINT tasks (no shippable deliverable).

### Constraints & Assumptions

- Constraints:
  - MCP browser tools (`mcp__brikette__browser_session_open`, `browser_observe`, `browser_act`) are available for visual walkthroughs of UI work.
  - Staging environment may not always be available; validation must degrade gracefully to dev or static review.
  - Skill files are markdown — changes are low-risk, reversible, no CI gate required.
  - `Execution-Track: business-artifact` is correct for this deliverable: the outputs are markdown skill files with no compiled artifacts, no TC test contracts, and VC-based validation (Mode 3 document review applies). The code-track Red/Green/Refactor TDD cycle does not apply.
- Assumptions:
  - The new phase runs after existing validation gates (tests/typecheck/lint/VC checks pass first).
  - Fix+retry is bounded — maximum 3 attempts before surface-to-operator; prevents infinite loop.
  - "Proof of fix" means the validation walkthrough re-passes, not a separate CI run (tests already cover that).

## Outcome Contract

- **Why:** lp-do-build marks tasks complete when tests pass and VC checks pass, but never simulates "does this actually work?" Post-build validation adds that step, catching integration failures, UX defects, and business artifact gaps that unit tests miss.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A new `modules/build-validate.md` module and updates to `build-code.md`, `build-biz.md`, and `SKILL.md` that embed a type-adaptive validation walkthrough gate after every IMPLEMENT task, with a fix+retry loop (max 3 attempts) and proof-of-fix required before task is marked done.

## Key Files and Modules

| File | Role | Status |
|---|---|---|
| `.claude/skills/lp-do-build/SKILL.md` | Orchestrator — Validation Gate and Quick Checklist | Needs update |
| `.claude/skills/lp-do-build/modules/build-code.md` | Code/mixed IMPLEMENT executor | Needs post-build step |
| `.claude/skills/lp-do-build/modules/build-biz.md` | Business-artifact IMPLEMENT executor | Needs post-build step |
| `.claude/skills/lp-do-build/modules/build-validate.md` | New validation module | Create |
| `.claude/skills/lp-do-build/modules/build-spike.md` | SPIKE executor | No change needed |
| `.claude/skills/lp-do-build/modules/build-investigate.md` | INVESTIGATE executor | No change needed |
| `.claude/skills/lp-do-build/modules/build-checkpoint.md` | CHECKPOINT executor | No change needed |

## Current Behaviour (Evidence-based)

### `build-code.md` — what it does today

1. Read task constraints and TC contract
2. Apply extinct test policy
3. TDD cycle (write/activate tests → confirm fail → implement → refactor while green)
4. Run required validations (typecheck/lint/tests)
5. Update plan evidence

**Gap:** Step 4 confirms the code compiles and tests pass. It does not verify the feature works from the outside (render a page, submit a form, call an API with real data).

### `build-biz.md` — what it does today

1. Red: falsification probes
2. Green: minimum artifact
3. Refactor: quality/VC re-pass
4. Capture approval evidence

**Gap:** Step 3 confirms VC checks pass. It does not verify the artifact reads correctly as the intended audience would receive it — e.g. a brochure whose pricing is correct but whose call-to-action link is dead.

### `SKILL.md` Validation Gate (Gate 3) — what it covers today

> IMPLEMENT/SPIKE/INVESTIGATE tasks require validation artifacts matching task contract.
> - code/mixed → TC contracts
> - business/mixed → VC contracts + fail-first evidence progression

**Gap:** TC/VC contracts are internal consistency checks. No external walkthrough or simulation.

## Validation Mode Design

Three modes keyed to deliverable type. The agent selects the appropriate mode from the task's `Execution-Track` and `Deliverable-Type`.

### Mode 1: Visual Walkthrough (UI / code producing rendered output)

**When:** `Execution-Track: code | mixed` AND deliverable produces a rendered UI (component, page, form, modal).

**Procedure:**
1. Open target URL/route using `mcp__brikette__browser_session_open`.
2. Take screenshot with `mcp__brikette__browser_observe`.
3. Walk through the primary user action for this task (e.g. click the button, submit the form, open the modal) using `mcp__brikette__browser_act`.
4. Take a final screenshot of the result state.
5. Assess: does the UI render correctly? Does the action produce the expected outcome? Are there visible errors/broken states?
6. **Pass:** screenshots confirm expected state. Record screenshot evidence in build notes.
7. **Fail:** describe the defect, apply fix, re-run from step 1. Max 3 attempts.

**Degraded mode** (browser tools unavailable / no dev server):
1. Locate the nearest test snapshot or rendered HTML file for the component/page (e.g. `__snapshots__/*.snap`, `out/<route>/index.html`).
2. Read the snapshot/HTML linearly; check that the key DOM elements from the acceptance criteria are present (correct class names, expected text, required attributes).
3. Reason explicitly about the primary user action (e.g. "button with `data-cy=submit` is present and not `disabled`").
4. Record: degraded mode used, snapshot path, elements checked, conclusion.
Note: degraded mode cannot catch runtime behavior (JS errors, network calls). Flag any acceptance criteria that require live execution as "not verifiable in degraded mode" and record in build notes.

### Mode 2: Data Simulation (coded systems — APIs, services, data pipelines)

**When:** `Execution-Track: code | mixed` AND deliverable is a function, API endpoint, service, or data transformation (not a rendered UI).

**Procedure:**
1. Identify the entry point (function signature, route, CLI command).
2. Construct representative input(s) — one happy path, one edge case if applicable.
3. Execute the entry point directly (Bash: `curl`, test runner with specific input, or inline call).
4. Capture actual output.
5. Assess: does the output match the expected contract? Are error states handled correctly?
6. **Pass:** output matches contract. Record execution trace in build notes.
7. **Fail:** describe the gap, apply fix, re-run from step 3. Max 3 attempts.

### Mode 3: Document Review (business artifacts)

**When:** `Execution-Track: business-artifact`.

**Procedure:**
1. Read the completed artifact as the intended audience would — linearly, from top to bottom.
2. Check for: broken or placeholder references, internal inconsistencies, missing required sections, calls-to-action that reference non-existent items, pricing/date errors.
3. For HTML/web artifacts: check all internal links and anchors exist.
4. Assess: does the artifact deliver its stated intended outcome?
5. **Pass:** no blockers found. Record review summary in build notes.
6. **Fail:** list specific issues, apply fixes, re-read from step 1. Max 3 attempts.

## Fix+Retry Loop

Applies to all three modes. If validation fails:

1. Describe the failure clearly in build notes (what was found, what the expected state was).
2. Identify the root cause before applying a fix. A fix that re-passes the walkthrough without addressing root cause must be flagged as "symptom patch" in build notes; symptom patches count toward the 3-attempt cap and are surfaced to the operator regardless of walkthrough result.
3. Apply the minimum fix addressing the root cause.
4. Re-run the validation (not the full task — just the walkthrough from step 1 of the applicable mode).
5. If it passes: record pass evidence. Continue to task completion.
6. If it fails again and retry count < 3: repeat from step 2.
7. If it fails after 3 attempts: mark task `Blocked`, surface the failure and retry history to the operator. Do not mark complete. Route to `/lp-do-replan` if the issue is architectural.

## Integration Points

### Where it hooks into `build-code.md`

After step 4 (validations pass), before step 5 (update plan evidence):
- Select Mode 1 or Mode 2 based on deliverable type.
- Run walkthrough.
- Record result.
- Only proceed to step 5 (and task completion) if walkthrough passes.

### Where it hooks into `build-biz.md`

After step 3 (Refactor / VC re-pass), before approval capture:
- Run Mode 3 document review.
- Record result.
- Only proceed to approval capture if review passes.

### Canonical Gate 3 update in `SKILL.md`

Add a new line under the Validation Gate:
> Post-build validation: run `modules/build-validate.md` after TC/VC contracts pass. Mode selected by deliverable type. Fix+retry loop (max 3) required before task is marked complete.

## Evidence Gap Review

### Gaps Addressed

- Current build-code.md and build-biz.md fully read; exact integration points identified with line-level precision.
- MCP browser tools confirmed available in this environment (in tool list).
- Three validation modes fully specified with step-by-step procedures.
- Fix+retry loop design complete with bounded iteration and operator escalation path.

### Confidence Adjustments

- **High confidence** on Mode 3 (document review) — entirely in-agent, no external dependencies.
- **High confidence** on Mode 2 (data simulation) — Bash tool always available, entry points deterministic.
- **Medium-high confidence** on Mode 1 (visual walkthrough) — depends on browser tools being available and dev server running; degraded mode defined for fallback.

### Remaining Assumptions

- Browser tools available for UI validation (confirmed in tool list, but requires active session).
- Dev server or staging URL must be reachable for Mode 1 — this is a runtime dependency, not a planning blocker.
- Skill file changes require no CI gate (confirmed: markdown files, no build step).

## Risks

1. **Browser session overhead** — Mode 1 adds ~30–60s per visual validation. Acceptable for IMPLEMENT tasks; not applied to SPIKE/INVESTIGATE. Low risk.
2. **Infinite fix loop** — Mitigated by 3-attempt hard cap with operator escalation.
3. **Mode selection ambiguity** — Some tasks produce both rendered UI and API (mixed). Tentative resolution: apply both Mode 1 and Mode 2, keyed on `Deliverable-Type` field (not `Affects` paths — see Open Questions item 2). The deterministic rule will be specified in the plan task before `build-validate.md` is authored.
4. **Degraded mode underdetection** — If browser tools are unavailable and degraded mode is used, some visual defects may be missed. Acceptable — degraded mode is still better than no validation. Noted in evidence.

## Confidence Inputs

Numeric scores (0–100) with evidence for each dimension. These feed `/lp-do-plan` task confidence.

- **Implementation: 90** — Integration points are precisely identified from direct source-file reads of `build-code.md` (5 steps), `build-biz.md` (3 steps + approval), and `SKILL.md` (Gate 3). Insertion points are unambiguous. The new module is additive; no existing logic is deleted. High confidence.
- **Approach: 80** — Three-mode design is sound and directly maps to the three existing track types. Degraded mode for Mode 1 is defined. One moderate gap: mode selection rule for mixed deliverables needs a deterministic decision rule (keyed on `Deliverable-Type`, not `Affects` paths). This is a specification gap in the module design, not an architectural unknown — addressable in the plan task.
- **Impact: 75** — The intended outcome (catching defects not caught by TC/VC checks) is plausible and grounded in the current behaviour evidence. No empirical data on defect escape rates exists; the change relies on reasoned inference that external walkthroughs catch what internal consistency checks miss. Measurement plan (see Hypothesis & Validation Landscape) provides the falsification path.
- **Delivery-Readiness: 95** — Deliverables are markdown skill files. No CI gate, no build step, no external approvals required beyond the named decision owner (to be confirmed). Writer lock protocol applies per AGENTS.md. All tooling (Bash, MCP browser, plan update) is available.
- **Testability: N/A** — This deliverable produces markdown skill files, not executable code. No TC test contract applies. The validation approach (Mode 3 document review) is self-referential — the new module itself will be validated using the process it defines. Testability is not applicable; the meaningful quality gate is the Mode 3 document review at plan execution time.

## Open Questions

The following items require operator input or confirmation before plan approval:

1. **Decision owner / approver identity** — who specifically signs off on changes to the shared `lp-do-build` skill? (Decision owner: operator.) This determines the `Reviewer` field in the plan task.
2. **Mode selection for mixed deliverables** — the current rule ("apply both modes if both are present in `Affects`") is fragile because `Affects` contains file paths, not deliverable type flags. A deterministic decision rule should be agreed before the module is authored. Recommendation: key on the `Deliverable-Type` field in the plan task, not on `Affects` paths. Operator to confirm or override.
3. **Fix quality standard** — should "symptom patch" fixes be allowed to count as a resolved attempt, or should the loop continue if root cause is not addressed? Recommendation: symptom patches count toward the cap but are flagged; operator to confirm or override.

## Hypothesis & Validation Landscape

**Key hypotheses:**

1. **H1 (primary):** Post-build validation walkthroughs surface at least one class of defect per 10 business-artifact IMPLEMENT tasks that VC checks alone would not catch (e.g. broken CTA links, dead placeholders, pricing inconsistencies undetected by structured VC probes). Falsifiable: track escaped defects found in operator review post-task-completion for 4 weeks pre- and post-implementation; compare rates.
2. **H2:** Mode 1 visual walkthroughs surface rendering defects not caught by Jest snapshot tests in at least 1 in 10 UI IMPLEMENT tasks. Falsifiable: log Mode 1 pass/fail outcomes per task for 4 weeks; a 0% failure rate would suggest Mode 1 adds no signal and should be made optional.
3. **H3:** The fix+retry loop resolves validation failures within 2 attempts in >80% of cases (i.e. the 3-attempt cap is not routinely hit). Falsifiable: log attempt counts per task; if >20% of failures hit attempt 3, the cap is too low or the fix quality gate is too strict.

**Existing signal coverage:** None (no prior measurement of defect escape rates from lp-do-build).

**Falsifiability/cost/time:** All three hypotheses are measurable via build-notes data after implementation. Zero additional tooling required. Measurement window: 4 weeks post-implementation.

**Recommended validation approach:** Deferred — collect data passively from build notes over first 4 weeks. No structured experiment required. Review at Week 4 to confirm H1 and H2; adjust Mode 1 optionality if H2 fails.

## Delivery & Channel Landscape

- **Owner of deliverable:** platform-skill-maintainer (to be named by operator — see Open Questions item 1).
- **Channel:** Internal skill files at `.claude/skills/lp-do-build/`. No external publication.
- **Approval path:** No CI gate required (markdown files, confirmed). Changes require standard writer-lock commit protocol per AGENTS.md. Plan-task `Reviewer` field must be set to the named decision owner before the plan task is marked complete.
- **Measurement availability:** Build notes are written per-task in the plan file. Defect escape rate and retry count are measurable from existing build evidence blocks. No additional infrastructure required.
- **Brand/compliance constraints:** None. Skill files are internal operational documents.

## Blast-Radius Map

This change modifies a shared skill (`lp-do-build`) executed for every IMPLEMENT task across every business on the platform.

**Affected consumers (in scope):**
- All future `IMPLEMENT + code/mixed` tasks across all businesses — will acquire Mode 1 or Mode 2 validation step.
- All future `IMPLEMENT + business-artifact` tasks across all businesses — will acquire Mode 3 document review step.
- `build-code.md` and `build-biz.md` step sequences change (new step inserted).
- `SKILL.md` Gate 3 definition changes (new post-build validation line).

**In-flight plans:** Any plan currently mid-build (task status `In-progress`) at the time of this change will not retroactively require the new step for the current task, as the executor has already started. The new phase applies from the next task cycle after the skill files are updated.

**Wave-dispatch interaction:** When wave-dispatch runs multiple IMPLEMENT tasks in parallel (wave size ≥ 2), each task's subagent will independently run its post-build validation before returning results to the orchestrator. No conflict expected — validation is read-only and per-task.

**Out of scope:**
- `build-spike.md`, `build-investigate.md`, `build-checkpoint.md` — explicitly excluded in Scope Non-goals.
- Existing plan tasks already marked `Complete` — not retroactively affected.
- CI pipeline — no changes to CI scripts or pre-commit hooks.

## Planning Readiness

**Go.**

All integration points are identified from direct source reads. Validation mode design is complete. Fix+retry loop design is sound. Three open questions remain (decision owner identity, mixed-deliverable mode selection rule, fix quality standard) — all are specification decisions resolvable by operator confirmation or agent recommendation at plan time; none block planning from proceeding.

**Recommended deliverable type:** `skill-update` (confirmed in frontmatter).
**Recommended execution skill:** `lp-do-build` (skill files as business artifacts, Mode 3 validation applies to the deliverables themselves).
**Remaining planning-acceptable risks:** Browser tool availability at runtime (degraded mode handles); dev server reachability for Mode 1 (runtime dependency, not planning blocker).
