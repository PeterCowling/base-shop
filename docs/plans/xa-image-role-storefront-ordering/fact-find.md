---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-04
Last-updated: 2026-03-04
Last-reviewed: 2026-03-04
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-image-role-storefront-ordering
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find
Related-Plan: docs/plans/xa-image-role-storefront-ordering/plan.md
Trigger-Why: storefront gallery still ignores image role semantics
Trigger-Intended-Outcome: type: operational | statement: preserve perspective metadata through sync and enforce front/back/top-first storefront ordering | source: operator
---

# XA Image Role Storefront Ordering Fact-Find

## Scope
Close the remaining gap where `imageRoles` are collected in uploader drafts but dropped before storefront rendering, leaving gallery ordering equal to upload order.

## Outcome Contract
- **Why:** storefront gallery still ignores image role semantics
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** preserve perspective metadata through sync and enforce front/back/top-first storefront ordering
- **Source:** operator

## Evidence Audit (Current State)
- `scripts/src/xa/run-xa-pipeline.ts`
  - At `imageFiles` transform (`line 423` region), media entries were built with `{ type, path, altText }` only.
  - `imageRoles` was not read, so roles were dropped in local sync.
- `apps/xa-uploader/src/lib/catalogDraftToContract.ts`
  - Cloud sync path likewise built media entries without role.
- `apps/xa-b/src/lib/demoData.ts`
  - Runtime media mapping did not include or sort by role.
- `apps/xa-b/src/components/XaImageGallery.client.tsx`
  - Gallery list was `media.filter(isImage)` (`line 35` region), preserving upload order.

## Resolved Questions
- Q: Is this local-only or both local/cloud sync?
  - A: Both. Two independent transform paths dropped role metadata.
  - Evidence: `run-xa-pipeline.ts` and `catalogDraftToContract.ts`.
- Q: Can ordering be enforced without paid infra?
  - A: Yes. Pure transformation/rendering change; no infrastructure changes.
  - Evidence: role metadata already captured in draft fields.

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Role taxonomy drift between schema and storefront logic | Medium | Medium | Introduce shared role utility in `@acme/lib/xa` and consume from both pipeline + storefront |
| Existing items without role remain unsorted | Medium | Low | Keep stable fallback order for missing roles and place unknown roles last |

## Planning Readiness
- Status: Ready-for-planning
- Recommended next step: `/lp-do-build`
