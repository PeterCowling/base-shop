---
Type: OpportunityQueue
Generated: 2026-02-28T08:26:51.607Z
Source: docs/plans/startup-loop-token-efficiency-v2/deterministic-extraction-analysis.md
Decisions: Implement now, Backlog
Status: Active
---

# Auto Opportunity Execution Queue

Generated from analysis payback categories. Default order is Implement now, then Backlog.

| Queue-ID | Source | Candidate | Decision | Payback months | Payback ROI | Expected ROI | Status | Execution notes |
|---|---|---|---|---:|---:|---:|---|---|
| CORE-1 | core | Confidence threshold enforcement (confidence-scoring-rules.md) | Implement now | 2.37 | 5.05x | 2.53x | Pending | Use candidate #1 implementation notes and proposed artifacts in analysis.md. |
| CORE-2 | core | Build eligibility gate (lp-do-build, lp-do-plan) | Implement now | 2.37 | 5.05x | 2.53x | Pending | Use candidate #2 implementation notes and proposed artifacts in analysis.md. |
| SCOUT-H1:lp-do-fact-find | scout | lp-do-fact-find | Implement now | 2.37 | 5.05x | 2.53x | Pending | Modularize/orchestrator trim opportunity from audit; prefer thin orchestrator + module extraction. |
| CORE-11 | core | Evidence cap rules (confidence-scoring-rules.md) | Implement now | 2.44 | 4.93x | 2.46x | Pending | Use candidate #11 implementation notes and proposed artifacts in analysis.md. |
| CORE-4 | core | Canonical path resolver (workspace-paths.md) | Implement now | 2.51 | 4.79x | 2.39x | Pending | Use candidate #4 implementation notes and proposed artifacts in analysis.md. |
| CORE-3 | core | Plan frontmatter schema validation (lp-do-plan, lp-do-build) | Implement now | 2.63 | 4.56x | 2.28x | Pending | Use candidate #3 implementation notes and proposed artifacts in analysis.md. |
| CORE-5 | core | lp-do-sequence topological sort (seq-algorithm.md) | Implement now | 2.72 | 4.41x | 2.21x | Pending | Use candidate #5 implementation notes and proposed artifacts in analysis.md. |
| CORE-6 | core | Critique autofix trigger rule (lp-do-critique) | Implement now | 2.72 | 4.41x | 2.21x | Pending | Use candidate #6 implementation notes and proposed artifacts in analysis.md. |
| CORE-20 | core | Business fail-first caps (confidence-scoring-rules.md) | Implement now | 2.72 | 4.41x | 2.21x | Pending | Use candidate #20 implementation notes and proposed artifacts in analysis.md. |
| SCOUT-H2:lp-sequence | scout | lp-sequence | Implement now | 2.75 | 4.36x | 2.18x | Pending | Dispatch-candidate from audit; adopt dispatch contract only when domains are parallelizable. |
| SCOUT-H3:lp-sequence | scout | lp-sequence | Implement now | 2.75 | 4.36x | 2.18x | Pending | Wave-dispatch advisory; add protocol reference only if execution actually runs in waves. |
| CORE-8 | core | Deliverable routing validator (deliverable-routing.yaml) | Backlog | 3.21 | 3.74x | 1.87x | Pending | Use candidate #8 implementation notes and proposed artifacts in analysis.md. |
| CORE-12 | core | Fact-find status gate (lp-do-fact-find) | Backlog | 3.21 | 3.74x | 1.87x | Pending | Use candidate #12 implementation notes and proposed artifacts in analysis.md. |
| CORE-7 | core | Critique score stability rule (lp-do-critique) | Backlog | 3.36 | 3.57x | 1.78x | Pending | Use candidate #7 implementation notes and proposed artifacts in analysis.md. |
| CORE-18 | core | Critique round-iteration rules (critique-loop-protocol.md) | Backlog | 3.36 | 3.57x | 1.78x | Pending | Use candidate #18 implementation notes and proposed artifacts in analysis.md. |
| CORE-9 | core | lp-do-worldclass state machine (lp-do-worldclass) | Backlog | 3.66 | 3.28x | 1.64x | Pending | Use candidate #9 implementation notes and proposed artifacts in analysis.md. |
| CORE-10 | core | lp-do-worldclass goal_contract_hash (modules/goal-phase.md) | Backlog | 3.66 | 3.28x | 1.64x | Pending | Use candidate #10 implementation notes and proposed artifacts in analysis.md. |
| CORE-17 | core | lp-do-assessment-14 quality gate (logo brief, 16 checks) | Backlog | 3.93 | 3.06x | 1.53x | Pending | Use candidate #17 implementation notes and proposed artifacts in analysis.md. |
| CORE-13 | core | lp-do-build wave dispatch parser (lp-do-build) | Backlog | 3.95 | 3.03x | 1.52x | Pending | Use candidate #13 implementation notes and proposed artifacts in analysis.md. |
| CORE-15 | core | Startup-loop stage ID validator (check-startup-loop-contracts.sh SQ-01D) | Backlog | 3.95 | 3.03x | 1.52x | Pending | Use candidate #15 implementation notes and proposed artifacts in analysis.md. |
| CORE-16 | core | Assessment artifact discovery (lp-do-assessment-14-logo-brief) | Backlog | 3.95 | 3.03x | 1.52x | Pending | Use candidate #16 implementation notes and proposed artifacts in analysis.md. |
| CORE-14 | core | Plan archiving trigger check (_shared/plan-archiving.md) | Backlog | 4.76 | 2.52x | 1.26x | Pending | Use candidate #14 implementation notes and proposed artifacts in analysis.md. |
| CORE-19 | core | Stage-doc API key policy (workspace-paths.md) | Backlog | 5.19 | 2.31x | 1.16x | Pending | Use candidate #19 implementation notes and proposed artifacts in analysis.md. |

## Execution Protocol

1. Execute all `Implement now` rows first, top-to-bottom.
2. Execute all `Backlog` rows second, top-to-bottom.
3. After each implementation, update `Status` and append validation evidence in this file.
4. If blocked, set `Status=Blocked` with reason and continue to next row.