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
Feature-Slug: xa-free-tier-anti-copy-hardening
Execution-Track: code
Deliverable-Family: multi
Deliverable-Type: code-change
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find
Related-Plan: docs/plans/xa-free-tier-anti-copy-hardening/plan.md
artifact: fact-find
---

# XA Free-Tier Anti-Copy Hardening Fact-Find

## Scope
Implement anti-copy hardening that stays Cloudflare free-tier compatible and avoids additional provider/infrastructure leakage across:
- `xa-uploader`
- `xa-drop-worker`
- `xa-b` operator-visible surfaces

## Access Declarations
None.

## Evidence
- `xa-uploader` already has login/session/logout and API auth, but ingress was not source-IP constrained.
  - `apps/xa-uploader/src/app/api/uploader/login/route.ts`
  - `apps/xa-uploader/src/app/api/uploader/session/route.ts`
  - `apps/xa-uploader/src/app/api/uploader/logout/route.ts`
- `xa-drop-worker` had token hardening but no source-IP allowlist gate.
  - `apps/xa-drop-worker/src/index.ts`
- Operator-facing submission UI/status still exposed storage-provider naming and internal storage keys.
  - `apps/xa-uploader/src/lib/uploaderI18n.ts`
  - `apps/xa-uploader/src/components/catalog/CatalogSubmissionPanel.client.tsx`
  - `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts`

## Risks Addressed
- Cloned frontend calling APIs from arbitrary networks.
- Unauthorized direct worker access despite token leaks.
- Avoidable operational leakage (provider naming, storage key echoes) in UI feedback.

## Simulation Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| uploader ingress | Yes | None | No |
| worker ingress | Yes | None | No |
| operator-visible leakage | Yes | None | No |

## Evidence Gap Review
### Gaps Addressed
- Added practical free-tier-compatible controls (header/IP checks, no new paid infra).

### Confidence Adjustments
- Increased implementation confidence from medium to high due to direct code-path coverage in all three targets.

### Remaining Assumptions
- Source IP allowlists are maintained operationally by operators.
- Middleware remains active in Cloudflare deployment path for `xa-uploader`.
