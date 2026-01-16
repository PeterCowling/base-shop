# Apply Design System & Tokens

## Context
Apply design tokens and design system patterns correctly in this monorepo. Never use arbitrary values.

## Prerequisites
- Component or page to style: `{{targetFile}}`
- Design requirements: `{{requirements}}`

## Design Token System

### Color Tokens
**Semantic colors (use these):**
```tsx
// Background colors
bg-background      // Main background
bg-foreground      // Inverted background
bg-card           // Card backgrounds
bg-popover        // Popover backgrounds
bg-primary        // Primary brand color
bg-secondary      // Secondary brand color
bg-muted          // Muted/subtle backgrounds
bg-accent         // Accent highlights
bg-destructive    // Error/destructive actions

// Text colors
text-foreground           // Default text
text-muted-foreground    // Muted text
text-primary-foreground  // Text on primary bg
text-secondary-foreground // Text on secondary bg
text-accent-foreground   // Text on accent bg
text-destructive-foreground // Text on destructive bg

// Border colors
border            // Default border
border-input      // Input borders
border-ring       // Focus rings
```

### Spacing Tokens
```tsx
// Padding & Margin
p-0, p-1, p-2, p-4, p-6, p-8, p-12, p-16, p-20, p-24
px-4  // horizontal
py-2  // vertical
pt-4  // top
pr-2  // right
pb-4  // bottom
pl-2  // left

// Gap (for flex/grid)
gap-1, gap-2, gap-4, gap-6, gap-8
gap-x-2  // horizontal gap
gap-y-4  // vertical gap

// Space between
space-x-2  // horizontal space between children
space-y-4  // vertical space between children
```

### Typography Tokens
```tsx
// Font families
font-sans      // Body font (from design system)
font-heading   // Heading font (if different)
font-mono      // Monospace

// Font sizes
text-xs     // 0.75rem
text-sm     // 0.875rem
text-base   // 1rem
text-lg     // 1.125rem
text-xl     // 1.25rem
text-2xl    // 1.5rem
text-3xl    // 1.875rem
text-4xl    // 2.25rem

// Font weights
font-normal     // 400
font-medium     // 500
font-semibold   // 600
font-bold       // 700

// Line heights
leading-none      // 1
leading-tight     // 1.25
leading-normal    // 1.5
leading-relaxed   // 1.625
```

### Border & Radius Tokens
```tsx
// Border width
border       // 1px
border-2     // 2px
border-4     // 4px

// Border radius
rounded-none    // 0
rounded-sm      // 0.125rem
rounded         // 0.25rem
rounded-md      // 0.375rem
rounded-lg      // 0.5rem
rounded-xl      // 0.75rem
rounded-full    // 9999px
```

### Shadow Tokens
```tsx
shadow-sm       // Small shadow
shadow          // Default shadow
shadow-md       // Medium shadow
shadow-lg       // Large shadow
shadow-xl       // Extra large shadow
```

## Workflow

### 1. Analyze Current Styles
If refactoring existing code:
```tsx
// ❌ BEFORE - Arbitrary values
<div className="bg-[#FF0000] text-[16px] p-[16px] rounded-[8px]">
  Content
</div>
```

### 2. Map to Token System
```tsx
// ✅ AFTER - Using tokens
<div className="bg-destructive text-destructive-foreground p-4 rounded-md">
  Content
</div>
```

### 3. Common Patterns

#### Card Pattern
```tsx
<div className="bg-card text-card-foreground rounded-lg border shadow-sm p-6">
  <h2 className="text-2xl font-semibold mb-2">Card Title</h2>
  <p className="text-muted-foreground">Card description</p>
</div>
```

#### Button Variants
```tsx
// Primary button
<button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium">
  Primary
</button>

// Secondary button
<button className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md font-medium">
  Secondary
</button>

// Outline button
<button className="border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-2 rounded-md font-medium">
  Outline
</button>

// Ghost button
<button className="hover:bg-accent hover:text-accent-foreground px-4 py-2 rounded-md font-medium">
  Ghost
</button>
```

#### Form Input Pattern
```tsx
<div className="space-y-2">
  <label className="text-sm font-medium leading-none">
    Email
  </label>
  <input
    type="email"
    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    placeholder="you@example.com"
  />
</div>
```

#### Layout Container Pattern
```tsx
// Page container
<div className="container mx-auto px-4 py-8">
  <main className="max-w-4xl mx-auto">
    {/* Content */}
  </main>
</div>

// Section spacing
<section className="py-12 md:py-16 lg:py-20">
  {/* Section content */}
</section>

// Grid layout
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Grid items */}
</div>
```

