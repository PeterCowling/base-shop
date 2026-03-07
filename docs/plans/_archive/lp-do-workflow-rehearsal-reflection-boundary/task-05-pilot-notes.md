# TASK-05 Pilot Notes — Delivery Rehearsal Validation

**Date:** 2026-03-06
**Phase:** CHECKPOINT — validate Phase 9.5 Delivery Rehearsal on archived plans
**Target:** 3 archived plans; minimum 2 required
**Hypothesis tested:** H2 — a bounded delivery rehearsal catches issues the structural Phase 7.5 trace does not foreground

---

## Pilot Plan Selection

| Slug | Type | Rationale |
|---|---|---|
| `workflow-skills-simulation-tdd` | Process-heavy | Pure workflow/skills update; no runtime data, UI, or auth |
| `xa-uploader-submission-ux` | UI-heavy | UI state + i18n changes; rendering path specification risk |
| `xa-uploader-image-autosave-reliability` | Data/integration-heavy | Autosave queue + conflict retry; data contract assumptions |

---

## Plan 1: workflow-skills-simulation-tdd (Process-heavy)

**Existing critique findings (from archive):** Delivery order (TASK-01 before TASK-02/03/04), checkpoint gate enforcement, cross-reference consistency of shared protocol path — all structural, addressed by Phase 7.5.

**Delivery rehearsal — four lenses:**

| Lens | Finding | Outcome |
|---|---|---|
| Data | All inputs are existing SKILL.md files; no database records, fixtures, or runtime data required | None |
| Process/UX | No user-visible flows; all changes are agent-read markdown files | None |
| Security | No auth boundaries or permission changes | None |
| UI | No UI components | None |

**Outcome classification:** Null result — no net-new findings.
**Interpretation:** Expected for process-only plans. The null result is a positive signal: the delivery rehearsal confirms readiness without adding noise. Phase 7.5 already handled the meaningful risks for this plan type.

---

## Plan 2: xa-uploader-submission-ux (UI-heavy)

**Existing critique findings (from archive):** `reason` propagation chain (TASK-01), `submissionStep` state coexistence with `submissionAction` (TASK-02), i18n key coverage, test `data-cy` vs `data-testid` distinction — structural and logic issues, all caught by Phase 7.5 and critique.

**Delivery rehearsal — four lenses:**

| Lens | Finding | Outcome |
|---|---|---|
| Data | No database records or external data dependencies; i18n bundles exist; state is in-memory | None |
| Process/UX | TASK-01: fallback behavior when `reason` is absent is explicitly specified ("falls back to current behavior when absent"). TASK-02: entry/happy/clear-on-reset specified in constraints. | None |
| Security | No auth boundary changes | None |
| UI | **[Minor]** TASK-02: plan specifies `submissionStep` state management path (`useCatalogConsoleState` + `useCatalogConsole` composition) but does not name the specific UI component that renders the in-flight label. The rendering component is implied by the `submissionAction` pattern but is left implicit. | Same-outcome: specifying rendering context is within TASK-02 scope |

**Net-new findings from delivery rehearsal:** 1 (Minor)
**Phase 7.5 would catch this?** No. Phase 7.5 checks type contracts, ordering, config keys. "Which UI component renders this state?" is not a structural topology question — it is a rendering path specification question.
**Same-outcome justification:** Confirming the rendering component is within TASK-02's existing scope (same acceptance criteria, same affected files). No new task required — executor confirms against `submissionAction` pattern in same files.
**Scope bleed?** None.

---

## Plan 3: xa-uploader-image-autosave-reliability (Data/integration-heavy)

**Existing critique findings (from archive):** Race condition ordering (TASK-01 → TASK-02 dependency), sync-lock interaction, test harness setup for rapid-upload simulation — structural, covered by Phase 7.5.

**Delivery rehearsal — four lenses:**

| Lens | Finding | Outcome |
|---|---|---|
| Data | **[Minor]** TASK-02: the conflict-safe retry relies on detecting a "revision mismatch" between the in-flight draft and the server state. The plan states "revision conflict" and "revision mismatch" as the trigger condition but does not cite the specific API response field or contract that provides this signal. The assumption that this field exists is carried implicitly from the existing cloud-draft contract. | Same-outcome: TASK-02's acceptance criteria already covers retry behavior; naming the revision field is clarifying detail within existing scope |
| Process/UX | TASK-03: error state (autosave fails + retry fails) is covered by "explicit manual Save fallback copy" in the plan. Entry/happy/error states are all specified. | None |
| Security | No auth boundary changes | None |
| UI | **[Minor]** TASK-03: plan specifies status state (`saving/saved/unsaved`) and composition point (`useCatalogConsole` `submissionState` block, lines 452–460) but does not name the UI component that renders the status label in the uploader console. Rendering context is implied as operator-facing but is not a named component. | Same-outcome: specifying rendering location is within TASK-03 scope; mirrors existing `submissionAction` display pattern |

**Net-new findings from delivery rehearsal:** 2 (both Minor)
**Phase 7.5 would catch these?** No.
- Data lens finding: Phase 7.5 checks "missing data dependency" in the task-output sense (does a prior task produce what a later task consumes). It does not check "does the specified API response field that drives the retry logic actually exist in the contract?" — that is a runtime data specification question.
- UI lens finding: Phase 7.5 checks type contracts and integration boundaries, not rendering component specification.
**Same-outcome justification:** Both findings are clarifications within existing task scope. No new tasks required.
**Scope bleed?** None.

---

## Pilot Summary

| Plan | Type | Phase 7.5 findings | Delivery rehearsal findings | Net-new | Scope bleed |
|---|---|---|---|---|---|
| workflow-skills-simulation-tdd | Process-heavy | Structural (ordering, consistency) | None | 0 | No |
| xa-uploader-submission-ux | UI-heavy | Structural + logic | 1 Minor (UI rendering path) | 1 | No |
| xa-uploader-image-autosave-reliability | Data/integration | Structural (ordering, lock) | 2 Minor (data contract + UI rendering) | 2 | No |
| **Total** | | | | **3** | **None** |

---

## Hypothesis Assessment

**H2 (delivery rehearsal catches issues the structural trace doesn't):** **CONFIRMED.**
- 2 of 3 plans produced net-new findings — both in the UI lens (rendering component specification) and the Data lens (revision signal contract assumption).
- 0 scope bleed events. Same-outcome rule held across all 3 findings.
- Null result on the process-heavy plan is the expected correct behavior (not a false negative — there genuinely is nothing to catch for plans with no data, UX, auth, or UI deliverables).

**Competing hypothesis (delivery rehearsal is redundant with Phase 7.5):** **Falsified.**
- All 3 net-new findings were in categories Phase 7.5 explicitly cannot cover (rendering path, runtime data contract assumption). They are not structural topology issues.

---

## Lens Calibration Notes

- **Data lens** is most valuable for plans with API-contract assumptions or integration-heavy tasks where the runtime data source is implicit.
- **UI lens** is most valuable when new state is introduced — the rendering component is frequently left implicit even in well-specified plans.
- **Process/UX lens** and **Security lens** produced zero findings across all three pilots — likely because the selected plans were operator tools (no auth changes) and the UX flows were well-specified. These lenses likely add more value on consumer-facing plans or plans with auth changes.
- **Recommendation recorded:** The same-outcome tiebreaker rule ("if a new task would directly unblock an existing IMPLEMENT task in the current plan, it may be treated as same-outcome") was not triggered. All findings were within-scope clarifications, not new tasks.

---

## Replan Required?

No. Pilot confirms H2. No scope bleed. No contradictions with plan acceptance criteria. Plan proceeds to completion.
