---
name: create-ui-component
description: Create UI components following atomic design hierarchy (atom/molecule/organism/template) with design tokens, forwardRef, tests, and Storybook stories.
---

# Create UI Component

Create components in `packages/ui/components/<layer>s/<ComponentName>/`.

## Layer Rules (CRITICAL)

- **Atoms** — Can import: primitives, types, hooks only
- **Molecules** — Can import: atoms + above
- **Organisms** — Can import: molecules + above
- **Templates** — Can import: organisms + above
- **Pages** (apps/) — Can import: any UI layer

Higher layers NEVER import from lower layers.

## File Structure

```
packages/ui/components/<layer>s/<ComponentName>/
├── ComponentName.tsx
├── ComponentName.test.tsx
├── ComponentName.stories.tsx
└── index.ts
```

## Component Template

```tsx
import { forwardRef } from 'react'
import type { ComponentPropsWithoutRef, ElementRef } from 'react'
import { cn } from '@acme/design-system/utils/style'

export interface ComponentNameProps extends ComponentPropsWithoutRef<'div'> {
  variant?: 'default' | 'primary' | 'secondary'
}

export const ComponentName = forwardRef<ElementRef<'div'>, ComponentNameProps>(
  ({ className, variant = 'default', children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-md p-4',
        {
          'bg-primary text-primary-foreground': variant === 'primary',
          'bg-secondary text-secondary-foreground': variant === 'secondary',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)

ComponentName.displayName = 'ComponentName'
```

## Rules

- Use `forwardRef` for DOM components
- Merge `className` via `cn()` (custom class always last = highest priority)
- Use design tokens only (no arbitrary values)
- Export from layer index: `packages/ui/components/<layer>s/index.ts`

## Import from Apps

```tsx
import { ComponentName } from '@acme/ui'
// or for presentation primitives:
import { Button } from '@acme/design-system/primitives'
```

## Validation

```bash
pnpm typecheck
pnpm --filter @acme/ui test -- --testPathPattern ComponentName
pnpm --filter @acme/ui lint
```

## Checklist

- [ ] Correct layer (simplest possible)
- [ ] Imports respect hierarchy
- [ ] Uses design tokens (no arbitrary values)
- [ ] `forwardRef` with proper types
- [ ] `cn()` for className merging
- [ ] Tests (render, variants, ref, className)
- [ ] Storybook stories
- [ ] Exported from package index
- [ ] Accessible (semantic HTML, ARIA)
