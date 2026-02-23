# Component Catalog

> **Last updated**: 2026-02-23
> **Purpose**: Searchable catalog of all components in `@acme/design-system` and `@acme/ui`

This catalog helps developers discover available components before building custom UI. Components are organized by layer (primitives → atoms → molecules → organisms → templates) and category.

---

## Quick Decision Tree

**"I need..."**

### Forms & Inputs
- **Simple text input** → `Input` from `@acme/design-system/primitives`
- **Multi-line text** → `Textarea` from `@acme/design-system/primitives`
- **Checkbox** → `Checkbox` from `@acme/design-system/primitives`
- **Radio button group** → `RadioGroup` + `RadioGroupItem` from `@acme/design-system/primitives`
- **Dropdown select** → `Select` from `@acme/design-system/primitives`
- **Searchable dropdown** → `Combobox` from `@acme/design-system/primitives`
- **Date picker** → `DatePicker` from `@acme/design-system/molecules`
- **File upload** → `FileSelector` from `@acme/design-system/atoms`
- **Slider/range** → `Slider` from `@acme/design-system/primitives`
- **Toggle switch** → `Switch` from `@acme/design-system/atoms`
- **Form with validation** → `Form` + `FormField` + `FormMessage` from `@acme/design-system/molecules` (react-hook-form integration)
- **Simple label+input** → `FormField` from `@acme/design-system/atoms`
- **Quantity input** → `QuantityInput` from `@acme/design-system/molecules`
- **Promo code input** → `PromoCodeInput` from `@acme/design-system/molecules`
- **Payment method selector** → `PaymentMethodSelector` from `@acme/design-system/molecules`
- **Media/image selector** → `MediaSelector` from `@acme/design-system/molecules`
- **Search bar** → `SearchBar` from `@acme/design-system/molecules`

### Layout & Structure
- **Vertical stack** → `Stack` from `@acme/design-system/primitives`
- **Horizontal row** → `Inline` from `@acme/design-system/primitives`
- **Flex cluster (wrapping)** → `Cluster` from `@acme/design-system/primitives`
- **Grid layout** → `Grid` from `@acme/design-system/primitives` or `@acme/design-system/atoms` (different APIs)
- **Card container** → `Card` + `CardHeader` + `CardContent` + `CardFooter` from `@acme/design-system/primitives`
- **Section with heading** → `Section` from `@acme/design-system/atoms`
- **Sidebar layout** → `Sidebar` from `@acme/design-system/primitives`
- **Cover layout (centered)** → `Cover` from `@acme/design-system/primitives`
- **Custom scrollbar** → `ScrollArea` from `@acme/design-system/primitives`
- **Divider line** → `Separator` from `@acme/design-system/primitives`

### Navigation & Tabs
- **Tabs** → `Tabs` + `TabsList` + `TabsTrigger` + `TabsContent` from `@acme/design-system/primitives`
- **Breadcrumbs** → `Breadcrumbs` from `@acme/design-system/molecules`
- **Stepper/wizard** → `Stepper` + `StepperStep` from `@acme/design-system/molecules`
- **Step flow shell** → `StepFlowShell` from `@acme/design-system/primitives`
- **Step progress** → `StepProgress` from `@acme/design-system/primitives`

### Feedback & Overlays
- **Button** → `Button` from `@acme/design-system/primitives`
- **Icon button** → `IconButton` from `@acme/design-system/atoms`
- **Modal dialog** → `Dialog` + `DialogContent` + `DialogHeader` from `@acme/design-system/primitives`
- **Confirm dialog** → `ConfirmDialog` from `@acme/design-system/atoms` (simplified confirm/cancel pattern)
- **Drawer (side panel)** → `Drawer` from `@acme/design-system/primitives`
- **Dropdown menu** → `DropdownMenu` from `@acme/design-system/primitives`
- **Popover** → `Popover` from `@acme/design-system/atoms`
- **Toast notification** → `Toast` from `@acme/design-system/atoms` OR `useToast` from `@acme/ui`
- **Alert message** → `Alert` from `@acme/design-system/atoms`
- **Tooltip** → `Tooltip` from `@acme/design-system/atoms`
- **Progress bar** → `Progress` from `@acme/design-system/atoms`
- **Loading spinner** → `Loader` (or `Spinner`) from `@acme/design-system/atoms`
- **Skeleton loader** → `Skeleton` from `@acme/design-system/atoms`
- **Overlay scrim** → `OverlayScrim` from `@acme/design-system/primitives`
- **Milestone toast** → `MilestoneToast` from `@acme/design-system/primitives`

