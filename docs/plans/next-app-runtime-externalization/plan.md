---
Type: Plan
Status: Complete
Domain: Infra
Workstream: Engineering
Created: 2026-03-11
Last-reviewed: 2026-03-11
Last-updated: 2026-03-11
Relates-to charter: none
Feature-Slug: next-app-runtime-externalization
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact)
Auto-Build-Intent: code-change
Business-OS-Integration: off
Business-Unit: PLAT
Card-ID: none
---

# Next App Runtime Externalization Plan

## Summary
Move Next.js dev runtime artifacts for repo apps out of each app's source tree so `pnpm --filter <app> dev` can run through the repo's read-only guard path without contending for the writer lock. Standardize this with a shared wrapper that relocates `.next` into the repo's ignored `node_modules/.cache/base-shop-next/...` lane, apply it across all active Next apps, and remove direct `.next/types/**/*.ts` tsconfig includes so `tsc` does not resolve generated validator files through an external symlink target.

## Active tasks
- [x] RT-01: Audit active Next apps, ports, and existing dev/typecheck patterns
- [x] RT-02: Create a shared Next runtime wrapper for externalized per-app caches
- [x] RT-03: Roll wrapper adoption across active Next app `dev` and `typecheck` scripts
- [x] RT-04: Remove direct `.next/types/**/*.ts` tsconfig includes for adopted apps
- [x] RT-05: Validate representative apps for lock-free dev startup and typecheck stability

## Scope
- In scope:
  - `apps/brikette`
  - `apps/business-os`
  - `apps/caryina`
  - `apps/cms`
  - `apps/cochlearfit`
  - `apps/cover-me-pretty`
  - `apps/handbag-configurator`
  - `apps/inventory-uploader`
  - `apps/prime`
  - `apps/product-pipeline`
  - `apps/reception`
  - `apps/skylar`
  - `apps/xa-b`
  - `apps/xa-uploader`
- Out of scope:
  - test-only custom dist-dir harnesses (for example XA uploader e2e)
  - production `next build` output paths
  - non-Next apps and workers

## Constraints
- Dev startup must work under `scripts/agents/integrator-shell.sh --read-only -- ...`
- Runtime caches must be per app and per port
- Existing app-specific `NODE_OPTIONS` and `--webpack` requirements must be preserved
- Typecheck must not depend on stale in-repo `.next` state

## Validation plan
- Start Business OS via the read-only integrator path while another writer lock holder exists
- Typecheck and lint a representative spread of migrated apps:
  - `@apps/business-os`
  - `@apps/reception`
  - `@apps/prime`
  - `@apps/xa-uploader`
  - `@apps/brikette`
