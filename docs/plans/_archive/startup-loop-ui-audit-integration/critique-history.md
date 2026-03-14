# Critique History — startup-loop-ui-audit-integration

## Round 1 — 2026-03-13

- **Route:** codemoot
- **Score:** 8/10 (lp_score: 4.0)
- **Verdict:** needs_revision
- **Severity counts:** Critical 0 / Major 3 / Minor 1

### Findings

**[Major]** Line 239: Default scoping fallback (Option A — any recent sweep) too weak. Live `docs/audits/contrast-sweeps/` contains unrelated slugs from different products. Business-scoped identifier required for "every product, every time" outcome.

**[Major]** Line 265: Degraded-mode handling under-specified. `Status: Complete` with `Routes-Tested: 0` should hard-block, not advise. Operator's intent is a rendered screen audit.

**[Major]** Line 277: Rollout/rollback section inconsistent — said "no rollback needed" while risk section acknowledged mid-loop businesses would be blocked. Rollback path (revert gate change or soften to advisory) must be acknowledged.

**[Minor]** Line 203: S9C mismatch well evidenced (informational confirmation).

### Fixes Applied

- Open question updated: Option A ruled out; Option C recommended (hard-block on missing `Business:` field).
- Degraded-mode risk upgraded to High impact; gate now hard-blocks on `Routes-Tested: 0`.
- Rollout/rollback section updated: rollback path documented; grace-period option surfaced for operator decision.
- `Data & Contracts` section updated with full frontmatter schema including `Business:`, `Routes-Tested:`, and `Status:` gate check logic.

---

## Round 2 — 2026-03-13

- **Route:** codemoot
- **Score:** 8/10 (lp_score: 4.0)
- **Verdict:** needs_revision
- **Severity counts:** Critical 0 / Major 3 / Minor 1

### Findings

**[Major]** Line 42: Scope statement internally inconsistent — non-goals said tools-ui-contrast-sweep is out of scope but brief proposed `Business:` frontmatter field change (requires report-template.md update).

**[Major]** Line 56: Assumptions section still used a business slug derivable from `--business` (Option B model) while Open section correctly said slug is operator-assigned. Two conflicting scoping models.

**[Major]** Line 120: Treating missing `Business:` frontmatter as warn too weak. Legacy artifacts (no `Business:` field) would pass the gate for the wrong product.

**[Minor]** Line 267: Degraded-mode policy materially improved (informational confirmation).

**[Minor]** Line 319: Confidence raises to ≥90 still referenced "Option A recommended" — stale after Option A was ruled out.

### Fixes Applied

- Non-goals updated: report-template.md change explicitly in scope as minimal prerequisite.
- Constraints section updated: "business scoping is required, not optional" with evidence (23 unrelated slugs in directory).
- Missing `Business:` field → hard-block (not warn). Legacy artifacts require re-run.
- Scoping resolution moved to Resolved questions. Open question reduced to single remaining item: grace period preference.
- Confidence section updated: references Option C (resolved), not Option A.
- Suggested Task Seeds updated with report-template.md task as prerequisite step.
- Deliverable acceptance package updated to include 7-case unit test coverage and report-template.md.

---

---

## Plan — Round 1 — 2026-03-14

- **Route:** codemoot
- **Artifact:** `docs/plans/startup-loop-ui-audit-integration/plan.md`
- **Score:** 6/10 (lp_score: 3.0)
- **Verdict:** needs_revision
- **Severity counts:** Critical 2 / Major 2 / Minor 0

### Findings

**[Critical]** Line 233: Gate does not enforce stated outcome of "all routes in both light and dark mode." Gate checks Routes-Tested > 0 and S1-Blockers = 0 but never validates Modes-Tested includes both light and dark. A single-route, single-mode sweep could pass while violating the operator contract.

**[Critical]** Line 479: TASK-05 creates `s9b-gates.ts` TypeScript module that has no runtime consumer. The advance flow reads `s9b-gates.md` (Markdown) at runtime; the TypeScript file is only consumed by tests. Tests can pass against dead code while the live Markdown gate diverges.

**[Major]** Line 449: Validation contract references `pnpm --filter scripts typecheck` and `pnpm --filter scripts lint` which don't exist in `scripts/package.json`. The correct commands are root-level `pnpm typecheck` and `pnpm lint`.

**[Major]** Line 421: Test count inconsistency throughout the plan — introduced as "7 gate scenarios," but acceptance list defines 8, and decision log notes the change to 8. Unreliable scope tracking.

### Fixes Applied

- TASK-02: Added 6th check condition — `Modes-Tested:` must include both "light" and "dark". Block Case C message updated to include mode coverage failure.
- TASK-02: Validation contract (TC-01 through TC-08) updated to include `Modes-Tested: light` (dark missing) → BLOCK test case (now TC-05).
- TASK-05: Explicitly documented that `s9b-gates.ts` has no runtime consumer (same pattern as `s6b-gates.ts`). File-level comment required referencing `s9b-gates.md` as authoritative spec. Synchronization obligation documented.
- TASK-05: Corrected validation contract to use root-level `pnpm typecheck` and `pnpm lint`.
- TASK-05: Test case count normalized to 9 throughout the plan. Decision log updated.
- Summary, Task Summary table, Engineering Coverage table, and Acceptance Criteria all updated for consistency.

