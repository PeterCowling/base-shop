# Critique History

## Round 1 (2026-03-14)

**Mode:** plan
**Verdict:** partially credible
**Score:** 3.2

### Findings

**Critical — `@media` dark selector produces invalid CSS output**

The plan lists reception as using `@media (prefers-color-scheme: dark)` as its dark selector (Fact-Find Support table, row 2). The plan's fix is to replace the hardcoded `.dark` string literal on line 293 with `config.darkSelector ?? ".dark"`. But the resulting emitted CSS would be:

```css
@media (prefers-color-scheme: dark) {
  color-scheme: dark;
  --color-primary: 142 55% 48%;
  ...
}
```

This is **invalid CSS**. A `@media` block cannot directly contain custom property declarations — it must wrap a selector: `@media (...) { :root { --var: value; } }`. The current compiler emits a flat block with no inner selector, which is valid for `.dark { }` and `html.theme-dark { }` but broken for any `@media` query.

Reception is the primary consumer named for `tokenVarMap`. If its dark selector is `@media (prefers-color-scheme: dark)`, the plan's `darkSelector` field, as designed, cannot produce valid CSS for that case. The plan acknowledges in the Decision Log that multi-selector support is out of scope, but it does not acknowledge that the `@media` case is also broken for single-selector use.

Mitigation options not discussed: (a) restrict `darkSelector` to only class/attribute selectors and document the `@media` limitation, or (b) detect `@media` prefix and wrap the dark block in an inner `:root { }`. Either requires plan acknowledgment.

**Major — Parity test will break if `tokenVarMap` adds vars not in the committed generated CSS**

The brikette parity test at `packages/themes/brikette/__tests__/generated-parity.test.ts` has an inverse check ("no unexpected vars in generated output"). It reads the committed `apps/brikette/src/styles/theme-tokens.generated.css` as its source of truth and fails if the compiler emits any variable not present in that file.

The plan states the parity test is "unaffected" because brikette's config has no `tokenVarMap` field. This is correct for the type change alone. However, if any future regeneration of `theme-tokens.generated.css` runs *after* a config change, the test will catch it. More importantly, the plan does not mention that the generated CSS file (`theme-tokens.generated.css`) is a committed artifact that must stay in sync with the compiler. The plan's own tests run in a new `build-theme-css.test.ts` file, not against brikette's committed artifact. This is fine — but the plan should note the dependency.

Actually on re-inspection: brikette's `ThemeCSSConfig` has no `tokenVarMap`, so calling `generateThemeCSS()` for brikette with the new code is identical. The parity test does not break. This is correct. Downgrading to Minor.

**Major — `derivedVars` key convention inconsistency is not surfaced for callers**

`derivedVars` keys must NOT include the `--` prefix (the compiler prepends it via `` `  --${name}: ${value};` `` on line 189). `tokenVarMap` keys MUST include the `--` prefix (the compiler emits them verbatim). These two fields on the same `ThemeCSSConfig` struct have opposite conventions. This creates a footgun for any app author populating both fields.

The plan notes this distinction in the Decision Log but does not propose any guard. The TypeScript type `Record<string, { light: string; dark?: string }>` does not enforce `--` prefix at compile time. Contrast with `TokenMap` in `tokens.ts`, which uses the template literal type `` Record<`--${string}`, Token> `` to enforce this at the type level.

The plan should either: (a) adopt the same template literal type for `tokenVarMap` (`` Record<`--${string}`, { light: string; dark? : string }> ``), or (b) explicitly document the inconsistency in the type JSDoc. Using the stricter type costs nothing and prevents a silent bug category (double-prefixed vars would produce `----var-name` in output).

**Minor — `tokenVarMap` ordering claim is not enforced by implementation**

The acceptance criterion (item 5) states: "Ordering: tokenVarMap entries appear after brand colors and before RGB triplets." The execution plan inserts `tokenVarMap` lines after brand colors and before RGB triplets. But the compiler's `:root` block order is:
1. `color-scheme`
2. Profile vars
3. Font vars
4. Brand colors
5. RGB triplets
6. Derived vars

The plan says to insert between steps 4 and 5. However, the execution plan code snippet says "after brand colors and before RGB triplets in both `:root` and dark blocks." This is correct for `:root` but in the dark block, there are no font or profile vars — only brand colors, RGB triplets, and derived vars. No test case validates ordering explicitly (TC-04 through TC-08 test presence/absence, not ordering). This is not a functional issue, but the acceptance criterion could be falsely passed if vars appear after derived vars.