### Data Display
- **Table** → `Table` from `@acme/design-system/primitives`
- **Data grid (advanced table)** → `DataGrid` from `@acme/design-system/molecules` OR `DataTable` from `@acme/ui/organisms`
- **Accordion** → `Accordion` from `@acme/design-system/primitives`
- **Empty state** → `EmptyState` from `@acme/design-system/atoms`
- **Stat card** → `StatCard` from `@acme/design-system/atoms`
- **Line chart** → `LineChart` from `@acme/design-system/atoms`
- **Code block** → `CodeBlock` from `@acme/design-system/molecules`

### E-commerce Specific
- **Price display** → `Price` from `@acme/design-system/atoms`
- **Price cluster** → `PriceCluster` from `@acme/design-system/molecules`
- **Product badge** → `ProductBadge` from `@acme/design-system/atoms`
- **Stock status** → `StockStatus` from `@acme/design-system/atoms`
- **Color swatch** → `ColorSwatch` from `@acme/design-system/atoms`
- **Rating stars** → `RatingStars` from `@acme/design-system/atoms`
- **Rating summary** → `RatingSummary` from `@acme/design-system/molecules`
- **Sustainability badges** → `SustainabilityBadgeCluster` from `@acme/design-system/molecules`
- **Option pill** → `OptionPill` from `@acme/design-system/atoms`
- **Option tile** → `OptionTile` from `@acme/design-system/atoms`
- **AR viewer** → `ARViewer` from `@acme/design-system/atoms`
- **360° image viewer** → `Image360Viewer` from `@acme/design-system/molecules`
- **Zoom image** → `ZoomImage` from `@acme/design-system/atoms`
- **Video player** → `VideoPlayer` from `@acme/design-system/atoms`
- **Pagination** → `PaginationControl` from `@acme/design-system/molecules` OR `PaginationDot` from `@acme/design-system/atoms`

### Branding & Identity
- **Logo** → `Logo` from `@acme/design-system/atoms`
- **Avatar** → `Avatar` from `@acme/design-system/atoms`
- **Icon** → `Icon` from `@acme/design-system/atoms`
- **Tag/label** → `Tag` from `@acme/design-system/atoms`
- **Chip** → `Chip` from `@acme/design-system/atoms`
- **Trust cue** → `TrustCue` from `@acme/design-system/primitives`
- **Status indicator** → `StatusIndicator` from `@acme/design-system/atoms`

### Settings & Preferences
- **Theme toggle (dark mode)** → `ThemeToggle` from `@acme/design-system/atoms`
- **Language switcher** → `LanguageSwitcher` from `@acme/design-system/molecules`
- **Currency switcher** → `CurrencySwitcher` from `@acme/design-system/molecules`

### Higher-Level Patterns (from @acme/ui)
- **Checkout flow** → `CheckoutStepper` from `@acme/ui/organisms`
- **Account panel** → `AccountPanel` from `@acme/ui/organisms`
- **Announcement bar** → `AnnouncementBar` from `@acme/ui/organisms`
- **Category card** → `CategoryCard` from `@acme/ui/organisms`
- **Content renderer** → `Content` from `@acme/ui/organisms`

---

## Import Path Guidance

### When to use `@acme/design-system/*` vs `@acme/ui/*`

| Use Case | Package | Rationale |
|----------|---------|-----------|
| Basic inputs, buttons, cards | `@acme/design-system/primitives` | Foundation layer, no domain logic |
| Layout primitives (Stack, Cluster, Grid) | `@acme/design-system/primitives` | Presentation-only layout |
| Simple composed atoms (FormField, IconButton) | `@acme/design-system/atoms` | Single-purpose, no business rules |
| Form integration with react-hook-form | `@acme/design-system/molecules` | Validation + DS primitives |
| E-commerce molecules (Price, ProductBadge) | `@acme/design-system/atoms` or `molecules` | Domain-aware but reusable |
| Complex organisms (CheckoutStepper, AccountPanel) | `@acme/ui/organisms` | App-specific composition |
| Full page templates | `@acme/ui/templates` | Layout + content coordination |
| CMS-specific components | `@acme/cms-ui` or `@acme/ui/components/cms` | Editor/page-builder features |

