Type: Runbook
Status: Active
Domain: Repo
Last-reviewed: 2026-01-23

# Modal + Dropdown Migration Checklist

This checklist defines the required behaviors when migrating app-level modals or dropdowns to design-system primitives.

## Acceptance Criteria

- Focus trap is enforced while open (Tab/Shift+Tab stays within the dialog).
- Escape closes the modal or dropdown when appropriate.
- Click outside closes only when expected; destructive actions are gated.
- Focus is restored to the trigger on close.
- Scroll lock prevents background scroll while modal is open.
- ARIA roles/labels are present and correct (`dialog`, `aria-labelledby`, `aria-describedby`).
- Z-index and portal behavior avoid clipping and stacked dialogs behave predictably.
- Keyboard navigation works for menu items (arrow keys, Enter/Space).

## Migration Steps

1. Replace custom overlays with `@acme/design-system/primitives`:
   - Modal: `Dialog`, `DialogOverlay`, `DialogPortal`, `DialogTitle`, `DialogContent`
   - Dropdown: `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`
   - Popover: `Popover`, `PopoverTrigger`, `PopoverContent`
2. Preserve existing open/close state logic; map it onto `open` + `onOpenChange`.
3. Ensure focus restore on close (if using a context provider, store the last focused element).
4. Validate behavior against the acceptance criteria above.
5. Add/adjust tests for at least:
   - Escape closes
   - Focus returns to trigger
   - A basic keyboard traversal

## Notes

- `@acme/ui/molecules/SimpleModal` is already backed by design-system Dialog primitives.
- Prefer `ThemeStyle` for theme-driven styles rather than inline colors in modal content.
