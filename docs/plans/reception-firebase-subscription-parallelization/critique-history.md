# Critique History: reception-firebase-subscription-parallelization

## Round 1 — 2026-03-08

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Moderate | Risks row 3 + Planning Constraints | Offline cache prefill strategy hand-wavy: "individual hooks' wrappers OR cache provider's startListening" — these are architecturally different; no commitment made |
| 1-02 | Moderate | Dependency & Impact Map / Suggested Task Seeds | Secondary call-sites of `useActivitiesByCodeData` not analyzed; codes arrays unknown; partial migration leaves those call-sites unchanged |
| 1-03 | Moderate | Scope vs Dependency Map vs Suggested Task Seeds | PrepareDashboard overlap inconsistently labelled "advisory — included in scope" but has no task seed; blast radius claimed "all 9 replaced" contradicts 3/9 migration |

### Issues Confirmed Resolved This Round
_(No prior critique — first round)_

### Issues Carried Open (not yet resolved)
_(No prior critique — first round)_

### Autofix Applied This Round
- Risks table row 3: updated mitigation to commit to `prefill` extension pattern; raised Impact to High
- Planning Constraints: added bullet requiring prefill extension before migrating IndexedDB-cached hooks
- Suggested Task Seeds: added scope note (3/9 migration, 6 excluded, PrepareDashboard as TASK-3 sub-task)
- Dependency & Impact Map: `useActivitiesByCodeData` call-sites annotated with "codes array not read" and per-component hook caveat
- Blast radius row 1: corrected from "all 9 subscriptions" to "3 of 9 in Phase 1"
- Blast radius row 2: PrepareDashboard labelled as "in scope as sub-task of TASK-3"

### Final Score This Round
- Score: 3.5 / 5.0
- Verdict: credible
- Severity distribution: Critical 0 / Major 0 / Moderate 3 / Minor 2
- All 3 Moderate findings addressed via autofix. No rounds required.

## Round 2 — 2026-03-08 (Plan critique, Round 1 for plan.md)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Critical | TASK-03 Acceptance + Consumer Tracing | `useBookingsData` migration assumes all call sites use default params — false: `useBookingSearchClient.tsx:53` passes `{startAt, endAt}` or `{limitToFirst:500}`; `BookingDetailsModal.tsx:46` passes `{startAt, endAt}`; full-tree cache key would silently serve all records to filtered callers |
| 2-02 | Major | TASK-03 Consumer Tracing | Consumer tracing incomplete: plan lists 4 consumers for `useBookingsData`; actual count is 10+ direct call sites; two are parameterized |
| 2-03 | Major | TASK-03 Approach | `useActivitiesData` also parameterized: `useBookingSearchClient.tsx:75` calls `useActivitiesData({ limitToFirst: LIMIT })`; same data-corruption risk as `useBookingsData`; not verified at planning time |
| 2-04 | Moderate | TASK-01 Validation Contract | TC-02 wording implies `getEntry` controls loading state; implementation must use a second `setCache` call after prefill resolves — sequence not spelled out; subtle error would pass mock tests but fail in real usage |
| 2-05 | Moderate | TASK-03 Acceptance | Schema validation location (hook vs provider) left as an open question in Acceptance; build agent needs a definitive answer before implementation |
| 2-06 | Moderate | TASK-03 Confidence | 80% confidence overclaiming given Critical unknown (parameterized call sites) deferred to Scout; corrected pre-verification score would be ~60-65% |
| 2-07 | Minor | TASK-05 tracking | TASK-05 listed as standalone tracked task AND stated as merged into TASK-03 Refactor step; ambiguous for build agent |

### Issues Confirmed Resolved This Round
_(No prior plan critique — first round for plan.md; all issues opened and resolved in this round via autofix)_

| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 2-01 | Critical | useBookingsData parameterized callers | TASK-03 reclassified from IMPLEMENT to INVESTIGATE; migration gated on call-site audit |
| 2-02 | Major | Consumer tracing incomplete | TASK-03 INVESTIGATE now requires full call-site enumeration as acceptance criterion |
| 2-03 | Major | useActivitiesData parameterized callers | Same resolution as 2-01; TASK-03 audit covers all three hooks |
| 2-05 | Moderate | Schema validation location | Resolved: Acceptance now states validation remains in hook subscriber callback (provider is type-agnostic) |
| 2-06 | Moderate | Confidence overclaiming | TASK-03 reclassified to INVESTIGATE at 95%; Overall-confidence recalculated to 88% |
| 2-07 | Minor | TASK-05 tracking ambiguity | TASK-05 now independent (no TASK-03 dependency); Decision Log updated |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 2-04 | Moderate | 1 | TC-02 loading state sequence not spelled out in TASK-01 Acceptance; build agent may misimplement the prefill-to-loading transition |

### Final Score This Round
- Score: 3.5 / 5.0 (post-autofix; critical finding resolved; remaining open: 1 Moderate)
- Pre-autofix score: 3.0 / 5.0 (1 Critical cap applied)
- Verdict: credible (post-autofix)
- Severity distribution (pre-autofix): Critical 1 / Major 2 / Moderate 3 / Minor 1
- Severity distribution (post-autofix): Critical 0 / Major 0 / Moderate 1 / Minor 0
- Delta from fact-find critique (Round 1): Plan critique is a separate document; no direct delta applies. IMPLEMENT tasks (TASK-01, 02, 04, 05) are credible at 85-95% confidence. TASK-03 correctly gated as INVESTIGATE.
