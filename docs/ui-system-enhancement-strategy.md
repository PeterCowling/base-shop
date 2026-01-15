Type: Strategy
Status: Draft
Domain: Design System, UI Architecture
Last-reviewed: 2026-01-12

# UI System Enhancement Strategy

## Executive Summary

This document outlines a comprehensive strategy for enhancing the centralized UI and styling system in the base-shop monorepo to support diverse applications spanning:
- **Consumer-facing**: Hostel/accommodation websites (Brikette)
- **E-commerce**: Product shops (Cover Me Pretty, Cochlearfit, Skylar, XA)
- **Operations**: Reception, stock management, bar/food systems, dashboard
- **Specialized**: Product configurators, CMS

## Current State Analysis

### Strengths
- Solid architectural foundation with atomic design principles
- Design tokens system via `@acme/design-tokens`
- Tailwind 4 integration with CSS variables
- shadcn/ui integration for battle-tested primitives
- Clear package layering (platform-core → ui → apps)
- Storybook infrastructure for component documentation

### Gaps & Opportunities
1. **Limited scope for operations apps**: Current components skew toward e-commerce/marketing
2. **Insufficient data-intensive UI patterns**: Tables, charts, dashboards need expansion
3. **Theming flexibility**: Single token set limits brand differentiation across diverse apps
4. **Component density**: Missing patterns for dense operational interfaces vs spacious consumer UIs
5. **Domain-specific patterns**: Hospitality, inventory, POS systems need specialized components
6. **Responsive design system**: Mobile-first vs desktop-first patterns need formalization

## Strategic Pillars

### 1. Multi-Context Design Token Architecture

**Current**: Single token set for all applications
**Proposed**: Layered token system with context-aware variants

#### Implementation

```
packages/design-tokens/
├── src/
│   ├── core/              # Universal tokens (spacing, typography scales)
│   ├── semantic/          # Semantic color mappings
│   ├── contexts/
│   │   ├── consumer/      # Marketing/e-commerce (spacious, brand-forward)
│   │   ├── operations/    # Dense, utility-focused (reception, inventory)
│   │   ├── hospitality/   # Hostel-specific (booking, accommodation)
│   │   └── dashboard/     # Analytics, data visualization
│   └── themes/
│       ├── light.ts
│       ├── dark.ts
│       └── high-contrast.ts
```

**Token Categories**:
- **Density**: `compact`, `default`, `comfortable`, `spacious`
- **Context-specific spacing**: Operations use tighter spacing than consumer
- **Typography scales**: Separate scales for marketing vs operational interfaces
- **Component sizing**: `sm`, `md`, `lg` variants with context-aware defaults

**Benefits**:
- Each app imports context tokens that match its use case
- Shared core ensures consistency where needed
- Easy theme switching without rebuilding components

### 2. Expanded Component Library (Domain-Driven)

#### Consumer/Marketing Components (Existing + Enhancements)

**Existing** (packages/ui/components/):
- Hero banners, carousels, product cards
- Marketing layouts, value props

**Add**:
- `BookingCard` (accommodation-specific)
- `AvailabilityCalendar` (date selection with pricing)
- `GuestReviewCard` (social proof)
- `AmenityList` (icons + descriptions)
- `RoomTypeSelector` (accommodation comparison)
- `GalleryLightbox` (image showcase)
- `InteractiveMap` (location-based features)

#### Operations Components (New Domain)

**Create** (`packages/ui/components/operations/`):

**Data Display**:
- `DataTable` (sortable, filterable, paginated)
  - With presets: `inventory-table`, `transaction-table`, `guest-table`
- `MetricsCard` (KPI display with trends)
- `ActivityFeed` (real-time updates)
- `StatusIndicator` (operational states: occupied, cleaning, available)

**Input/Actions**:
- `QuickActionBar` (frequently used operations)
- `SearchWithFilters` (advanced filtering UI)
- `BulkActionToolbar` (multi-select operations)
- `NumericInput` (quantity, currency with formatting)
- `BarcodeScanner` (integration component)

**Dashboards**:
- `DashboardGrid` (responsive widget layout)
- `ChartCard` (chart.js wrapper with consistent styling)
- `RealtimeCounter` (live updating numbers)
- `OccupancyHeatmap` (visual capacity indicator)

**POS/Till**:
- `ReceiptPreview` (transaction summary)
- `CashierKeypad` (number entry)
- `PaymentMethodSelector` (cash, card, etc.)
- `TillReconciliation` (cash count interface)

**Inventory**:
- `StockLevelIndicator` (low/ok/high with thresholds)
- `StockAdjustmentForm` (add/remove inventory)
- `VarianceReport` (expected vs actual)
- `ExpiryDateTracker` (perishables management)

#### Hospitality-Specific Components

