Type: Guide
Status: Active
Domain: UI
Last-reviewed: 2025-12-02

# Storybook Guide

This project uses **Storybook** for developing and testing UI components.

**Builder choice:** we are pinned to the Webpack 5 builder (`apps/storybook/.storybook/main.ts`). We attempted Vite (see `apps/storybook/.storybook/vite.storybook.ts`) and rolled it back because it broke HMR and server/client stubbing for Next 15/React 19. Please do **not** retry Vite unless there is an explicit migration task; it burns time and leaves SB unusable.

## Running Storybook

Start the interactive UI explorer (app wrapper) with:

```bash
pnpm storybook   # runs @apps/storybook (config: apps/storybook/.storybook)
```

For CI and a quicker subset, use the filtered config on port 6007 (app wrapper):

```bash
pnpm storybook:ci   # runs @apps/storybook run dev:ci (config: apps/storybook/.storybook-ci)
pnpm storybook:composed   # runs @apps/storybook run dev:composed (config: apps/storybook/.storybook-composed)
```

Stories live under `packages/ui` and `apps/storybook/.storybook/stories`. A small
"known-good" subset is tagged with `ci` and used by the CI config.

### Responsive Carousels

`ProductCarousel` and `RecommendationCarousel` determine how many items to show by
measuring the available screen width. The visible count is clamped between
`minItems` and `maxItems`, allowing stories to demonstrate both narrow and wide
viewports.

## Tests (current approach)

We run a lightweight Playwright suite against the CI Storybook. This is the
most reliable path in this stack (Next 15, React 19) and keeps CI green:

```bash
pnpm test-storybook         # starts SB (CI config) and runs the Playwright smoke tests
pnpm storybook:smoke        # same, explicit
pnpm storybook:smoke:ci     # CI-focused Playwright sweep over atoms/molecules/CMS blocks/PageBuilder
pnpm test-storybook:coverage # start + run the official test-runner with coverage enabled
```

### Coverage

Code coverage for stories uses the official `@storybook/addon-coverage`. Enable the
**Coverage** toggle in the Testing panel or run `pnpm test-storybook:coverage` to
capture metrics. When coverage runs, the addon exposes a `/coverage/index.html`
report from the local Storybook server alongside the summary visible in the
testing widget.

Critical stories covered in CI (Matrix):

- Order Summary (organisms)
- Product Variant Selector (organisms)
- Product Gallery (organisms)
- Showcase Section (CMS block)
- Collection Section.client (CMS block)
- CMS/PageBuilder flows (add/reorder, style edit, template apply, locale/device, checkout composition)
- CMS/PageBuilder visual matrix (hero → grid → value props → social proof → checkout shell)

Manual guardrails:

- Use `CMS/PageBuilder → Perf probe (50 blocks)` to spot render regressions; it logs initial render time to the console and is tagged `perf` (Chromatic snapshots disabled).

Where the smoke tests live:

- `apps/storybook/.storybook/test-runner/__tests__/smoke-health.test.ts` — basic iframe boot
- `apps/storybook/.storybook/test-runner/__tests__/tokens.test.ts` — Tokens/All base→brandx via globals
- `apps/storybook/.storybook/test-runner/__tests__/usefsm.test.ts` — verifies `useFSM` toggles label

Notes:

- These are plain Playwright tests that navigate directly to Storybook's
  `iframe.html` with `id=...` and, where needed, set globals via the URL
  (e.g., `&globals=tokens:brandx`).
- The official `@storybook/test-runner` remains installed but is currently
  bypassed because it times out on this environment. See "Why not the official
  runner (for now)?" below.

## Theme Switcher

The toolbar lets you toggle between design token themes (`base` or `brandx`) and
light, dark, or system mode. Dark tokens are defined once and applied to
`:root` with `@media (prefers-color-scheme: dark)`, while the `.theme-dark`
class forces dark mode when needed. Theme logic lives in `apps/storybook/.storybook/preview.tsx`.

## Publishing Previews

Chromatic is **placeholder only** right now. We are not uploading or gating on Chromatic in the near term.
If/when we re-enable it, set `CHROMATIC_PROJECT_TOKEN` and run:

```bash
pnpm chromatic
```

to upload your Storybook to [Chromatic](https://www.chromatic.com/) for visual
review and regression testing. Until then, leave it disabled.

### Visual Tests addon (Chromatic)

The Chromatic Visual Tests addon remains installed but is disabled by default. Do not sign in or trigger snapshots; use the Playwright smoke suites instead. We'll revisit Chromatic when the migration is explicitly scheduled.

## Date & Time Formatting

For consistent locale-aware timestamps across UI components, use the
`formatTimestamp` helper from `@acme/date-utils` instead of calling
`toLocaleString` directly:

```ts
import { formatTimestamp } from "@acme/date-utils";

formatTimestamp("2025-01-01T12:34:56Z");
```

This central utility ensures future components render dates uniformly.

## Why not the official runner (for now)?

- We initially targeted the official `@storybook/test-runner` for story smoke
  checks and a11y. On our stack (Next 15 / React 19), the runner routinely
  timed out waiting for stories to be considered "rendered" (even with
  `waitForPageReady`, visibility fixes, and simple `play()` hooks).
- We also tried Storybook 9 and runner 0.24.x (next) but saw similar behavior.
  We reverted to Storybook 8.6.14 for developer stability and use direct
  Playwright tests for CI checks.

Decision:

- Keep Storybook on 8.6.14 for now and run Playwright-based smoke tests
  against the CI config to validate key stories quickly and reliably.
- Retain `@storybook/test-runner` and a dedicated script so we can retry easily
  when compatibility improves.

How to retry later:

- Try upgrading `@storybook/test-runner` (and, optionally, Storybook core) and
  run the official path:

```bash
pnpm run test-storybook:runner
```

If this becomes reliable again, we can switch `pnpm test-storybook` back to the
official runner and expand coverage.
