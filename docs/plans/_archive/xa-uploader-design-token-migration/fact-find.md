---
Title: XA uploader — design token exemptions XAUP-0001 unresolved
Slug: xa-uploader-design-token-migration
Status: Ready-for-planning
Business: XA
Domain: SELL
Outcome: planning
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Loop-Gap-Trigger: none
Primary-Execution-Skill: lp-do-build
Delivery-Readiness: 80%
Last-updated: 2026-02-28
Source-Dispatch: IDEA-DISPATCH-20260228-0072
---

## Summary

The XA uploader has 14 UI component files blanket-disabled under XAUP-0001 for
design token violations, plus 6 non-UI files with separate exemptions. The root
cause is a set of "gate" CSS custom properties (`--gate-ink`, `--gate-muted`,
`--gate-bg`, `--gate-accent`) defined as hardcoded hex values in an inline `style`
block on `UploaderHome.client.tsx`, rather than mapped to the base theme tokens.
The base theme already provides exact or near-exact equivalents. Migration path:
define gate tokens as aliases in `globals.css`, register them in the Tailwind
config, and update components to use proper utility classes.

## Access Declarations

None — investigation was codebase-only.

## Routing Header

```yaml
Outcome: planning
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Loop-Gap-Trigger: none
```

## Investigation Summary

### Root cause: gate tokens defined as raw hex inline

In `apps/xa-uploader/src/app/UploaderHome.client.tsx` (line 41–44):
```tsx
style={{
  "--gate-bg": "#ffffff",
  "--gate-ink": "#111111",
  "--gate-muted": "#6b6b6b",
  "--gate-accent": "#111111",
} as CSSProperties}
```

These four custom properties power the uploader's visual theme but are set as raw
hex values, violating `ds/no-raw-color`. They are also never registered in the
Tailwind config, so every use of them becomes `text-[color:var(--gate-ink)]` —
triggering `ds/no-arbitrary-tailwind`.

### Base theme mapping

The base theme (`packages/themes/base/tokens.css`) already provides equivalent tokens:

| Gate token | Value | Base equivalent | Tailwind class |
|---|---|---|---|
| `--gate-bg` | `#ffffff` | `--color-bg` (0 0% 100%) | `bg` / `bg-surface` |
| `--gate-ink` | `#111111` | `--color-fg` (0 0% 10%) | `text-fg` / `border-fg` |
| `--gate-muted` | `#6b6b6b` | `--color-fg-muted` (0 0% 40%) | `text-muted-foreground` |
| `--gate-accent` | `#111111` | `--color-fg` (same) | `text-fg` |

These values are close (not pixel-perfect) but both are near-black for ink and
white for bg — the gate tokens do not encode brand-specific values.

### Violation inventory

**Category A — gate token arbitrary values (14 UI files)**

All 14 UI component files use patterns like:
- `text-[color:var(--gate-ink)]` → REPLACE: `text-fg`
- `text-[color:var(--gate-muted)]` → REPLACE: `text-muted-foreground`
- `bg-[color:var(--gate-bg)]` → REPLACE: `bg` or `bg-surface`
- `border-[color:var(--gate-ink)] bg-[color:var(--gate-ink)]` → REPLACE: `border-fg bg-fg`

**Category B — raw typography values (design decision required)**

Several components use:
- `text-[10px]` — no base token for 10px text (`text-xs` = 12px)
- `tracking-[0.35em]`, `tracking-[0.3em]`, `tracking-[0.25em]` — no tracking tokens

These require a design decision: either add typography tokens to the base theme,
or accept these specific values as whitelisted brand constants.

**Category C — tap size accessibility (ds/min-tap-size)**

Some buttons have tap targets below 44px (e.g., the "Recheck" button in
`CatalogSyncPanel` uses `px-3 py-2 text-[10px]`). These need padding/height
adjustment to meet the minimum.

**Category D — non-UI file exemptions (separate from design tokens)**

These 6 files have XAUP-0001 exemptions unrelated to design tokens:

| File | Rule | Reason | Resolution path |
|---|---|---|---|
| `api/catalog/currency-rates/route.ts` | `ds/no-hardcoded-copy` | Machine-token route guards | Keep: API strings are not UI copy |
| `api/catalog/products/route.ts` | `ds/no-hardcoded-copy` | Machine-token route guards | Keep: API strings are not UI copy |
| `api/catalog/sync/route.ts` | `security/detect-non-literal-fs-filename` | Dynamic paths from validated inputs | Accepted risk — inputs are validated |
| `components/catalog/catalogConsoleUtils.ts` | `ds/no-hardcoded-copy` | Zod schema message map | Keep: maps Zod EN output to i18n keys |
| `lib/catalogCsv.ts`, `lib/repoRoot.ts`, `lib/submissionZip.ts` | blanket | Security/i18n audit pending | Separate task — security audit scope |
| `lib/__tests__/*.ts` | blanket | Temp FS operations in tests | Keep: test utilities exemption |
| `lib/uploaderI18n.ts` | blanket | i18n stubs pending centralization | Separate task — i18n centralization |

**Scope for this plan**: Category A + B + C only (UI design token violations).
Category D files are separate concerns with their own resolution paths and should
NOT be included in this design token migration.

