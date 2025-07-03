# Storybook Guide

This project uses **Storybook** for developing and testing UI components.

## Running Storybook

Start the interactive UI explorer with:

```bash
pnpm storybook
```

Stories are located under `packages/ui` and `.storybook/stories`.

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
light/dark mode. Theme logic lives in `.storybook/preview.tsx`.

## Publishing Previews

Set `CHROMATIC_PROJECT_TOKEN` and run:

```bash
pnpm chromatic
```

to upload your Storybook to [Chromatic](https://www.chromatic.com/) for visual
review and regression testing.
