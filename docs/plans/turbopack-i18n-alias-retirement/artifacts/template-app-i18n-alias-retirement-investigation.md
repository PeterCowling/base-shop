Type: Reference
Status: Active

# Template-App i18n Alias Retirement Investigation

Date: 2026-02-20  
Task: TASK-09 (`INVESTIGATE`)

## Baseline failure reproduction
- Scenario: remove shared `@acme/i18n` webpack alias from `packages/next-config/next.config.mjs`.
- Command: `pnpm --filter @acme/template-app build`
- Result: fail (exit 1)
- Error excerpt:
  - `Module not found: Can't resolve '@acme/i18n'`
  - reported from `./src/app/[lang]/checkout/layout.tsx` and `./src/app/[lang]/layout.tsx`

## Candidate seam A: alias-shape change in shared config (`"@" -> "@/"`)
- Change tested:
  - shared config: remove shared `@acme/i18n` alias
  - shared config: change alias key from `"@"` to `"@/"`
- template-app webpack build:
  - Command: `pnpm --filter @acme/template-app build`
  - Result: fail (exit 1), same `Can't resolve '@acme/i18n'` error
- resolver harness:
  - Not run (candidate failed on first gate)
- Conclusion: not sufficient.

## Candidate seam B: remove `@acme/i18n` from template-app `transpilePackages`
- Change tested:
  - shared config: remove shared `@acme/i18n` alias
  - template-app config: remove `@acme/i18n` from `transpilePackages`
- template-app webpack build:
  - Command: `pnpm --filter @acme/template-app build`
  - Result: fail (exit 1), same `Can't resolve '@acme/i18n'` error
- resolver harness:
  - Not run (candidate failed on first gate)
- Conclusion: not sufficient.

## Candidate seam C: template-app-local webpack alias (no shared i18n alias)
- Change tested:
  - shared config: remove shared `@acme/i18n` alias
  - template-app config: add local webpack alias `@acme/i18n -> ../i18n/dist`
- template-app webpack build:
  - Command: `pnpm --filter @acme/template-app build`
  - Result: pass (exit 0)
- resolver harness:
  - Command: `node scripts/check-i18n-resolver-contract.mjs`
  - Result: pass (exit 0), all configured surfaces green
- Conclusion: sufficient to unblock TASK-04 execution path.

## Selected seam
Selected seam: **Candidate seam C**.

Rationale:
- It is the only tested seam that preserved green status for both template-app webpack build and full resolver harness while removing the shared alias.
- It retires shared alias debt immediately and scopes compatibility handling to the known consumer surface (`@acme/template-app`).

Target files for TASK-04 execution:
- `packages/next-config/next.config.mjs`
- `packages/template-app/next.config.mjs`

## TASK-04 promotion criteria
- Implement selected seam exactly (shared alias removal + template-app-local alias).
- Validation must pass:
  - `pnpm --filter @acme/template-app build`
  - `pnpm --filter @apps/business-os build && pnpm --filter @apps/brikette build`
  - `node scripts/check-i18n-resolver-contract.mjs`
- Confirm no unrelated webpack callback rows changed in shared config.

## rollback
- Immediate rollback path:
  1. Restore shared alias line in `packages/next-config/next.config.mjs`.
  2. Remove template-app-local alias from `packages/template-app/next.config.mjs`.
  3. Re-run `pnpm --filter @acme/template-app build`.

## Workspace hygiene
- All temporary investigation edits were reverted after probing.
- Repository baseline is restored before TASK-04 implementation.
