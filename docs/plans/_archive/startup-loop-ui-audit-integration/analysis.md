---
Type: Analysis
Status: Ready-for-planning
Domain: BOS
Workstream: Engineering
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: startup-loop-ui-audit-integration
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: tools-ui-contrast-sweep
Related-Fact-Find: docs/plans/startup-loop-ui-audit-integration/fact-find.md
Related-Plan: docs/plans/startup-loop-ui-audit-integration/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Startup Loop UI Audit Integration — Analysis

## Decision Frame

### Summary

Three decisions require resolution before planning can decompose tasks:

1. **Business-scoping mechanism** — How does `GATE-UI-SWEEP-01` know a sweep artifact belongs to the business being advanced? Two viable options remain after Option A (business-agnostic glob) was ruled out by the fact-find.
2. **Degraded-mode gate behaviour** — What happens when a sweep artifact exists but has `Routes-Tested: 0` (auth-blocked, token-only analysis)? The operator wants a rendered screen-by-screen audit; the gate must be fail-closed on non-rendered sweeps.
3. **Rollout approach** — Does the new hard gate apply immediately to all businesses, or is there an advisory window for businesses already mid-loop?

The approach chosen here determines: which files change, how many task boundaries exist in the plan, and the migration burden on existing artifacts.

### Goals

- Decisive choice on business-scoping mechanism (Option B vs C) with rejected option documented.
- Decisive choice on degraded-mode gate policy.
- Decisive choice on rollout (immediate hard gate vs. grace period).
- Planning handoff with concrete sequencing constraints and validation implications.

### Non-goals

- Re-litigating whether to add the gate (operator mandate confirmed).
- Redesigning `tools-ui-contrast-sweep` execution workflow.
- Introducing a new loop stage (`S9C`) — integration targets existing S9B.

### Constraints & Assumptions

- Constraints:
  - Gate must remain filesystem-only at advance time.
  - `loop-spec.yaml` is runtime-authoritative; spec_version bump required.
  - The `Business:` frontmatter field (Option C, chosen) is a **forced migration for any business with existing sweep artifacts**: existing reports have no `Business:` field and will hard-block the gate. This is intentional — the forced re-run ensures every operator re-executes the sweep against the new artifact contract before advancing.
- Assumptions (confirmed by fact-find):
  - 30-day staleness window (matching `GATE-LAUNCH-SEC`).
  - S1 blockers = hard block; S2/S3 = advisory warn only.
  - `Status: Complete` required (in-progress reports block).

## Inherited Outcome Contract

