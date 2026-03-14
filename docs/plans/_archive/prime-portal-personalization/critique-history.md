# Critique History: prime-portal-personalization

## Round 1 — 2026-03-13

**Target:** `docs/plans/prime-portal-personalization/fact-find.md`
**Schema mode:** Current (Fact-Find)
**Overall score:** 4.0 / 5.0
**Verdict:** credible
**Severity distribution:** Critical: 0 | Major: 0 | Moderate: 3 | Minor: 2

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Moderate | Risks table | `fetchViaFullScan` passive data exposure (all bookings root downloaded for un-indexed occupants) not in risks table — higher-probability exposure than intentional tamper |
| 1-02 | Moderate | Planning Constraints | `AuthSessionContext` null/empty failure mode not addressed — trading url tamper fragility for new context SPOF |
| 1-03 | Moderate | Dependency & Impact Map | `validateGuestToken` caller enumeration incomplete; TASK-02 blast radius underspecified |
| 1-04 | Moderate | Suggested Task Seeds | TASK-08 ordering inversion — tests cannot accurately cover hardened uuid behavior until TASK-04 (AuthSessionContext) exists |
| 1-05 | Minor | Non-goals | "Firebase RTDB rules out of scope" understates operator dependency for final priority classification |
| 1-06 | Minor | Execution Routing Packet | Post-delivery measurement plan cites "7 days" with no pre-release baseline |

### Issues Confirmed Resolved This Round

None (first round).

### Issues Carried Open (not yet resolved)

None — all 6 issues autofixed in this round.

### Autofix Summary

- Fix 1: Added 2 new rows to Risks table (`fetchViaFullScan` exposure, `AuthSessionContext` null failure mode).
- Fix 2: Added `validateGuestToken` caller enumeration to Dependency & Impact Map with explicit note that full grep required before TASK-02.
- Fix 3: Added `AuthSessionContext` failure-mode constraint to Planning Constraints & Notes.
- Fix 4: Added ordering dependency note to TASK-08 in Suggested Task Seeds.
- Fix 5: Clarified Non-goals RTDB rules entry to specify "out-of-codebase-scope" and operator confirmation requirement.
- Fix 6: Added pre-release baseline requirement to post-delivery measurement plan.

---

## Round 2 — 2026-03-13

**Target:** `docs/plans/prime-portal-personalization/analysis.md`
**Schema mode:** Current (Analysis)
**Overall score:** 4.0 / 5.0
**Verdict:** credible
**Severity distribution:** Critical: 0 | Major: 0 | Moderate: 3 | Minor: 2

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Moderate | Planning Handoff | Section crosses analysis/task-decomposition boundary — 9 TASK bullets with implementation specifics belong in plan.md, not analysis |
| 2-02 | Moderate | Chosen Approach / app/page.tsx seam | Root-page seam identified but deferred to planning instead of decided in analysis — agent-resolvable, not operator-only |
| 2-03 | Moderate | Chosen Approach | Graceful degradation contract buried in Engineering Coverage table — not present in primary Chosen Approach narrative |
| 2-04 | Minor | Planning Handoff | TASK-06 leaves `/api/assistant-query` auth model as unconfirmed without flagging the scoping risk |
| 2-05 | Minor | Risks to Carry Forward | TASK-02/TASK-07 CI ordering risk not listed as a risk |

### Issues Confirmed Resolved This Round

| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-01 | Moderate | `fetchViaFullScan` not in risks | Fact-find fix confirmed; analysis carried risk forward explicitly |
| 1-02 | Moderate | AuthSessionContext null failure mode | Degradation contract added to Chosen Approach in this round (autofix) |
| 1-03 | Moderate | `validateGuestToken` caller enumeration incomplete | 4 callers confirmed in analysis; blast radius noted in constraints and planning handoff |
| 1-04 | Moderate | TASK-08 ordering inversion | Ordering constraint noted in analysis; planning handoff corrected (2-01 partial overlap) |
| 1-05 | Minor | RTDB rules scope understated | Operator question preserved in Open Questions with explicit planning impact |
| 1-06 | Minor | Post-delivery measurement plan lacks baseline | TASK-09 (pre-release baseline capture) explicit in planning handoff |

### Issues Carried Open (not yet resolved)

None — all 5 issues autofixed in this round.

### Autofix Summary

- Fix 1: Added null-both-absent degradation contract to `## Chosen Approach` (2-03).
- Fix 2: Added explicit decision for `app/page.tsx` root-page seam to `## Chosen Approach` "What it depends on" paragraph (2-02).
- Fix 3: Full section rewrite of `## Planning Handoff` — compressed 9 TASK bullets to 5 approach-level focus areas; added explicit CI ordering constraint for TASK-02/TASK-07; added TASK-06 endpoint inspection requirement (2-01, 2-04, 2-05).
- Fix 4: Updated `## Risks to Carry Forward` `app/page.tsx` row from "plan must decide" to "decided" with reduced impact rating (2-02).
- Fix 5: Consistency scan — updated `GuardedGate` and `uuid resolution` rows in End-State Operating Model to reflect the decided `app/page.tsx` exclusion (orphaned terminology cleanup).

---

## Round 3 — 2026-03-13

**Target:** `docs/plans/prime-portal-personalization/plan.md`
**Schema mode:** Current (Plan)
**Overall score:** 4.0 / 5.0
**Verdict:** credible
**Severity distribution:** Critical: 0 | Major: 0 | Moderate: 2 | Minor: 2

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 3-01 | Moderate | TASK-03 execution plan | React 18 batching mechanism not specified — "same sync block" claim incorrect for async useEffect without explicit batching explanation |
| 3-02 | Moderate | TASK-04 execution plan | Mismatch telemetry destination unspecified — `logger.warn` may be console-only; observable sink not confirmed |
| 3-03 | Minor | TASK-06 edge cases | Missing-cookie auth path returns 400 (from validateGuestSessionToken null) not 401; must be explicitly guarded |
| 3-04 | Minor | Plan frontmatter | `Last-reviewed` field absent (required by plan-lens) |

### Issues Confirmed Resolved This Round

| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 2-01 | Moderate | Planning handoff crossed task-decomposition boundary | Analysis fixed; plan uses approach-level handoff; tasks properly decomposed in plan.md |
| 2-02 | Moderate | app/page.tsx seam deferred | Resolved in analysis; plan inherits the decision with code comment instruction in TASK-04 |
| 2-03 | Moderate | Degradation contract buried in engineering coverage | Added to Chosen Approach in analysis; reflected in plan constraints |
| 2-04 | Minor | TASK-06 pre-investigation requirement | Inspection done in planning — confirmed `/api/assistant-query` uses body-token path; TASK-06 scoped correctly |
| 2-05 | Minor | TASK-02/TASK-07 CI risk not listed | Explicit blocking dependency in plan Task Summary; enforced in Parallelism Guide |

### Issues Carried Open (not yet resolved)

None — all 4 issues autofixed in this round.

### Autofix Summary

- Fix 1: Added React 18 automatic batching explanation to TASK-03 Green execution step (3-01).
- Fix 2: Updated TASK-04 Green execution step to use `recordActivationFunnelEvent` pattern (observable analytics sink) instead of bare `logger.warn` (3-02).
- Fix 3: Added explicit 401 guard before `validateGuestSessionToken(null)` call in TASK-06 edge cases (3-03).
- Fix 4: Added `Last-reviewed: 2026-03-13` to plan frontmatter (3-04).
