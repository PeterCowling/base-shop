# Critique History — xa-uploader-theme-token-compiler

## Round 1

- **Date**: 2026-03-14
- **Route**: codemoot (Node 22)
- **Artifact**: `docs/plans/xa-uploader-theme-token-compiler/fact-find.md`
- **Score**: 7/10 → lp_score 3.5
- **Verdict**: needs_revision

### Findings

| Severity | Line | Finding |
|---|---|---|
| warning (Major) | 279 | `derivedVars.light`-for-all-17-tokens approach duplicates the 14 non-alpha values between `assets.brandColors` and `theme-css-config.ts`. Tokens not "declared once"; planned parity test would not catch drift. Need to derive `gate-*` entries from `assets.brandColors` rather than duplicating. |
| warning (Major) | 56 | Compiler behavior misstated. `generateThemeCSS()` always emits `color-scheme: light`, `--theme-transition-duration`, and `.dark { color-scheme: dark; }` unconditionally. This is not a like-for-like replacement for xa-uploader's current globals.css — generator script must post-process. |
| warning (Major) | 194 | `pnpm --filter @themes/xa-uploader test` won't work — brikette package has no `test` script, and xa-uploader task seeds don't add one. Must include `"test"` script in package.json. |
| info (Minor) | 413 | `assets.ts` task seed omits `fonts: {}`. `ThemeAssets` requires `fonts` even when empty. |

### Autofixes Applied

- Updated `Constraints & Assumptions` to clarify generator script must post-process `generateThemeCSS()` output.
- Added explicit statement that `fonts: {}` is required in `ThemeAssets`.
- Revised `ThemeCSSConfig Mapping Design` to use `Object.entries(assets.brandColors)` reference pattern (no duplication).
- Updated test infrastructure section: added `"test": "jest"` script requirement to package.json.
- Updated task seed 1: includes `"test"` script; task seed 2: explicitly lists `fonts: {}`.
- Updated task seed 6: generator script post-processing documented.
- Updated rehearsal trace: added 4 new rows covering generator extras, duplication, test script, fonts.
- Updated resolved Q&A: corrected `generateThemeCSS()` dark block behavior.
- Updated remaining assumptions.

---

## Round 2

- **Date**: 2026-03-14
- **Route**: codemoot (Node 22)
- **Artifact**: `docs/plans/xa-uploader-theme-token-compiler/fact-find.md`
- **Score**: 7/10 → lp_score 3.5
- **Verdict**: needs_revision

### Findings

| Severity | Line | Finding |
|---|---|---|
| warning (Major) | 165 | Internal contradiction: brief still said empty `.dark {}` block acceptable, but elsewhere noted compiler always emits `color-scheme: dark;`. |
| warning (Major) | 217 | Parity test strategy wrong: test must use `postProcessGateCSS()` shared helper, not raw `generateThemeCSS()` output. |
| warning (Major) | 421 | Coverage-parity test only guards 14 brandColors entries; 3 alpha-only tokens unguarded independently. |

### Autofixes Applied

- Fixed internal contradiction: removed "may be left in generated file" statement; clarified compiler always emits `.dark { color-scheme: dark; }`.
- Updated testability assessment: parity test must import `postProcessGateCSS()` shared helper from `src/post-process.ts`.
- Added `src/post-process.ts` to task seeds (task 5) as shared helper for generator + parity test.
- Updated `coverage-parity.test.ts` scope: exhaustive over all 17 tokens including 3 alpha-only entries.
- Updated task seeds 10 and 11 to reflect both test files and their roles.
- Updated acceptance criteria: committed CSS must not contain `color-scheme`, `--theme-transition-duration`, or `.dark {}` block.

---

## Round 3

- **Date**: 2026-03-14
- **Route**: codemoot (Node 22)
- **Artifact**: `docs/plans/xa-uploader-theme-token-compiler/fact-find.md`
- **Score**: 8/10 → lp_score 4.0
- **Verdict**: needs_revision (but lp_score ≥ 4.0 → credible threshold met — final round)

### Findings

| Severity | Line | Finding |
|---|---|---|
| warning (Major) | 194 | Test invocation off-contract: `pnpm exec jest` and `"test": "jest"` bypass the governed runner. Must use `run-governed-test.sh`. |
| warning (Major) | 281 | `toGateVars` helper type mismatch: `assets.brandColors` is `Record<string, BrandColor \| string>`, not `Record<string, string>`. Helper must normalize `BrandColor` to `.light` value. |
| warning (Major) | 230 | `coverage-parity.test.ts` scoped only to brandColors entries; 3 alpha-only tokens still unguarded. |

