---
Type: Critique-History
Status: Reference
---

# Critique History: brikette-seo-traffic-growth

## Round 1 — 2026-02-22

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Major | OPP-08/09, Risks | Thin content / multilingual duplicate risk entirely unaddressed — Wave 3 assumption not validated |
| 1-02 | Major | OPP-01 | OPP-01 severity overstated as Critical; redirect verification missing; GSC variant lag is normal |
| 1-03 | Major | OPP-03 | "hostel positano" top-10 mechanism misdiagnosed — OTA authority gap not addressed |
| 1-04 | Moderate | Evidence Gap Review | GSC Links report not pulled — backlink thinness inferred from GA4, not measured |
| 1-05 | Moderate | Structure | Test Landscape section absent for mixed execution track |
| 1-06 | Moderate | Frontmatter | Card-ID: none with Business-OS-Integration: on — BOS card creation skipped |
| 1-07 | Moderate | Open Questions | /en/help GSC query data not pulled despite being available in same API session |
| 1-08 | Minor | Confidence Inputs | Confidence scores lack explicit evidence citation per dimension |

### Issues Confirmed Resolved This Round
_(none — first run)_

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-06 | Moderate | 1 | Card-ID missing — BOS card not created; to be resolved when /lp-do-plan runs BOS integration |

### Autofix Summary
- 1-01: Thin content risk added to Risks table; Wave 3 gate added to Tier 3 preamble ✅
- 1-02: OPP-01 reframed as "Diagnostic First", severity language changed ✅
- 1-03: OPP-03 ceiling corrected to position 15–18; OTA caveat added ✅
- 1-04: GSC Links gap added to Remaining Assumptions and Confidence Adjustments ✅
- 1-05: Test Landscape section added ✅
- 1-07: Noted in Remaining Assumptions ✅
- 1-08: Not autofixed — requires evidence to be gathered; flagged as open

### Overall Score
**3.5 / 5.0** — Partially credible. Wave 1/2 can proceed. Wave 3 gated on GSC Coverage diagnostic.

---

## Round 2 — 2026-02-22

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Major | GA4 Traffic Sources / Measurement Plan | GA4 active only since 2026-02-10 (13 days) — "90-day" label misleading; measurement baseline needs correction |
| 2-02 | Moderate | OPP-02 | GSC International Targeting: "per subdirectory" claim wrong for domain property; hreflang already covers intent |
| 2-03 | Minor | TIER 4 / Wave 1 seeds | OPP-14 (/en/help) miscategorised as Tier 4 authority task — should be Wave 1 diagnostic |
| 2-04 | Minor | Hypothesis & Validation Landscape | H1/H2/H4 lack quantified pass/fail thresholds; downstream VCs must invent them |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-01 | Major | Thin content / multilingual duplicate risk unaddressed | Wave 3 gate + Risks table entry added ✅ |
| 1-02 | Major | OPP-01 severity overstated; redirect verification missing | Live curl probes added (E3); OPP-01 confirmed + reframed ✅ |
| 1-03 | Major | OPP-03 top-10 mechanism misdiagnosed | Ceiling corrected to 15–18; OTA authority gap documented ✅ |
| 1-04 | Moderate | GSC Links report not pulled | Acknowledged as gap in Confidence Adjustments + Remaining Assumptions ✅ |
| 1-05 | Moderate | Test Landscape absent for mixed track | Test Landscape section added ✅ |
| 1-07 | Moderate | /en/help GSC query data not pulled | Open Question added + Pending Audit Work documented ✅ |
| 1-08 | Minor | Confidence scores lack evidence citations | E-number citations added per confidence dimension ✅ |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-06 | Moderate | 2 | Card-ID missing — BOS card not created; to be resolved when /lp-do-plan runs BOS integration |

