---
Type: Fact-Find
Outcome: Planning
Status: Needs-input
Domain: UI
Workstream: Engineering
Created: 2026-02-23
Last-updated: 2026-02-23
Feature-Slug: prime-app-improvement-backlog
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-design-system
Related-Plan: docs/plans/prime-app-improvement-backlog/plan.md
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID: none
direct-inject: true
direct-inject-rationale: User requested /lp-do-fact-find on in-session Prime app audit findings.
---

# Prime App Improvement Backlog Fact-Find Brief

## Scope

### Summary

Prime has stable core infrastructure (typecheck passes and Firebase cost-safety gates pass), but meaningful guest-facing product debt remains: email-linked access pages are incomplete, several homepage-linked guarded routes are placeholder stubs, and full-source lint debt is high (494 issues in ). This fact-find converts current evidence into a planning-ready backlog.

### Goals

- Prioritize guest-impact work where live links currently land on placeholder pages.
- Quantify and segment Prime lint debt by rule and file hotspot for wave-based remediation.
- Identify unfinished operational seams (auth, chat navigation, static contact data).
- Capture test coverage gaps blocking safe refactors in core data orchestration.
- Provide -ready task seeds with explicit blockers and decision owners.

### Non-goals

- Implementing code changes in this cycle.
- Re-running full-repo validation outside Prime scope.
- Rewriting Prime architecture decisions already accepted (staff auth and messaging processor).
- Redesigning Prime visual language from scratch.

### Constraints & Assumptions

- Constraints:
  - Use Prime's existing guarded-route pattern and data hooks (, , ).
  - Keep DS token/lint contracts intact (no raw-color or rule-bypass shortcuts).
  - Preserve Firebase query/listener budget protections as release gates.
  - Keep scope to Prime app + directly coupled templates/docs; no broad cross-app refactors.
- Assumptions:
  -  and  are business-critical because templates T06/T07/T10 route guests there.
  - Stub-route cleanup should precede deep lint/i18n cleanup because it affects live guest journeys.
  - i18n scope decisions may gate full hardcoded-copy closure but should not block Wave 1 route/functionality fixes.

## Evidence Audit (Current State)

### Entry Points

- Homepage task/service routing points guests to guarded routes, including current stubs:
  - 
  - 
- Main-door page still placeholder content:
  - 
- Multiple guarded pages remain coming
