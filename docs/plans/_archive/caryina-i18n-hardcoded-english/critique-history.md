---
Type: Working-Notes
Status: Active
Domain: UI
Last-reviewed: 2026-03-12
---

# Critique History: caryina-i18n-hardcoded-english

## Round 1 (fact-find) — 2026-03-12

Target: `fact-find.md`

- Verdict: credible
- Score: 4.6/5.0
- Critical: 0
- Major: 0
- Moderate: 1
- Minor: 1

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| FF-1-01 | Moderate | `Root Cause` | Dispatch `current_truth` stated "components have hardcoded English text" — investigation proved this false. Root cause is in the data layer, not component code. |
| FF-1-02 | Minor | `Approach Options` | Materializer durability risk understated as the deciding factor for Option A over B/C. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| FF-1-01 | Moderate | Dispatch mischaracterised root cause | Investigation section explicitly states all components are locale-aware; root cause confirmed as data layer only |
| FF-1-02 | Minor | Materializer durability risk understated | Approach comparison expanded; durability risk called out as primary selection criterion for Option A |

---

## Round 1 (plan) — 2026-03-12

Target: `plan.md`

- Verdict: credible
- Score: 4.1/5.0
- Critical: 0
- Major: 2
- Moderate: 3
- Minor: 3

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| PL-1-01 | Major | `Summary`, `Goals`, `Acceptance` | String count stated as 27 throughout; actual count in `CHROME_EN_DEFAULTS` is 25 (header 3 + footer 7 + consent 5 + trust 3 + notifyMe 7) |
| PL-1-02 | Major | TASK-02 `Execution plan` | `readPayload` is not exported — mock strategy incorrectly described as possible at module boundary; correct approach (no mocking, real JSON without chrome) not committed to |
| PL-1-03 | Moderate | TASK-02 `Acceptance` | `testIdAttribute: data-cy` criterion is irrelevant for a pure function test with no DOM rendering |
| PL-1-04 | Moderate | TASK-02 `Risks` | "trial-and-error" language in risk row not confidence-appropriate for a plan |
| PL-1-05 | Moderate | TASK-01 `Scouts` | "exactly one hit" for grep may confuse (definition at 268 + usage at 307 = 2 hits) |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| PL-1-01 | Major | String count 27 → 25 | Fixed throughout: summary, goals, acceptance criteria now say 25 strings / 50 values |
| PL-1-02 | Major | Mock strategy under-specified | Execution plan updated: `readPayload` private → no mocking needed; real JSON without chrome drives `CHROME_DEFAULTS` path; `jest.isolateModules()` documented for cache isolation |
| PL-1-03 | Moderate | Irrelevant DOM test criterion | Replaced with "pure function assertions only, no DOM testing setup" |
| PL-1-04 | Moderate | trial-and-error risk language | Risk row updated to `cachedPayload` singleton isolation issue with concrete mitigation |
| PL-1-05 | Moderate | Scout grep "exactly one hit" ambiguous | N/A: scout instruction retained as-is; clarification in planning validation section sufficient |

---

## Round 1 (analysis) — 2026-03-12

Target: `analysis.md`

- Verdict: credible
- Score: 4.1/5.0
- Critical: 0
- Major: 2
- Moderate: 3
- Minor: 3

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| AN-1-01 | Major | `Fact-Find Reference` | Two different `SiteContentPayload` types conflated: runtime type in `contentPacket.ts` (has `chrome?`) vs materializer type (no `chrome`). Distinction matters for understanding durability risk accurately. |
| AN-1-02 | Major | `Planning Handoff` | `_manualExtension` guard in `site-content.generated.json` never surfaced — it explicitly warns against running materializer without porting trustStrip and chrome. Material operational risk omission. |
| AN-1-03 | Moderate | `Fact-Find Reference` | notifyMe string count "7 + 2 edge" annotation in fact-find unresolved — actual count is 7 (no edge case). |
| AN-1-04 | Moderate | `Planning Handoff` | TASK-03 timing gap: note said "same commit as TASK-02" but didn't explain why atomic swap matters while translations are being authored in TASK-01. |
| AN-1-05 | Moderate | `Planning Handoff` | Actual EN string values for the 3 sentence-length strings not included for build executor reference. |
| AN-1-06 | Minor | `End-State Operating Model` | Section was sparse; did not state source-of-truth migration from JSON to code explicitly. |
| AN-1-07 | Minor | `Risks` | i18n parity audit scope left as UNVERIFIED in fact-find; not addressed or carried forward in analysis. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| AN-1-01 | Major | Two `SiteContentPayload` types conflated | Fact-Find Reference updated to explicitly separate runtime type (has `chrome?`) from materializer type (no chrome); clarified materializer's type is authoritative for JSON output |
| AN-1-02 | Major | `_manualExtension` guard not surfaced | Added to Fact-Find Reference findings; added to Planning Handoff risks; Risks table updated with materializer guard as separate row |
| AN-1-03 | Moderate | notifyMe string count inconsistency | Confirmed actual count is 7; "7 + 2 edge" annotation was an error in the fact-find table; 27-string total is correct |
| AN-1-04 | Moderate | TASK-03 timing gap | Planning Handoff explicitly states TASK-02 and TASK-03 must be same commit and explains why (JSON chrome would still win if only code is updated) |
| AN-1-05 | Moderate | Sentence-length strings not included | Planning Handoff TASK-01 now includes actual EN values for `consent.message`, `notifyMe.consent`, `notifyMe.validation` |
| AN-1-06 | Minor | End-State Operating Model sparse | Section updated to state source-of-truth migration explicitly and note the JSDoc comment requirement |
| AN-1-07 | Minor | Parity audit scope unresolved | Added as explicit check in TASK-04 planning and as a risk row in Risks to Carry Forward |
