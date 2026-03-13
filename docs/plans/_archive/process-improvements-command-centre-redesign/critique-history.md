# Critique History — process-improvements-command-centre-redesign

## Round 1

- **Date:** 2026-03-13
- **Route:** codemoot (gpt-5.4, medium reasoning)
- **Raw output:** `critique-raw-output.json`
- **codemoot score:** 7/10 → **lp_score: 3.5** (partially credible)
- **Verdict:** needs_revision
- **Severity counts:** Critical: 0 | Major (warning): 6 | Minor (info): 1

### Findings

| Severity | Finding |
|---|---|
| Major | B6 ("overallConfidence shows raw —") is not a real bug — `InProgressInbox.tsx:282` already guards it |
| Major | "8 confirmed data-accuracy bugs" claim inconsistent — B8 is visual, B6 is not present in code |
| Major | B4 root cause misstated — API (`/api/process-improvements/items`) already returns `activePlans`; stale badge is because no client subscriber derives `newIdeasCount` from that data |
| Major | Test coverage understated — `InProgressInbox.test.tsx` covers TC-07 (active-now), TC-08 (handoff in-flight), TC-09 (agent observation), not just snooze |
| Major | Rollout/rollback section treats BOS as local-dev-only; it is a live production Workers deployment |
| Major | Dark theme section conflates reference image navy palette with existing `packages/themes/dark/tokens.css` near-black values |
| Minor | "Not-A-Bug Clarifications" section materially improves the brief |

### Autofixes Applied
- B6 and B7 reclassified to "Not-A-Bug Clarifications" table with code evidence
- B4 root cause corrected to reflect API already returning `activePlans`
- Bug count updated to "5 confirmed + 1 visual artefact"
- Test coverage table expanded with TC-07, TC-08, TC-09 rows
- Rollout section updated to acknowledge production Workers deployment
- Dark theme section now clearly distinguishes reference image palette (navy, net-new) from existing dark theme tokens (near-black, not to be copied)

---

## Round 2

- **Date:** 2026-03-13
- **Route:** codemoot (gpt-5.4, medium reasoning, resumed session)
- **Raw output:** `critique-raw-output.json` (overwritten)
- **codemoot score:** 8/10 → **lp_score: 4.0** (credible)
- **Verdict:** needs_revision (3 residual warnings; no criticals)
- **Severity counts:** Critical: 0 | Major (warning): 3 | Minor (info): 1

### Findings

| Severity | Finding |
|---|---|
| Major | Internal inconsistency: test approach still said "B1–B7", task seeds still said "B1–B7", evidence gap review still said "all 8 bugs" — bug count not fully propagated from round 1 fixes |
| Major | Dark-theme Key Modules note (`packages/themes/dark/tokens.css`) still incorrectly stated it was a reference for navy values, contradicting the later corrected architecture section |
| Major | Sub-nav data-plumbing seam under-specified — `ProcessImprovementsSubNav` has no props; `InProgressCountBadge` pattern insufficient for shared nav counts |
| Minor | "Not-A-Bug Clarifications" section confirmed as an improvement |

### Autofixes Applied
- All "B1–B7" references updated to "B1–B5" throughout (test approach, evidence gap review)
- `packages/themes/dark/tokens.css` key module note corrected to state it uses near-black (not navy) and is NOT the target palette
- Sub-nav data-plumbing resolved: option (a) — sub-nav polls `/api/process-improvements/items` on mount — documented in Resolved Questions
- Task seed #8 (sub-nav redesign) updated with specific data-plumbing approach

### Final verdict: **credible** — lp_score 4.0/5.0, 0 Critical findings. Proceeding to completion.

---

## Analysis — Round 1 (lp-do-analysis)

- **Date:** 2026-03-13
- **Route:** codemoot (gpt-5.4, medium reasoning, resumed session)
- **Raw output:** `critique-raw-output.json` (overwritten)
- **codemoot score:** 8/10 → **lp_score: 4.0** (credible)
- **Verdict:** needs_revision
- **Severity counts:** Critical: 0 | Major (warning): 2 | Minor (info): 1

### Findings

| Severity | Finding |
|---|---|
| Major | Phase 1 under-specifies B4 — analysis said `newIdeasCount` derived from `activePlans`; actual derivation requires `items` + `inProgressDispatchIds` (API at `route.ts:22–27` returns both but `InProgressInbox.tsx:450` discards them) |
| Major | Sub-nav decision presented as settled but planning handoff hard-committed to polling while "Why this wins" section said "planning must select" — internal inconsistency |
| Minor | Analysis materially cleaner than fact-find; B6/B7 correctly excluded; palette distinction preserved |

### Autofixes Applied
- B4 handoff corrected: `newIdeasCount` requires destructuring `items` + `inProgressDispatchIds` from auto-refresh payload; `InProgressInbox` type assertion must expand accordingly
- Sub-nav: opened planning choice (polling vs. shared context) with both tradeoffs documented

---

## Analysis — Round 2 (lp-do-analysis)

- **Date:** 2026-03-13
- **Route:** codemoot (gpt-5.4, medium reasoning, resumed session)
- **Raw output:** `critique-raw-output.json` (overwritten)
- **codemoot score:** 9/10 → **lp_score: 4.5** (credible)
- **Verdict:** needs_revision (2 residual warnings; no criticals)
- **Severity counts:** Critical: 0 | Major (warning): 2 | Minor (info): 1

