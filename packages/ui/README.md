# @acme/ui

Domain-level UI components for the Acme platform.

## Overview

`@acme/ui` is the domain UI layer, providing:

- **Domain Components** – Shop-specific organisms, checkout UI, product displays
- **CMS Components** – Page Builder, media manager, shop chooser, editor UI
- **Domain Hooks** – useCart, useCheckout, useProductEditorFormState
- **Domain Contexts** – Modal, banner, rates contexts
- **Templates** – Page-level layouts for storefronts
- **Size/Tone Guidance** – For atoms (Buttons/IconButtons/Tags/ProductBadges/Chips): see `docs/size-tone-guide.md`

## Architecture Role

`@acme/ui` sits above `@acme/design-system` in the package hierarchy:

```
Apps (apps/*)
    ↓
CMS-only packages (@acme/cms-marketing, @acme/configurator)
    ↓
@acme/ui (domain UI) ← You are here
    ↓
@acme/design-system (presentation primitives)
    ↓
Low-level libraries (@acme/types, @acme/date-utils, etc.)
```

## Deprecated Presentation Imports

**Presentation primitives should be imported from `@acme/design-system`, not `@acme/ui`.**

The following import paths are deprecated for presentation components:

```ts
// ❌ Deprecated
import { Button } from "@acme/ui/atoms";
import { Button } from "@acme/ui/atoms/Button";
import { Card } from "@acme/ui/components/atoms/primitives";
import { cn } from "@acme/ui/utils/style";

// ✅ Use design-system instead
import { Button, Card } from "@acme/design-system/primitives";
import { cn } from "@acme/design-system/utils/style";
```

These deprecated paths now delegate to `@acme/design-system` via shims for backward compatibility, but new code should use design-system directly.

## Valid @acme/ui Imports

Domain components and contexts remain valid imports from `@acme/ui`:

```ts
// ✅ Domain components (valid)
import { ProductCard, CheckoutForm } from "@acme/ui";
import { StorefrontFooter } from "@acme/ui/components/organisms";

// ✅ Domain hooks (valid)
import { useCart, useCheckout } from "@acme/ui/hooks";

// ✅ Domain contexts (valid)
import { ModalProvider, useModal } from "@acme/ui/context/modal";
```

## Package Structure

```
packages/ui/
├── src/
│   ├── atoms/           # Shims to design-system (deprecated)
│   ├── components/
│   │   ├── atoms/       # Domain atoms + shims
│   │   ├── molecules/   # Domain molecules
│   │   ├── organisms/   # Domain organisms
│   │   ├── templates/   # Page templates
│   │   ├── cms/         # CMS editor UI
│   │   ├── checkout/    # Checkout components
│   │   └── shop/        # Shop-specific components
│   ├── hooks/           # Domain hooks
│   ├── context/         # Domain contexts
│   └── utils/           # Shims to design-system (deprecated)
```

## Related Documentation

- [Architecture](../../docs/architecture.md) – Package layering and import rules
- [Design System README](../design-system/README.md) – Canonical presentation imports
- [Size/Tone Guide](../../docs/size-tone-guide.md) – Atom sizing guidance
- [Platform vs Apps](../../docs/platform-vs-apps.md) – Platform vs apps responsibilities
