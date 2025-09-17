# Shadcn atoms

Thin wrappers around [shadcn/ui](https://ui.shadcn.com/) primitives. They expose
upstream behaviour with our typings so consumers can opt into shadcn defaults
while staying inside the `@acme/ui` package.

```ts
import { Button, Input } from "@/components/atoms/shadcn";

// combine with first-party atoms when needed
import { StatCard } from "@/components/atoms";
```

Alias the shadcn imports when an in-house atom shares the same component name to
keep call sites clear:

```ts
import { Button } from "@/components/atoms";
import { Button as ShButton } from "@/components/atoms/shadcn";

function Example() {
  return (
    <div className="flex gap-3">
      <Button>Primary</Button>
      <ShButton variant="secondary">Secondary</ShButton>
    </div>
  );
}
```

## Available wrappers

All wrappers accept the same props as their shadcn counterparts plus a
`className` override:

| Component | Notes |
| --- | --- |
| `Button` | Supports `variant`, `size`, `asChild` and can be composed with icons. |
| `Input` / `Textarea` | Controlled or uncontrolled text inputs with Tailwind-friendly classes. |
| `Checkbox` | Emits `checked`/`onCheckedChange` values consistent with Radix. |
| `Select` | Includes trigger, content and item sub-components. Import as `Select`, `SelectTrigger`, etc. |
| `Dialog` | Provides modal primitives (`Dialog`, `DialogTrigger`, `DialogContent`, …). |
| `Card`, `Table` | Structural wrappers for layout blocks and tabular data. |

Refer to the generated Storybook stories under `Atoms/Shadcn/*` for interactive
examples.

## Maintenance

- Run `pnpm shadcn:diff` after bumping `@shadcn/ui` to review upstream changes.
- Keep wrapper props aligned with the upstream components to avoid mismatched
  behaviour in the CMS and storefront apps.
