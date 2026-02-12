---
Type: Ideas-Readiness
Status: Active
Date: 2026-02-11
Run-Status: blocked
Scope: App ownership mapping coverage
Max-Age-Days: 21
---

# Ideas Readiness Refresh

Readiness status: BLOCKED. Do not run `/idea-generate` until unmapped app ownership is resolved.

## 1. Scope and Method

- Audited source of truth:
  - `docs/business-os/readiness/path-business-map.user.yaml`
  - `docs/business-os/strategy/businesses.json`
  - top-level app directories under `apps/`
- Coverage rule:
  - `mapped` = app directory is present in either path-map rules (`prefix: apps/<app>/`) or business catalog app lists.
  - `unmapped` = app directory has no mapping in either source.

## 2. Coverage Snapshot

- Total app directories: **25**
- Mapped app directories: **14**
- Unmapped app directories: **11**
- Coverage: **56.0%** (14/25)

## 3. Changes Since Last Snapshot

- `front-door-worker` mapped to `PLAT` in both catalog and path map.
- `apps/shop-secret` deleted.
- `apps/storefront` deleted.

## 4. Hard Blockers (RG-04 Code-to-Plan Traceability)

The following app directories remain unmapped and block reliable idea generation routing:

- `apps/api`
- `apps/checkout-gateway-worker`
- `apps/cms`
- `apps/cochlearfit`
- `apps/cochlearfit-worker`
- `apps/dashboard`
- `apps/storybook`
- `apps/telemetry-worker`
- `apps/xa-b`
- `apps/xa-drop-worker`
- `apps/xa-j`

## 5. Required Information To Unblock

For each unmapped app above, provide:

1. Canonical owner business/system ID (`PLAT`, `BOS`, `BRIK`, `PIPE`, `XA`, `HEAD`, `PET`, `HBAG`, etc.)
2. Outcome link (`Outcome ID` or `Card ID`) that the app currently advances
3. Role of the app in that outcome (core runtime, worker, admin tool, support app)
4. Whether mapping is temporary or stable

Then encode it in both:

- `docs/business-os/readiness/path-business-map.user.yaml`
- `docs/business-os/strategy/businesses.json` (and mirrored runtime catalog)

## 6. Go / No-Go

Readiness status: BLOCKED.
No-go until all top-level `apps/*` directories are mapped to a canonical business/system owner with explicit outcome linkage.
