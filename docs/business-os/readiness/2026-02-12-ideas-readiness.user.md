---
Type: Ideas-Readiness
Status: Active
Date: 2026-02-12
Run-Status: warning
Scope: App ownership mapping coverage
Max-Age-Days: 21
---

# Ideas Readiness Refresh

Readiness status: WARNING (mapping gate pass for active scope). App ownership mapping coverage is complete for active planning scope, with non-blocking catalog hygiene follow-ups.

## 1. Scope and Method

- Audited source of truth:
  - `docs/business-os/readiness/path-business-map.user.yaml`
  - `docs/business-os/strategy/businesses.json`
  - top-level app directories under `apps/`
- Coverage rule:
  - `mapped` = app directory is present in either path-map rules (`prefix: apps/<app>/`) or business catalog app lists.
  - `excluded` = app directory explicitly listed in `excluded_paths` in `path-business-map.user.yaml`.
  - `unmapped` = app directory not mapped and not excluded.

## 2. Coverage Snapshot

- Total app directories: **25**
- Excluded app directories: **3**
  - `apps/xa-b`
  - `apps/xa-drop-worker`
  - `apps/xa-j`
- Active-scope app directories: **22**
- Mapped active-scope app directories: **22**
- Unmapped active-scope app directories: **0**
- Coverage (active scope): **100.0%** (22/22)

## 3. Changes Since Last Snapshot

- Mapping coverage moved from blocked state to full active-scope coverage.
- Previously blocked apps (`api`, `cms`, `dashboard`, `storybook`, `telemetry-worker`, `checkout-gateway-worker`, `cochlearfit`, `cochlearfit-worker`) now resolve via mapping sources.
- Excluded XA app paths are now explicitly honored as out of active planning scope.

## 4. Hard Blockers (RG-04 Code-to-Plan Traceability)

None for active planning scope.

## 5. Non-Blocking Warnings

- `apps/skylar` is mapped in `path-business-map.user.yaml` to `HOLDCO`, but `HOLDCO` is not yet registered as a canonical business ID in `docs/business-os/strategy/businesses.json`.
  - Impact: taxonomy hygiene and reporting consistency risk.
  - Severity: warning (non-blocking for current HEAD/PET execution).

## 6. Go / No-Go

Mapping gate status: PASS for active planning scope.
`/idea-generate` is not blocked by app ownership mapping at this time.
