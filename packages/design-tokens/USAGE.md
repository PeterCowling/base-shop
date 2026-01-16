# Design Tokens Usage Guide

## Overview

The `@acme/design-tokens` package provides context-aware design tokens and a Tailwind plugin that enables different UI densities and spacing for different types of applications.

## Contexts

Choose the appropriate context for your app:

### Operations Context
**Use for**: Reception, inventory, POS systems, dashboards, admin panels

**Characteristics**:
- Dense spacing (8px row gaps, 16px section gaps)
- Smaller base font (14px)
- Optimized for data-heavy interfaces
- Compact table cells (8px padding)

```tsx
// apps/reception/src/app/layout.tsx
<body className="context-operations">
  {children}
</body>
```

### Consumer Context
**Use for**: Marketing sites, e-commerce shops, public-facing pages

**Characteristics**:
- Generous spacing (24px row gaps, 48px section gaps)
- Standard base font (16px)
- Comfortable reading experience
- Larger touch targets

```tsx
// apps/brikette/src/app/layout.tsx
<body className="context-consumer">
  {children}
</body>
```

### Hospitality Context
**Use for**: Hotel/hostel websites, booking systems, guest portals

**Characteristics**:
- Balanced spacing (16px row gaps, 32px section gaps)
- Medium base font (15px)
- Works for both guest-facing and staff-facing screens

```tsx
// apps/booking-system/src/app/layout.tsx
<body className="context-hospitality">
  {children}
</body>
```

## Using CSS Variables

All context tokens are exposed as CSS variables when you apply a context class:

### Typography Variables

```css
--base-size      /* Base font size */
--heading-size   /* Heading font size */
--label-size     /* Label/small text size */
--data-size      /* Data display size (operations only) */
--hero-size      /* Hero text size (consumer only) */
```

**Usage**:
```tsx
<h2 className="text-[var(--heading-size)]">Heading</h2>
<p className="text-[var(--base-size)]">Body text</p>
```

### Spacing Variables

```css
--row-gap          /* Gap between rows */
--section-gap      /* Gap between sections */
--card-padding     /* Card internal padding */
--input-padding    /* Input field padding */
--table-cell-padding  /* Table cell padding */
--button-padding-x /* Button horizontal padding */
--button-padding-y /* Button vertical padding */
```

**Usage**:
```tsx
<div className="flex flex-col gap-[var(--row-gap)]">
  <Card className="p-[var(--card-padding)]">
    Content
  </Card>
</div>
```

### Core Spacing Variables

These are always available regardless of context:

```css
--space-0   /* 0 */
--space-1   /* 4px */
--space-2   /* 8px */
--space-3   /* 12px */
--space-4   /* 16px */
--space-5   /* 20px */
--space-6   /* 24px */
--space-8   /* 32px */
--space-10  /* 40px */
--space-12  /* 48px */
--space-16  /* 64px */
--space-20  /* 80px */
--space-24  /* 96px */
```

### Status Colors (Operations Context)

```css
--status-available
--status-occupied
--status-cleaning
--status-maintenance
--stock-low
--stock-ok
--stock-high
```

**Usage**:
```tsx
<div style={{ color: 'var(--status-available)' }}>
  Available
</div>
```

### Brand Colors (Consumer Context)

```css
--color-brand-primary
--color-brand-secondary
--color-accent
--price-default
--price-sale
--price-original
```

**Usage**:
```tsx
<button style={{ backgroundColor: 'var(--color-brand-primary)' }}>
  Buy Now
</button>
```

### Room Status Colors (Hospitality Context)

```css
--room-available
--room-occupied
--room-cleaning
--room-maintenance
--amenity-highlight
--booking-primary
```

## Overriding Context

You can override the context for specific sections:

```tsx
<body className="context-operations">
  {/* Most of the app uses operations context */}

  <section className="context-consumer">
    {/* This marketing section uses consumer spacing */}
    <Hero />
  </section>
</body>
```

## Density Overrides

Override just the density without changing the full context:

```tsx
<div className="density-compact">
  {/* Forces compact spacing even in consumer context */}
</div>

<div className="density-comfortable">
  {/* Forces comfortable spacing even in operations context */}
</div>

<div className="density-default">
  {/* Forces default/hospitality spacing */}
</div>
```

