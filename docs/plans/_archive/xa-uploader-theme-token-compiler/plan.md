---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-14
Last-reviewed: 2026-03-14
Last-updated: 2026-03-14
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-theme-token-compiler
Dispatch-ID: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 95%
Confidence-Method: single-task plan; task confidence directly sets overall
Auto-Build-Intent: plan+auto
Related-Analysis: none
---

# xa-uploader Theme Token Compiler Retrofit — Plan

## Summary

The xa-uploader theme token compiler retrofit is almost entirely complete. The full three-layer system is in place:

- `packages/themes/xa-uploader/src/assets.ts` — 14 plain-color `brandColors` entries + 3 alpha-channel tokens in `theme-css-config.ts`
- `packages/themes/xa-uploader/src/design-profile.ts` — design profile
- `packages/themes/xa-uploader/src/theme-css-config.ts` — all 17 tokens via `derivedVars.light`; `buildGateVars()` derives the 14 plain entries from `assets.brandColors`; 3 alpha entries hardcoded
- `packages/themes/xa-uploader/src/post-process.ts` — `postProcessGateCSS()` shared helper strips compiler extras
- `scripts/xa-uploader/generate-theme-tokens.ts` — generator script
- `apps/xa-uploader/src/app/theme-tokens.generated.css` — committed generated file (17 `--gate-*` vars)
- `apps/xa-uploader/src/app/globals.css` — already cut over to `@import "./theme-tokens.generated.css"` (inline `:root` block removed)
- `packages/themes/xa-uploader/__tests__/generated-parity.test.ts` — parity test (uses `postProcessGateCSS`)
- `packages/themes/xa-uploader/__tests__/coverage-parity.test.ts` — coverage test (TypeScript-level, orthogonal to helper)
- `scripts/package.json` — `xa-uploader:generate-theme-tokens` alias present

**One item remains:** the `test` script in `packages/themes/xa-uploader/package.json` uses `../../scripts/tests/run-governed-test.sh`, which is one directory level short (the package is 3 levels deep, not 2). The correct path is `../../../scripts/tests/run-governed-test.sh`.

## Active tasks

- [x] TASK-01: Fix governed test script path in package.json

## Goals

- Fix the broken `../../scripts/tests/run-governed-test.sh` path in `packages/themes/xa-uploader/package.json` to `../../../scripts/tests/run-governed-test.sh`.

## Non-goals

- Authoring `packages/themes/xa-uploader/src/` files — these already exist and are correct.
- Writing the generator script — already exists at `scripts/xa-uploader/generate-theme-tokens.ts`.
- Producing the committed CSS file — already committed at `apps/xa-uploader/src/app/theme-tokens.generated.css`.
- Wiring `globals.css` — already done (line 4: `@import "./theme-tokens.generated.css"`).
- Writing the parity or coverage tests — already present in `packages/themes/xa-uploader/__tests__/`.
- Dark-mode token extraction (`[data-theme="dark"]` stays hand-authored in `globals.css`).
- Any visual change to the xa-uploader app.

## Constraints & Assumptions

- Constraints:
  - `packages/themes/xa-uploader/` is 3 directory levels deep from repo root → correct governed test script relative path is `../../../scripts/tests/run-governed-test.sh`.
  - Tests are CI-only per `docs/testing-policy.md`. The test script path fix must be verified at plan level; test execution is CI-only.

- Assumptions:
  - All existing source files compile without type errors (validated in prior rounds; no changes needed).

## Inherited Outcome Contract

- **Why:** xa-uploader previously hand-authored its CSS custom properties directly in globals.css with no structured source of truth or automated parity check. The brikette three-layer system provides a proven pattern for making tokens refactorable from TypeScript and preventing silent drift. Retrofitting xa-uploader closes the gap.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** xa-uploader tokens are declared in TypeScript source files under `packages/themes/xa-uploader/`, compiled into a committed CSS file, and Jest parity tests guard against future divergence between source and generated output.
- **Source:** auto

## Analysis Reference

- Related analysis: None (direct fact-find → plan path; no analysis stage run)
- Selected approach: derivedVars.light for all 17 tokens (preserves `--gate-*` naming); `postProcessGateCSS()` shared helper strips compiler extras; two orthogonal test files for independent coverage. All already implemented.

## Fact-Find Support

- Supporting brief: `docs/plans/xa-uploader-theme-token-compiler/fact-find.md`

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Fix governed test script path in package.json | 95% | XS | Complete (2026-03-14) | - | - |

## Engineering Coverage

| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A — path string fix; no CSS output changes | - | All visual coverage already provided by existing tests and committed CSS |
| UX / states | N/A | - | None |
| Security / privacy | N/A | - | None |
| Logging / observability / audit | N/A | - | None |
| Testing / validation | Required — fix unblocks governed test runner for both parity tests | TASK-01 | Without this fix, tests cannot be invoked via governed runner path |
| Data / contracts | N/A | - | None |
| Performance / reliability | N/A | - | None |
| Rollout / rollback | N/A — reversible single-field JSON fix | TASK-01 | Rollback = revert string to `../../` (leaves tests broken again) |

## Delivered Processes

None: no material process topology change.

Token authoring is a file-level concern. No multi-step operator workflow, CI lane, approval path, or deployment orchestration changes. The generator script is a local CLI tool producing a committed file.

---

## Tasks

### TASK-01: Fix governed test script path in package.json