### Canonical Import Patterns

```ts
// ✅ Recommended: Import from specific subpaths
import { Button, Input, Select } from "@acme/design-system/primitives";
import { FormField, IconButton, Tag } from "@acme/design-system/atoms";
import { DatePicker, Stepper } from "@acme/design-system/molecules";

// ✅ Also valid: Import from individual files
import { FormField } from "@acme/design-system/atoms/FormField";
import { DatePicker } from "@acme/design-system/molecules/DatePicker";

// ⚠️ Avoid: Main barrel export (slower build times)
import { Button } from "@acme/design-system";

// ❌ Deprecated: Importing primitives from @acme/ui
import { Button } from "@acme/ui/atoms";
```

---

## Component Reference Tables

### Primitives (`@acme/design-system/primitives`)

Low-level building blocks with minimal styling. Foundation layer.

| Component | Category | Key Props | Storybook | Usage Examples |
|-----------|----------|-----------|-----------|----------------|
| **Button** | Action | `variant`, `size`, `disabled` | ✅ | Primary actions, secondary buttons, icon buttons |
| **Input** | Form | `type`, `placeholder`, `disabled`, `error` | ✅ | Text fields, email, password, search |
| **Textarea** | Form | `rows`, `placeholder`, `disabled` | ✅ | Multi-line text entry, comments |
| **Checkbox** | Form | `checked`, `disabled`, `onCheckedChange` | ✅ | Boolean toggles, multi-select lists |
| **RadioGroup** + **RadioGroupItem** | Form | `value`, `onValueChange`, `disabled` | ✅ | Mutually exclusive options |
| **Select** | Form | `value`, `onValueChange`, `disabled` | ✅ | Dropdown selections |
| **Combobox** | Form | `value`, `onSelect`, `searchable` | ✅ | Autocomplete, searchable dropdowns |
| **Slider** | Form | `value`, `min`, `max`, `step` | ✅ | Numeric range input, volume controls |
| **Separator** | Layout | `orientation` (horizontal/vertical) | ✅ | Visual dividers |
| **Tabs** + **TabsList** + **TabsTrigger** + **TabsContent** | Navigation | `value`, `onValueChange` | ✅ | Tabbed interfaces |
| **Accordion** | Data | `type` (single/multiple), `collapsible` | ✅ | Expandable sections, FAQs |
| **Dialog** | Overlay | `open`, `onOpenChange` | ✅ | Modals, confirmations |
| **Drawer** | Overlay | `open`, `onOpenChange`, `side` | ✅ | Side panels, mobile menus |
| **DropdownMenu** | Overlay | `open`, `onOpenChange` | ✅ | Context menus, action menus |
| **Card** + **CardHeader** + **CardContent** + **CardFooter** | Layout | `className` | ✅ | Content containers |
| **Table** + **TableHeader** + **TableBody** + **TableRow** + **TableCell** | Data | `className` | ✅ | Tabular data |
| **Stack** | Layout | `gap`, `align`, `justify` | ✅ | Vertical layouts |
| **Cluster** | Layout | `gap`, `align`, `justify` | ✅ | Wrapping flex rows |
| **Inline** | Layout | `gap`, `align` | ✅ | Horizontal inline layouts |
| **Grid** | Layout | `cols`, `gap` | ✅ | Grid layouts |
| **Cover** | Layout | `minHeight`, `centered` | ✅ | Full-height centered content |
| **Sidebar** | Layout | `side`, `width` | ✅ | Sidebar layouts |
| **ScrollArea** | Layout | `className` | ✅ | Custom scrollbars |
| **OverlayScrim** | Overlay | `visible`, `onClick` | ✅ | Modal backgrounds |
| **Slot** | Utility | `asChild` | - | Component composition helper |
| **StepFlowShell** | Layout | `currentStep`, `totalSteps` | ✅ | Multi-step flow container |
| **StepProgress** | Feedback | `currentStep`, `totalSteps` | ✅ | Progress indicator |
| **TrustCue** | Branding | `type`, `text` | ✅ | Trust badges |
| **MilestoneToast** | Feedback | `title`, `description`, `icon` | ✅ | Achievement notifications |

### Atoms (`@acme/design-system/atoms`)

Single-purpose components composed from primitives.