**Create** (`packages/ui/components/hospitality/`):
- `RoomGrid` (visual room layout)
- `CheckInForm` (guest registration)
- `GuestProfile` (customer details)
- `StayTimeline` (check-in to check-out)
- `HousekeepingStatus` (cleaning workflow)
- `ReservationCalendar` (booking management)

### 3. Pattern Libraries by Use Case

Create documented pattern libraries that compose components:

#### E-commerce Patterns
- Product listing pages (grid + filters)
- Product detail pages (gallery + specs + CTA)
- Cart and checkout flows
- Account dashboard

#### Hospitality Patterns
- Accommodation listing
- Room selection + booking flow
- Guest portal
- Reception dashboard

#### Operations Patterns
- Inventory management screens
- Transaction processing
- Reconciliation workflows
- Reporting interfaces

### 4. Responsive Strategy Formalization

**Current**: Ad-hoc responsive approaches
**Proposed**: Defined responsive patterns

#### Breakpoint System (standardize in tokens)
```typescript
export const breakpoints = {
  mobile: '0px',      // 0-639px
  tablet: '640px',    // 640-1023px
  desktop: '1024px',  // 1024-1439px
  wide: '1440px',     // 1440px+
  operations: '1280px' // Min width for operations apps
}
```

#### Component Responsive Patterns
- **Stack-to-row**: Mobile stack → desktop row
- **Hide-show**: Show/hide elements by context
- **Drawer-to-sidebar**: Mobile drawer → desktop permanent sidebar
- **Compact-to-comfortable**: Density changes by screen size

### 5. Layout System Enhancement

**Current**: Basic templates
**Proposed**: Comprehensive layout toolkit

#### New Layout Components (`packages/ui/components/layouts/`)

**Consumer Layouts**:
- `MarketingLayout` (hero + sections)
- `ProductLayout` (with sidebar filters)
- `CheckoutLayout` (focused, minimal chrome)

**Operations Layouts**:
- `DashboardLayout` (sidebar nav + main + optional right panel)
- `DataEntryLayout` (form-focused with action bar)
- `SplitViewLayout` (list + detail views)
- `ModalWorkflowLayout` (multi-step processes)

**Universal**:
- `PageShell` (header + content + footer with slots)
- `ContentContainer` (max-width with responsive padding)
- `SidebarContainer` (collapsible navigation)

### 6. Data Visualization Suite

**Add** (`packages/ui/components/charts/`):
- Wrapper components around chart.js
- Consistent theming with design tokens
- Responsive behavior
- Loading and error states

**Chart Types**:
- `LineChart` (trends over time)
- `BarChart` (comparisons)
- `PieChart` / `DonutChart` (proportions)
- `HeatmapChart` (density/occupancy)
- `SparklineChart` (inline trends)

### 7. Form System Overhaul

**Current**: Basic form fields
**Proposed**: Comprehensive form toolkit

#### Enhanced Form Components (`packages/ui/components/forms/`)

**Core**:
- `Form` (react-hook-form integration)
- `FormSection` (grouped fields)
- `FormField` (enhanced with validation UI)
- `FieldArray` (dynamic lists)

**Input Types**:
- `CurrencyInput` (formatted monetary values)
- `PercentageInput` (0-100 with validation)
- `DateRangePicker` (start + end dates)
- `TimePicker` (24hr/12hr formats)
- `ColorPicker` (for theming)
- `FileUploadZone` (drag-drop)

**Validation**:
- Consistent error display patterns
- Field-level and form-level validation
- Async validation support
- Accessibility-first error announcements

### 8. Accessibility & Internationalization

#### Accessibility Enhancements
- Audit all components with jest-axe
- Keyboard navigation patterns documented
- ARIA patterns for complex widgets
- Focus management utilities
- Screen reader testing strategy

#### I18n Integration
- RTL support in all components
- Number/date/currency formatting via i18n
- Locale-aware component behavior
- Translation key conventions

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-3)
**Goal**: Establish enhanced token system and core operations components

1. **Token Architecture** (Week 1)
   - [ ] Create context-specific token structure
   - [ ] Define density variants
   - [ ] Update Tailwind config to support contexts
   - [ ] Document token usage patterns

2. **Operations Primitives** (Weeks 2-3)
   - [ ] DataTable component with sorting/filtering
   - [ ] MetricsCard for KPIs
   - [ ] QuickActionBar
   - [ ] StatusIndicator
   - [ ] Add Storybook stories for each

### Phase 2: Domain Expansion (Weeks 4-6)
**Goal**: Add hospitality and POS-specific components

3. **Hospitality Components** (Week 4)
   - [ ] RoomGrid
   - [ ] CheckInForm
   - [ ] ReservationCalendar
   - [ ] GuestProfile

4. **POS/Till Components** (Week 5)
   - [ ] CashierKeypad
   - [ ] ReceiptPreview
   - [ ] PaymentMethodSelector
   - [ ] TillReconciliation