---

## Plan — Round 2 — 2026-03-14

- **Route:** codemoot
- **Artifact:** `docs/plans/startup-loop-ui-audit-integration/plan.md`
- **Score:** 6/10 (lp_score: 3.0)
- **Verdict:** needs_revision
- **Severity counts:** Critical 2 / Major 2 / Minor 0

### Findings

**[Critical]** Line 233: Gate still does not enforce "every screen" requirement. `Routes-Tested > 0` allows a single-route, single-mode sweep to pass while many screens remain unaudited.

**[Critical]** Line 485: TASK-05 still introduces `s9b-gates.ts` with no runtime consumer. Tests can pass against the TypeScript while the live Markdown gate drifts.

**[Major]** Line 123: Task dependency graph inconsistent — task table says TASK-05 depends only on TASK-01, but Parallelism Guide Wave 3 requires TASK-02 complete first.

**[Major]** Line 423: TASK-05 deliverable line says "8 scenarios" but acceptance list defines 9 cases. Inconsistency.

### Fixes Applied

- Constraints section: added explicit route-exhaustiveness limitation note. Gate is a proxy (Routes-Tested > 0, Modes-Tested includes light+dark), not a guarantee of complete screen coverage. Operator responsibility documented.
- TASK-02 notes: acknowledged route-exhaustiveness limitation in gate definition.
- Risks & Mitigations: added entry for route-exhaustiveness proxy risk and s9b-gates.ts synchronization risk.
- TASK-05 dependency: corrected to `TASK-01, TASK-02` in task table and task definition.
- TASK-02 Blocks: updated to include TASK-05.
- TASK-05 deliverable line: corrected from "8 scenarios" to "9 scenarios."
- Decision log: added entries for Round 2 fixes.

---

## Plan — Round 3 — 2026-03-14 (Final Round)

- **Route:** codemoot
- **Artifact:** `docs/plans/startup-loop-ui-audit-integration/plan.md`
- **Score:** 6/10 (lp_score: 3.0)
- **Verdict:** needs_revision (final round — no further iterations)
- **Severity counts:** Critical 2 / Major 2 / Minor 0
- **Post-loop classification:** partially credible (score 3.0 in 3.0–3.5 range) → Status: Draft, auto-build blocked, recommend `/lp-do-replan`

### Findings

**[Critical]** Line 63: Route exhaustiveness documentation gap — plan accepts it as operator responsibility but TASK-04 does not explicitly plan updating `tools-ui-contrast-sweep/SKILL.md` to instruct operators to cover all routes when running for S9B advance (the SKILL.md currently says "infer best-effort routes").

**[Critical]** Line 436: TASK-05 still validates `s9b-gates.ts` with no runtime consumer. Persistent finding across all 3 rounds.

**[Major]** Line 151: Delivered Processes section stale after Modes-Tested addition — still described only 5 checks (Business/Audit-Date/Status/Routes-Tested/S1-Blockers) missing the Modes-Tested check.

**[Major]** Line 442: TASK-05 acceptance says "All 8 test cases pass" but enumerates 9 cases immediately below.

### Fixes Applied (post Round 3 — final artifacts)

- TASK-04: Expanded scope to explicitly include a `tools-ui-contrast-sweep/SKILL.md` update requiring operators to cover all application routes when running for S9B advance. TC-05 added to validation contract.
- Delivered Processes: Updated S9B→SIGNALS gate flow to include all 6 checks (adding Modes-Tested check (e)).
- TASK-02 execution plan: Updated "check steps 1–5" to "check steps 1–6."
- TASK-05 acceptance: Corrected "All 8 test cases pass" to "All 9 test cases pass."
- Plan Status: Draft (partially credible — auto-build blocked per policy).

### Post-Loop Outcome

- **lp_score:** 3.0
- **Classification:** partially credible (score 3.0–3.5)
- **Outcome:** Status: Draft. Auto-build blocked. Recommend `/lp-do-replan startup-loop-ui-audit-integration` to address the persistent `s9b-gates.ts` runtime-consumer finding and confirm route-exhaustiveness documentation is sufficient.

---

## Analysis Final Verdict

- **lp_score:** 4.0
- **Classification:** credible (score ≥ 4.0)
- **Critical remaining:** 0
- **Outcome:** Proceed to completion. Status: Ready-for-analysis.

---

## Replan — Plan Round 1 — 2026-03-14

- **Route:** codemoot
- **Artifact:** `docs/plans/startup-loop-ui-audit-integration/plan.md`
- **Score:** 8/10 (lp_score: 4.0)
- **Verdict:** needs_revision
- **Severity counts:** Critical 0 / Major 3 / Minor 0

### Findings

**[Major]** Line 473: TC-04 not valid — `grep -r "s9b-gates" scripts/src/` would match the test file's comment referencing `s9b-gates.md`. Needs to target import pattern or filename specifically.