| Component | Category | Key Props | Storybook | Zero Usage? |
|-----------|----------|-----------|-----------|-------------|
| **Alert** | Feedback | `variant`, `title`, `description` | ✅ | No |
| **ARViewer** | Media | `modelSrc`, `alt` | ✅ | Yes ⚠️ |
| **Avatar** | Branding | `src`, `alt`, `fallback` | ✅ | Yes ⚠️ |
| **Chip** | Branding | `label`, `variant`, `onRemove` | ✅ | No |
| **ColorSwatch** | E-commerce | `color`, `selected` | ✅ | Yes ⚠️ |
| **ConfirmDialog** | Overlay | `title`, `onConfirm`, `variant` (default/destructive) | ✅ | No |
| **EmptyState** | Data | `title`, `description`, `icon`, `action` | ✅ | No |
| **FileSelector** | Form | `accept`, `onFileSelect` | ✅ | Yes ⚠️ |
| **FormField** | Form | `label`, `error`, `required` | ✅ | No |
| **Icon** | Branding | `name`, `size`, `color` | ✅ | No |
| **IconButton** | Action | `icon`, `label`, `onClick` | ✅ | No |
| **LineChart** | Data | `data`, `xKey`, `yKey` | ✅ | No |
| **LinkText** | Navigation | `href`, `children` | ✅ | No |
| **Loader** / **Spinner** | Feedback | `size`, `color` | ✅ | No |
| **Logo** | Branding | `variant`, `size` | ✅ | No |
| **OptionPill** | E-commerce | `label`, `selected`, `onClick` | ✅ | Yes ⚠️ |
| **OptionTile** | E-commerce | `label`, `selected`, `onClick` | ✅ | Yes ⚠️ |
| **PaginationDot** | Navigation | `active`, `onClick` | ✅ | Yes ⚠️ |
| **Popover** | Overlay | `open`, `onOpenChange`, `trigger` | ✅ | No |
| **Price** | E-commerce | `amount`, `currency`, `variant` | ✅ | No |
| **ProductBadge** | E-commerce | `type`, `text` | ✅ | No |
| **Progress** | Feedback | `value`, `max` | ✅ | No |
| **Radio** | Form | `value`, `checked` | ✅ | Yes ⚠️ (use RadioGroup instead) |
| **RatingStars** | E-commerce | `rating`, `max`, `interactive` | ✅ | Yes ⚠️ |
| **Section** | Layout | `title`, `children` | ✅ | No |
| **SelectField** | Form | `label`, `options`, `value` | ✅ | Yes ⚠️ |
| **Skeleton** | Feedback | `width`, `height`, `variant` | ✅ | No |
| **StatCard** | Data | `label`, `value`, `trend` | ✅ | No |
| **StatusIndicator** | Feedback | `status`, `label` | ✅ | No |
| **StockStatus** | E-commerce | `status`, `quantity` | ✅ | Yes ⚠️ |
| **Switch** | Form | `checked`, `onCheckedChange` | ✅ | No |
| **Tag** | Branding | `label`, `variant`, `onRemove` | ✅ | No |
| **ThemeToggle** | Settings | `theme`, `onToggle` | ✅ | No |
| **Toast** | Feedback | `title`, `description`, `variant` | ✅ | No |
| **Tooltip** | Feedback | `content`, `children` | ✅ | No |
| **VideoPlayer** | Media | `src`, `controls` | ✅ | Yes ⚠️ |
| **ZoomImage** | Media | `src`, `alt`, `zoomSrc` | ✅ | Yes ⚠️ |

**⚠️ Zero Usage Components**: These components exist but have no current usage in apps. **Evaluate these before building custom alternatives.**

### Molecules (`@acme/design-system/molecules`)

Multi-part components with internal state management.