### Files with design token violations (Category A/B/C)

| File | Exemptions | Notes |
|---|---|---|
| `app/UploaderHome.client.tsx` | `ds/no-raw-color, ds/no-arbitrary-tailwind, ds/container-widths-only-at` | Root cause — defines gate tokens as raw hex inline |
| `components/LanguageToggle.client.tsx` | `ds/no-raw-typography, ds/no-arbitrary-tailwind` | Small component, minimal violations |
| `components/catalog/CatalogConsole.client.tsx` | `ds/no-raw-typography, ds/no-arbitrary-tailwind, ds/min-tap-size` | Main shell component |
| `components/catalog/CatalogLoginForm.client.tsx` | `ds/no-raw-typography, ds/no-arbitrary-tailwind, ds/min-tap-size, ds/enforce-layout-primitives, ds/no-hardcoded-copy` | Complex form, most rules violated |
| `components/catalog/CatalogProductBagFields.client.tsx` | blanket | Product form fields |
| `components/catalog/CatalogProductBaseFields.client.tsx` | blanket | Product form fields |
| `components/catalog/CatalogProductClothingFields.client.tsx` | blanket | Product form fields |
| `components/catalog/CatalogProductForm.client.tsx` | blanket | Parent form component |
| `components/catalog/CatalogProductImagesFields.client.tsx` | blanket | Product form fields |
| `components/catalog/CatalogProductJewelryFields.client.tsx` | blanket | Product form fields |
| `components/catalog/CatalogProductsList.client.tsx` | blanket | Product list |
| `components/catalog/CatalogSubmissionPanel.client.tsx` | blanket | Submission panel |
| `components/catalog/CatalogSyncPanel.client.tsx` | blanket | Sync panel |
| `components/catalog/CurrencyRatesPanel.client.tsx` | blanket | Currency rates panel |

### What already uses tokens correctly

`CatalogSyncPanel.client.tsx` (recently modified) already uses:
`border-border-2`, `bg-surface`, `bg-muted`, `text-primary-fg`, `text-danger-fg`,
`text-success-fg`, `shadow-elevation-1` — this is the target pattern.

### Test landscape

No component-level visual regression tests exist. The test suite covers:
- Unit tests for utilities (`fileGlob`, `imageDimensions`, `submissionZip`)
- Integration tests for API routes (`route.test.ts`)
- Component tests for feedback logic (`sync-feedback.test.tsx`, `action-feedback.test.tsx`)

There are no snapshot tests or visual tests that would break from token migration.
The safe validation approach is: lint passes clean (all XAUP-0001 exemptions
removed from Category A/B/C files) + typecheck clean + manual review.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Gate token definition (root cause) | Yes | `ds/no-raw-color` in inline style block | Yes — resolve in TASK-01 |
| Tailwind config token registration | Yes | Gate tokens not in Tailwind config | Yes — resolve in TASK-01 |
| Component token usage (Category A) | Yes | 14 files with arbitrary value violations | Yes — resolve in TASK-02 through TASK-04 |
| Typography token gaps (Category B) | Yes | `text-[10px]` has no direct equivalent | Yes — design decision needed in planning |
| Tap size violations (Category C) | Yes | Some buttons below 44px | Yes — resolve alongside Category A |
| Non-UI exemptions (Category D) | Yes | Separate concerns, not design tokens | No — excluded from this plan scope |
| Test coverage for migration | Yes | No visual regression tests | No — lint/typecheck sufficient for validation |

## Evidence Gap Review

### Gaps Addressed

- Confirmed gate token definition location and values
- Mapped gate tokens to existing base theme tokens with exact values
- Identified all 14 UI component files affected
- Confirmed which files can keep exemptions (Category D) vs which need migration
- Established that Tailwind config already has `text-fg`, `text-muted-foreground` etc.

### Confidence Adjustments

`text-[10px]` has no base token equivalent — this is a minor confidence dip for
the typography category. Options: add `text-2xs` token to base theme (adding a
new token), use `text-xs` (12px — slight visual change), or accept as whitelisted.
This needs a design decision in planning. Overall confidence remains 80%.

### Remaining Assumptions

- Gate token values `#111111` and `hsl(0 0% 10%)` are visually equivalent enough
  that migration will not cause visible colour changes (assumption: acceptable drift)
- `text-[10px]` pattern will be resolved in planning phase (design decision deferred)

## Open Questions

All self-resolved:

1. **Q: Does xa-uploader have its own theme package?** Resolved: No. Uses base
   theme directly. Gate tokens should be defined in `globals.css` as aliases to
   base tokens, not in a new theme package.

2. **Q: Are Category D exemptions in scope?** Resolved: No. API route
   `ds/no-hardcoded-copy` exemptions cover machine-readable strings (not UI
   copy), security relaxations, and test utilities. These are intentional and should
   remain under XAUP-0001 until their specific audits are complete.

3. **Q: Will removing gate token inline styles break the uploader visually?**
   Resolved: No, if gate tokens are mapped in `globals.css` before removing the
   inline block. The inline style block sets the root values; CSS vars in `globals.css`
   achieve the same effect at page scope.
