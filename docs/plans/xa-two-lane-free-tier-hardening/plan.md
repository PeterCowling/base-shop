---
Type: Plan
Status: Complete
Domain: Engineering
Workstream: Platform
Created: 2026-03-01
Last-reviewed: 2026-03-01
Last-updated: 2026-03-01
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-two-lane-free-tier-hardening
Execution-Track: code
Deliverable-Type: code-change
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find
Overall-confidence: 86%
Confidence-Method: min(Implementation,Approach,Impact)
artifact: plan
---

# XA Two-Lane + Free-Tier Hardening Plan

## Summary
Implement dispatches `0085-0092` as one sequenced stream with strict two-lane contracts and Cloudflare free-tier-safe defaults.

## Active tasks
- [x] TASK-01: Runtime safety guardrails for local-FS-dependent uploader routes (`0085`)
- [x] TASK-02: Reduce uploader/drop-worker payload defaults to free-tier-safe envelope (`0089`)
- [x] TASK-03: Add explicit media role schema and CSV mapping (`0087`, `0088`)
- [x] TASK-04: Add uploader UI fields/defaults for image roles (`0086`, `0087`)
- [x] TASK-05: Surface catalog freshness status in xa-b homepage (`0090`)
- [x] TASK-06: Token lifecycle hardening additions + tests (`0091`)
- [x] TASK-07: Complete two-lane E2E/contract test matrix (`0092`)
- [x] TASK-08: Queue-state progression to processed/completed for dispatches 0085-0092

## Implementation notes (completed)
- Added `apps/xa-uploader/src/lib/localFsGuard.ts` and integrated guards in:
  - `apps/xa-uploader/src/app/api/catalog/products/route.ts`
  - `apps/xa-uploader/src/app/api/catalog/products/[slug]/route.ts`
  - `apps/xa-uploader/src/app/api/catalog/submission/route.ts`
  - `apps/xa-uploader/src/app/api/catalog/sync/route.ts`
- Free-tier sizing:
  - uploader submission default: `25MB`
  - drop-worker default max upload: `25MB`
  - per-image uploader cap during packaging: `8MB`
- Schema/mapping:
  - `imageRoles` added to draft schema with category-required roles.
  - `media_paths` now built from role:path pairs.
- Freshness surface:
  - stale catalog warning rendered on xa-b homepage when runtime data exceeds freshness threshold.

## Validation run
- `pnpm --filter @acme/lib build` PASS
- `pnpm --filter @apps/xa-uploader typecheck` PASS
- `pnpm --filter @apps/xa-uploader lint` PASS (existing warnings only in untouched currency route)
- `pnpm --filter @apps/xa-drop-worker typecheck && lint` PASS
- `pnpm --filter @apps/xa-b typecheck && lint` PASS (existing warnings only)