**[Major]** Line 441: Confidence math broken — `min(90, 92, 88) = 88`, not 90. Confidence method violated.

**[Major]** Line 544: Decision log contains superseded `s9b-gates.ts` decisions alongside replan entry, making TASK-05 architecture ambiguous.

### Fixes Applied

- TC-04 corrected to `grep -rn "from.*s9b-gates\|require.*s9b-gates\|s9b-gates\.ts" scripts/src/` (import-specific pattern).
- TASK-05 confidence scores aligned: Implementation=90, Approach=90, Impact=90; min=90. Confidence method satisfied.
- Superseded `s9b-gates.ts` decisions in Decision Log struck through with explicit superseded annotation.

---

## Replan — Plan Round 2 — 2026-03-14

- **Route:** codemoot
- **Artifact:** `docs/plans/startup-loop-ui-audit-integration/plan.md`
- **Score:** 9/10 (lp_score: 4.5)
- **Verdict:** needs_revision
- **Severity counts:** Critical 0 / Major 2 / Minor 0

### Findings

**[Major]** Line 483: Sweep-artifact count evidence stale — "10" in planning validation and "23+" in risks section; actual count is 19.

**[Major]** Line 537: Top-level acceptance criteria under-specifies TASK-04 `tools-ui-contrast-sweep/SKILL.md` changes — only checks loop-position, not `Business:` requirement or all-routes coverage.

### Fixes Applied

- Artifact count corrected to 19 (confirmed by `grep -rL "Business:" docs/audits/contrast-sweeps/*/contrast-uniformity-report.md`) in both locations.
- Overall acceptance criteria expanded: `tools-ui-contrast-sweep/SKILL.md` entry now requires all 3 changes (loop-position, `Business:` manual step, all-routes coverage).

---

## Replan — Plan Round 3 — 2026-03-14

- **Route:** codemoot
- **Artifact:** `docs/plans/startup-loop-ui-audit-integration/plan.md`
- **Score:** 9/10 (lp_score: 4.5)
- **Verdict:** needs_revision
- **Severity counts:** Critical 0 / Major 2 / Minor 0

### Findings

**[Major]** Line 372: TASK-04 scope at top still said "2 changes" after being updated to require 3 changes.

**[Major]** Line 474: TC-04b inverted — `test -f ...` exits 0 when file exists, not when absent. Check would pass the undesired state.

### Fixes Applied

- TASK-04 scope line updated to "3 changes" explicitly listing all three.
- TC-04b corrected to `test ! -f scripts/src/startup-loop/s9b-gates.ts` (negated check).

---

## Replan — Plan Round 4 — 2026-03-14

- **Route:** codemoot
- **Artifact:** `docs/plans/startup-loop-ui-audit-integration/plan.md`
- **Score:** 9/10 (lp_score: 4.5)
- **Verdict:** needs_revision (continuing refinement)
- **Severity counts:** Critical 0 / Major 2 / Minor 0

### Findings

**[Major]** Line 395: TASK-04 missing TC for `Business: <BIZ>` instruction in SKILL.md — acceptance and engineering coverage require it, but no validation check existed.

**[Major]** Line 470: TASK-05 validation contract prescribed local Jest run — contradicts CI-only test policy (`docs/testing-policy.md`).

### Fixes Applied

- TC-06 added to TASK-04: `grep -in "Business.*frontmatter..." .claude/skills/tools-ui-contrast-sweep/SKILL.md` → found.
- TASK-05 TC-01 changed from "local `pnpm --filter scripts test`" to "CI-only: verified in CI on push."
- TASK-05 acceptance note updated to cite CI-only policy.

---

## Replan — Plan Round 5 — 2026-03-14

- **Route:** codemoot
- **Artifact:** `docs/plans/startup-loop-ui-audit-integration/plan.md`
- **Score:** 9/10 (lp_score: 4.5)
- **Verdict:** needs_revision (final round — no further iterations)
- **Severity counts:** Critical 0 / Major 2 / Minor 0
- **Post-loop classification:** credible (score 4.5 ≥ 4.0) → Status: Active, auto-build eligible

### Findings

**[Major]** Line 400: TC-05 doesn't match tightened acceptance contract — generic coverage keywords too weak for the exact instruction now required.

**[Major]** Line 401: TC-06 too loose — regex would pass partial wording, doesn't prove exact manual operator instruction was added.

### Fixes Applied

- TASK-04 acceptance block updated: "two changes" corrected to "three changes"; `Business:` requirement moved from a separate note into the numbered list as change 2; all-routes note updated as change 3 with exact required wording.
- TC-06 tightened: `grep -in "Business.*frontmatter\|frontmatter.*Business\|manually.*Business\|set.*Business"` — must match explicit operator instruction language.

### Post-Loop Outcome

- **lp_score:** 4.5
- **Classification:** credible (score ≥ 4.0)
- **Critical remaining:** 0
- **Outcome:** Plan credible. Status: Active. Auto-build eligible. Proceed to `/lp-do-build startup-loop-ui-audit-integration`.
