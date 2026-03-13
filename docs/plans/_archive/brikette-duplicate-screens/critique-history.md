# Critique History: brikette-duplicate-screens

## Round 1 — 2026-03-13

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Moderate | Evidence Audit > Key Modules | `readAttribution` attributed to wrong source file (`ga4-events.ts`; actual: `entryAttribution.ts`) |
| 1-02 | Moderate | Evidence Audit > Patterns | Dark mode border drift understated — 3 elements affected, only WhatsApp CTA named |
| 1-03 | Minor | Suggested Task Seeds | INVESTIGATE task seed unnecessary — transport mode confirmed beacon in `trackThenNavigate.ts:69` |
| 1-04 | Minor | Evidence Audit > Patterns | `trackThenNavigate` + `readAttribution` call description imprecise — attribution fields built manually, not via combined call |

### Issues Confirmed Resolved This Round
All 4 issues resolved by autofix in same round.

| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-01 | Moderate | Wrong source file for `readAttribution` | Key Modules corrected; `trackThenNavigate.ts` and `entryAttribution.ts` added |
| 1-02 | Moderate | Dark mode scope understated | Expanded to all 3 affected elements with line references |
| 1-03 | Minor | Unnecessary INVESTIGATE task seed | Removed; field-parity + null guard folded into IMPLEMENT acceptance criteria |
| 1-04 | Minor | Attribution call description imprecise | Patterns section updated with explicit null guard note and field names |

### Issues Carried Open (not yet resolved)
None.

### Final Score
**4.0 / 5.0 — credible**

## Round 2 — 2026-03-13 (analysis.md)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Moderate | Planning Handoff > Validation implications | `apartment-booking-url-matrix.test.tsx` mocks `fireHandoffToEngine` but not named as needing update after analytics migration |
| 2-02 | Minor | Constraints & Assumptions | `fireHandoffToEngine` "other callers may exist" is unsupported — zero other runtime callers confirmed |
| 2-03 | Minor | Planning Handoff > Sequencing constraints | Soft ordering ("analytics first") inconsistent with independence claim |

### Issues Confirmed Resolved This Round
All 3 issues resolved by autofix in same round.

| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 2-01 | Moderate | Second test file not named in validation | Expanded validation bullet to include both test files with explicit mock change instructions |
| 2-02 | Minor | Caller count not verified | Constraint updated: dead code implication noted, cleanup out of scope |
| 2-03 | Minor | Soft ordering vs independence inconsistency | Analysis left as-is (acceptable directional note; planning will sequence correctly) |

### Issues Carried Open (not yet resolved)
None.

### Final Score (analysis)
**4.5 / 5.0 — credible**

## Round 3 — 2026-03-13 (plan.md)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 3-01 | Major | TASK-01 Affects / TASK-03 Affects / TASK-03 Notes | Wrong path for `ga4-07-apartment-checkout.test.tsx` — stated `test/app/private-rooms/…`, actual `test/components/…` (3 occurrences) |
| 3-02 | Moderate | TASK-01 Acceptance | `ga4-07` mock change described as "remove `fireHandoffToEngine` mock" — file uses `jest.requireActual` spread; no explicit mock to remove |

### Issues Confirmed Resolved This Round
All 2 issues resolved by autofix in same round.

| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 3-01 | Major | Wrong test file path (3 locations) | All 3 occurrences corrected to `apps/brikette/src/test/components/ga4-07-apartment-checkout.test.tsx` |
| 3-02 | Moderate | Inaccurate `ga4-07` mock change instruction | Acceptance criterion rewritten: add `trackThenNavigate` + `readAttribution` mocks; explicit note that no `fireHandoffToEngine` removal is needed |

### Issues Carried Open (not yet resolved)
None.

### Final Score (plan)
**4.5 / 5.0 — credible**
