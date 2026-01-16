---
Type: Plan
Status: Active
Domain: Commerce
Created: 2026-01-16
Created-by: Codex
Last-updated: 2026-01-16
Last-updated-by: Codex
---

# Handbag Configurator DS Lint Cleanup

## Problem Summary
The `@apps/handbag-configurator` lint job fails with ~200+ design-system (DS) violations across viewer and rendering modules (layout primitives, typography tokens, colors, z-index, RTL-safe classes, and hardcoded copy). This blocks `validate / validate-and-build` in CI for PRs touching shared packages.

## Goals
- Bring `apps/handbag-configurator` lint to green without disabling DS rules.
- Replace raw Tailwind values, colors, and typography with DS tokens/utilities.
- Update layout and layering to use DS primitives and approved z-index patterns.
- Preserve runtime visuals and interaction behaviors.

## Non-goals
- Redesigning the configurator UI/UX.
- Refactoring unrelated viewer logic beyond lint compliance.
- Mass search/replace without understanding component context.

## Approach
1. **Inventory violations**
   - Run `pnpm --filter @apps/handbag-configurator lint` and capture file-level errors.
   - Group by rule type: layout primitives, typography/spacing tokens, color tokens, z-index, RTL-safe classes, hardcoded copy.
2. **Prioritize high-impact files**
   - Focus on `ViewerCanvas.tsx`, `HotspotOverlay.tsx`, `materialPresets.ts`, `LightingRig.tsx`, `LookdevObjects.tsx`, and any others flagged by lint.
3. **Apply DS fixes**
   - Replace raw Tailwind values (`tracking-[...]`, `text-[...]`, `active:scale-[...]`) with DS-approved utilities.
   - Swap `flex`/absolute layout on leaf nodes for `Stack/Inline/Grid` primitives where possible.
   - Replace raw colors with DS tokens (or theme variables if the viewer uses its own palette).
   - Resolve z-index violations by using approved layering components or refactoring to avoid direct z-index.
   - Convert hardcoded copy to i18n keys or add scoped `i18n-exempt` comments with ticket + TTL when non-UI.
4. **Validate and iterate**
   - Re-run lint locally after each file set.
   - Ensure visual behavior remains consistent (manual smoke check if needed).

## Risks
- Visual regressions in 3D viewer overlays if layout primitives change semantics.
- Token substitutions might alter colors/spacing slightly.

## Validation
- `pnpm --filter @apps/handbag-configurator lint`
- CI `validate / validate-and-build` for `@apps/handbag-configurator`

## Open Questions
- Should configurator-specific colors be mapped to existing DS tokens or added to theme tokens?
- Do we need dedicated DS utility classes for micro-typography (tracking/text sizes) used in viewer overlays?
