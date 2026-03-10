---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: Engineering
Workstream: Platform
Created: 2026-03-01
Last-updated: 2026-03-01
Last-reviewed: 2026-03-01
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-two-lane-free-tier-hardening
Execution-Track: code
Deliverable-Family: multi
Deliverable-Type: code-change
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find
Related-Plan: docs/plans/xa-two-lane-free-tier-hardening/plan.md
artifact: fact-find
direct-inject: true
direct-inject-rationale: Operator requested immediate implementation of XA dispatches 0085-0092.
---

# XA Two-Lane + Free-Tier Hardening Fact-Find

## Scope
Audit and implement critical hardening needed for a day-one XA rollout with a strict two-lane flow:
1) `data` lane = bulk product data ingestion
2) `media` lane = image assign/re-assign with explicit shot roles

Include Cloudflare free-tier operational constraints and existing app behavior (`xa-uploader`, `xa-drop-worker`, `xa-b`).

## Confirmed Findings
- `xa-uploader` server routes currently depend on local FS and sync process spawning.
  - `apps/xa-uploader/src/app/api/catalog/sync/route.ts`
  - `apps/xa-uploader/src/lib/catalogCsv.ts`
- Submission payload envelope was configured at 250MB in uploader/drop-worker paths.
  - `apps/xa-uploader/src/app/api/catalog/submission/route.ts`
  - `apps/xa-drop-worker/wrangler.toml`
  - `apps/xa-drop-worker/src/index.ts`
- Catalog schema did not enforce explicit image shot roles.
  - `packages/lib/src/xa/catalogAdminSchema.ts`
- XA storefront freshness signals existed in code but were not surfaced to operators on homepage.
  - `apps/xa-b/src/lib/demoData.ts`
  - `apps/xa-b/src/app/page.tsx`

## Dispatch Mapping (lp-do-ideas)
- `IDEA-DISPATCH-20260301-0085` runtime compatibility guardrails
- `IDEA-DISPATCH-20260301-0086` strict two-lane contract
- `IDEA-DISPATCH-20260301-0087` media role semantics
- `IDEA-DISPATCH-20260301-0088` lane validation contracts
- `IDEA-DISPATCH-20260301-0089` free-tier quota guardrails
- `IDEA-DISPATCH-20260301-0090` publish freshness surface
- `IDEA-DISPATCH-20260301-0091` upload token lifecycle hardening
- `IDEA-DISPATCH-20260301-0092` missing test matrix

## Build Evidence (completed slice)
- Added local-FS runtime guard helper and route protections for FS-dependent uploader APIs.
- Lowered default submission/upload payload limits to free-tier-safe defaults (25MB).
- Added per-image byte cap (default 8MB) during ZIP packaging.
- Extended catalog draft schema with `imageRoles` + category-specific required role checks.
- Wired image role input through uploader form defaults + CSV mapping (`media_paths`).
- Added stale-catalog visibility notice on `xa-b` homepage.
- Expanded tests for schema and CSV mapping role behavior.

## Residual Risk / Pending
- Token lifecycle hardening (0091) needs explicit anti-replay telemetry and operations playbook-level checks beyond current nonce/object-key guard.
- Full two-lane E2E workflow test set (0092) still needs API+UI+publish-path integration assertions.
- `xa-uploader` long-term cloud architecture remains local-FS constrained; current guardrails prevent invalid cloud execution but do not replatform sync.

## Confidence
- Implementation confidence: 86%
- Evidence confidence: 90%
- Operational confidence on free-tier posture after current tranche: 80%

What would make this >=90%:
- Complete 0091 token lifecycle hardening tasks and 0092 E2E matrix tasks.
- Add publish verification checkpoints from contract publish -> xa-b build artifact -> live page freshness marker.