5. **Inventory Components** (Week 6)
   - [ ] StockLevelIndicator
   - [ ] StockAdjustmentForm
   - [ ] ExpiryDateTracker

### Phase 3: Patterns & Polish (Weeks 7-9)
**Goal**: Create pattern libraries and improve DX

6. **Pattern Libraries** (Week 7)
   - [ ] Document e-commerce patterns
   - [ ] Document hospitality patterns
   - [ ] Document operations patterns
   - [ ] Create example implementations

7. **Layout System** (Week 8)
   - [ ] DashboardLayout
   - [ ] DataEntryLayout
   - [ ] SplitViewLayout
   - [ ] Responsive behavior testing

8. **Data Visualization** (Week 9)
   - [ ] Chart wrapper components
   - [ ] Themed chart configurations
   - [ ] Dashboard examples

### Phase 4: Migration & Optimization (Weeks 10-12)

9. **Reception App Migration** (Weeks 10-11)
   - [ ] Migrate to new operations components
   - [ ] Use DashboardLayout
   - [ ] Leverage DataTable
   - [ ] Remove local duplicates

10. **Documentation & Guidelines** (Week 12)
    - [ ] Component selection guide
    - [ ] Pattern cookbook
    - [ ] Migration guides
    - [ ] Performance best practices

## Component Organization Structure

```
packages/ui/src/components/
├── atoms/
│   ├── shadcn/          # shadcn/ui primitives (existing)
│   ├── primitives/      # Generic wrappers (existing)
│   ├── indicators/      # Status, badges, pills (NEW)
│   ├── inputs/          # Form primitives (ENHANCED)
│   └── display/         # Display-only atoms (NEW)
├── molecules/
│   ├── forms/           # Form field compositions (ENHANCED)
│   ├── cards/           # Card variants (ENHANCED)
│   ├── navigation/      # Nav components (ENHANCED)
│   └── feedback/        # Toasts, alerts, etc. (ENHANCED)
├── organisms/
│   ├── operations/      # Operations-specific (NEW)
│   │   ├── DataTable/
│   │   ├── MetricsCard/
│   │   ├── ActivityFeed/
│   │   └── QuickActionBar/
│   ├── hospitality/     # Hospitality-specific (NEW)
│   │   ├── RoomGrid/
│   │   ├── CheckInForm/
│   │   ├── ReservationCalendar/
│   │   └── GuestProfile/
│   ├── pos/             # POS/Till components (NEW)
│   │   ├── CashierKeypad/
│   │   ├── ReceiptPreview/
│   │   └── TillReconciliation/
│   ├── inventory/       # Inventory management (NEW)
│   │   ├── StockLevelIndicator/
│   │   ├── StockAdjustmentForm/
│   │   └── VarianceReport/
│   ├── charts/          # Data visualization (NEW)
│   │   ├── LineChart/
│   │   ├── BarChart/
│   │   └── HeatmapChart/
│   ├── cms/             # CMS-specific (existing)
│   └── common/          # Shared organisms (existing)
├── templates/
│   ├── consumer/        # Marketing/e-commerce (existing)
│   ├── operations/      # Operations layouts (NEW)
│   │   ├── DashboardLayout/
│   │   ├── DataEntryLayout/
│   │   └── SplitViewLayout/
│   └── hospitality/     # Hospitality layouts (NEW)
└── patterns/            # Documented pattern examples (NEW)
    ├── ecommerce/
    ├── hospitality/
    └── operations/
```

## Design Token Structure (Expanded)

```typescript
// packages/design-tokens/src/core/spacing.ts
export const spacing = {
  // Universal spacing scale
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
}

// packages/design-tokens/src/contexts/operations/spacing.ts
export const operationsSpacing = {
  // Tighter spacing for dense interfaces
  'row-gap': 'var(--space-2)',      // 8px between rows
  'section-gap': 'var(--space-4)',  // 16px between sections
  'card-padding': 'var(--space-3)', // 12px card padding
  'input-padding': 'var(--space-2)', // 8px input padding
}

// packages/design-tokens/src/contexts/consumer/spacing.ts
export const consumerSpacing = {
  // Generous spacing for marketing
  'row-gap': 'var(--space-6)',      // 24px between rows
  'section-gap': 'var(--space-12)', // 48px between sections
  'card-padding': 'var(--space-6)', // 24px card padding
  'input-padding': 'var(--space-4)', // 16px input padding
}

// packages/design-tokens/src/contexts/operations/colors.ts
export const operationsColors = {
  // Operational status colors
  'status-available': 'hsl(142, 76%, 36%)',
  'status-occupied': 'hsl(0, 84%, 60%)',
  'status-cleaning': 'hsl(45, 93%, 47%)',
  'status-maintenance': 'hsl(262, 52%, 47%)',
  'stock-low': 'hsl(0, 84%, 60%)',
  'stock-ok': 'hsl(142, 76%, 36%)',
  'stock-high': 'hsl(199, 89%, 48%)',
}
```

