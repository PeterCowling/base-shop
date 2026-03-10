---
Type: Plan
Status: Complete
Domain: Business-OS
Workstream: Startup-Loop
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-stockist-target-list
Deliverable-Type: business-artifact
Startup-Deliverable-Alias: none
Execution-Track: business-artifact
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Startup Loop Stockist Target List Plan

## Summary
This build adds a canonical `stockist-target-list.user.md` artifact for product businesses that need a standing place to track prospective and active retail/distribution doors before they become live channel-health entries. The immediate use case is HBAG's Caryina resort-boutique rollout, but the loop change is replicated into the other active product businesses so the structure stays aligned across product-oriented startup loops.

## Active tasks
- [x] TASK-01: Add the stockist-target-list contract to GTM-2 in the process registry
- [x] TASK-02: Create the HBAG stockist target list and wire it into the HBAG strategy index
- [x] TASK-03: Replicate the stockist target list artifact into HEAD and PET and wire their indexes

## Goals
- Create a canonical standing artifact for pre-live stockist targeting and expansion planning.
- Capture HBAG's current boutique rollout thesis in a structured, reusable operating surface.
- Keep the product-business loop structure aligned across HBAG, HEAD, and PET.

## Non-goals
- Launch new physical-retail channels for HEAD or PET.
- Replace `channel-health-log.user.md` as the source of live channel actuals.
- Define CAP-02 message-testing schema or broader GTM-3 sales-ops changes.

## Decision log
- 2026-03-09: Replication scope limited to `HBAG`, `HEAD`, and `PET` because they are the active product businesses with standing startup-loop artifacts. `BRIK` is hospitality. `PWRB` is not yet operating an active startup-baseline loop to mirror into.

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Canonicalize `stockist-target-list.user.md` under GTM-2 in the process registry | 90% | S | Complete (2026-03-09) | - | TASK-02,TASK-03 |
| TASK-02 | IMPLEMENT | Create HBAG stockist target list and connect it to the existing boutique pilot loop | 88% | S | Complete (2026-03-09) | TASK-01 | - |
| TASK-03 | IMPLEMENT | Replicate the stockist target list artifact into HEAD and PET indexes/artifacts | 85% | S | Complete (2026-03-09) | TASK-01 | - |

## Acceptance Criteria
- [x] `docs/business-os/startup-loop/process-registry-v2.md` recognizes `stockist-target-list.user.md` as a GTM-2 artifact for physical-product retail-led businesses.
- [x] `docs/business-os/strategy/HBAG/stockist-target-list.user.md` exists and captures the current Caryina rollout structure.
- [x] `docs/business-os/strategy/HEAD/stockist-target-list.user.md` and `docs/business-os/strategy/PET/stockist-target-list.user.md` exist as canonical placeholders for future stockist work.
- [x] HBAG, HEAD, and PET strategy indexes reference the new artifact.

## Validation
- Targeted document review for internal consistency and path correctness.
- `rg -n "stockist-target-list.user.md|GTM-2"` across changed startup-loop and business strategy docs.
- Manual review that live-channel facts remain in `channel-health-log.user.md` and pre-live target capture lives in `stockist-target-list.user.md`.

## What would make this >=90%
- Add one build cycle where a stockist target transitions from `stockist-target-list.user.md` into `channel-health-log.user.md` in two separate businesses.
- Add CAP-02 message-capture support so retailer feedback language and target-door notes share a canonical measurement surface.
