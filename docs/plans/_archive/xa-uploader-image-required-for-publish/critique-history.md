# Critique History: xa-uploader-image-required-for-publish

## Round 1 — 2026-03-12

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Major | Risks table | Test harness for `catalogConsoleActions.ts` falsely stated absent; file exists with full `handleSaveImpl` + fetch mock harness |
| 1-02 | Moderate | Test Landscape | `branches.test.ts` reference to nonexistent file |
| 1-03 | Moderate | Outcome Contract | First sentence describes already-delivered image storage capability, not the publish-gate gap |
| 1-04 | Minor | Document structure | No explicit `## Open Questions` section (all resolved inline in Remaining Assumptions) |

### Issues Confirmed Resolved This Round
None (first round).

### Issues Carried Open (not yet resolved)
None — all resolved via autofix in this round.

### Autofix Summary
- 1-01: Risks row rewritten to reflect existing harness and Low effort/likelihood
- 1-02: `branches.test.ts` reference removed; `catalogConsoleActions.test.ts` row added to Test Landscape with accurate coverage note
- 1-03: Outcome Contract first sentence removed; kept only "Products cannot go live without at least one image"
- 1-04: Not autofixed (Minor; resolved questions are noted in Remaining Assumptions which is acceptable)

**Score: 4.0 / 5.0 — credible**

## Round 2 — 2026-03-12 (analysis.md)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Moderate | Risks + Planning Handoff | Autosave gate scope left unresolved; gate fires on every autosave when staff mid-edit |
| 2-02 | Minor | Planning Handoff TASK-02 | TC-01/TC-02 not flagged as already-passing regression guards — misleads Red-Green ordering |
| 2-03 | Minor | Fact-Find Reference | `withAutoCatalogDraftFields` absence claim too broad (only absent from `productForSave` construction, not codebase) |

### Issues Confirmed Resolved This Round
None carried from Round 1 (Round 1 was fact-find; Round 2 is first analysis critique).

### Issues Carried Open (not yet resolved)
None — all resolved via autofix in this round.

### Autofix Summary
- 2-01: Risks row rewritten with explicit resolution (`suppressUiBusy !== true` check); TASK-01 updated with concrete guard condition
- 2-02: TC-01/TC-02 framing updated to call out regression-guard nature and correct write order
- 2-03: Scope of `withAutoCatalogDraftFields` claim narrowed to "POST handler `productForSave` construction"

**Score: 4.5 / 5.0 — credible**

## Round 3 — 2026-03-12 (plan.md)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 3-01 | Major | Parallelism Guide + TASK-02 Depends on | TASK-02 depends on TASK-01 making TDD Red step impossible — TC-03 must be written before the guard exists |
| 3-02 | Moderate | TASK-02 Validation contract | TC-04 missing — autosave pass-through (suppressUiBusy: true) not tested; critical to confirm the gate boundary |
| 3-03 | Minor | TASK-02 | `Startup-Deliverable-Alias` field absent from TASK-02 header |
| 3-04 | Minor | TASK-01 | "What would make this >=90%" framing cited future CI run, creating impression of unresolved planning gap |

### Issues Confirmed Resolved This Round
None carried from prior rounds (Rounds 1–2 were fact-find and analysis critiques respectively).

### Issues Carried Open (not yet resolved)
None — all resolved via autofix in this round.

### Autofix Summary
- 3-01: TASK-02 `Depends on` changed to `-`; TASK-01 `Blocks` changed to `-`; Parallelism Guide collapsed to single Wave 1 row with same-session TDD execution note; TASK-02 execution plan Red step rewritten
- 3-02: TC-04 added to TASK-02 Validation contract, Acceptance, and overall Acceptance Criteria; Rehearsal Trace TASK-02 row updated
- 3-03: `Startup-Deliverable-Alias: none` confirmed present in TASK-02 header
- 3-04: "What would make this >=90%" rewritten: "Already at 90% planning confidence. No unresolved unknowns remain. CI pass will confirm delivery."

**Score: 4.0 / 5.0 → 4.5 / 5.0 — credible** (delta justified: 3-01 Major removed; 3-02 Moderate removed; only Minor findings remained after autofix)