- **Why:** The startup loop has no step that requires checking how every screen in the app actually looks when rendered — both in light and dark mode. Issues like invisible text in dark mode, clashing colours, and text that is too small are only caught by doing this audit manually. Adding a screen-by-screen rendered audit to the loop means these problems get found automatically for every product, every time, before launch.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The startup loop includes a required rendered UI screen audit at S9B that covers every screen in both light and dark mode, with findings saved as an artifact and blocking issues preventing advance.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/startup-loop-ui-audit-integration/fact-find.md`
- Key findings used:
  - S9C does not exist in `loop-spec.yaml`; `tools-ui-contrast-sweep` self-declares "S9C" but is unintegrated.
  - `docs/audits/contrast-sweeps/` contains 23+ slug-named reports across multiple unrelated products — business-agnostic glob would cross-contaminate.
  - Existing sweep report template (`report-template.md`) has no `Business:` field; adding it is a one-line change.
  - `GATE-LAUNCH-SEC` in `s9b-gates.md` establishes the exact implementation pattern (glob → date parse → content check → block packet).
  - Reception audit (2026-03-12) found 2 S1 blockers with `Routes-Tested: 0 (auth-blocked)` — demonstrates that `Status: Complete` does not guarantee a rendered audit.
  - `s6b-gate-simulation.test.ts` establishes the unit test pattern for gate logic.
  - One open operator question: grace period preference (immediate hard gate vs. 30-day advisory window).

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Business-scoping correctness | Gate must not allow one product's sweep to satisfy another product's advance | Critical |
| Backward compatibility | 23+ existing sweep artifacts have no `Business:` field — gate must not silently reject all history | High |
| Implementation simplicity | Fewer moving parts = lower build risk and easier rollback | High |
| Operator clarity | Block messages must tell the operator exactly what to run next | High |
| Test coverage | Gate logic regression risk; unit tests required | High |
| Staleness correctness | Auth-blocked / token-only sweeps must not pass the rendered-screen requirement | Critical |

## Options Considered

### Decision 1: Business-scoping mechanism

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| B | Require sweep artifact slug to contain the business identifier as an infix (e.g., `*brik*`, `*pipe*`). Gate globs `docs/audits/contrast-sweeps/*<BIZ-lower>*`. | No change to sweep artifact schema or report template. | BIZ identifiers like `BRIK` are short and may appear coincidentally in unrelated slugs (e.g., `brikette-ci-release` is BRIK but `xa-b-branding` could accidentally match `b`). Also requires all operators to follow slug-naming convention — convention not currently enforced. | False positives (wrong product's sweep matching) or false negatives (correctly-named sweep missed by too-strict pattern) | Yes, with caveats |
| C | Add `Business: <BIZ>` to the sweep report frontmatter template; operator sets this field manually when running the sweep. Gate reads this field explicitly. Missing field = hard block. | Unambiguous. No slug-pattern guessing. Explicitly scoped. Consistent with GATE-LAUNCH-SEC pattern of reading structured report fields. | Requires changes to `report-template.md` (frontmatter) and `tools-ui-contrast-sweep/SKILL.md` (document required field + update loop-position). Existing sweeps (pre-gate) lack the field and hard-block — forced migration for any business at S9B. | Legacy artifact forced-migration: operators must re-run sweeps before advancing S9B | Yes — **recommended** |

**Decision 1 recommendation: Option C.** Slug-infix matching (Option B) relies on operator convention that does not currently exist and is brittle for short identifiers (`BRIK`, `PIPE`). Option C makes the contract explicit, aligns with the structured-field pattern used by `GATE-LAUNCH-SEC`, and eliminates all ambiguity at the cost of one template line and a clear block message for legacy artifacts.

**Option A (any recent sweep, business-agnostic) is eliminated.** The live `docs/audits/contrast-sweeps/` directory contains unrelated products' sweeps — a business-agnostic glob would silently allow BRIK to advance on an xa-uploader or reception sweep. This directly contradicts "every product, every time."

### Decision 2: Degraded-mode gate policy

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| D1 | Hard-block when `Routes-Tested: 0`. Advisory warn when `Routes-Tested > 0` but low (e.g., 1–2 routes). | Fail-closed on the core requirement (rendered screens). Matches operator intent. | Operators with auth-blocked products must resolve auth before advancing S9B — may require additional prep work. | Auth-blocked products cannot produce a rendered sweep; if this is a structural blocker, it surfaces early. | Yes — **recommended** |
| D2 | Advisory warn when `Routes-Tested: 0`, allow advance. | No friction for auth-blocked products. | Undermines the core requirement: a token-only analysis is not a rendered screen audit. S1 blockers visible only in token analysis may still exist in rendered state. | Gate value is degraded; operator intent is not satisfied. | No |

**Decision 2 recommendation: Option D1 (hard-block when `Routes-Tested: 0`).** The operator's stated requirement is a rendered screen-by-screen audit. A `Status: Complete` report with zero rendered routes is explicitly not a rendered audit — it is a token-analysis proxy that found issues but did not confirm visual rendering. Allowing it to satisfy the gate would make the gate semantically misleading. Operators with auth-blocked products must resolve this before S9B advance, which is the correct forcing function.

**Note for planning:** The `Routes-Tested` field can contain a non-integer suffix (e.g., `0 (auth-blocked — token-level + code-level analysis only)`). The gate implementation must parse the leading integer from this field, not exact-match.

### Decision 3: Rollout approach

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| R1 | Immediate hard gate. Gate applies from the moment the files are merged. | Clean, simple, consistent with operator statement ("blocking issues preventing advance"). | Mid-loop businesses hit a new hard block at their next S9B advance attempt. | Operator friction if a business is at S9B with no sweep artifact. | Yes — **recommended** |
| R2 | 30-day advisory window (warn, not block) then auto-harden. | Grace period reduces operator surprise. | Adds complexity: requires a date check or a flag to track advisory vs. hard mode. Contradicts operator's stated intent. | Advisory mode may be ignored; the window becomes permanent by operator inaction. | No — adds complexity without proportionate benefit |

**Decision 3 recommendation: Option R1 (immediate hard gate).** The block message must be actionable: tell the operator to run `/tools-ui-contrast-sweep`, manually set `Business: <BIZ>` in the report frontmatter, then re-run advance. Rollback path is clear (revert/soften `s9b-gates.md` — no data migration). An advisory window would add implementation complexity and is inconsistent with the GATE-LAUNCH-SEC precedent.

## Engineering Coverage Comparison

| Coverage Area | Option C (chosen — Business: field in frontmatter) | Option B (slug-infix matching, rejected) | Chosen implication |
|---|---|---|---|
| UI / visual | N/A — gate does not touch rendered UI | N/A | N/A — no rendered UI change |
| UX / states | Block message must clearly tell operator to run `/tools-ui-contrast-sweep` and set `Business: <BIZ>` in the report frontmatter manually. Advance packet includes `ui_sweep_gate_status`. | Block message references slug convention — less precise, more confusing | Plan must define the exact block message strings (3 cases: no artifact, stale/missing-Business, S1 blockers or Routes=0) |
| Security / privacy | Filesystem-only; no auth, no untrusted input | Same | N/A |
| Logging / observability / audit | Gate result added to advance packet (same pattern as GATE-LAUNCH-SEC). `ui_sweep_gate`, `ui_sweep_gate_status`, `ui_sweep_report` fields. | Same advance packet pattern | No additional logging needed; advance packet is the audit trail |
| Testing / validation | 7 unit test cases: no artifact, stale artifact, missing Business field, Routes-Tested: 0, S1-Blockers > 0, clean pass, Status: In-progress | Fewer test cases (no Business field check); but slug-pattern matching needs its own test cases for false-positive/negative edge cases | Plan must include a test task with explicit fixture files |
| Data / contracts | Sweep report frontmatter gains `Business: <BIZ>` field. Report template updated. Existing artifacts without field = hard block. | No schema change — brittle by design | Template change is in scope; plan must update `report-template.md` as prerequisite |
| Performance / reliability | Trivially fast (glob + file read) | Same | N/A |
| Rollout / rollback | Immediate hard gate. Rollback = revert `s9b-gates.md`. No data change. Legacy artifacts block until re-run. | Same rollback shape. Legacy artifacts need slug naming fix instead. | Grace period removed. Block message must explain how to re-run. |

## Chosen Approach

- **Recommendation:** Option C for business-scoping (`Business:` frontmatter field), D1 for degraded-mode (hard-block on `Routes-Tested: 0`), R1 for rollout (immediate hard gate).
- **Why this wins:**
  - Option C is the only unambiguous business-scoping mechanism. Slug patterns are too brittle for short identifiers and have no enforcement path.
  - D1 preserves the semantic integrity of the gate — a non-rendered sweep does not satisfy a rendered-screen requirement.
  - R1 keeps the gate simple and consistent with existing gate precedents. The block message carries the recovery path.
- **What it depends on:**
  - Plan task ordering: `report-template.md` change must land before any gate test that requires `Business:` field.
  - The gate implementation must parse `Routes-Tested` as a leading integer (field value may include a parenthetical description like `"0 (auth-blocked)"`).
  - **`Business:` population mechanism is manual-frontmatter, not a CLI flag.** `tools-ui-contrast-sweep` has no `--business` flag and the chosen approach does not add one. Operators manually set `Business: <BIZ>` in the report frontmatter when running the sweep. The SKILL.md must document this as a required field. All references to `--business` as a CLI argument are incorrect and must not appear in planning tasks or block messages.

### Rejected Approaches

- **Option A (business-agnostic glob)** — Eliminated. Cross-product contamination risk. 23+ unrelated slugs already in `docs/audits/contrast-sweeps/`.
- **Option B (slug-infix matching)** — Rejected. Brittle for short identifiers (`BRIK`, `PIPE`). No slug-naming convention is currently enforced. Prone to false positives/negatives without operator convention guarantee.
- **Option D2 (warn on Routes-Tested: 0)** — Rejected. Undermines the operator-stated requirement for a rendered screen audit. Makes the gate semantically misleading.
- **Option R2 (30-day advisory window)** — Rejected. Adds implementation complexity, is inconsistent with GATE-LAUNCH-SEC precedent, and may be ignored by operators.

### Open Questions (Operator Input Required)

None remaining. The one operator question from the fact-find (grace period preference) is resolved in Decision 3: immediate hard gate (R1) is the correct choice by analysis, consistent with operator intent and existing gate precedents.

## End-State Operating Model

| Area | Current state | Trigger | Delivered step-by-step end state | What remains unchanged | Risks / seams to carry into planning |
|---|---|---|---|---|---|
| S9B stage execution | Operator runs `/lp-launch-qa`, optionally `/lp-design-qa`. No rendered UI audit required or checked. | `startup-loop advance --business <BIZ>` at S9B | 1. Operator runs `/tools-ui-contrast-sweep` and manually sets `Business: <BIZ>` in the report frontmatter (produces artifact at `docs/audits/contrast-sweeps/YYYY-MM-DD-<slug>/contrast-uniformity-report.md`). 2. Operator runs `/lp-launch-qa --business <BIZ>`. 3. Operator optionally runs `/lp-design-qa`. 4. Operator runs `startup-loop advance`. Gate checks both GATE-LAUNCH-SEC and GATE-UI-SWEEP-01. | lp-launch-qa and lp-design-qa unchanged. GATE-LAUNCH-SEC unchanged. Advance packet structure extended (new fields), not replaced. | Ordering is operator-driven; gate doesn't enforce which step runs first. Plan must document the recommended execution order in startup-loop docs. No CLI flag added to tools-ui-contrast-sweep. |
| S9B→SIGNALS advance gate | Single gate: GATE-LAUNCH-SEC (security domain of launch QA report). | S9B→SIGNALS advance attempt | Two gates enforced: (1) GATE-LAUNCH-SEC — unchanged; (2) GATE-UI-SWEEP-01 — checks for a sweep artifact ≤30 days old, `Business: <BIZ>` present, `Status: Complete`, `Routes-Tested > 0`, `S1-Blockers = 0`. Both must pass for advance. | GATE-LAUNCH-SEC logic unchanged. | Block message for GATE-UI-SWEEP-01 must be actionable. Three block cases: (a) no artifact found, (b) stale/missing-Business-field artifact, (c) S1 blockers > 0 or Routes-Tested = 0. |
| Sweep artifact schema | `Type, Status, Audit-Date, Target-URL, Standard, Breakpoints-Tested, Modes-Tested, Routes-Tested, Issues-Total, S1-Blockers, S2-Major, S3-Minor`. No `Business:` field. | Gate implementation requires `Business: <BIZ>` for scoping | `report-template.md` gains `Business: <BIZ>` as a required frontmatter field. Sweep invocations produce artifacts with this field. Gate reads it. | All other frontmatter fields unchanged. JSON sidecar schema unchanged. | Existing sweep artifacts (23+ reports) lack `Business:` field. If any business is currently at S9B with a recent sweep, they must re-run the sweep. Plan block message must explain this. |
| `tools-ui-contrast-sweep` SKILL.md | Self-declares "Loop position: S9C (Parallel Sweep)" — S9C does not exist in loop-spec. | This change | Loop position updated to "S9B secondary skill, required before S9B→SIGNALS advance." | All sweep workflow, output paths, severity model unchanged. | Cosmetic only; no consumer breakage. |
| `loop-spec.yaml` | spec_version 3.15.0. S9B: `skill: /lp-launch-qa`, `secondary_skills: [/lp-design-qa]`. GATE-LAUNCH-SEC comment block present. | This change | spec_version 3.16.0. S9B: `secondary_skills: [/lp-design-qa, /tools-ui-contrast-sweep]`. New GATE-UI-SWEEP-01 comment block added to S9B stage. New changelog entry at top. | All other stages, ordering, and gate definitions unchanged. | VC-02 alignment: startup-loop SKILL.md, cmd-advance.md summary line, and any doc referencing spec_version must be updated. |

## Planning Handoff

- Planning focus:
  - Task 1: Update `tools-ui-contrast-sweep/modules/report-template.md` — add `Business: <BIZ>` field (prerequisite for all gate tests).
  - Task 2: Implement `GATE-UI-SWEEP-01` in `s9b-gates.md` — define all 5 check conditions with exact block messages and pass/block packet fields.
  - Task 3: Update `loop-spec.yaml` — bump to 3.16.0, add secondary skill, add gate comment block to S9B.
  - Task 4: Update `startup-loop/SKILL.md`, `cmd-advance.md`, and `tools-ui-contrast-sweep/SKILL.md` — alignment docs.
  - Task 5: Add unit tests for GATE-UI-SWEEP-01 gate logic (7 cases, fixture-based).
- Validation implications:
  - Task 1 must land before Task 5 (tests need the template schema as contract reference).
  - Task 2 must land before Task 3 (gate implementation before spec version comment that references it).
  - Tasks 1–4 are documentation/config only (markdown and YAML); no app code changes in those tasks.
  - Task 5 adds TypeScript/Jest code to the `scripts` package. `pnpm typecheck` and `pnpm lint` must pass for the scripts package — these run in CI. The reference implementation is `scripts/src/startup-loop/__tests__/s6b-gate-simulation.test.ts`.
  - `scripts/check-startup-loop-contracts.sh` should be run after Task 3 to verify spec integrity.
- Sequencing constraints:
  - Tasks 1 → 2 → 3 → 4/5 (4 and 5 can be parallel; 1–3 are sequential).
  - Task 4 (alignment docs) can be done in a single commit alongside Task 3 if all files are clean.
- Risks to carry into planning:
  - `Routes-Tested` field value parsing: field includes a parenthetical description in existing reports. Gate must parse the leading integer robustly.
  - `tools-ui-contrast-sweep` does not currently accept or require a `--business` flag. The report template will instruct operators to fill `Business:` manually — this needs a clear instruction in the SKILL.md and a note in the block message.
  - Grace period decision is immediate hard gate; no fallback advisory mode to implement.

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Routes-Tested field value is non-integer string | High (confirmed: "0 (auth-blocked...)" exists in live artifacts) | High — gate blocks or errors if it tries to parseInt on full string | Implementation detail resolved in analysis (parse leading integer) | Plan must specify leading-integer parse in the gate implementation task |
| Operator doesn't know to set `Business: <BIZ>` manually in sweep frontmatter | Medium | Medium — sweep produces artifact without field; gate hard-blocks | Addressed by: (1) block message with exact remediation instruction, (2) `tools-ui-contrast-sweep` SKILL.md update documenting `Business:` as a required frontmatter field | Block message: "No sweep artifact found for business `<BIZ>`. Run `/tools-ui-contrast-sweep`, set `Business: <BIZ>` in the report frontmatter, then re-run advance." |
| spec_version bump triggers VC-02 alignment drift | Low | Low — misaligned docs are cosmetic, not functional | Not a hard block; requires discipline | Plan Task 4 covers all known alignment docs; note any new ones discovered during build |
| Auth-blocked products structurally cannot produce rendered sweeps | Low (product-specific) | High — would mean a business cannot advance S9B at all | Operator-specific deployment constraint; not a loop design flaw | Plan must document: "If the deployed product requires auth on all routes, resolve auth bypass (e.g., preview mode) before running contrast sweep." |

## Planning Readiness

- Status: Go
- Rationale: All three decisions resolved. No operator input remaining. File change set identified (6–7 files, all orchestration/documentation). Implementation pattern established by GATE-LAUNCH-SEC. Test seam established by s6b gate tests. Sequencing constraints clear. Risks carried forward are implementation-level details, not architecture blockers.