## Brand Color Customization

Override brand colors per app using inline styles:

```tsx
// apps/cover-me-pretty/src/app/layout.tsx
<body
  className="context-consumer"
  style={{
    '--color-brand-primary': 'hsl(330, 100%, 50%)', // Pink
    '--color-brand-secondary': 'hsl(340, 100%, 60%)',
  } as React.CSSProperties}
>
  {children}
</body>
```

## Programmatic Access

Import tokens directly in TypeScript:

```typescript
import {
  operationsTokens,
  consumerTokens,
  hospitalityTokens,
  getContextTokens
} from '@acme/design-tokens'

// Get tokens for a context
const tokens = getContextTokens('operations')
console.log(tokens.spacing['row-gap']) // '0.5rem' (8px)

// Direct access
const spacing = operationsTokens.spacing['card-padding'] // '0.75rem' (12px)
```

## Examples by App Type

### Reception App (Operations)

```tsx
// apps/reception/src/app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="context-operations">
        {children}
      </body>
    </html>
  )
}

// Component usage
function GuestList() {
  return (
    <div className="flex flex-col gap-[var(--section-gap)]">
      <Card className="p-[var(--card-padding)]">
        <h2 className="text-[var(--heading-size)] mb-[var(--row-gap)]">
          Guests
        </h2>
        <DataTable {...props} />
      </Card>
    </div>
  )
}
```

### Product Shop (Consumer)

```tsx
// apps/cover-me-pretty/src/app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className="context-consumer"
        style={{
          '--color-brand-primary': 'hsl(330, 100%, 50%)',
        } as React.CSSProperties}
      >
        {children}
      </body>
    </html>
  )
}

// Component usage
function ProductGrid() {
  return (
    <div className="grid grid-cols-3 gap-[var(--section-gap)]">
      {products.map(product => (
        <Card key={product.id} className="p-[var(--card-padding)]">
          <h3 className="text-[var(--heading-size)]">{product.name}</h3>
          <Price amount={product.price} />
        </Card>
      ))}
    </div>
  )
}
```

### Hostel Website (Hospitality)

```tsx
// apps/brikette/src/app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="context-hospitality">
        {children}
      </body>
    </html>
  )
}

// Component usage
function RoomCard({ room }) {
  return (
    <Card className="p-[var(--card-padding)] flex flex-col gap-[var(--row-gap)]">
      <h3 className="text-[var(--heading-size)]">{room.name}</h3>
      <div style={{ color: 'var(--room-available)' }}>
        Available
      </div>
    </Card>
  )
}
```

## Best Practices

1. **Set context once**: Apply the context class at the app root (`<body>` or top-level layout)

2. **Use CSS variables**: Prefer `var(--row-gap)` over hardcoded values

3. **Override sparingly**: Only override context when sections truly need different density

4. **Document deviations**: Comment why you're overriding the default context

5. **Test responsive behavior**: Context spacing should work well on mobile, tablet, and desktop

6. **Semantic colors**: Use status/brand colors instead of hardcoding hex values

## Troubleshooting

### Variables are undefined

**Problem**: CSS variables show as `var(--row-gap)` in browser

**Solution**: Ensure you've applied a context class (`context-operations`, `context-consumer`, or `context-hospitality`) to a parent element.

### Wrong spacing/font size

**Problem**: Components don't match expected density

**Solution**: Check that the correct context is applied and no conflicting styles override the variables.

### Brand colors not applying

**Problem**: Custom brand colors don't show

**Solution**: Ensure inline styles use proper TypeScript casting: `as React.CSSProperties`

## Migration from Hardcoded Values

Replace hardcoded Tailwind classes with CSS variables:

```tsx
// ❌ Before
<div className="p-6 gap-4 text-base">

// ✅ After
<div className="p-[var(--card-padding)] gap-[var(--row-gap)] text-[var(--base-size)]">
```

## Phase 2 Features (Coming Soon)

- **Dashboard context**: Optimized for analytics and chart-heavy interfaces
- **Spacious density**: For accessibility and large displays
- **Additional color schemes**: Extended status and semantic colors

---

**Package**: `@acme/design-tokens`
**Version**: 0.0.0
**Last updated**: 2026-01-12