### Autofixes Applied (advisory — final round, lp_score ≥ 4.0)

- Updated test command to use governed runner: `bash ../../scripts/tests/run-governed-test.sh -- jest -- --config ./jest.config.cjs`.
- Fixed `toGateVars` type signature: `Record<string, BrandColor | string>` with `typeof val === "string" ? val : val.light` normalization.
- Updated `coverage-parity.test.ts` scope description: exhaustive over all 17 tokens including alpha-only assertions.

### Final Status

- lp_score: 4.0 (credible — ≥ 4.0 threshold met)
- No Critical findings across all 3 rounds
- Final verdict: credible

---

# Plan Critique History

## Plan Round 1

- **Date**: 2026-03-14
- **Route**: codemoot (Node 22)
- **Artifact**: `docs/plans/xa-uploader-theme-token-compiler/plan.md`
- **Score**: 6/10 → lp_score 3.0
- **Verdict**: needs_revision

### Findings

| Severity | Line | Finding |
|---|---|---|
| critical | 27 | Plan stale: `packages/themes/xa-uploader/` and all source files already exist (confirmed at plan time). TASK-01 through TASK-05 as originally written were wrong; only the governed test script path fix remained. |
| warning (Major) | multiple | 5 of 6 tasks described creating files that already exist. |

### Autofixes Applied

- Rewrote plan from 6 tasks (including package scaffold) to 5 tasks (generator, CSS, tests, globals wiring).
- Corrected Summary to state package and source files already exist.
- Updated Non-goals to exclude already-complete items.

---

## Plan Round 2

- **Date**: 2026-03-14
- **Route**: codemoot (Node 22)
- **Artifact**: `docs/plans/xa-uploader-theme-token-compiler/plan.md`
- **Score**: 4/10 → lp_score 2.0
- **Verdict**: needs_revision

### Findings

| Severity | Line | Finding |
|---|---|---|
| critical | 27 | Plan still materially stale. Generator script, committed CSS, globals.css cutover, and both test files all already exist in the repo. Only TASK-01 (test script path fix) is genuinely pending. |
| warning | 191 | TASK-02 described creating `scripts/xa-uploader/generate-theme-tokens.ts` — already exists. |
| warning | 257 | TASK-03 described cutting over `globals.css` — already done (line 4 already has `@import "./theme-tokens.generated.css"`). |
| warning | 313 | TASK-04/TASK-05 described creating both test files — both already exist. |
| warning | 216 | Validation strategy note about `norm()` handling `hsla()` equivalence is moot — committed CSS uses modern `hsl()` syntax throughout. |
| info | 61 | `norm()` only lowercases and collapses whitespace — would not handle `hsla()` vs `hsl()` equivalence anyway. Moot since no `hsla()` present. |

### Autofixes Applied

- Completely rewrote plan to 1 task only (TASK-01).
- Updated Summary to document all already-completed deliverables.
- Updated Goals and Non-goals to reflect single remaining item.
- Removed TASK-02 through TASK-05 as they describe already-landed work.
- Updated Task Summary table, Rehearsal Trace, and Acceptance Criteria accordingly.
- Removed `hsla()` normalisation risk (moot — no legacy `hsla()` syntax in committed CSS).

### Final Status (Plan Round 2)

- Plan rewritten to single-task; Round 3 critique pending

---

## Plan Round 3

- **Date**: 2026-03-14
- **Route**: codemoot (Node 22)
- **Artifact**: `docs/plans/xa-uploader-theme-token-compiler/plan.md`
- **Score**: 9/10 → lp_score 4.5
- **Verdict**: approved

### Findings

| Severity | Line | Finding |
|---|---|---|
| info (Minor) | 166 | Brikette comparison is factually wrong — `packages/themes/brikette/package.json` has no `test` script so it is not evidence for the `../../` pattern. The path fix itself is still correct based on directory depth. |

### Autofixes Applied

- Replaced inaccurate brikette comparison note with direct depth-verification reasoning.

### Final Status

- lp_score: 4.5 (credible — ≥ 4.0 threshold met)
- No Critical findings
- Final verdict: approved (credible)
