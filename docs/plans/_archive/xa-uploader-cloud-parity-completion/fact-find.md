---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: Products
Workstream: Engineering
Created: 2026-03-09
Last-updated: 2026-03-09
Last-reviewed: 2026-03-09
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-cloud-parity-completion
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Type: code-change
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas
Related-Plan: docs/plans/xa-uploader-cloud-parity-completion/plan.md
Trigger-Why: The hosted XA uploader path is mostly cloud-native now, but a small number of operator flows still depend on local filesystem assumptions or are only documented as local-only fallbacks.
Trigger-Intended-Outcome: type: operational | statement: finish the remaining hosted/cloud parity work in xa-uploader so routine operator flows no longer depend on repo-local state | source: operator
---

# XA Uploader Cloud Parity Completion Fact-Find

## Scope
### Summary
Complete the remaining uploader cloud-parity work after the first free-tier replatform tranches. Earlier plans removed the major hosted blockers for product draft CRUD, sync publish, submission export, bulk ingest, and storefront freshness. The remaining work is to identify what still depends on local filesystem/runtime assumptions and cut the next bounded implementation slice.

### Goals
- Confirm which uploader flows are already cloud-capable versus still local-only.
- Identify the smallest remaining hosted parity gap that should be implemented next.
- Preserve Cloudflare free-tier constraints and the existing contract-worker boundary.

### Non-goals
- Re-open the completed xa-b live-catalog runtime migration.
- Replace the catalog contract architecture.
- Remove local development support without an explicit follow-up decision.

## Outcome Contract
- **Why:** The repo no longer has a clear single source of truth for what remains to finish the cloud replatform, which makes it easy to overstate or understate how much local-FS dependency is left.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A planning-ready parity map exists for xa-uploader cloud mode, and the next implementation slice is narrowed to one bounded hosted gap.
- **Source:** operator

## Evidence Audit (Current State)
### Confirmed completed cloud tranches
- Cloud draft CRUD is already supported in hosted mode.
  - Evidence: `docs/plans/xa-uploader-cloud-free-tier-replatform/plan.md`
- Cloud sync publish and cloud submission fallback are already implemented.
  - Evidence: `docs/plans/xa-upload-display-gap-closure/plan.md`
- xa-b no longer depends on a Pages rebuild for ordinary catalog freshness.
  - Evidence: `docs/plans/xa-b-live-catalog-client-runtime/plan.md`

### Confirmed remaining local-only or local-aware seams
- Currency rates still fail closed in cloud mode with `currency_rates_local_fs_required`.
  - Evidence: `apps/xa-uploader/src/app/api/catalog/currency-rates/route.ts`
- Local filesystem remains the default runtime branch unless explicitly disabled.
  - Evidence: `apps/xa-uploader/src/lib/localFsGuard.ts`
- Prior free-tier hardening intentionally left new cloud persistence for currency rates out of scope.
  - Evidence: `docs/plans/xa-uploader-free-tier-hardening/plan.md`
- Recent XA deploy-state notes explicitly call out a future cleanup pass if Cloudflare-only runtime becomes the permanent product decision.
  - Evidence: `docs/plans/xa-uploader-deploy-state-hardening/build-record.user.md`

## Key Finding
The remaining replatform gap is no longer “make hosted uploader viable.” That work is done. The concrete remaining hosted parity gap is narrower: currency-rate persistence is still repo-local, and the codebase still carries local-FS default branching that should only be removed or collapsed after that hosted-safe replacement exists.

## Recommended Next Slice
Implement cloud-backed currency-rate persistence first, then run a checkpoint on whether the remaining local-FS branches should be retained as a dev-only lane or removed in a separate cleanup tranche.

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Over-scoping into a full local-FS removal pass | Medium | High | Keep the next task bounded to currency-rate persistence only |
| Introducing a second source of truth for rates | Medium | Medium | Reuse the existing contract-worker boundary instead of adding ad hoc storage |
| Replatform claims drift from actual repo state again | Medium | Medium | Persist a canonical parity matrix and tie the next plan to it |

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None for the next bounded slice
- Recommended next step:
  - `/lp-do-build` on an investigate-first plan that captures the parity matrix, then executes the currency-rates hosted persistence slice
