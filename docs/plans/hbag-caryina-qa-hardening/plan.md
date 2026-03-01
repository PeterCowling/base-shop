---
Type: Plan
Status: Active
Domain: Web
Workstream: Engineering
Created: 2026-03-01
Last-reviewed: 2026-03-01
Last-updated: 2026-03-01
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: hbag-caryina-qa-hardening
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact)
Auto-Build-Intent: plan+auto
---

# HBAG Caryina QA Hardening Plan

## Summary

Addresses issues found in interactive QA for the Caryina storefront: unstable cookie-consent behavior, missing `metadataBase`, Next.js `middleware` deprecation warning, and local-dev cross-origin warning for `allowedDevOrigins`.

## Active tasks

- [x] TASK-01: Implement QA hardening fixes (consent cookie detection, metadata base, proxy migration, allowed dev origins)
- [ ] TASK-02: Re-run simulated storefront QA and record verification evidence

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---:|---:|---|---|---|---|
| TASK-01 | IMPLEMENT | Fix consent, metadata, middleware deprecation, and dev-origin config | 88% | M | Complete (2026-03-01) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Run post-fix QA pass and document outcomes | 85% | S | Pending | TASK-01 | - |

## Tasks

### TASK-01: Implement QA hardening fixes

- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Status:** Complete (2026-03-01)
- **Affects:** `apps/caryina/src/components/ConsentBanner.client.tsx`, `apps/caryina/src/app/layout.tsx`, `apps/caryina/next.config.mjs`, `apps/caryina/src/proxy.ts`, `apps/caryina/src/middleware.ts`, `docs/plans/hbag-caryina-qa-hardening/plan.md`
- **Confidence:** 88%
  - Implementation: 88% — direct, bounded changes in existing files.
  - Approach: 90% — standard Next.js config + file-convention migration.
  - Impact: 86% — high likelihood to remove warnings and stabilize consent behavior.
- **Acceptance:**
  - Consent banner cookie detection no longer relies on fragile `"; "` splitting.
  - `metadataBase` is explicitly set in root metadata.
  - `middleware.ts` deprecation warning is removed by migrating to `proxy.ts` convention.
  - `allowedDevOrigins` explicitly includes `localhost` and `127.0.0.1`.
- **Validation contract (TC-XX):**
  - TC-01: `pnpm --filter @apps/caryina typecheck` passes.
  - TC-02: `pnpm --filter @apps/caryina lint` passes (warnings only; 0 errors).
- **Build Evidence (2026-03-01):**
  - Updated consent cookie parsing in `ConsentBanner.client.tsx` to split on `";"` and trim entries.
  - Added `metadataBase` to `apps/caryina/src/app/layout.tsx` using `NEXT_PUBLIC_SITE_URL` fallback to `http://localhost:3018`.
  - Migrated edge auth entrypoint from `apps/caryina/src/middleware.ts` to `apps/caryina/src/proxy.ts`.
  - Added `allowedDevOrigins: ["localhost", "127.0.0.1"]` in `apps/caryina/next.config.mjs`.
  - Runtime smoke confirms prior warnings gone for `metadataBase` and middleware deprecation; cross-origin warning no longer appears on `127.0.0.1` requests.

### TASK-02: Re-run simulated storefront QA and record verification evidence

- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Status:** Pending
- **Affects:** `docs/plans/hbag-caryina-qa-hardening/plan.md`
- **Depends on:** TASK-01
- **Confidence:** 85%
- **Acceptance:**
  - Post-fix run confirms warnings resolved and consent flow works consistently.
- **Validation contract (TC-XX):**
  - TC-01: Simulated session on `/en` and `/en/product/...` records no consent reappearance after accept + refresh.
  - TC-02: Dev server logs no `metadataBase`, `middleware` deprecation, or cross-origin `allowedDevOrigins` warnings.
