# Critique History: startup-loop-standing-info-gap-analysis

## Round 1 — 2026-02-22

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Major | Gap Matrix, MARKET sequence shape | MARKET stage renumbering vs. extension ambiguity — migration scope (additive vs. renumbering) undefined; ASSESSMENT/MARKET semantic overlap unaddressed |
| 1-02 | Major | Confidence Inputs, Impact row | Self-contradiction: score stated as 82% but "to reach >=80" threshold note implies sub-80 |
| 1-03 | Moderate | Scope, line 32 | Proposed model target is ephemeral — no stable artifact path; gap matrix unverifiable if thread context changes |
| 1-04 | Moderate | Data & Contracts, S4 join | S4 join description omitted three optional inputs (seo, outreach, adjacent_product_research) |
| 1-05 | Moderate | Gap Matrix, MARKET row + Scope | ASSESSMENT↔MARKET stage semantic collision not addressed (problem framing / ICP baseline already in ASSESSMENT-01/02) |
| 1-06 | Moderate | Planning Readiness + Suggested Task Seeds | "Task 00/Decision" referenced in Planning Readiness but absent from task seeds |
| 1-07 | Minor | Data & Contracts, artifact-registry.md:24 | Registry characterised as "offer/channels/forecast/seo only"; briefing_contract entry omitted |
| 1-08 | Minor | Gap Matrix, SELL sequence shape | "SEO/outreach as first-class stages" overstates absence; they exist as secondary_skills in SELL-01 |

### Issues Confirmed Resolved This Round
_None (first critique round)_

### Issues Carried Open (not yet resolved)
_None (first critique round)_

---

## Fact-check Round 1 — 2026-02-22

**Audit anchor:** working tree (HEAD `b18aa4ee5f`; fact-find directory is untracked)

### Claims Verified
- All 16 file/directory references: EXIST ✓
- 14 of 16 line citations: ACCURATE ✓
- LOGISTICS/IDEAS-* grep-count = 0: ACCURATE ✓
- `results-review.user.md` zero-match outside the doc: ACCURATE ✓
- MARKET-01..05 prompt templates (5 files): ACCURATE ✓
- cmd-start.md:159 = "S2/S6 deep research completion" heading: ACCURATE ✓
- AGENTS.md:110/112 = feature workflow / idea generation: ACCURATE ✓

### Inaccuracies Fixed
| Line | Claim | Issue | Fix |
|---|---|---|---|
| 78 (Patterns section) | `loop-spec.yaml:118` for "single directed stage graph" | Line 118 is `- id: ASSESSMENT-01`; `stages:` section starts at line 111 | Changed citation to `loop-spec.yaml:111` |
| Gap Matrix, "Operating model layers" | `loop-spec.yaml:118` | Same line citation error | Changed to `loop-spec.yaml:111` |
| Gap Matrix, "Standing domains" | `Containers: ASSESSMENT, MEASURE, PRODUCT, MARKET, SELL (loop-spec.yaml:118)` | (1) MEASURE is not a container — `MEASURE-01/02` have `stage_group: MEASURE` but no `type: container` block; actual containers at lines 224/280/303/404. (2) Wrong line citation. | Updated to list real containers with correct line citations; noted MEASURE as `stage_group` |

### Autofix Summary
Applied 8 point fixes + 2 consistency-scan cleanup edits. No section rewrites triggered (no section met ≥2 Major threshold). All edits in document order:
1. Scope: added proposed-target-model.md anchor NOTE
2. Data & Contracts: expanded S4 join to list 3 required + 3 optional inputs
3. Gap Matrix MARKET row: added renumbering ambiguity OPEN note and ASSESSMENT/MARKET overlap warning
4. Gap Matrix SELL row: corrected "missing" to "not first-class stage IDs; currently secondary_skills"
5. Gap Matrix Aggregate packs row: corrected registry to 5 entries including briefing_contract
6. Confidence Inputs Impact: fixed "To reach >=80" → "To reach >=90"
7. Suggested Task Seeds: added TASK-00 Decision task
8. Planning Readiness: updated blocking items to reference TASK-00 and proposed-target-model.md
9. (Consistency scan) Key Modules / Files: added briefing_contract to artifact list
10. (Consistency scan) Remaining Assumptions: flagged proposed model stability as open risk tied to TASK-00