- **Type:** IMPLEMENT
- **Deliverable:** Fixed `packages/themes/xa-uploader/package.json` — `test` script uses `../../../scripts/tests/run-governed-test.sh`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** XS
- **Status:** Pending
- **Affects:**
  - `packages/themes/xa-uploader/package.json` (modified — fix test script path)
- **Depends on:** -
- **Blocks:** -
- **Status:** Complete (2026-03-14)
- **Confidence:** 95%
  - Implementation: 95% — single string replacement in a JSON file.
  - Approach: 95% — path depth verified: `packages/themes/xa-uploader/` is 3 directory levels deep; `../../../` reaches repo root. Confirmed: `scripts/tests/run-governed-test.sh` exists at repo root.
  - Impact: 95% — without this fix, `pnpm --filter @themes/xa-uploader test` fails because the shell script path doesn't resolve to an existing file.
- **Acceptance:**
  - `package.json` `test` script reads: `"bash ../../../scripts/tests/run-governed-test.sh -- jest -- --config ./jest.config.cjs"`
  - `ls packages/themes/xa-uploader/../../../scripts/tests/run-governed-test.sh` resolves successfully (file exists).
  - No other fields in `package.json` are changed.
- **Engineering Coverage:**
  - UI / visual: N/A — no CSS, component, or output changes
  - UX / states: N/A
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — this fix is the sole unresolved blocker for test invocation via the governed runner
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: N/A — reversible single-field change
- **Validation contract:**
  - TC-01: `grep -c "scripts/tests/run-governed-test.sh" packages/themes/xa-uploader/package.json` outputs `1`
  - TC-02: `grep "../../../scripts/tests/run-governed-test.sh" packages/themes/xa-uploader/package.json` matches (3 `../` prefixes)
  - TC-03: `ls packages/themes/xa-uploader/../../../scripts/tests/run-governed-test.sh` exits 0
- **Execution plan:**
  - Red: `package.json` test script is `bash ../../scripts/tests/run-governed-test.sh -- jest -- --config ./jest.config.cjs`.
  - Green: Change `../../scripts/tests/run-governed-test.sh` → `../../../scripts/tests/run-governed-test.sh`.
  - Refactor: verify `package.json` is valid JSON and no other fields changed.
- **Planning validation (required for M/L):** None: XS effort.
- **Scouts:** None: trivial string fix.
- **Edge Cases & Hardening:** None.
- **What would make this >=90%:** Already 95%.
- **Rollout / rollback:** Rollback = revert string to `../../` (leaves tests broken again — no value).
- **Documentation impact:** None.
- **Notes / references:**
  - Path depth verification: `packages/themes/xa-uploader/` is 3 levels deep → `../../../` reaches repo root → `scripts/tests/run-governed-test.sh` confirmed present. Current `package.json` has `../../` (2 levels) which resolves to `packages/scripts/tests/` — does not exist.
- **Build evidence (2026-03-14):**
  - TC-01: `grep -c "scripts/tests/run-governed-test.sh" package.json` → 1 ✓
  - TC-02: `grep "../../../scripts/tests/run-governed-test.sh"` present with correct 3 `../` prefixes ✓
  - TC-03: `ls packages/themes/xa-uploader/../../../scripts/tests/run-governed-test.sh` → exits 0 ✓
  - JSON valid after edit ✓
  - Committed: `12a414e26e fix(xa-uploader-theme): correct governed test script path in package.json (TASK-01)`

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Incorrect depth count for path fix | Very low | Low | Depth verified: `packages/` (1) → `themes/` (2) → `xa-uploader/` (3); `../../../` confirmed |
| Other `package.json` fields inadvertently changed | Very low | Low | Edit is targeted single-field replacement; validate JSON afterwards |

## Observability

- Logging: None — build-time only.
- Metrics: None.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)

- [ ] `packages/themes/xa-uploader/package.json` test script uses `../../../scripts/tests/run-governed-test.sh`.
- [ ] No other fields in `package.json` changed.
- [ ] Existing artifacts unchanged: `theme-tokens.generated.css`, `globals.css`, generator script, both test files.

## Decision Log

- 2026-03-14: derivedVars.light approach chosen for all 17 tokens to preserve `--gate-*` naming. Resolved in fact-find.
- 2026-03-14: `postProcessGateCSS` shared helper approach chosen for testability.
- 2026-03-14: Two orthogonal tests chosen (generated-parity + coverage-parity) so a bug in post-process.ts cannot mask a coverage gap.
- 2026-03-14: `hsla()` → `hsl()` normalisation accepted as semantic equivalence (not byte-identical). `norm()` handles whitespace; coverage test uses exact string values from `derivedVars.light` (normalised form) — moot because committed CSS uses modern `hsl()` syntax throughout.
- 2026-03-14: TASK-01 added to fix pre-existing governed test script path bug (`../../` → `../../../`).
- 2026-03-14 [Plan Round 2]: Rewrote plan from 5 pending tasks to 1. Codemoot critique confirmed all deliverables (generator, committed CSS, globals.css cutover, both tests) are already committed to the repo. Only the path bug in `package.json` remains.

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Fix test script path | Yes — `package.json` exists with broken `../../` path; `scripts/tests/run-governed-test.sh` confirmed at repo root | None | No |

## Overall-confidence Calculation

- TASK-01: 95%, XS (weight 1)

Overall = 95%