### Findings

| Severity | Finding |
|---|---|
| Major | Sub-nav strategy still internally inconsistent — "Why this wins" said choice remains open but planning handoff (line 182) and validation (line 187) hard-committed to polling |
| Major | Dependency contract stale — `What it depends on` section still only mentioned `activePlans`; after B4 correction the payload contract is `{ items, recentActions, activePlans, inProgressDispatchIds }` |
| Minor | B4 handoff materially improved from Round 1 — now matches actual route.ts payload and InProgressInbox.tsx limitation |

### Autofixes Applied
- Sub-nav: chose polling decisively (option a); removed "planning must select" framing; updated end-state model row and planning handoff to be consistent
- Dependency contract updated: now references full API payload `{ items, recentActions, activePlans, inProgressDispatchIds }` at `route.ts:22–27`

### Final verdict: **credible** — lp_score 4.5/5.0, 0 Critical findings. No Round 3 triggered (no criticals remaining). Proceeding to validators.

---

## Plan — Round 1 (lp-do-plan)

- **Date:** 2026-03-13
- **Route:** codemoot (gpt-5.4, medium reasoning, resumed session)
- **Raw output:** `critique-raw-output.json` (overwritten)
- **codemoot score:** 7/10 → **lp_score: 3.5** (partially credible)
- **Verdict:** needs_revision
- **Severity counts:** Critical: 1 | Major (warning): 4 | Minor (info): 1

### Findings

| Severity | Finding |
|---|---|
| Critical | TASK-05 CSS override contract wrong — plan specified `--color-surface-1/2/3` and `--color-muted` with `hsl()` wrappers; actual underlying vars are `--surface-1/2/3` and `--color-fg-muted` with raw HSL triplets |
| Major | TASK-02 internally inconsistent — acceptance/execution plan expanded `useInProgressAutoRefresh` but Scouts said standalone component with own poll |
| Major | TASK-09 `inProgressCount` semantics ambiguous — allowing `activePlans.length` vs snoozed filter creates count drift with `InProgressCountBadge` |
| Major | TASK-01 B3 claim wrong — `InboxSection` `childCount` already matches item count for `.map()` call sites; not a confirmed accuracy bug |
| Major | Plan marked `Auto-build eligible: Yes` but TASK-07 is `IMPLEMENT` at 75% confidence (below 80% threshold) |
| Minor | TASK-02 materially improved — B4 tied to real refresh payload in `route.ts` |

### Autofixes Applied
- TASK-05: CSS vars corrected to `--surface-1/2/3` + `--color-fg-muted` with raw HSL triplets (no `hsl()` wrapper); note added explaining `--surface-1` → `bg-surface-1` propagation chain
- TASK-02: Committed to standalone `LiveNewIdeasCount` architecture; removed type assertion expansion; execution plan updated to match
- TASK-09: `inProgressCount` pinned to snooze-filtering logic matching `InProgressCountBadge`
- TASK-01 B3: Reclassified from "confirmed data bug" to "code quality improvement — explicit count prop"
- Auto-build gate: Clarified with note that TASK-07 requires replan at TASK-06 CHECKPOINT; Waves 1–5 all ≥80%

---

## Plan — Round 2 (lp-do-plan)

- **Date:** 2026-03-13
- **Route:** codemoot (gpt-5.4, medium reasoning, resumed session)
- **Raw output:** `critique-raw-output.json` (overwritten)
- **codemoot score:** 8/10 → **lp_score: 4.0** (credible)
- **Verdict:** needs_revision (4 residual warnings; no criticals)
- **Severity counts:** Critical: 0 | Major (warning): 4 | Minor (info): 1

### Findings

| Severity | Finding |
|---|---|
| Major | Summary and overall acceptance still said "5 confirmed data-accuracy bugs" after B3 reclassification |
| Major | TASK-02 still had two incompatible implementations — acceptance/execution plan expanded `useInProgressAutoRefresh`, Scouts said standalone component |
| Major | TASK-05 sub-nav theme inconsistent — one line said "remain on light surface", another said it inherits dark; Phase 2 gate said "dark or light" |
| Major | TASK-07 overdue scout stale — `isOverdue` already at `projection.ts:87` and `NewIdeasInbox.tsx:145`; "investigate" framing incorrect |
| Minor | TASK-05 CSS token contract now materially better |

### Autofixes Applied
- Summary and overall acceptance updated: "4 confirmed data-accuracy bugs + 1 code quality improvement (B3)"
- TASK-02: Fully committed to standalone badge architecture; removed all type assertion expansion references from acceptance, execution plan, and consumer tracing
- TASK-05 sub-nav: Committed to dark palette (intentional); TASK-06 gate updated; Scouts note removed
- TASK-07 overdue: Scout updated to state `isOverdue` already confirmed at `projection.ts:87`; stale fallback removed from Risks table and Rehearsal Trace

### Final verdict: **credible** — lp_score 4.0/5.0, 0 Critical findings. No Round 3 triggered (no criticals remaining). Proceeding to validators.

