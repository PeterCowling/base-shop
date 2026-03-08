---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: BOS
Workstream: Engineering
Created: 2026-03-04
Last-updated: 2026-03-04
Feature-Slug: repo-maturity-strictness-hardening
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas
Related-Plan: docs/plans/repo-maturity-strictness-hardening/plan.md
Trigger-Why: The current repository maturity score returns 98/100 despite material engineering gaps in security depth, CI velocity, indexing quality, structure hygiene, OSS acceleration, and advanced math adoption.
Trigger-Intended-Outcome: type: operational | statement: Replace shallow presence scoring with strictness-aware deterministic scoring so Level-5 is only reachable when priority engineering dimensions are genuinely strong. | source: operator
---

# Repo Maturity Strictness Hardening Fact-Find Brief

## Scope
### Summary
Harden the deterministic maturity scanner so the reported level reflects engineering reality rather than broad config/tool presence. The immediate objective is to prevent false Level-5 results when known priority gaps exist.

### Goals
- Add strictness-aware machine-detectable dimensions aligned to operator priorities.
- Introduce deterministic score caps when high-risk gaps are present.
- Preserve static-repo-only extraction (no runtime telemetry dependency).

### Non-goals
- Runtime observability redesign.
- Full CI pipeline architecture refactor.
- Security framework migration in this cycle.

### Constraints & Assumptions
- Constraints:
  - Must remain deterministic and static-analysis based.
  - Must run quickly enough for routine bridge execution.
- Assumptions:
  - Queue dispatches `IDEA-DISPATCH-20260304092559-0065` and `IDEA-DISPATCH-20260304101633-0661` anchor this workstream.

## Outcome Contract
- **Why:** The current maturity score is too permissive and hides important operational risk.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Replace shallow maturity scoring with strictness-aware deterministic scoring so Level-5 requires demonstrably strong security, CI speed hygiene, structural/indexing quality, and frontier capability adoption.
- **Source:** operator

## Evidence Audit (Current State)
### Key findings
- Current scorer is heavily boolean/presence based and maps >=90 to Level-5.
- Repo currently scores 98/100 with full scan despite documented CI/security/indexing issues.
- CI workflows repeatedly run setup/install across jobs and include long critical-path gates.
- Security controls are uneven; policy is minimal and deep static security gates are sparse.
- Math package capability is broad; advanced module adoption is comparatively narrow.
- Structural/indexing debt is material (README/index coverage gaps, duplicate component surfaces, root noise files).

### Key files
- `scripts/src/startup-loop/ideas/repo-maturity-signals.ts`
- `scripts/src/startup-loop/ideas/lp-do-ideas-codebase-signals-bridge.ts`
- `.github/workflows/ci.yml`
- `.github/workflows/reusable-app.yml`
- `.github/workflows/merge-gate.yml`

## Confidence Inputs
- Implementation: 88%
- Approach: 85%
- Impact: 90%
- Delivery-Readiness: 88%
- Testability: 82%

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Over-penalizing mature repos | Medium | Medium | Keep caps tied to explicit measurable conditions with emitted cap reasons |
| New score semantics surprise downstream consumers | Medium | Medium | Keep schema additive and preserve existing category score fields |
| Scanner runtime growth | Low | Medium | Restrict expensive checks to bounded file subsets and reuse existing file listing |

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None
- Recommended next step:
  - `/lp-do-build` TASK-01 (strictness scoring implementation)
