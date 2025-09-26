# Drawer Primitive

A thin wrapper around Radix Dialog that standardizes slide-over surfaces and sides.

## Usage

```tsx
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
} from "@acme/ui";

<Drawer>
  <DrawerTrigger asChild>
    <button>Open</button>
  </DrawerTrigger>
  <DrawerContent side="right" width="w-80" className="p-6">
    <DrawerTitle>Title</DrawerTitle>
    <DrawerDescription className="sr-only">Optional description</DrawerDescription>
    …
  </DrawerContent>
  {/* Optional: DrawerOverlay / DrawerPortal available for custom cases */}
  {/* Overlay defaults are managed by callers (e.g., use bg-[hsl(--overlay-scrim-1)]). */}
</Drawer>
```

## Design tokens

- Surface: `bg-panel`
- Borders: `border-border-2` with `border-l`/`border-r` depending on `side`
- Elevation: `shadow-elevation-4`

## Props

- `side`: `"left" | "right"` (default: `"right"`)
- `width`: Tailwind width class (string) or pixel number. When numeric, an inline `style` width is applied with `maxWidth: 100%`.

## Accessibility

Use `DrawerTitle` and `DrawerDescription` inside `DrawerContent` to provide accessible names and descriptions (Radix requirement). If you want to visually hide them, apply `sr-only` classes.

