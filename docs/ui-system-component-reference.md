Type: Reference
Status: Active
Domain: Design System
Last-reviewed: 2026-01-12
Relates-to: docs/ui-system-enhancement-strategy.md

# UI System Component Reference

Quick reference guide for all components in the enhanced UI system.

## Component Matrix by Context

| Component Category | Consumer | Hospitality | Operations | Shared |
|--------------------|----------|-------------|------------|--------|
| **Density** | Comfortable | Default | Compact | Configurable |
| **Base font size** | 16px | 15px | 14px | - |
| **Primary use case** | Marketing, e-commerce | Guest & staff | Dense data, dashboards | Universal |

---

## Atoms

### Buttons
```tsx
import { Button } from '@acme/ui/atoms/shadcn'

<Button variant="primary" size="lg">Action</Button>
<Button variant="secondary" size="md">Cancel</Button>
<Button variant="ghost" size="sm">Link</Button>
<Button variant="danger" size="md">Delete</Button>
```

**Variants**: `primary`, `secondary`, `ghost`, `outline`, `danger`, `success`
**Sizes**: `xs`, `sm`, `md`, `lg`, `xl`
**Context-aware**: Padding and font size adjust per context

---

### Inputs
```tsx
import { Input, TextArea, Select } from '@acme/ui/atoms/shadcn'

<Input type="text" placeholder="Search..." />
<TextArea rows={4} placeholder="Description..." />
<Select options={options} value={selected} onChange={setSelected} />
```

**Types**: `text`, `email`, `password`, `number`, `tel`, `url`, `search`
**States**: `default`, `disabled`, `error`, `success`
**Context-aware**: Padding adjusts (8px operations, 16px consumer)

---

### Display Components
```tsx
import { Badge, Chip, Avatar, Price } from '@acme/ui/atoms'

<Badge variant="success">Active</Badge>
<Chip label="Featured" onRemove={handleRemove} />
<Avatar src={user.image} name={user.name} size="md" />
<Price amount={29.99} currency="EUR" size="lg" />
```

---

### Status Indicators
```tsx
import { StatusIndicator, StockLevelIndicator } from '@acme/ui/atoms/indicators'

// Operations context - room status
<StatusIndicator status="available" variant="room" />
<StatusIndicator status="occupied" variant="room" />
<StatusIndicator status="cleaning" variant="room" />

// Inventory - stock levels
<StockLevelIndicator
  quantity={5}
  threshold={10}
  unit="units"
/>
```

