---
Type: Runbook
Status: Archive
Domain: Repo
Last-reviewed: 2026-01-24
Relates-to charter: docs/plans/handbag-configurator-implementation-plan.md
---

# Handbag Configurator Lint Enablement Plan

## Summary
- `apps/handbag-configurator` currently bypasses monorepo linting via its own `lint` script that just `echo`s and via the global `eslint.config.mjs` ignore list. Running lint manually shows hundreds of design-system and formatting violations, so the app is not in sync with shared quality gates.
- Goal: clean up the app so it obeys shared ESLint rules and re-enable linting by wiring it into the standard workflow (`pnpm lint` + package scripts).

## Acceptance criteria
1. ESLint runs cleanly against `apps/handbag-configurator/src/**` using the canonical config without `--no-ignore`, and the app is removed from the `eslint.config.mjs` ignore list.
2. `apps/handbag-configurator/package.json` exposes a working `lint` script (IDE expectation: `eslint .` or equivalent).
3. `pnpm lint` / `turbo run lint` includes handbag-configurator by default without breaking the existing global build.
4. Fixes respect DS rules (no hardcoded tokens/colors typography, physical-direction classes, etc.), and translations follow `packages/i18n`.

## Tasks
1. **Audit current failures.** Document which files / rules block lint so we can prioritize prunable problems. Prioritize `simple-import-sort`, DS color/typography rules, hardcoded copy, security warnings, and auto-fixable ESLint issues.
2. **Apply automatic fixes.** Run `pnpm exec eslint --config eslint.config.mjs --fix` (or targeted commands) across `apps/handbag-configurator` and commit the safe changes (imports, type-imports, etc.).
3. **Resolve DS hardcoded warnings manually.** Replace raw colors/typography classes, logical utility usage, container width limits, `z-index`, `tap-size`, `hardcoded copy` with tokens or translations, and add required `ds/require-disable-justification` tickets if unavoidable.
4. **Enable lint.** Update `apps/handbag-configurator/package.json:lint` to match other apps, remove the `apps/handbag-configurator/**` ignore entry in `eslint.config.mjs`, and rerun `pnpm exec eslint --config eslint.config.mjs apps/handbag-configurator/src`.
5. **Validate gate.** Run targeted `pnpm --filter @apps/handbag-configurator lint` and ensure `pnpm lint` passes; update docs if new exemptions needed.

## Risks / Questions
- DS rule changes may require deeper UI adjustments; flag blockers early if a rule seems inappropriate for configurator-specific interactions.
- Translations demand new entries in `packages/i18n`; confirm locale scope (probably `en-US`).

## Phase 2: Reintroduce DS governance (copy rule)

1. **Scope creep log.** Track the incremental subset of DS rules we re-enable — start with `ds/no-hardcoded-copy` — and annotate which directories are ready (initially `src/app` + `src/ui`) versus the deferred viewer/hotspot assets.
2. **Targeted override.** Re-enable `ds/no-hardcoded-copy` via a focused override in `eslint.config.mjs` for the directories above, while the global disable block retains coverage for the rest of the app; add `ignorePatterns` for CSS gradients so the rule remains actionable for real copy.
3. **Ship UI copy to translations.** Introduce `handbagConfigurator.*` keys covering the banner message, button labels, lookdev/KTX2 panels, and toggle tooling text, then reference them via `useTranslations` (and `useTranslations.server` for the error state).
4. **Validate the scoped run.** Run `pnpm exec eslint --config eslint.config.mjs --no-ignore apps/handbag-configurator/src` and confirm zero `ds/no-hardcoded-copy` reports under the targeted directories before removing the general rule disable.
5. **Plan next phases.** Once copy is covered, promote this plan with the next DS rule (palette/typography/token rules) and capture the scope so the next iteration can tackle it.