**Minor — `tokenVarMap` entries in the dark block when no dark vars exist still emits a comment**

Looking at the proposed implementation:
```ts
rootLines.push("  /* Token overrides */");
rootLines.push(...tokenLines);
```

This structure pushes the comment unconditionally before checking `tokenLines.length > 0`. The plan wraps it in `if (tokenLines.length > 0)` for the root block, but the dark block emission is described only as "(Same pattern for dark block)" — it's ambiguous whether the guard is applied. If a `tokenVarMap` with only light-only entries runs the dark block path, `generateTokenVarLines(..., "dark")` returns `[]`. If the comment guard is absent, the dark block gets a stray `/* Token overrides */` comment with no vars, which is cosmetically wrong.

**Observation — No existing test file for `build-theme-css.ts`**

The plan creates `packages/themes/base/__tests__/build-theme-css.test.ts` as a new file. The existing `__tests__/` directory for `@themes/base` contains only `tokens.test.ts`, `hospitality-tokens.test.ts`, and `contrast.test.ts` — none of which test the compiler. This is correct; a new file is required. No issue, just confirming.

**Observation — `generate-theme-tokens.ts` script is also a consumer of `generateThemeCSS`**

`scripts/brikette/generate-theme-tokens.ts` calls `generateThemeCSS()` and writes the output to a committed file. The plan lists only `packages/themes/brikette/src/theme-css-config.ts` and `packages/themes/brikette/__tests__/generated-parity.test.ts` as the downstream consumers to consider. The script is a third consumer, but since it passes the brikette config (no new fields), its behavior is unchanged.

**Observation — `GenerateThemeCSSOptions` duplication**

`GenerateThemeCSSOptions` (lines 58-62) has `assets` and `profile` at the top level AND inside `config: ThemeCSSConfig`. This means both fields are present twice on every call site (`generateThemeCSS({ assets, profile, config: { assets, profile, ... } })`). The plan does not address this redundancy, which is pre-existing tech debt. Not a blocker for this plan.

### Evidence Checks

| Claim | Verdict | Evidence |
|---|---|---|
| `.dark` hardcoded on line 293 of `build-theme-css.ts` | **Confirmed accurate** | Line 293: `sections.push(\`.dark {\n${darkLines.join("\n")}\n}\`)` |
| `ThemeCSSConfig` has no `darkSelector` field | **Confirmed accurate** | Interface at lines 29–56, no `darkSelector` present |
| `ThemeCSSConfig` has no `tokenVarMap` field | **Confirmed accurate** | Interface at lines 29–56, no `tokenVarMap` present |
| Brikette config uses no `darkSelector` | **Confirmed accurate** | `theme-css-config.ts` has no `darkSelector` field |
| Reception uses `@media (prefers-color-scheme: dark)` + `html.theme-dark` | **Not verifiable from cited sources** | The four upstream fact-find files listed as evidence (`docs/plans/reception-theme-token-compiler/fact-find.md` etc.) do not exist in the repo — the plan references unreachable documents. Reception's `tokens.ts` confirms 107 TokenMap entries exist, but dark selector choice cannot be confirmed from available code. |
| `tokenVarMap` type matches reception's `TokenMap` exactly | **Partially confirmed** | `TokenMap` in `tokens.ts` line 17 is `` Record<`--${string}`, Token> `` where `Token = { light: string; dark?: string }`. The plan proposes `Record<string, { light: string; dark?: string }>` — functionally equivalent but weaker type (no `--` enforcement). Not an exact match. |
| Brikette parity tests are unaffected | **Confirmed** | Parity test reads committed CSS and brikette's config, neither of which has new fields. Compiler output for brikette config is unchanged. |
| Only 5 files reference `ThemeCSSConfig` or `generateThemeCSS` | **Confirmed** | Grep finds 5 files: `scripts/brikette/generate-theme-tokens.ts`, `packages/themes/brikette/src/theme-css-config.ts`, `packages/themes/brikette/__tests__/generated-parity.test.ts`, `packages/themes/base/src/build-theme-css.ts`, `packages/themes/base/src/index.ts`. No undiscovered consumers. |
| Analysis references (4 fact-find docs) exist in repo | **Not confirmed** | `docs/plans/caryina-theme-token-compiler/`, `docs/plans/reception-theme-token-compiler/`, `docs/plans/cms-theme-token-compiler/`, `docs/plans/xa-b-theme-token-compiler/` were not found. The plan cites evidence that cannot be inspected. |