**Status colors** (operations context):
- Available: Green (#16a34a)
- Occupied: Red (#dc2626)
- Cleaning: Yellow (#ca8a04)
- Maintenance: Blue (#2563eb)

---

## Molecules

### Cards
```tsx
import { Card, CardHeader, CardContent, CardFooter } from '@acme/ui/atoms/shadcn'

<Card>
  <CardHeader>
    <h3>Card Title</h3>
  </CardHeader>
  <CardContent>
    <p>Card content here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

**Spacing**: Padding adapts to context (12px operations, 24px consumer)

---

### Form Fields
```tsx
import { FormField, FormSection } from '@acme/ui/molecules/forms'

<FormSection title="Personal Information">
  <FormField
    label="Full Name"
    name="name"
    required
    error={errors.name}
  >
    <Input {...register('name')} />
  </FormField>

  <FormField
    label="Email"
    name="email"
    type="email"
    helper="We'll never share your email"
  >
    <Input {...register('email')} />
  </FormField>
</FormSection>
```

---

### Navigation
```tsx
import { Breadcrumbs, Tabs, Pagination } from '@acme/ui/molecules/navigation'

<Breadcrumbs
  items={[
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'Item', href: '/products/123' },
  ]}
/>

<Tabs
  tabs={[
    { id: 'overview', label: 'Overview' },
    { id: 'details', label: 'Details' },
    { id: 'reviews', label: 'Reviews' },
  ]}
  active={activeTab}
  onChange={setActiveTab}
/>
```

---

### Feedback
```tsx
import { Alert, Toast, ProgressBar } from '@acme/ui/molecules/feedback'

<Alert variant="success" title="Success!" dismissible>
  Your changes have been saved.
</Alert>

<Toast
  message="Item added to cart"
  variant="success"
  duration={3000}
/>

<ProgressBar value={75} max={100} variant="success" />
```

---

## Organisms

### Operations Components

#### DataTable
```tsx
import { DataTable } from '@acme/ui/operations'

const columns = [
  { id: 'id', header: 'ID', accessor: (row) => row.id, sortable: true },
  { id: 'name', header: 'Name', accessor: (row) => row.name, sortable: true },
  { id: 'status', header: 'Status', accessor: (row) => <StatusBadge status={row.status} /> },
]

<DataTable
  data={items}
  columns={columns}
  searchable
  onRowClick={handleRowClick}
/>
```

**Features**:
- Built-in search and filtering
- Column sorting (ascending/descending)
- Row selection (single/multi)
- Pagination (configurable page size)
- Responsive (horizontal scroll on mobile)
- Keyboard navigation (arrow keys, enter)
- Empty states and loading states

---

#### MetricsCard
```tsx
import { MetricsCard, RealtimeCounter } from '@acme/ui/operations'

<MetricsCard
  label="Total Revenue"
  value={<RealtimeCounter value={revenue} prefix="$" />}
  trend={{ value: 12.5, direction: 'up' }}
  status="success"
  icon={DollarSign}
/>
```

**Variants**: `default`, `success`, `warning`, `danger`
**Trend**: Shows percentage change with arrow

---

#### QuickActionBar
```tsx
import { QuickActionBar } from '@acme/ui/operations'

<QuickActionBar
  actions={[
    { label: 'New Booking', icon: Plus, onClick: handleNew },
    { label: 'Check In', icon: UserPlus, onClick: handleCheckIn },
    { label: 'Reports', icon: FileText, onClick: showReports },
  ]}
  size="lg" // For touch interfaces
/>
```

**Sizes**: `sm`, `md`, `lg` (lg for POS/touch)

---

#### ActivityFeed
```tsx
import { ActivityFeed } from '@acme/ui/operations'

<ActivityFeed
  items={activities}
  realtime
  maxItems={10}
  variant="compact"
/>
```

**Features**:
- Real-time updates (via WebSocket or polling)
- Infinite scroll
- Timestamp formatting
- User avatars
- Action icons

---

### Hospitality Components

#### RoomGrid
```tsx
import { RoomGrid } from '@acme/ui/hospitality'

<RoomGrid
  rooms={rooms}
  layout="grid" // or "list"
  onRoomClick={handleRoomClick}
  showStatus
  showPrice
  filterBy={{ status: 'available', type: 'double' }}
/>
```

**Views**: Grid (cards) or list (table)
**Filtering**: By status, type, floor, amenities

---

#### CheckInForm
```tsx
import { CheckInForm } from '@acme/ui/hospitality'

<CheckInForm
  reservation={reservation}
  onSubmit={handleCheckIn}
  requireId
  collectDeposit
  sections={['guest-info', 'payment', 'preferences']}
/>
```

**Sections**: Modular form sections
**Validation**: Built-in validation rules
**ID scanning**: Camera integration ready

---

#### ReservationCalendar
```tsx
import { ReservationCalendar } from '@acme/ui/hospitality'

<ReservationCalendar
  availableDates={availableDates}
  reservations={existingReservations}
  onDateSelect={handleSelect}
  view="month" // or "week"
  showPricing
  highlightWeekends
/>
```

**Features**:
- Multi-month view
- Date range selection
- Availability overlay
- Dynamic pricing display
- Blocked dates

---

#### GuestProfile
```tsx
import { GuestProfile } from '@acme/ui/hospitality'

<GuestProfile
  guest={guest}
  showHistory
  showPreferences
  showLoyalty
  onEdit={handleEdit}
/>
```

**Sections**:
- Contact information
- Booking history
- Preferences (room type, floor, amenities)
- Loyalty status/points
- Notes and tags

---

### POS Components

#### CashierKeypad
```tsx
import { CashierKeypad } from '@acme/ui/organisms/pos'

<CashierKeypad
  amount={total}
  onComplete={handlePayment}
  showQuickAmounts={[10, 20, 50, 100]}
  currency="EUR"
  size="lg" // Touch-optimized
/>
```

**Features**:
- Large touch targets (min 44x44px)
- Quick amount buttons
- Change calculation
- Keyboard support
- Sound feedback (optional)

---

#### ReceiptPreview
```tsx
import { ReceiptPreview } from '@acme/ui/organisms/pos'

<ReceiptPreview
  items={orderItems}
  subtotal={subtotal}
  tax={tax}
  total={total}
  onRemoveItem={removeItem}
  onEditQuantity={editQuantity}
  showTaxBreakdown
/>
```

**Features**:
- Line item editing
- Quantity adjustment
- Tax breakdown
- Discounts/coupons
- Print/email ready

---

#### PaymentMethodSelector
```tsx
import { PaymentMethodSelector } from '@acme/ui/organisms/pos'

<PaymentMethodSelector
  methods={['cash', 'card', 'mobile', 'tab']}
  selected={method}
  onSelect={setMethod}
  variant="buttons" // or "cards"
/>
```

**Methods**: Cash, card, mobile pay, tab/invoice
**Variants**: Buttons (compact) or cards (visual)

---

#### TillReconciliation
```tsx
import { TillReconciliation } from '@acme/ui/organisms/pos'

<TillReconciliation
  expected={expectedAmount}
  counted={countedAmount}
  denominations={cashBreakdown}
  onSubmit={handleSubmit}
  showVariance
  allowOverride
/>
```

**Features**:
- Denomination counting
- Variance calculation
- Approval workflow
- Audit trail
- PDF export

---

### Inventory Components

#### StockAdjustmentForm
```tsx
import { StockAdjustmentForm } from '@acme/ui/organisms/inventory'

<StockAdjustmentForm
  item={item}
  reasons={['sale', 'damage', 'theft', 'recount', 'return']}
  onSubmit={handleAdjustment}
  showHistory
  requireApproval={amount > 100}
/>
```

---

#### VarianceReport
```tsx
import { VarianceReport } from '@acme/ui/organisms/inventory'

<VarianceReport
  items={itemsWithVariance}
  dateRange={{ start, end }}
  highlightThreshold={5} // Highlight if >5% variance
  exportable
/>
```

---

#### ExpiryDateTracker
```tsx
import { ExpiryDateTracker } from '@acme/ui/organisms/inventory'

<ExpiryDateTracker
  items={perishableItems}
  warnDays={7} // Yellow warning
  dangerDays={3} // Red warning
  onDiscard={handleDiscard}
  showNotifications
/>
```

---

### E-commerce Components

#### ProductCard
```tsx
import { ProductCard } from '@acme/ui/patterns/ecommerce'

<ProductCard
  product={product}
  onAddToCart={handleAddToCart}
  showQuickView
  showWishlist
  imageAspectRatio="4:3"
  variant="elevated" // or "flat", "outlined"
/>
```

---

#### ProductFilters
```tsx
import { ProductFilters } from '@acme/ui/patterns/ecommerce'

<ProductFilters
  filters={availableFilters}
  selected={selectedFilters}
  onChange={handleFilterChange}
  responsive="drawer" // Drawer on mobile, sidebar on desktop
  showCount
/>
```

---

#### CartDrawer
```tsx
import { CartDrawer } from '@acme/ui/patterns/ecommerce'

<CartDrawer
  items={cartItems}
  onUpdateQuantity={updateQuantity}
  onRemoveItem={removeItem}
  onCheckout={goToCheckout}
  showShipping
  showEstimatedTotal
/>
```

---

## Templates

### DashboardLayout
```tsx
import { DashboardLayout } from '@acme/ui/templates/operations'

<DashboardLayout
  sidebar={<NavigationSidebar />}
  header={<TopBar />}
  quickActions={<QuickActionBar actions={actions} />}
  variant="default" // or "pos" (touch), "analytics" (charts)
>
  {/* Main content */}
</DashboardLayout>
```

**Variants**:
- `default`: Standard sidebar + content
- `pos`: Touch-optimized, larger targets
- `analytics`: Chart-friendly, wider content area

---

### ShopLayout
```tsx
import { ShopLayout } from '@acme/ui/templates/consumer'

<ShopLayout
  header={<Header />}
  footer={<Footer />}
  announcement={<AnnouncementBar />}
  maxWidth="7xl"
>
  {/* Page content */}
</ShopLayout>
```

---

### DataEntryLayout
```tsx
import { DataEntryLayout } from '@acme/ui/templates/operations'

<DataEntryLayout
  title="New Booking"
  onSave={handleSave}
  onCancel={handleCancel}
  saveLabel="Create Booking"
  showProgress
  steps={['guest', 'room', 'payment']}
  currentStep={currentStep}
>
  {/* Form content */}
</DataEntryLayout>
```

---

### SplitViewLayout
```tsx
import { SplitViewLayout } from '@acme/ui/templates/operations'

<SplitViewLayout
  list={<ItemList items={items} selected={selected} />}
  detail={<ItemDetail item={selectedItem} />}
  listWidth="300px"
  responsive="stack" // Stack on mobile
>
  {/* Optional toolbar */}
</SplitViewLayout>
```

---

## Charts & Visualizations

```tsx
import { LineChart, BarChart, PieChart, HeatmapChart } from '@acme/ui/organisms/charts'

<LineChart
  data={timeSeriesData}
  xAxis="date"
  yAxis="value"
  title="Revenue Over Time"
  height={300}
  theme="operations" // Matches context colors
/>

<HeatmapChart
  data={occupancyData}
  rows={rooms}
  columns={dates}
  colorScale="operations" // Uses status colors
/>
```

---

## Pattern Libraries

### E-commerce Pattern: Product Listing Page
```tsx
import { ShopLayout, ProductGrid, ProductFilters } from '@acme/ui'

function ProductListingPage() {
  return (
    <ShopLayout>
      <div className="flex gap-[--section-gap]">
        <ProductFilters {...filterProps} />
        <ProductGrid {...gridProps} />
      </div>
    </ShopLayout>
  )
}
```

---

### Operations Pattern: Dashboard
```tsx
import { DashboardLayout, MetricsCard, DataTable, ActivityFeed } from '@acme/ui'

function Dashboard() {
  return (
    <DashboardLayout>
      {/* Metrics row */}
      <div className="grid grid-cols-4 gap-[--section-gap]">
        <MetricsCard {...metric1} />
        <MetricsCard {...metric2} />
        <MetricsCard {...metric3} />
        <MetricsCard {...metric4} />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-2 gap-[--section-gap]">
        <DataTable {...tableProps} />
        <ActivityFeed {...feedProps} />
      </div>
    </DashboardLayout>
  )
}
```

---

### Hospitality Pattern: Booking Flow
```tsx
import { ShopLayout, AvailabilityCalendar, RoomSelector, CheckoutForm } from '@acme/ui'

function BookingFlow() {
  return (
    <ShopLayout>
      <div className="space-y-[--section-gap]">
        <AvailabilityCalendar {...calendarProps} />
        <RoomSelector {...roomProps} />
        <CheckoutForm {...checkoutProps} />
      </div>
    </ShopLayout>
  )
}
```

---

## Context Usage Examples

### Consumer Context (Marketing Site)
```tsx
// apps/brikette/src/app/layout.tsx
<body className="context-consumer">
  {children}
</body>
```

**Result**:
- Base font: 16px
- Row gap: 24px
- Section gap: 48px
- Card padding: 24px
- Comfortable density

---

### Operations Context (Reception App)
```tsx
// apps/reception/src/app/layout.tsx
<body className="context-operations">
  {children}
</body>
```

**Result**:
- Base font: 14px
- Row gap: 8px
- Section gap: 16px
- Card padding: 12px
- Compact density

---

### Hospitality Context (Booking System)
```tsx
// apps/booking-system/src/app/layout.tsx
<body className="context-hospitality">
  {children}
</body>
```

**Result**:
- Base font: 15px
- Row gap: 16px
- Section gap: 32px
- Card padding: 16px
- Default density

---

## Density Override

Override context density for specific sections:

```tsx
<div className="context-operations">
  {/* Most of the app uses compact operations spacing */}

  <section className="density-comfortable">
    {/* This marketing section uses comfortable spacing */}
  </section>
</div>
```

---

## Theming

### Brand Color Override
```tsx
<body
  className="context-consumer"
  style={{
    '--color-brand-primary': 'hsl(330, 100%, 50%)', // Pink
    '--color-brand-secondary': 'hsl(340, 100%, 60%)',
  }}
>
```

### Dark Mode
```tsx
<body className="context-consumer theme-dark">
  {children}
</body>
```

---

## Accessibility Features

All components include:
- **Keyboard navigation**: Tab, arrow keys, enter, escape
- **ARIA labels**: Proper semantic HTML and ARIA attributes
- **Focus indicators**: Visible focus states
- **Screen reader support**: Announcements for dynamic content
- **Color contrast**: WCAG AA compliant (4.5:1 minimum)
- **Touch targets**: Minimum 44x44px for interactive elements

---

## Responsive Behavior

### Breakpoints (from design tokens)
```typescript
mobile: '0px',      // 0-639px
tablet: '640px',    // 640-1023px
desktop: '1024px',  // 1024-1439px
wide: '1440px',     // 1440px+
```

### Responsive Utilities
```tsx
<div className="
  grid
  grid-cols-1       /* Mobile: 1 column */
  md:grid-cols-2    /* Tablet: 2 columns */
  lg:grid-cols-3    /* Desktop: 3 columns */
  gap-[--section-gap]
">
  {items}
</div>
```

---

## Import Patterns

### Named Imports (Recommended)
```tsx
import { Button, Input } from '@acme/ui/atoms/shadcn'
import { DataTable, MetricsCard } from '@acme/ui/operations'
import { ProductCard } from '@acme/ui/patterns/ecommerce'
```

### Default Imports (Components)
```tsx
import DataTable from '@acme/ui/organisms/operations/DataTable'
```

---

## Testing Components

### Unit Test Example
```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@acme/ui/atoms/shadcn'

test('button click handler', () => {
  const handleClick = jest.fn()
  render(<Button onClick={handleClick}>Click me</Button>)
  fireEvent.click(screen.getByText('Click me'))
  expect(handleClick).toHaveBeenCalled()
})
```

### Accessibility Test Example
```tsx
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

test('should have no accessibility violations', async () => {
  const { container } = render(<MyComponent />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

---

## Component Checklist

When creating a new component for `@acme/ui`:

- [ ] TypeScript types defined
- [ ] Props interface exported
- [ ] Responsive behavior tested
- [ ] Accessibility verified (keyboard, screen reader)
- [ ] Storybook story created
- [ ] Unit tests written (>80% coverage)
- [ ] JSDoc comments added
- [ ] Uses design tokens (no hardcoded values)
- [ ] Context-aware (works in all contexts)
- [ ] Exported from package.json

---

## Performance Tips

1. **Lazy load heavy components**:
   ```tsx
   const DataTable = lazy(() => import('@acme/ui/operations').then(m => ({ default: m.DataTable })))
   ```

2. **Virtualize long lists**:
   ```tsx
   <DataTable virtualized rowHeight={40} />
   ```

3. **Memoize expensive calculations**:
   ```tsx
   const sortedData = useMemo(() => sortItems(data), [data])
   ```

4. **Code split by context**:
   ```tsx
   // Only load operations components in operations apps
   const operations = await import('@acme/ui/operations')
   ```

---

## Related Documentation

- [UI System Enhancement Strategy](./ui-system-enhancement-strategy.md)
- [Phase 1 Implementation Guide](./ui-system-phase1-implementation.md)
- [Benefits by Application Type](./ui-system-benefits-by-app.md)
- [Architecture](./architecture.md)

---

**Last updated**: 2026-01-12
**Component count**: 50+ components, 3 contexts, 8 patterns