## Best Practices & Guidelines

### When to Create a New Component

**Create in `@acme/ui` when**:
- Used in 2+ apps
- Part of the design system
- Reusable pattern
- Well-tested and stable

**Keep in app when**:
- Single-app specific
- Rapid iteration needed
- Domain logic tightly coupled
- Experimental

### Component Quality Standards

All components in `@acme/ui` must have:
1. **TypeScript**: Fully typed props and exports
2. **Storybook story**: At least one default story
3. **Tests**: Unit tests for logic, accessibility tests
4. **Documentation**: JSDoc comments explaining usage
5. **Responsive**: Works on mobile, tablet, desktop
6. **Accessible**: WCAG 2.1 AA compliant
7. **Themed**: Uses design tokens, no hardcoded values

### Performance Considerations

- Lazy load heavy components (charts, tables)
- Virtualize long lists (use react-window or similar)
- Memoize expensive calculations
- Code-split domain-specific component sets
- Optimize bundle size per app context

### Testing Strategy

**Unit Tests**:
- Component rendering
- Prop variations
- User interactions
- Edge cases

**Accessibility Tests**:
- jest-axe for automated checks
- Keyboard navigation
- Screen reader compatibility

**Visual Regression**:
- Chromatic or Percy for Storybook
- Catch unintended styling changes

**Integration Tests**:
- Complex component interactions
- Form submissions
- Multi-step workflows

## Migration Strategy for Existing Apps

### Brikette (Hostel Website)
**Current state**: Custom components
**Migration path**:
1. Replace custom buttons/inputs with `@acme/ui` atoms
2. Use `BookingCard` for accommodation display
3. Leverage `AvailabilityCalendar` for date selection
4. Apply consumer spacing tokens

**Benefits**: Consistent UI, easier maintenance, better mobile experience

### Reception App
**Current state**: Legacy Vite app
**Migration path** (per reception-nextjs-migration-plan.md):
1. Use operations token context
2. Replace custom tables with `DataTable`
3. Use `DashboardLayout` for main screens
4. Leverage `QuickActionBar` for common tasks
5. Use `MetricsCard` for KPIs

**Benefits**: Faster development, consistent operations UX, easier onboarding

### Product Shops (Cover Me Pretty, Cochlearfit, etc.)
**Current state**: Mix of shared and custom
**Migration path**:
1. Audit for duplicated patterns
2. Consolidate into shared components
3. Use pattern libraries for consistency
4. Apply e-commerce token context

**Benefits**: Faster shop creation, brand consistency, reduced maintenance

## Success Metrics

### Development Velocity
- Time to create new shop: -50%
- Time to create new operations screen: -60%
- Component reuse rate: >70%

### Quality
- Accessibility compliance: 100% WCAG AA
- Test coverage: >80%
- Visual regression incidents: -90%

### Maintenance
- Duplicate components: -80%
- UI-related bugs: -50%
- Design system adoption: >90%

## Open Questions & Decisions Needed

1. **Token Override Strategy**: How should apps override context tokens?
   - Proposal: App-level CSS variables that cascade over context tokens

2. **Chart Library**: Stick with chart.js or evaluate alternatives?
   - Alternatives: Recharts, Victory, D3 directly
   - Recommendation: Keep chart.js, add wrappers

3. **Table Library**: Build custom or use existing?
   - Options: TanStack Table, react-table, custom
   - Recommendation: TanStack Table with custom wrapper

4. **Mobile Strategy**: Separate mobile components or responsive only?
   - Recommendation: Responsive-first, mobile-specific where needed

5. **Icon System**: Expand beyond Lucide React?
   - Current: Lucide React
   - Recommendation: Stick with Lucide, add custom SVG support

## Related Documentation

- [Architecture](./architecture.md) - UI layer hierarchy
- [Reception Migration Plan](./plans/reception-nextjs-migration-plan.md) - Operations app example
- [Platform vs Apps](./platform-vs-apps.md) - Ownership boundaries
- [Design Tokens Package](../packages/design-tokens/AGENTS.md) - Token implementation

## Approval & Next Steps

**Stakeholder review needed from**:
- [ ] Frontend lead (component architecture decisions)
- [ ] Design lead (token system, spacing, colors)
- [ ] Operations team (operations component requirements)
- [ ] Product owners (each app context)

**Next steps after approval**:
1. Create detailed component specifications
2. Begin Phase 1 implementation
3. Schedule weekly reviews
4. Document as we build

---

**Document owner**: Development team
**Last updated**: 2026-01-12
**Status**: Draft - awaiting stakeholder review
