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
| Currency-rate editing | Incomplete | Hosted mode still returns `currency_rates_local_fs_required` because rates are stored in repo-local JSON | `apps/xa-uploader/src/app/api/catalog/currency-rates/route.ts` | Next implementation slice |
| Runtime default branching | Partial | Local-FS remains the default branch unless explicitly disabled via env | `apps/xa-uploader/src/lib/localFsGuard.ts` | Revisit after hosted currency-rate persistence exists |
| Local-FS cleanup/removal | Decision pending | Prior notes defer removing local-FS branches until Cloudflare-only runtime is an explicit product decision | `docs/plans/xa-uploader-deploy-state-hardening/build-record.user.md` | Checkpoint after TASK-02 |

## Conclusion
The remaining hosted parity gap is specific, not architectural: currency-rate persistence is still local-only. Everything broader than that should stay out of the next build unit unless the operator explicitly chooses a full local-FS cleanup pass.