| Component | Category | Key Props | Storybook | Zero Usage? |
|-----------|----------|-----------|-----------|-------------|
| **AccordionMolecule** | Data | `items`, `defaultOpen` | ✅ | No |
| **Breadcrumbs** | Navigation | `items` (BreadcrumbItem[]) | ✅ | No |
| **CodeBlock** | Data | `code`, `language`, `showLineNumbers` | ✅ | No |
| **CurrencySwitcher** | Settings | `currencies`, `value`, `onValueChange` | ✅ | No |
| **DataGrid** | Data | `columns`, `data`, `onRowClick` | ✅ | Yes ⚠️ |
| **DatePicker** | Form | `value`, `onChange`, `min`, `max` | ✅ | No |
| **Form** + **FormField** + **FormMessage** | Form | react-hook-form integration | 🚧 Pending | - |
| **Image360Viewer** | Media | `images`, `autoRotate` | ✅ | Yes ⚠️ |
| **LanguageSwitcher** | Settings | `languages`, `value`, `onValueChange` | ✅ | Yes ⚠️ |
| **MediaSelector** | Form | `media`, `onSelect`, `multiple` | ✅ | Yes ⚠️ |
| **PaginationControl** | Navigation | `currentPage`, `totalPages`, `onPageChange` | ✅ | Yes ⚠️ |
| **PaymentMethodSelector** | Form | `methods`, `selected`, `onSelect` | ✅ | Yes ⚠️ |
| **PriceCluster** | E-commerce | `prices`, `variant` | ✅ | No |
| **PromoCodeInput** | Form | `value`, `onApply`, `loading` | ✅ | Yes ⚠️ |
| **QuantityInput** | Form | `value`, `onChange`, `min`, `max` | ✅ | No |
| **RatingSummary** | E-commerce | `averageRating`, `totalReviews`, `distribution` | ✅ | Yes ⚠️ |
| **SearchBar** | Form | `value`, `onChange`, `onSubmit`, `suggestions` | ✅ | Yes ⚠️ |
| **Stepper** + **StepperStep** | Navigation | `currentStep`, `steps` | ✅ | No |
| **SustainabilityBadgeCluster** | E-commerce | `badges` | ✅ | Yes ⚠️ |

### Selected Organisms (`@acme/ui/organisms`)

Higher-level composed components. **Partial list** — full catalog in `@acme/ui` package.

| Component | Category | Import Path | Storybook |
|-----------|----------|-------------|-----------|
| **AccountPanel** | Account | `@acme/ui/organisms/AccountPanel` | ✅ |
| **AnnouncementBar** | Marketing | `@acme/ui/organisms/AnnouncementBar` | ✅ |
| **CategoryCard** | E-commerce | `@acme/ui/organisms/CategoryCard` | ✅ |
| **CheckoutStepper** | E-commerce | `@acme/ui/organisms/CheckoutStepper` | ✅ |
| **Content** | CMS | `@acme/ui/organisms/Content` | ✅ |
| **DataTable** | Data | `@acme/ui/organisms/DataTable` | ✅ |
| **DeliveryScheduler** | E-commerce | `@acme/ui/organisms/DeliveryScheduler` | ✅ |

### Selected Templates (`@acme/ui/templates`)

Full-page layout templates. **Partial list** — full catalog in `@acme/ui` package.

| Template | Category | Import Path | Storybook |
|----------|----------|-------------|-----------|
| **AccountDashboardTemplate** | Account | `@acme/ui/templates/AccountDashboardTemplate` | ✅ |
| **AnalyticsDashboardTemplate** | Analytics | `@acme/ui/templates/AnalyticsDashboardTemplate` | ✅ |
| **AppShell** | Layout | `@acme/ui/templates/AppShell` | ✅ |
| **CartTemplate** | E-commerce | `@acme/ui/templates/CartTemplate` | ✅ |
| **CategoryCollectionTemplate** | E-commerce | `@acme/ui/templates/CategoryCollectionTemplate` | ✅ |
| **CheckoutTemplate** | E-commerce | `@acme/ui/templates/CheckoutTemplate` | ✅ |

---

## Migration Notes

### Deprecated Imports

The following imports are **deprecated** and should be migrated:

```ts
// ❌ DEPRECATED: Importing primitives from @acme/ui
import { Button, Input, Card } from "@acme/ui/atoms";

// ✅ MIGRATE TO: Import from design-system
import { Button, Input, Card } from "@acme/design-system/primitives";
```

### Duplicate Components to Consolidate

| Component | Locations | Recommendation |
|-----------|-----------|----------------|
| **FormField** | `atoms/FormField` (simple), `molecules/FormField` (react-hook-form) | Use atoms version for uncontrolled, molecules version for validated forms |
| **Grid** | `primitives/Grid` (cols), `atoms/Grid` (columns+as) | Incompatible APIs — see component docs |
| **Radio** | `atoms/Radio` (basic), `primitives/RadioGroup` (compound) | Prefer RadioGroup for new usage |
| **Accordion** | `primitives/accordion`, `molecules/Accordion` | Primitive for basic usage, molecule for item arrays |

