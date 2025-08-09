# Shadcn Atoms

Wrappers around [shadcn/ui](https://ui.shadcn.com/) primitives. They expose the original components with our TypeScript types and minimal styling tweaks so they can be used as regular atoms in the design system.

Import directly from `@ui`:

```ts
import { Button, Input } from "@ui";
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
