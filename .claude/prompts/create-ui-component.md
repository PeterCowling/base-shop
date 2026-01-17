# Create UI Component

## Context
Create a new UI component following the monorepo's atomic design hierarchy and design token system.

## Prerequisites
- Component name: `{{componentName}}`
- Component layer: `{{layer}}` (atom/molecule/organism/template)
- Location: `packages/ui/components/{{layer}}s/{{componentName}}/`

## Architectural Rules
**CRITICAL:** Follow the component hierarchy:
- **Atoms** - Can import: primitives, types, hooks (NO other components)
- **Molecules** - Can import: atoms, primitives, types, hooks
- **Organisms** - Can import: molecules, atoms, primitives, types, hooks
- **Templates** - Can import: organisms, molecules, atoms, primitives, types, hooks
- **Pages** (in apps/) - Can import: any UI layer

## Workflow

### 1. Understand Context
```bash
# Read the target layer to see existing patterns
Read packages/ui/components/{{layer}}s/

# Find similar components for reference
pnpm claude:find-component {{similarComponent}}
```

### 2. Check Layer Compliance
- What layer should this be? (simplest possible)
- What components does it need to import?
- Do those imports respect the hierarchy?

### 3. Create Component Structure
Create these files in `packages/ui/components/{{layer}}s/{{componentName}}/`:

**`{{componentName}}.tsx`:**
```tsx
import { forwardRef } from 'react'
import type { ComponentPropsWithoutRef, ElementRef } from 'react'

export interface {{componentName}}Props extends ComponentPropsWithoutRef<'div'> {
  // Add your props here
  variant?: 'default' | 'primary' | 'secondary'
}

/**
 * {{Brief description of what this component does}}
 *
 * @example
 * ```tsx
 * <{{componentName}} variant="primary">
 *   Content here
 * </{{componentName}}>
 * ```
 */
export const {{componentName}} = forwardRef<
  ElementRef<'div'>,
  {{componentName}}Props
>(({ className, variant = 'default', children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        // Base styles using design tokens
        'rounded-md',
        // Variant styles
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
})

{{componentName}}.displayName = '{{componentName}}'
```

**`{{componentName}}.test.tsx`:**
```tsx
import { render, screen } from '@testing-library/react'
import { {{componentName}} } from './{{componentName}}'

describe('{{componentName}}', () => {
  it('renders without crashing', () => {
    render(<{{componentName}}>Test</{{componentName}}>)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('applies variant styles', () => {
    const { container } = render(
      <{{componentName}} variant="primary">Test</{{componentName}}>
    )
    expect(container.firstChild).toHaveClass('bg-primary')
  })

  it('forwards ref correctly', () => {
    const ref = createRef<HTMLDivElement>()
    render(<{{componentName}} ref={ref}>Test</{{componentName}}>)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('merges custom className', () => {
    const { container } = render(
      <{{componentName}} className="custom-class">Test</{{componentName}}>
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })
})
```

**`{{componentName}}.stories.tsx`:**
```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { {{componentName}} } from './{{componentName}}'

const meta: Meta<typeof {{componentName}}> = {
  title: 'Components/{{layer | capitalize}}s/{{componentName}}',
  component: {{componentName}},
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'secondary'],
    },
  },
}

export default meta
type Story = StoryObj<typeof {{componentName}}>

export const Default: Story = {
  args: {
    children: 'Default {{componentName}}',
  },
}

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary {{componentName}}',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary {{componentName}}',
  },
}
```

**`index.ts`:**
```tsx
export * from './{{componentName}}'
export type { {{componentName}}Props } from './{{componentName}}'
```

### 4. Use Design Tokens
**CRITICAL:** Only use design tokens, never arbitrary values:

✅ **Correct:**
```tsx
className="bg-primary text-primary-foreground rounded-md p-4 gap-2"
```

❌ **Wrong:**
```tsx
className="bg-[#FF0000] text-[16px] rounded-[8px] p-[16px]"
```

**Token Categories:**
- Colors: `bg-primary`, `text-foreground`, `border-muted`
- Spacing: `p-4`, `gap-2`, `space-y-4`
- Typography: `text-base`, `font-sans`, `text-lg`
- Borders: `border`, `border-2`, `rounded-md`
- Shadows: `shadow-sm`, `shadow-md`

### 5. Add Accessibility
- Use semantic HTML elements
- Add ARIA labels where needed
- Ensure keyboard navigation works
- Test with screen reader if interactive

### 6. Export from Package
Add to `packages/ui/components/{{layer}}s/index.ts`:
```tsx
export * from './{{componentName}}'
```

## Quality Checks

Run these commands:
```bash
# Type checking
pnpm typecheck

# Tests
pnpm --filter @acme/ui test -- --testPathPattern {{componentName}}

# Lint
pnpm --filter @acme/ui lint

# View in Storybook
pnpm storybook
```

**Manual Checks:**
- [ ] Component respects layer hierarchy (check imports)
- [ ] Uses design tokens (no arbitrary values)
- [ ] Has TypeScript types for all props
- [ ] Has JSDoc comments
- [ ] Forwards ref if applicable
- [ ] Handles className merging with `cn()`
- [ ] Has comprehensive tests (render, variants, edge cases)
- [ ] Has Storybook stories showing all variants
- [ ] Passes accessibility checks
- [ ] Works in both light and dark mode (if applicable)
- [ ] Exported from package index

## Common Mistakes to Avoid

❌ **Breaking layer hierarchy:**
```tsx
// In an atom - DON'T DO THIS
import { SomeOrganism } from '../organisms' // ❌ Atoms can't import organisms
```

❌ **Arbitrary values:**
```tsx
className="bg-[#FF0000] p-[16px]" // ❌ Use tokens
```

❌ **Missing forwarded ref:**
```tsx
// Should use forwardRef for DOM components
export const MyComponent = (props) => { /* ... */ } // ❌
```

❌ **No tests:**
```tsx
// Component without tests ❌
```

## Example Usage

After creating the component:

```tsx
import { {{componentName}} } from '@acme/ui'

export default function MyPage() {
  return (
    <{{componentName}} variant="primary">
      Hello World
    </{{componentName}}>
  )
}
```

## Related Documentation
- [Architecture](../../docs/architecture.md) - Layer hierarchy
- [Design Tokens](../../docs/typography-and-color.md) - Token usage
- [Testing](../../__tests__/docs/testing.md) - Testing guidelines
