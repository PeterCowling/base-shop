# Storybook Guide

This project uses **Storybook** for developing and testing UI components.

## Running Storybook

Start the interactive UI explorer with:

```bash
pnpm storybook
```

Stories are located under `packages/ui` and `.storybook/stories`.

### Responsive Carousels

`ProductCarousel` and `RecommendationCarousel` determine how many items to show by
measuring the available screen width. The visible count is clamped between
`minItems` and `maxItems`, allowing stories to demonstrate both narrow and wide
viewports.

## Accessibility Tests

Automated accessibility checks run via `@storybook/test-runner` and `axe-playwright`.
Execute them against all stories with:

```bash
pnpm test-storybook
```

Custom Playwright tests live under `.storybook/test-runner`. For example,
`theme-toggle.test.ts` ensures the toolbar's theme and mode switches update the
CSS variables in rendered stories.

## Theme Switcher

The toolbar lets you toggle between design token themes (`base` or `brandx`) and
light, dark, or system mode. Dark tokens are defined once and applied to
`:root` with `@media (prefers-color-scheme: dark)`, while the `.theme-dark`
class forces dark mode when needed. Theme logic lives in `.storybook/preview.tsx`.

## Publishing Previews

Set `CHROMATIC_PROJECT_TOKEN` and run:

```bash
pnpm chromatic
```

to upload your Storybook to [Chromatic](https://www.chromatic.com/) for visual
review and regression testing.

## Date & Time Formatting

For consistent locale-aware timestamps across UI components, use the
`formatTimestamp` helper from `@lib/date` instead of calling
`toLocaleString` directly:

```ts
import { formatTimestamp } from "@lib/date";

formatTimestamp("2025-01-01T12:34:56Z");
```

This central utility ensures future components render dates uniformly.
