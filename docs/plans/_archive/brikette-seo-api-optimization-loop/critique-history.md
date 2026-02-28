# Critique History: brikette-seo-api-optimization-loop

## Round 1 — 2026-02-25

Overall score: **4.0/5.0** — credible

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Moderate | Hypothesis H2 | datePublished cannot affect discovery of pages Google has never crawled — logical sequencing error; reframed as post-discovery quality fix |
| 1-02 | Moderate | Planning Constraints / Execution Routing | Monitoring cadence missing: execution method (manual), rotation math (~42 weeks full coverage), stagnation escalation (0 transitions in 6 weeks → replan) |
| 1-03 | Moderate | Execution Routing Packet | No stagnation escalation defined for null monitoring results; Week 6 checkpoint vague |
| 1-04 | Minor | Hypothesis H1 signal coverage row | TASK-14 residual gap unquantified — ~12% of unreachable guides now reachable; majority unchanged |
| 1-05 | Minor | Questions Resolved Q6 | Rotation math omitted from monitoring sample size answer |

### Issues Confirmed Resolved This Round

None (Round 1).

### Issues Carried Open (not yet resolved)

None (all fixed in autofix phase this round).

---

## Round 2 — 2026-02-25

Target: `docs/plans/brikette-seo-api-optimization-loop/plan.md`
Overall score: **3.5/5.0** — partially credible (pre-fix); **4.0/5.0** — credible (post-fix, see note below)

Note: Round 1 was a fact-find critique, not a plan critique. Round 2 is the first critique of the plan document.

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Critical | TASK-02, TASK-03, TASK-06 Type field + Task Summary | IMPLEMENT tasks at 75%/75%/70% confidence violate ≥80% build gate (AGENTS.md line 230); auto-build would halt |
| 2-02 | Major | TASK-03 Confidence/Affects/Execution plan | Implementation description mischaracterises architecture: fix requires HeadSection.tsx interface extension + GuideSeoTemplateBody threading, not a 2-call-site patch; 90% Implementation confidence unsupported |
| 2-03 | Major | TASK-05 Depends on / Parallelism Guide | TASK-01 dependency on TASK-05 creates unnecessary Wave 2 serialization; Indexing API submission itself does not require TASK-01 |
| 2-04 | Moderate | TASK-03 Scout / HowToGetHereContent.tsx | HowToGetHereContent.tsx Props type has no `lastUpdated` field (confirmed); data access is a blocking question, not a "minor scout risk" as stated |
| 2-05 | Moderate | TASK-06 Type + conditional gate | TASK-06 is typed IMPLEMENT at 70% (below gate) and has no decision gate conditioned on TASK-05 verdict; if Indexing API eligible, TASK-06 is redundant |
| 2-06 | Moderate | TASK-05 Planning Validation | Indexing API scope/verified-owner pre-check is a parenthetical note; must be an explicit acceptance criterion to prevent TASK-05 stalling at auth |
| 2-07 | Minor | TASK-04 Validation contract | No TC-XX identifiers; other tasks have explicit pass/fail criteria; weakens executor clarity |
| 2-08 | Minor | Plan Gates / Auto-build eligible | Stated as "Yes — TASK-01 at 80%" without noting that TASK-02, TASK-03, TASK-06 gates are not yet cleared |

### Issues Confirmed Resolved This Round

| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-01 | Moderate | Fact-find H2 logical sequencing | Resolved in fact-find autofix Round 1; not a plan-level issue |
| 1-02 | Moderate | Monitoring cadence missing in fact-find | Resolved in fact-find autofix Round 1; plan fully includes cadence protocol |
| 1-03 | Moderate | Stagnation escalation missing in fact-find | Resolved in fact-find autofix Round 1; plan includes 6-week stagnation trigger |
| 1-04 | Minor | TASK-14 residual gap unquantified | Resolved in fact-find autofix Round 1 |
| 1-05 | Minor | Rotation math omitted | Resolved in fact-find autofix Round 1 |

### Issues Confirmed Resolved By Autofix This Round

| ID | Severity | Summary | How resolved |
|---|---|---|---|
| 2-01 | Critical | IMPLEMENT tasks below ≥80% gate | TASK-02, TASK-03, TASK-06 reclassified to SPIKE; build-gate notes added per task; Plan Gates updated to "Partial" |
| 2-02 | Major | TASK-03 architecture mischaracterised | Full TASK-03 section rewrite: correct Affects list (HeadSection.tsx, GuideSeoTemplateBody.tsx), correct execution plan (3-file threading chain), Implementation confidence reduced to 75%, SPIKE type |
| 2-03 | Major | TASK-05 unnecessary serialization | TASK-05 Depends-on changed to "-"; TASK-01 Blocks updated to "TASK-04" only; Parallelism Guide updated to move TASK-05 submission to Wave 1 |
| 2-04 | Moderate | HowToGetHereContent.tsx scope gap | Elevated from minor scout to blocking Scout 2 in TASK-03; planning validation updated with confirmed findings |
| 2-05 | Moderate | TASK-06 no conditional gate | Conditional gate added ("proceed only if TASK-05 ineligible/inconclusive"); TASK-06 depends on TASK-05; Decision Log updated |
| 2-06 | Moderate | TASK-05 scope pre-check parenthetical | Added explicit pre-flight acceptance criterion to TASK-05 |
| 2-07 | Minor | TASK-04 validation contract missing TC-XX | TC-11, TC-12, TC-13 identifiers added with explicit pass conditions |
| 2-08 | Minor | Auto-build eligible overstated | Plan Gates updated to "Partial" with per-task gate status |

### Issues Carried Open (not yet resolved)

None — all issues from this round resolved in autofix phase.
