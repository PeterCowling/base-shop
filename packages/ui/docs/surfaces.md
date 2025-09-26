# Surfaces and Tokens

This UI package standardizes container surfaces to improve readability and consistency across themes.

- Use `bg-panel` for containers such as dialogs, drawers, popovers, dropdowns, selects, and cards.
- Use `bg-surface-2` for lightweight hover or highlight states.
- Use `bg-surface-3` for stronger emphasis such as selected rows or elevated hover.
- Borders should prefer `border-border-2` for container edges; `border-border-1` for subtle separators.
- Focus rings should use the tokenized `ring-ring` color with width/offset variables.

Examples:
- DropdownMenu / Select / Popover: `bg-panel` + `border-border-2`, item `hover:bg-surface-3`.
- Dialog content: `bg-panel` + `border-border-2`.
- Drawers (MiniCart, Wishlist, Sidebars): `bg-panel` + `border-border-2`. Prefer the Drawer primitive for new slide-overs.
- Table rows: hover `bg-surface-2`, selected `bg-surface-3`.

Rationale: `panel` maps to a token that ensures contrast and theme parity across light/dark, while `surface-2/3` provide a stepped elevation/interaction scale.
