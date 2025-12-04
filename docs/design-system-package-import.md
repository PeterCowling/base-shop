Type: Guide
Status: Active
Domain: Theming
Last-reviewed: 2025-12-02

# Design System Package Import

Importing a design system package lets the CMS generate tokens and components from an external source.

## Layout spec tips
- Align imported components with existing layout rules. Verify grid and breakpoint tokens before publishing.

## Token mapping strategies
- Map the package's tokens to the platform's names. Use a translation table so design and engineering share the same meaning.

## Rollback
- Keep the previous package version in `package.json`. Reinstall it to revert if the new tokens cause issues.

## Versioning
- Bump the package version and commit the change. Record the imported version in the CMS so future upgrades reference the history.
