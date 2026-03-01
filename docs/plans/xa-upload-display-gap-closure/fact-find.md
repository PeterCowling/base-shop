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
Feature-Slug: xa-upload-display-gap-closure
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Type: code-change
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find
Related-Plan: docs/plans/xa-upload-display-gap-closure/plan.md
---

# XA Upload-to-Display Gap Closure Fact-Find

## Scope
Close concrete operational gaps from the current uploader-to-storefront path:
- Cloud-mode publish blocked by local-FS/script dependency
- No API-level bulk data ingestion path
- Draft read path not least-privilege tokenized
- Cloud-mode submission endpoint hard-fails

## Evidence
- `apps/xa-uploader/src/app/api/catalog/sync/route.ts` blocked cloud mode with `local_fs_unavailable`.
- `apps/xa-uploader/src/app/api/catalog/submission/route.ts` blocked cloud mode with `local_fs_unavailable`.
- `apps/xa-drop-worker/src/index.ts` used write-token guard for draft reads.
- No dedicated bulk endpoint under `apps/xa-uploader/src/app/api/catalog/products/`.

## Decisions
- Add cloud-native sync branch that builds/publishes contract payload directly from cloud draft snapshot.
- Add bulk products upsert endpoint for lane-1 data ingestion.
- Keep local sync lane intact; add cloud branch rather than replacing local behavior.
- Harden draft reads with read-token semantics when configured.
- Add cloud submission fallback that emits export ZIP from draft data without local file scanning.

## Residual Risk
- `xa-b` still renders from build-time runtime catalog files; contract publish does not hot-update live pages until next build/deploy.
- Media binary ingestion remains non-first-class in cloud (current cloud submission fallback exports data package, not local-media bundle).

## Planning Readiness
- Status: Ready-for-planning
- Recommended execution: implement code + tests for cloud sync, bulk API, token hardening, and cloud submission fallback.
