# Critique History — process-improvements-snooze-buttons

## Round 1 — 2026-03-12

### Critique Input
Fact-find draft reviewed against the following lenses:
- Completeness: are all required sections present and non-omittable sections filled?
- Evidence anchoring: do all claims have explicit file/line references?
- Storage decision: is the localStorage vs. ledger decision well-reasoned?
- Overlap analysis: is the existing Defer/Snooze overlap clearly delineated?
- Open questions: are any agent-resolvable questions left as "Open"?

### Findings

**Critical:** None.

**Major:** None.

**Minor:**
1. The page-header SSR count limitation (snoozed plans still counted in the in-progress header stat) is noted in Risks but not surfaced in Planning Constraints. Added to Planning Constraints as a known limitation.
2. The stale localStorage entry risk on plan rename/archive needed a mitigation note. Added: "filter for slugs that exist in the current plan list on read."

**Info:**
- The overlap analysis table is a useful addition that was not in the template but aids planning significantly. Retained.
- The open question about new-ideas Defer relabelling is correctly placed as "operator input required" — the agent cannot resolve a UX preference question without operator confirmation.

### Resolution
Both minor findings were addressed in the draft before finalisation. No confidence adjustment needed.

### Status after Round 1
Ready-for-analysis.

---

## Analysis Stage

### Round 1 — 2026-03-12
- Tool: codemoot (Node 22)
- Artifact: `docs/plans/process-improvements-snooze-buttons/analysis.md`
- Score: 7/10 → lp_score 3.5
- Verdict: needs_revision
- Critical: 0 | Major (warnings): 3 | Minor (info): 1

**Findings:**
1. WARNING (line 76): Analysis claimed `InProgressInbox.tsx` has no tests, but `InProgressInbox.test.tsx` exists with component-level tests. The "starts from zero" claim overstated setup effort.
2. WARNING (line 62): Scope mismatch — Inherited Outcome Contract said operator can snooze cards on both `/in-progress` and `/new-ideas`, but chosen approach defaults to leaving new-ideas unchanged. Contract and chosen approach were inconsistent.
3. WARNING (line 97): localStorage downside analysis incomplete — missed the hydration flash seam. Because `activePlans` is server-rendered into `initialActivePlans` prop, snoozed cards flash briefly on page load before client-side filter runs.
4. INFO (line 164): Sequencing note said tests must follow implementation; repo pattern favours co-development.

**Autofixes applied:**
- Narrowed Inherited Outcome Contract to `/in-progress` as the primary scope; new-ideas capability noted as already existing.
- Corrected test claim: `InProgressInbox.test.tsx` exists; snooze tests extend it rather than starting from zero.
- Added hydration flash to Option A downsides, UX/states coverage row, End-State Operating Model, Planning Handoff, and Risks table.
- Softened sequencing to co-development.

---

### Round 2 — 2026-03-12
- Tool: codemoot (Node 22)
- Artifact: `docs/plans/process-improvements-snooze-buttons/analysis.md`
- Score: 8/10 → lp_score 4.0
- Verdict: needs_revision
- Critical: 0 | Major (warnings): 3 | Minor (info): 0

**Findings:**
1. WARNING (line 52): Analysis overstated reappearance timing — "reappears automatically when the period elapses" implies exact-time reappearance. The 30s refresh loop means reappearance is on the next refresh cycle, up to 30s after expiry.
2. WARNING (line 107): Internal inconsistency — analysis said "snoozed indicator shown if card is temporarily visible" while also saying snoozed cards are filtered and hidden. Snoozed cards have no visible indicator — they are absent.
3. WARNING (line 146): Mount guard presented as required solution without acknowledging the UX tradeoff: every page visit briefly hides all cards (including unsnoozed) until hydration completes.

**Autofixes applied:**
- Softened reappearance language: "reappears on the next refresh cycle after expiry (up to 30s lag)" throughout document.
- Removed snoozed-indicator state from UI/visual and UX/states rows. Snoozed cards are absent, not shown with indicator.
- Reframed hydration flash mitigation as a planning-level choice (mount guard vs accept flash), not a hard requirement.
- Updated TASK-01 description, Planning Handoff, End-State Operating Model, and Risks table accordingly.

