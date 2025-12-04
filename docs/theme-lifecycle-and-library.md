Type: Guide
Status: Active
Domain: Theming
Last-reviewed: 2025-12-02

# Theme Lifecycle and Library

A theme library keeps reusable styles in one place and tracks how they evolve over time.

## Layout spec tips
- Document layout rules with each theme. Consistent spacing and typography tokens make swapping themes predictable.

## Token mapping strategies
- When a theme adds new tokens, map them to the existing schema. Deprecated tokens should be noted so migrations are clear.

## Rollback
- Publish each theme with an immutable tag. Restoring a previous look is as simple as selecting the prior tag.

## Versioning
- Increment the theme version whenever defaults or tokens change. Record notes in the library so downstream shops know what changed.
