---
Type: Plan
Status: Archived
Domain: Repo
Last-reviewed: 2026-02-14
Relates-to charter: none
Last-updated: 2026-02-14
Last-updated-by: Codex (archived)
Archived-Date: 2026-02-14
Audit-Ref: working-tree
Audit-Date: 2026-02-14
---

# Guide System — Phase 3 Candidates

> Captured from the [Unified Guide System Plan](guide-system-unification-plan.md).
> These are candidates for future work, not committed tasks.

## Active tasks

No active tasks. This is a reference-only candidate list.

## P3-01: Manifest TS to JSON migration

Move guide manifest from TypeScript (`guide-manifest.ts`) to JSON/YAML for non-developer editing.
Would enable business-os to edit manifests without touching source code.

**Status:** Candidate
**Blocked by:** Phase A extraction (completed)

## P3-02: GuideSeoTemplate extraction for testability

Extract the GuideSeoTemplate rendering pipeline into a testable module with clear input/output boundaries.
May be partially superseded by the business-os extraction (Phase A-3).

**Status:** Candidate — partially superseded by Phase A

## P3-03: Content migration tooling

Scripts to migrate guide content between formats (e.g., when block schemas change).
Would automate bulk content updates across 18 locales x 165 guides.

**Status:** Candidate

## P3-04: PR/CI reporting

Generate human-readable guide quality reports in PR comments.
Would surface validation results, coverage changes, and translation gaps directly in PRs.

**Status:** Candidate

## P3-05: Dashboards

Real-time guide health dashboards (validation status, translation coverage, SEO scores).
May be partially superseded by the business-os validation dashboard (Phase A-3).

**Status:** Candidate — partially superseded by Phase A