### 4. Responsive Design
Use mobile-first responsive prefixes:
```tsx
<div className="
  px-4 py-2          // Mobile
  md:px-6 md:py-3    // Tablet (768px+)
  lg:px-8 lg:py-4    // Desktop (1024px+)
  xl:px-10 xl:py-5   // Large desktop (1280px+)
">
  Responsive spacing
</div>

<h1 className="
  text-2xl           // Mobile
  md:text-3xl        // Tablet
  lg:text-4xl        // Desktop
  xl:text-5xl        // Large desktop
">
  Responsive heading
</h1>
```

### 5. Dark Mode
All semantic tokens automatically support dark mode:
```tsx
// This automatically adapts to dark mode
<div className="bg-background text-foreground border border-border">
  Content adapts to theme
</div>

// Force dark mode class if needed (avoid unless necessary)
<div className="dark:bg-slate-900 dark:text-white">
  Manual dark mode styles (only when tokens don't work)
</div>
```

### 6. Accessibility Colors
Ensure contrast ratios meet WCAG AA standards:

✅ **Good contrast:**
```tsx
<div className="bg-primary text-primary-foreground">
  Text is readable
</div>
```

❌ **Poor contrast:**
```tsx
<div className="bg-muted text-muted-foreground">
  <!-- Don't use muted bg + muted text together -->
</div>
```

### 7. Using `cn()` Helper
Merge Tailwind classes correctly:
```tsx
import { cn } from '@/lib/utils'

interface Props {
  className?: string
  variant?: 'default' | 'destructive'
}

export function Component({ className, variant = 'default' }: Props) {
  return (
    <div
      className={cn(
        // Base styles
        'rounded-md px-4 py-2 font-medium',
        // Conditional styles
        {
          'bg-primary text-primary-foreground': variant === 'default',
          'bg-destructive text-destructive-foreground': variant === 'destructive',
        },
        // Custom className from props (highest priority)
        className
      )}
    >
      Content
    </div>
  )
}
```

## Common Patterns

### Hero Section
```tsx
<section className="relative bg-background">
  <div className="container mx-auto px-4 py-16 md:py-24">
    <div className="max-w-3xl mx-auto text-center space-y-6">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
        Hero Title
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground">
        Hero description text
      </p>
      <div className="flex gap-4 justify-center">
        <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-md font-medium">
          Primary CTA
        </button>
        <button className="border border-input hover:bg-accent px-6 py-3 rounded-md font-medium">
          Secondary CTA
        </button>
      </div>
    </div>
  </div>
</section>
```

### Card Grid
```tsx
<div className="container mx-auto px-4 py-12">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {items.map(item => (
      <div
        key={item.id}
        className="bg-card text-card-foreground rounded-lg border shadow-sm hover:shadow-md transition-shadow p-6"
      >
        <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
        <p className="text-muted-foreground">{item.description}</p>
      </div>
    ))}
  </div>
</div>
```

### Form Layout
```tsx
<form className="space-y-6 max-w-md mx-auto">
  <div className="space-y-2">
    <label className="text-sm font-medium">Name</label>
    <input
      type="text"
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
    />
  </div>

  <div className="space-y-2">
    <label className="text-sm font-medium">Email</label>
    <input
      type="email"
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
    />
  </div>

  <button
    type="submit"
    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium"
  >
    Submit
  </button>
</form>
```

## Quality Checks

```bash
# Check if Tailwind compiles without errors
pnpm --filter {{package}} build

# Run tests
pnpm --filter {{package}} test

# Check in Storybook
pnpm storybook
```

**Visual Checks:**
- [ ] No arbitrary values used (no `[#hex]`, `[16px]`, etc.)
- [ ] Colors use semantic tokens
- [ ] Spacing uses token scale
- [ ] Typography uses token scale
- [ ] Works in both light and dark mode
- [ ] Responsive on mobile, tablet, desktop
- [ ] Meets WCAG AA contrast ratios
- [ ] Consistent with existing components

## Anti-Patterns

❌ **Arbitrary values:**
```tsx
className="bg-[#FF0000] text-[16px] p-[16px]"
```

❌ **Direct hex colors:**
```tsx
className="bg-red-500" // Use semantic tokens instead
```

❌ **Inline styles:**
```tsx
style={{ backgroundColor: '#FF0000', padding: '16px' }}
```

❌ **Hardcoded pixels:**
```tsx
className="w-[250px] h-[100px]"
```

✅ **Use tokens:**
```tsx
className="bg-destructive text-base p-4 w-64 h-24"
```

## Design System Resources
- Design tokens: `packages/design-tokens/`
- Typography guide: `docs/typography-and-color.md`
- Component library: `packages/ui/components/`
- Tailwind config: `tailwind.config.mjs`

## When Tokens Don't Exist

If you need a value not in the token system:
1. Check if there's a semantic token that's close enough
2. Discuss with team if new token needed
3. Add to design tokens package
4. Update Tailwind config
5. Document in typography-and-color.md

**Don't:** Use arbitrary values as workaround
**Do:** Extend the token system properly