## Progress
- Replaced the temporary `lint` placeholder with `eslint .`, so the package now participates in the shared workflow and runs the DS plugin build via `prelint`.
- Added a scoped override in `eslint.config.mjs` that turns `ds/no-hardcoded-copy` back on for `apps/handbag-configurator/src/app` and `src/ui` while keeping the broader disable block in place for the more experimental viewer and API code.
- Replaced every piece of UI copy in the targeted directories with `handbagConfigurator.*` keys and added the corresponding translations in `packages/i18n/src/{en,de,es,fr,it,ja,ko}.json`.
- Ran `pnpm --filter @apps/handbag-configurator lint` (which pulls the shared config) to confirm the scoped rule now passes.
- Re-enabled `ds/no-raw-color` for the same directories and moved the swatch palette/textures into `src/viewer/swatchStyles.ts`, so the UI layer no longer stores raw hex/rgba values while the viewer/hotspot code that drives the rule remains under the global disable block.
- Re-enabled `ds/no-raw-font`, `ds/no-raw-typography`, and `ds/no-arbitrary-tailwind`; replaced every `text-[..]`/`tracking-[..]` usage in `TopBar`, `ThemeToggle`, and the lookdev/KTX2 headers with token-friendly tailwind utilities plus global helper classes (`handbag-tracking-*` and `handbag-caption`), and routed the layout-specific `grid-cols`/`max-w` definitions into dedicated CSS helpers.
- Added scoped overrides that keep `ds/no-raw-color`, `ds/no-hardcoded-copy`, `ds/no-raw-font`, `ds/absolute-parent-guard`, `ds/enforce-layout-primitives`, and `ds/no-nonlayered-zindex` disabled only for the viewer layer while the API routes keep `ds/no-hardcoded-copy` off, so the remaining DS rules apply everywhere else.
- Reintroduced `ds/no-hardcoded-copy` for the viewer/hotspot surfaces by translating the remaining UI strings (badges, buttons, hotspot panel copy) through new `handbagConfigurator.*` keys, adding i18n exemptions for palette/debug data, and confirming the targeted lint gate still passes before tightening the scoped override.

## Next steps
- All phases complete. DS rules are enforced across all directories.
- Viewer/API scoped overrides removed. Remaining exemptions are file-level `eslint-disable` with ticket references (HAND-0008 for Three.js colors, HAND-0009 for overlay positioning, HAND-0010 for API error messages).
- Global `ds/no-raw-color: "off"` removed. Only non-DS relaxations remain in the global block (complexity, max-lines, security, TS strictness).

## Phase 3: Token/typography/palette rules

**Goal:** Bring the remaining token-focused DS rules back for the `src/app` + `src/ui` surface so the configurator UI aligns with the rest of the monorepo (fonts, palette helpers, and Tailwind utilities must come from the DS token set instead of inline values).

### Tasks
1. **Audit remaining rule gaps.** Re-run `pnpm --filter @apps/handbag-configurator lint` and capture the specific `ds/no-raw-*` and `ds/no-arbitrary-tailwind` violations that still surface outside `TopBar`, `ThemeToggle`, `LookdevClient`, and `Ktx2TestClient`. Record the files/rules in this plan for visibility.
2. **Extract helpers.** Continue extracting letter-spacing/font-size variants into `globals.css` helpers (reusing `handbag-tracking-*` and `handbag-caption`) and apply them wherever `text-[..]` or `tracking-[..]` appear in `src/app` or `src/ui`.
3. **Promote Tailwind tokens.** Replace `max-w-[1280px]`, `grid-cols-[1fr_auto_1fr]`, or similar arbitrary layout utilities with DS-approved tokens (`max-w-screen-xl`, grid utility mixins, or new helpers anchored in `globals.css`).
4. **Revalidate & iterate.** After each cleanup, re-run the targeted lint command to ensure no new `ds/no-raw-*` or `ds/no-arbitrary-tailwind` violations remain, documenting blockers/residual violations in the plan so they can be addressed in subsequent PRs.

### Phase 3 progress
- Task 1: recent `pnpm --filter @apps/handbag-configurator lint` runs report zero `ds/no-raw-*` / `ds/no-arbitrary-tailwind` errors once the helper classes/DS tokens were introduced, so no additional blocking files remain in `src/app` + `src/ui`.
- Tasks 2 & 3: the helper classes (`handbag-tracking-*`, `handbag-caption`, `handbag-topbar-grid`) now cover the letter-spacing/font-size/layout needs across `TopBar`, `ThemeToggle`, `LookdevClient`, and `Ktx2TestClient`, and those same helpers were reused inside the `ViewerCanvas` / `HotspotOverlay` UI surfaces to remove the remaining `text-[..]` / `tracking-[..]` usages.
- Task 4: the lint gate now passes cleanly, so the next scope is to start lifting the global disable block for viewer/hotspot assets once their palettes and tailwind usages align with the DS tokens.
