# @acme/design-system

The canonical source for presentation primitives, atoms, molecules, hooks, and style utilities.

## Overview

`@acme/design-system` is the foundation layer of the UI architecture. It provides:

- **Primitives** – Button, Card, Dialog, Input, Select, Checkbox, etc.
- **Atoms** – FormField, IconButton, Tag, Chip, Alert, etc.
- **Molecules** – FormField (molecule variant), etc.
- **Presentation Hooks** – useViewport, useReducedMotion, useInView, useScrollProgress
- **Style Utilities** – cn, cssVars, boxProps, drawerWidthProps
- **shadcn Wrappers** – shadcn-style API wrappers over primitives

## Canonical Imports

```ts
// Primitives
import { Button, Card, CardHeader, CardContent, CardFooter } from "@acme/design-system/primitives";
import { Dialog, DialogContent, DialogHeader } from "@acme/design-system/primitives";
import { Input, Select, Checkbox, Textarea } from "@acme/design-system/primitives";

// Atoms
import { FormField } from "@acme/design-system/atoms/FormField";
import { IconButton } from "@acme/design-system/atoms/IconButton";
import { Tag, Chip, Alert } from "@acme/design-system/atoms";

// Molecules
import { FormField as MoleculeFormField } from "@acme/design-system/molecules/FormField";

// Hooks
import { useViewport, useReducedMotion, useInView, useScrollProgress } from "@acme/design-system/hooks";

// Style Utilities
import { cn, cssVars, boxProps, drawerWidthProps } from "@acme/design-system/utils/style";

// shadcn Wrappers (alternative API)
import { Button } from "@acme/design-system/shadcn/Button";
```

## Package Exports

| Export Path | Description |
|-------------|-------------|
| `@acme/design-system` | Main barrel export |
| `@acme/design-system/primitives` | Core UI primitives |
| `@acme/design-system/atoms` | Atomic components |
| `@acme/design-system/atoms/*` | Individual atoms |
| `@acme/design-system/molecules` | Molecule components |
| `@acme/design-system/molecules/*` | Individual molecules |
| `@acme/design-system/hooks` | Presentation hooks |
| `@acme/design-system/hooks/*` | Individual hooks |
| `@acme/design-system/utils/style` | Style utilities |
| `@acme/design-system/shadcn` | shadcn-style wrappers |
| `@acme/design-system/shadcn/*` | Individual shadcn wrappers |

## Architecture Rules

1. **Foundation Layer**: design-system is the lowest UI layer; it must not import from `@acme/ui`, `@acme/cms-ui`, or any app.
2. **No Domain Logic**: design-system must not contain e-commerce logic (cart, pricing, inventory), CMS/editor logic, or app-specific contexts.
3. **Token-Based Styling**: All components use design tokens from `packages/themes/*` rather than hardcoded colors.

## Migration from @acme/ui

If you're importing presentation primitives from `@acme/ui`, migrate to `@acme/design-system`:

```ts
// ❌ Deprecated
import { Button } from "@acme/ui/atoms";
import { cn } from "@acme/ui/utils/style";

// ✅ Canonical
import { Button } from "@acme/design-system/primitives";
import { cn } from "@acme/design-system/utils/style";
```

The `@acme/ui` package maintains backward-compatible shims that delegate to design-system, but new code should import from design-system directly.

## Related Documentation

- [Component Catalog](../../docs/component-catalog.md) – **Searchable catalog of all components with decision tree**
- [Architecture](../../docs/architecture.md) – Package layering and import rules
- [Theme Customization Guide](../../docs/theming-customization-guide.md) – Token overrides and branding
- [API Reference](../../docs/api/) – Generated TypeDoc reference (`pnpm doc:api`)
- [UI Architecture Consolidation Plan](../../docs/plans/ui-architecture-consolidation-plan.md) – Migration strategy