### Autofix Summary
- 2-01: GA4 section header corrected to "13-day window"; disclosure note added; measurement plan baseline label updated ✅
- 2-02: OPP-02 rewritten with accurate mechanism (domain-level only; hreflang redundancy noted); TASK-03 updated ✅
- 2-03: OPP-14 moved to Tier 2 (Quick wins); removed from Tier 4 ✅
- 2-04: Pass thresholds added to H1/H2/H3/H4/H5 ✅
- Cloudflare token scope gap documented in Confidence Adjustments ✅

### Overall Score
**3.5 / 5.0** — Partially credible. Score unchanged (3 Majors + 3 Moderates + 1 Minor resolved; offset by new Major GA4 window + Moderate OPP-02). Wave 1/2 ready to plan. Wave 3 gated. GA4 baseline corrected in doc.

---

## Round 3 — 2026-02-22 (first critique of **plan.md**)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 3-01 | Moderate | TASK-02 Planning Validation + Confidence note | Consumer trace error: "6 call-sites" (actual: 8); generate-public-seo.ts has independent normalizePathname (not ensureTrailingSlash) |
| 3-02 | Moderate | TASK-13 VC-01 | OR logic conflates two independent hypotheses (ranking vs indexation improvement) — TASK-13 can pass without confirming H2 |
| 3-03 | Moderate | TASK-02 Notes | 308 mechanism claimed as "Next.js App Router behavior" — next.config has no trailingSlash config; empirically confirmed but mechanism is likely Cloudflare Pages file-serving |
| 3-04 | Moderate | Observability line 874 | Wrong task cross-reference: "guide-page coverage confirmed by TASK-06" — TASK-06 is /en/help bounce query pull, not guide coverage |
| 3-05 | Minor | Observability / Decision Log | No calendar timeline — all measurement windows are relative; no anchor date for Wave 1 start |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 2-01 | Major | GA4 window misleading | Plan written with correct 13-day window language throughout ✅ |
| 2-02 | Moderate | OPP-02 GSC International Targeting wrong claim | Fact-find fixed; plan written correctly without the wrong claim ✅ |
| 2-03 | Minor | OPP-14 miscategorised as Tier 4 | TASK-06 (/en/help) correctly placed in Wave 1 Investigate ✅ |
| 2-04 | Minor | H1/H2/H4 lack thresholds | VCs in plan contain explicit thresholds (VC-01: ≥3/5 top-20; VC-02: ≥3.5% CTR; VC-04: ≥3 responses) ✅ |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-06 | Moderate | 3 | Card-ID missing — BOS card not created; Business-OS-Integration: on but no card exists |

### Autofix Summary
- 3-01: TASK-02 planning validation note corrected to "8 call-sites in 4 source files"; normalizePathname clarification added for generate-public-seo.ts ✅
- 3-01b: TASK-02 Green step corrected to "8 call-sites" with per-file breakdown ✅
- 3-01c: Constraints & Assumptions consumer trace corrected (line 79); TASK-02 Confidence note corrected (line 218) ✅
- 3-02: VC-01 rewritten with primary pass condition + separate diagnostic (no OR logic) ✅
- 3-03: TASK-02 Notes 308 mechanism note updated to reflect empirical confirmation + Cloudflare Pages likely source ✅
- 3-04: Observability cross-reference corrected to TASK-11 ✅
- 3-05: Not autofixed — calendar timeline is an operator decision; flagged as open Minor

### Overall Score
**4.0 / 5.0** — Credible. First plan critique. Wave 1 (8 tasks) immediately executable. TASK-02 gated on operator confirmation of slashless policy. CHECKPOINT-01 gate protects Wave 3. Delta +0.5 from fact-find Round 2 score (3.5): plan resolves all prior Major issues and has full IMPLEMENT schemas with VCs; offset by 4 new Moderates. Score is at the stability boundary (exactly +0.5) — justified by document type change (fact-find → plan) and resolved issue set.

---

