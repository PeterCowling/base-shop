---
Type: Build-Record
Status: Complete
Domain: UI
Last-reviewed: 2026-03-14
Feature-Slug: xa-uploader-theme-token-compiler
Execution-Track: code
Completed-date: 2026-03-14
artifact: build-record
Build-Event-Ref: docs/plans/xa-uploader-theme-token-compiler/build-event.json
---

# Build Record: xa-uploader Theme Token Compiler Retrofit

## Outcome Contract

- **Why:** xa-uploader previously hand-authored its CSS custom properties directly in globals.css with no structured source of truth or automated parity check. The brikette three-layer system provides a proven pattern for making tokens refactorable from TypeScript and preventing silent drift. Retrofitting xa-uploader closes the gap.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** xa-uploader tokens are declared in TypeScript source files under `packages/themes/xa-uploader/`, compiled into a committed CSS file, and Jest parity tests guard against future divergence between source and generated output.
- **Source:** auto

## What Was Built

The xa-uploader theme token compiler retrofit brought the application into parity with the brikette three-layer generated theme system. The full system was built across three prior commits and completed in this build cycle:

**Prior commits (all now landed):**
- `d332e42700` — Wired `globals.css` to import `theme-tokens.generated.css` (removing the inline `:root` block), and added both `generated-parity.test.ts` and `coverage-parity.test.ts` to `packages/themes/xa-uploader/__tests__/`.
- `0b9ac62eb9` — Wrote the generator script at `scripts/xa-uploader/generate-theme-tokens.ts` and produced the committed `apps/xa-uploader/src/app/theme-tokens.generated.css` (17 `--gate-*` vars).
- All source files in `packages/themes/xa-uploader/src/` were already in place (assets.ts, design-profile.ts, theme-css-config.ts, post-process.ts, index.ts).

**This build (TASK-01, commit `12a414e26e`):**
Fixed a pre-existing bug in `packages/themes/xa-uploader/package.json` where the `test` script used `../../scripts/tests/run-governed-test.sh` (resolving 2 levels to `packages/scripts/tests/` — a non-existent path). Corrected to `../../../scripts/tests/run-governed-test.sh` so the governed runner can be invoked via `pnpm --filter @themes/xa-uploader test`.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `bash scripts/tests/run-governed-test.sh -- jest -- --config packages/themes/xa-uploader/jest.config.cjs --testPathPattern=packages/themes/xa-uploader --no-coverage` | Pass (59/59) | Both test suites pass: generated-parity (45 tests) + coverage-parity (14 tests) |
| `bash ../../../scripts/tests/run-governed-test.sh -- jest -- --config ./jest.config.cjs --no-coverage` (from package dir) | Pass (59/59) | Governed runner via corrected path resolves correctly |
| `scripts/validate-engineering-coverage.sh docs/plans/xa-uploader-theme-token-compiler/plan.md` | Pass | `{"valid": true, "errors": [], "warnings": []}` |
| `npx tsc --noEmit --project packages/themes/xa-uploader/tsconfig.json` | Pass (clean) | No TypeScript errors in source files |

## Workflow Telemetry Summary

- Feature slug: `xa-uploader-theme-token-compiler`
- Records: 5 across lp-do-fact-find, lp-do-plan (×2), lp-do-build (×2)
- Total context input: ~383 KB across 5 records
- Deterministic checks run: 8

| Stage | Records | Avg modules | Avg context bytes | Avg artifact bytes |
|---|---:|---:|---:|---:|
| lp-do-fact-find | 1 | 1.00 | 60390 | 36511 |
| lp-do-plan | 2 | 1.00 | 97354 | 25569 |
| lp-do-build | 2 | 2.00 | 63953 | 2551 |

Token measurement coverage: 0.0% (auto-capture not available in this session).

## Validation Evidence

### TASK-01: Fix governed test script path in package.json

- TC-01: `grep -c "scripts/tests/run-governed-test.sh" packages/themes/xa-uploader/package.json` → `1` ✓
- TC-02: `grep "../../../scripts/tests/run-governed-test.sh" packages/themes/xa-uploader/package.json` matches — 3 `../` prefixes confirmed ✓
- TC-03: `ls packages/themes/xa-uploader/../../../scripts/tests/run-governed-test.sh` exits 0 ✓
- JSON validity: `node -e "JSON.parse(...)"` passes ✓
- Commit: `12a414e26e` on `dev` branch ✓

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | N/A | Path string fix; no CSS output changes. All visual coverage provided by already-landed parity tests and committed CSS |
| UX / states | N/A | No interactive state changes |
| Security / privacy | N/A | Static package.json field; no auth or PII surface |
| Logging / observability / audit | N/A | Build-time only; no runtime telemetry |
| Testing / validation | Covered — TC-01/02/03 all pass; governed runner path now resolves to existing `scripts/tests/run-governed-test.sh` | Two parity tests (`generated-parity.test.ts`, `coverage-parity.test.ts`) will run via CI on push |
| Data / contracts | N/A | No data contracts affected |
| Performance / reliability | N/A | One-off JSON field fix; no hot path |
| Rollout / rollback | N/A — reversible; rollback = revert string to `../../` (leaves tests broken again, so no value) | Single-field JSON change |

## Scope Deviations

None. The build touched only `packages/themes/xa-uploader/package.json` as planned.
