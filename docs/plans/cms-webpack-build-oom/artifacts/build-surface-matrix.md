---
Type: Plan-Artifact
Status: Draft
Domain: Infra
Feature-Slug: cms-webpack-build-oom
Task-ID: TASK-02
Created: 2026-02-23
Last-updated: 2026-02-23
Relates-to: docs/plans/cms-webpack-build-oom/plan.md
---

# CMS Build-Surface Matrix (TASK-02)

## Scope
Enumerate all active plan/workflow contract surfaces that currently consume `@apps/cms` build pass/fail status, and map their gate sensitivity plus decision owner role.

## Method
- Searched plan and artifact contracts for explicit CMS build blocker language.
- Audited CI workflows that run CMS build commands directly.
- Audited merge-gate workflow logic that turns CMS workflow outcomes into merge requirements.

Primary audit commands (2026-02-23):
- `rg -n "@apps/cms build|--filter @apps/cms build|CMS validation blocker|TASK-07|hard blocker" docs/plans/turbopack-full-migration/plan.md docs/plans/turbopack-full-migration/artifacts/migration-matrix.md docs/plans/cms-webpack-build-oom/plan.md`
- `rg -n "@apps/cms|pnpm --filter .*cms.* build|turbo run build --filter=@apps/cms|cms_deploy|cms_e2e|promote-app:cms" .github/workflows/*.yml`

## Consumer Matrix
| Consumer surface | Category | Current CMS build requirement | Policy sensitivity | Decision owner (role) | Evidence |
|---|---|---|---|---|---|
| `docs/plans/cms-webpack-build-oom/plan.md` | Plan gate contract | Option A selected: CMS remains hard blocker in dependent migration gates; mitigation sequencing preserves hard-gate posture. | High | `cms-webpack-build-oom` plan operator (Infra/PLAT; inferred) | `docs/plans/cms-webpack-build-oom/plan.md:66`, `docs/plans/cms-webpack-build-oom/plan.md:73`, `docs/plans/cms-webpack-build-oom/plan.md:191` |
| `docs/plans/turbopack-full-migration/plan.md` | Plan gate contract | TASK-07 is pending with explicit `CMS validation blocker`; TASK-08 depends on TASK-07 completion. | High | `turbopack-full-migration` plan operator (Infra/PLAT; inferred) | `docs/plans/turbopack-full-migration/plan.md:329`, `docs/plans/turbopack-full-migration/plan.md:332`, `docs/plans/turbopack-full-migration/plan.md:375` |
| `docs/plans/turbopack-full-migration/artifacts/migration-matrix.md` | Validation contract artifact | TASK-07 snapshot records CMS build fail in required variants; Wave S3 command list includes CMS build probe. | High | Turbopack matrix maintainer (Infra/PLAT; inferred) | `docs/plans/turbopack-full-migration/artifacts/migration-matrix.md:84`, `docs/plans/turbopack-full-migration/artifacts/migration-matrix.md:88`, `docs/plans/turbopack-full-migration/artifacts/migration-matrix.md:117` |
| `.github/workflows/cms.yml` | CI workflow contract | `build` job runs `pnpm --filter @apps/cms... build`; `deploy` job requires successful `build` (`needs: [build]`). | High | CMS deploy workflow maintainer (CI/Infra role; inferred) | `.github/workflows/cms.yml:123`, `.github/workflows/cms.yml:144`, `.github/workflows/cms.yml:156` |
| `.github/workflows/cypress.yml` | CI workflow contract | E2E jobs build CMS (`turbo run build --filter=@apps/cms`) and run app-started Cypress tests. Build pass is a prerequisite for E2E jobs. | High | CMS test workflow maintainer (QA/Infra role; inferred) | `.github/workflows/cypress.yml:132`, `.github/workflows/cypress.yml:145`, `.github/workflows/cypress.yml:172` |
| `.github/workflows/merge-gate.yml` | Merge control contract | Merge Gate requires `cms.yml` and `cypress.yml` when CMS scopes are active (`cms_deploy`/`cms_e2e` flags or `promote-app:cms` label). | Very High | Merge Gate maintainer (Repo CI governance role; inferred) | `.github/workflows/merge-gate.yml:98`, `.github/workflows/merge-gate.yml:149`, `.github/workflows/merge-gate.yml:182` |

## Excluded Surfaces (not CMS build consumers)
- `.github/workflows/ci.yml` is path-ignored for `apps/cms/**` and `.github/workflows/cms.yml`; it is not an active CMS build status consumer in the current split-pipeline model.
  - Evidence: `.github/workflows/ci.yml:9`, `.github/workflows/ci.yml:15`.

## Findings for TASK-06 Input
1. No active surface currently implements machine-class-aware "best-effort" semantics for CMS build status.
2. Hard-gate behavior is anchored in both planning docs and merge-gate workflow requirements.
3. Any policy change away from hard blocker would require coordinated updates across:
   - `docs/plans/turbopack-full-migration/plan.md`
   - `docs/plans/turbopack-full-migration/artifacts/migration-matrix.md`
   - `.github/workflows/cms.yml`
   - `.github/workflows/cypress.yml`
   - `.github/workflows/merge-gate.yml`
4. Current Option A remains internally consistent with all identified consumer contracts.

## Owner Assignment Gap
No audited file carries explicit named owner metadata for these gate decisions. Owner roles above are inferred from artifact/workflow domain. TASK-06 should preserve this mapping and, if needed, add explicit owner assignment in decision logs.