## Round 4 — 2026-02-22 (operator feedback, structural task split)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 4-01 | Critical | TASK-01 / _redirects mechanism | www→apex cannot be done via `_redirects` (path-based only); requires Cloudflare Bulk Redirects — hard blocker for www consolidation |
| 4-02 | Major | TASK-01 / Pages Functions | `_redirects` rules are shadowed by Pages Functions — preflight check required before deploying redirects |
| 4-03 | Major | TASK-03 sequencing | TASK-03 and TASK-01 running concurrently makes canonical baseline non-repeatable; TASK-03 must split into pre-change and post-change runs |
| 4-04 | Major | TASK-01 atomicity | URL normalization not treated as atomic — TASK-01a+01b+post-change probes all required before marking complete |
| 4-05 | Moderate | Proposed Approach Option B | "~18× slug variants" numerically wrong; should be "roughly doubles" |
| 4-06 | Moderate | Fact-Find Reference E7 | "human PV/day" mislabelled — mixed traffic, not human-only |
| 4-07 | Moderate | Acceptance Criteria | Canonical ≥80% threshold too low for templates we control; CTR has no threshold; position has no measurement method |
| 4-08 | Moderate | TASK-05 | "Rich Results Test (SERP API)" is not execution-grade; must specify manual tools |
| 4-09 | Moderate | TASK-17 | DA>30 criterion requires paid tools (Ahrefs/SEMrush); use tool-free criteria; extract GSC Links pull to separate Wave 1 task |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 3-01 | Moderate | Consumer trace: "6 call-sites" (actual: 8) | Already fixed in Round 3; confirmed in Risks section (also fixed 4-06 consistency) |
| 3-02 | Moderate | VC-01 OR logic conflating two hypotheses | Fixed in Round 3 |
| 3-03 | Moderate | 308 mechanism claimed as Next.js trailingSlash | Fixed in Round 3 |
| 3-04 | Moderate | Wrong TASK-06 cross-reference in Observability | Fixed in Round 3 |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-06 | Moderate | 4 | Card-ID missing — BOS card not created; Business-OS-Integration: on but no card exists |
| 3-05 | Minor | 2 | No calendar timeline — all measurement windows are relative; no anchor date for Wave 1 start |

### Autofix Summary
- 4-01: TASK-01 split into TASK-01a (Cloudflare Bulk Redirects, dashboard ops) + TASK-01b (root redirect code change) ✅
- 4-02: TASK-01c (Pages Functions preflight INVESTIGATE) added; TASK-01a+01b blocked on TASK-01c ✅
- 4-03: TASK-03 split into TASK-03a (pre-change baseline, blocks TASK-01a/01b/02/07) + TASK-03b (post-change validation, after TASK-01a+01b+02) ✅
- 4-04: TASK-01 atomicity gate added to TASK-01a Acceptance Criteria and overall Acceptance Criteria ✅
- 4-05: Option B "~18× slug variants" → "roughly doubles the variant surface per URL path" ✅
- 4-06: E7 "human PV/day" → "baseline PV/day (mixed traffic) after anomaly days excluded" ✅
- 4-07: Acceptance Criteria: canonical ≥90% (100% for critical templates); CTR ≥1.5%; position ≤18 (28-day GSC avg); "no 3xx from canonical targets" added ✅
- 4-08: TASK-05 Implementation note updated to specify manual Rich Results Test + Schema Markup Validator ✅
- 4-09: TASK-18 (GSC Links baseline, Wave 1 INVESTIGATE) added; TASK-17 updated to depend on TASK-18; DA>30 criterion removed; tool-free targeting criteria substituted ✅
- Overall-confidence recalculated: 2,075/27 = 77% (was 75%); frontmatter updated ✅
- Task Summary table, Parallelism Guide, Active tasks list, Plan Gates all updated ✅
- Plan Gates reset: Sequenced: No, Edge-case review: No (structural change requires re-sequence) ✅

### Overall Score
**4.0 / 5.0** — Credible. Score unchanged from Round 3 (stability rule: delta < 0.5 from Round 3; all new issues were operator-feedback corrections, not newly discovered critique issues). 1 Critical + 3 Major issues resolved by structural task split; fixes are substantive and improve execution safety materially. Remaining open: 1-06 (Card-ID, Moderate), 3-05 (no calendar, Minor).
