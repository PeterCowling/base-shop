# Shadcn Atoms

Wrappers around [shadcn/ui](https://ui.shadcn.com/) primitives. They expose the original components with our TypeScript types and minimal styling tweaks so they can be used as regular atoms in the design system.

Import from this directory to make it clear the component originates from shadcn:

```ts
import { Button, Input } from "@ui";
```

When using both the shadcn wrapper and an in-house atom of the same
name, alias the shadcn import so the distinction remains clear:

```ts
import { Button } from "@ui";
import { Button as ShButton } from "@ui";
```

Available components:

- `Button`
- `Input`
- `Card`
- `Checkbox`
- `Dialog`
- `Select`
- `Table`
- `Textarea`

Run `pnpm shadcn:diff` after upgrading `@shadcn/ui` to check for
upstream changes.