---

### Round 3 — 2026-03-12 (Final)
- Tool: codemoot (Node 22)
- Artifact: `docs/plans/process-improvements-snooze-buttons/analysis.md`
- Score: 9/10 → lp_score 4.5
- Verdict: needs_revision (minor only; Round 3 is final)
- Critical: 0 | Major (warnings): 1 | Minor (info): 1

**Findings:**
1. WARNING (line 161): Remaining internal inconsistency — Planning Handoff said hydration-flash mitigation was a choice, but Risks to Carry Forward said it "must be suppressed via a mount guard" (hard requirement). Document gave conflicting positions.
2. INFO (line 107): UX/state description was materially improved and correctly describes the implementation shape.

**Autofixes applied:**
- Unified hydration flash position: flash is cosmetic and accepted for a single-operator internal tool. The `isMounted` guard is an option, not a requirement. Planning may choose to add it. Consistent language applied to Planning Handoff, Validation Implications, and Risks table.
- Removed contradictory "must be suppressed" phrasing.

**Post-loop gate result:**
- lp_score: 4.5 (Round 3) ≥ 4.0 threshold → credible
- No Critical findings at any round
- Status: Ready-for-planning

---

## Plan Stage

### Round 1 — 2026-03-12
- Tool: codemoot (Node 22)
- Artifact: `docs/plans/process-improvements-snooze-buttons/plan.md`
- Score: 8/10 → lp_score 4.0
- Verdict: needs_revision
- Critical: 0 | Major (warnings): 2 | Minor (info): 1

**Findings:**
1. WARNING (line 56): Internal inconsistency — plan said stale snooze entries are "silently pruned" on each render cycle, but the selected approach, delivered flow, and acceptance criteria only described ignoring unknown slugs during filtering (not writing a cleaned map back to `localStorage`). These are different behaviors affecting implementation and test scope.
2. WARNING (line 159): The `isMounted` guard conflicted with the TASK-02 claim that existing TC-07/08/09 would pass without modification. Current tests assert card content synchronously after `render()`; the guard gates list rendering behind `useEffect`, so those tests require `waitFor`/`act` updates.
3. INFO (line 130): Delivered flow is coherent on main behavior.

**Autofixes applied:**
- Standardised "silently pruned" → "silently ignored during filtering"; added note that stale entries remain in `localStorage` with no write-back.
- Updated TASK-02 Acceptance to require TC-07/08/09 be updated to use `waitFor`/`act`.
- Updated TASK-02 Scouts section to warn about vacuous-pass risk if `waitFor` is not used.
- Updated overall Acceptance Criteria and Decision Log.

---

### Round 2 — 2026-03-12
- Tool: codemoot (Node 22)
- Artifact: `docs/plans/process-improvements-snooze-buttons/plan.md`
- Score: 9/10 → lp_score 4.5
- Verdict: needs_revision
- Critical: 0 | Major (warnings): 1 | Minor (info): 1

**Findings:**
1. WARNING (line 55): `isMounted` strategy still underspecified — if plan list is not rendered until hydration, component must render `null` (not empty-state copy) pre-mount; otherwise every page load briefly flashes "No plans currently in progress," which is more misleading than the original card flash.
2. INFO (line 160): Plan now correctly acknowledges existing tests must be updated for the `isMounted` guard.

**Autofixes applied:**
- Explicitly specified: `isMounted === false` → renders `null` for section area (not empty-state copy). Empty-state only shown when mounted AND filtered list is empty.
- Updated Assumptions, TASK-01 Acceptance, UX/states Engineering Coverage (plan table + task block) to describe 4 states (pre-mount null / shown / snoozed / reappeared).
- Updated Rehearsal Trace row for TASK-01.
- Added Decision Log entry for Round 2 fix.

**Post-loop gate result:**
- lp_score: 4.5 (Round 2 final after fixes) ≥ 4.0 threshold → credible
- No Critical findings at any round
- Round 3 not triggered (no Critical remain after Round 2)
- Status: Active — auto-build eligible
