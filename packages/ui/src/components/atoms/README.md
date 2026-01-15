# Atoms

Small, reusable building blocks that power most UI layers in the design system.

Shadcn-based primitives live in [`atoms/shadcn`](./shadcn/README.md). They
re-export the original shadcn/ui components with our typings so you can opt in
to their baseline styling when needed.

```ts
import { Button } from "@ui/components/atoms/shadcn";

// or mix in our in-house atoms
import { StatCard } from "@ui/components/atoms";
```

When both variants are present in the same module, alias the shadcn import so
its provenance remains clear:

```ts
import { Button as ShButton } from "@ui/components/atoms/shadcn";
```

Most atoms extend a native element (`HTMLDivElement`, `HTMLSpanElement`, …) so
layout, spacing and accessibility attributes can be passed through via
`className`, `aria-*` attributes, `onClick` handlers and similar props.

## Usage patterns

- Import atoms from `@ui/components/atoms` inside apps and templates.
- Co-locate styling tweaks with consumers by passing Tailwind classes through
  `className` instead of modifying the component source.
- Many visual atoms (e.g. `StatCard`, `ProductBadge`) accept `children` or
  explicit props such as `label`/`value`. Prefer these documented props over
  re-implementing bespoke UI in downstream apps.

## Component reference

| Component | Key props | Example |
| --- | --- | --- |
| `StatCard` | `label: string`, `value: ReactNode`, `className?` | ```tsx
<StatCard label="Revenue" value="$12k" className="bg-card" />
``` |
| `Price` | `amount: number`, `currency?: string` – defaults to the active currency context | ```tsx
<Price amount={12900} currency="USD" className="text-2xl" />
``` |
| `LineChart` | `data: ChartData<'line'>`, `options?: ChartOptions<'line'>` | ```tsx
<LineChart data={trendData} options={{ plugins: { legend: { display: false } } }} />
``` |
| `Tooltip` | `content: ReactNode`, render-prop children to anchor the tooltip | ```tsx
<Tooltip content="Copied!">
  <button type="button">Copy code</button>
</Tooltip>
``` |
| `Loader` | `size?: number` (defaults to `20`) plus standard div attributes. Pair with off-screen text for accessibility. | ```tsx
<div className="flex items-center gap-2" aria-live="polite">
  <Loader size={28} />
  <span className="sr-only">Fetching recommendations</span>
</div>
``` |

Additional atoms follow the same pattern—props are intentionally narrow and
pass-through HTML attributes allow fine-grained control. Inspect the component
source or Storybook stories for less-common variants such as
`ARViewer`, `ZoomImage` or the toast primitives.

## Storybook examples

Every atom ships with a Storybook story under `Atoms/*`. These stories
demonstrate baseline configuration and common variations (loading, hover,
accessibility states). Launch Storybook with `pnpm --filter @acme/ui storybook`
to explore the playground and copy example code snippets.
