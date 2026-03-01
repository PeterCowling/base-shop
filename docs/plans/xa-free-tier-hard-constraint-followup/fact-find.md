---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-01
Last-updated: 2026-03-01
Last-reviewed: 2026-03-01
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-free-tier-hard-constraint-followup
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Type: code-change
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find
Related-Plan: docs/plans/xa-free-tier-hard-constraint-followup/plan.md
---

# XA Free Tier Hard Constraint Follow-up Fact-Find

## Scope
Implement hard technical guardrails that keep XA uploader + storefront operations free-tier-safe even if environment variables drift.

## Confirmed Gaps
- Upload/catalog byte limits accepted larger env values than free-tier-safe envelopes.
- Token TTL allowed values beyond current free-tier operational posture.
- Sync success payloads did not explicitly communicate build/deploy dependency for storefront display.
- Bulk data endpoint returned single error message only; lacked bounded per-row diagnostics for operator correction.

## Decisions
- Clamp byte + TTL limits to free-tier-safe ceilings in runtime code.
- Add explicit display-sync guidance in sync response payload.
- Add bounded per-row validation diagnostics for bulk API failures.
- Add tests to lock these behaviors.

## Residual Risk
- Live product display still depends on xa-b build/deploy cycle (architectural by design).
- Media lane remains metadata/assignment-first in cloud path.

## Planning Readiness
- Status: Ready-for-planning
- Recommended execution: implement clamps + diagnostics + response guidance + tests in one scoped build tranche.
