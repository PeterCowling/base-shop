---
Type: Working-Artifact
Status: Active
Feature-Slug: xa-uploader-cloud-parity-completion
artifact: parity-matrix
Last-updated: 2026-03-09
---

# XA Uploader Cloud Parity Matrix

## Goal
Record the current hosted-vs-local state of the XA uploader after the March 2026 cloud replatform tranches, so the next build unit targets only the remaining hosted gap.

## Capability Matrix
| Capability | Hosted/cloud status | Current truth | Evidence | Next action |
|---|---|---|---|---|
| Product draft CRUD | Complete | Hosted mode lists, saves, edits, and deletes drafts through the draft contract rather than local CSV | `docs/plans/xa-uploader-cloud-free-tier-replatform/plan.md` | None |
| Bulk product ingest | Complete | Hosted mode supports `/api/catalog/products/bulk` | `docs/plans/xa-upload-display-gap-closure/plan.md` | None |
| Sync publish | Complete | Hosted mode can build and publish from cloud draft snapshot without local script spawning | `docs/plans/xa-upload-display-gap-closure/plan.md` | None |
| Submission export | Complete | Hosted mode can emit export packages without local file scanning | `docs/plans/xa-upload-display-gap-closure/plan.md` | None |
| Storefront freshness after publish | Complete | xa-b now reads live published catalog client-side; rebuild is no longer the ordinary freshness gate | `docs/plans/xa-b-live-catalog-client-runtime/plan.md` | None |
| Currency-rate editing | Complete | Hosted mode reads/writes rates through the catalog contract and hosted sync/publish consume the same stored rates | `apps/xa-uploader/src/app/api/catalog/currency-rates/route.ts`, `apps/xa-uploader/src/app/api/catalog/sync/route.ts`, `apps/xa-uploader/src/app/api/catalog/publish/route.ts` | None |
| Runtime default branching | Partial | Local-FS remains the default branch unless explicitly disabled via env, but hosted mode now has cloud-capable branches for draft CRUD, sync/publish, currency rates, and deploy-state handling | `apps/xa-uploader/src/lib/localFsGuard.ts`, `apps/xa-uploader/src/app/api/catalog/sync/route.ts`, `apps/xa-uploader/src/app/api/catalog/products/route.ts` | Keep as dev/local support for now |
| Local-FS cleanup/removal | Deferred follow-up | Surviving local-FS branches support local image writes and repo-local deploy-state files rather than blocking hosted parity | `apps/xa-uploader/src/app/api/catalog/images/route.ts`, `apps/xa-uploader/src/app/api/catalog/deploy-drain/route.ts` | Separate future tranche only if Cloudflare-only runtime becomes the product decision |

## Conclusion
The scoped hosted parity goal is now met. The remaining local-FS branches are environment-support paths for dev/local operation, not a newly discovered hosted blocker, so local-FS cleanup should stay out of this tranche unless the operator explicitly chooses a Cloudflare-only runtime cleanup feature.
