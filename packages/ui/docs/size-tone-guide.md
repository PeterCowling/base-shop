# Size & Tone Guide (Atoms)

Use these defaults to keep atoms consistent across apps.

## Sizes
- `sm`: compact surfaces (h-9 / px-3), icon-only h/w-9.
- `md`: standard surfaces (h-10 / px-4).
- `lg`: roomy surfaces (h-11 / px-5 / text-base), icon-only h/w-11.

Applies to: Button, IconButton, Tag, ProductBadge, Chip.

## Tones
- `solid`: filled background + foreground contrast.
- `soft`: tinted background, foreground stays neutral.
- `outline`: border + neutral text.
- `ghost`: neutral text, subtle hover fill.
- `quiet`: text-forward, near-transparent hover (use for low-emphasis actions).

Colors: `default | primary | accent | success | info | warning | danger` (Tag/Badge/Chip also support `destructive` alias).

## A11y
- Icon-only actions (Button/IconButton) require `aria-label`/`aria-labelledby`.
- Toast/Tag/Badge/Chip stories show size/tone combos; mirror those patterns in apps.
- IconButton includes a `quiet` variant for low-emphasis, text-forward actions; pair with clear labels.

## Storybook
- Buttons: see `Primitives/Button` (TonesAndColors, TonesColorsSizes, quiet tone).
- IconButton: see `Atoms/IconButton` for variants and sizes.
- Pills: `Atoms/Tag`, `Atoms/ProductBadge`, `Atoms/Chip` include size grids.