---

## Component Categories

### By Usage Frequency (apps with zero usage)

**High Adoption** (used in 3+ apps):
- Button, Input, Card, Dialog, Select, FormField, Tag, Loader, Alert

**Medium Adoption** (used in 1-2 apps):
- DatePicker, Checkbox, Switch, Progress, Skeleton, Tooltip, Breadcrumbs

**Zero Adoption** ⚠️ (evaluate before building custom):
- ARViewer, Avatar, ColorSwatch, FileSelector, OptionPill, OptionTile, PaginationDot, Radio, RatingStars, SelectField, StockStatus, VideoPlayer, ZoomImage, DataGrid, Image360Viewer, LanguageSwitcher, MediaSelector, PaginationControl, PaymentMethodSelector, PromoCodeInput, RatingSummary, SearchBar, SustainabilityBadgeCluster

---

## Guardrail Contracts (Canonical)

### Primitive depth variation

Core primitives (`Button`, `Input`, `Select`, `Textarea`, `Card`) support:
- `shape`: `square` | `soft` | `pill`
- `radius`: `none` | `xs` | `sm` | `md` | `lg` | `xl` | `2xl` | `3xl` | `4xl` | `full`

Use `shape` for consistent presets across screens; use `radius` for explicit per-instance overrides.

### Containment and bleed safety

Overlay/menu primitives use shared containment utilities from `@acme/design-system/utils/style`:
- Dialog content -> `overflowContainmentClass("dialogContent")` (`overflow-x-hidden`)
- Menu surfaces (dropdown/select/popover content) -> `overflowContainmentClass("menuSurface")` (`overflow-hidden`)

Do not introduce bespoke overflow classes in those primitives unless an exception is documented and scoped.

### Operations minimum safety baseline

For internal admin UI (`packages/ui/src/components/organisms/operations/**`):
- `ds/no-overflow-hazards` is enforced as `error`
- `react/forbid-dom-props` (`style`) is `error` with explicit file-level runtime exceptions only
- `ds/no-arbitrary-tailwind` stays `warn` with constrained allowlists

This baseline guards against content bleed and unsafe style drift while preserving internal-tool velocity.

---

## Storybook Links

All design-system components now appear in the main Storybook (as of DS-01 completion, 2026-02-07):

```bash
pnpm --filter @apps/storybook dev
# Navigate to http://localhost:6006
```

**Categories in Storybook sidebar:**
- Design System / Primitives
- Design System / Atoms
- Design System / Molecules
- UI / Organisms
- UI / Templates

---

## Related Documentation

- [Design System README](../packages/design-system/README.md) — Package overview and exports
- [Theme Customization Guide](./theming-customization-guide.md) — Token overrides and branding
- [Design System Hardening Plan (Archived)](./plans/archive/design-system-depth-and-guardrail-hardening/plan.md) — Completed guardrail and migration record
- [Architecture](./architecture.md) — Package layering rules

---

## Contribution Guidelines

When adding new components to the design system:

1. **Choose the right layer:**
   - **Primitives**: Radix wrappers, layout utilities, basic inputs
   - **Atoms**: Single-purpose, composed from 1-2 primitives
   - **Molecules**: Multi-part with internal state
   - **Organisms** (in `@acme/ui`): App-specific composition

2. **Follow the checklist:**
   - [ ] Component file in correct directory
   - [ ] Storybook story with 3+ variants
   - [ ] Unit tests (RTL) with accessibility assertions
   - [ ] Export added to barrel file (`index.ts`)
   - [ ] Props documented with JSDoc
   - [ ] Update this catalog

3. **Token usage:**
   - Use design tokens from `@acme/themes/*` for colors, spacing, typography
   - No hardcoded colors or spacing values
   - Respect token naming: `--color-*`, `--spacing-*`, `--text-*`, `--z-*`

4. **Accessibility:**
   - Semantic HTML where possible
   - ARIA attributes for interactive components
   - Keyboard navigation support
   - Focus management for overlays
   - `jest-axe` assertions in tests (DS-23 pending)

---

**Last updated**: 2026-02-07 by Claude Code
**Maintainer**: Design System Working Group
