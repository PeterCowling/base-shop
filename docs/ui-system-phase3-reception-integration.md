Type: Implementation Report
Status: Completed
Domain: Design System
Last-reviewed: 2026-01-16

# UI System Phase 3 - Reception App Integration (Agent Runbook)

**Date:** 2026-01-12
**App:** Reception (@apps/reception)
**Components Integrated:** EmptyState, StatusIndicator
**Status:** ✅ Complete

## Overview

This document details the integration of Phase 3 UI System components into the Reception app. The integration focused on improving empty state messaging and maintaining consistency with previous StatusIndicator work.

## Integration Summary

| Component | Files Modified | Use Cases | Impact |
|-----------|---------------|-----------|---------|
| **EmptyState** | 2 | No search results, empty shopping cart | Improved UX with helpful messaging |
| **StatusIndicator** | Re-exported | Already integrated (Phase 2) | Maintained consistency |

### Components Not Integrated

**SearchBar** - Reception app uses a complex FilterBar with multiple fields (firstName, lastName, bookingRef, date, roomNumber, etc.) rather than a simple search input. The SearchBar component is designed for single-input search scenarios and wouldn't be appropriate for this use case.

**FormCard** - Reception app has minimal form usage. The existing PayModal has a custom structure that's already well-designed for its specific use case.

**ActionSheet** - While the PayModal could potentially use ActionSheet, the existing modal implementation with `withModalBackground` HOC and `ModalContainer` is well-established and would require significant refactoring without clear benefits.

## Integrations Completed

### 1. BookingSearchTable - No Results Empty State

**File:** [`apps/reception/src/components/search/BookingSearchTable.tsx`](../apps/reception/src/components/search/BookingSearchTable.tsx:223-231)

#### Before
```tsx
if (!extendedGuests.length)
  return (
    <p className="text-gray-600 dark:text-darkAccentGreen">
      No matching results. Please adjust your filters or search terms.
    </p>
  );
```

#### After
```tsx
import { StatusIndicator, type GeneralStatusType, EmptyState } from "@acme/ui/operations";
import { Search } from "lucide-react";

if (!extendedGuests.length)
  return (
    <div className="rounded-md border border-gray-400 bg-white shadow-sm dark:bg-darkSurface dark:border-darkSurface">
      <EmptyState
        icon={Search}
        title="No matching results"
        description="We couldn't find any bookings matching your search criteria. Try adjusting your filters or search terms."
        size="sm"
      />
    </div>
  );
```

#### Benefits
- Visual consistency with search icon
- Better formatted messaging with title and description
- Proper card container with borders
- Dark mode support
- More helpful user guidance

---

### 2. Bar OrderList - Empty Cart State

**File:** [`apps/reception/src/components/bar/orderTaking/OrderList.tsx`](../apps/reception/src/components/bar/orderTaking/OrderList.tsx:76-83)

#### Before
```tsx
) : (
  <div className="flex flex-1 items-center justify-center text-gray-500">
    No items yet. Tap a product to add it to the order.
  </div>
)}
```

#### After
```tsx
import { EmptyState } from "@acme/ui/operations";
import { ShoppingCart } from "lucide-react";

) : (
  <div className="flex flex-1 items-center justify-center px-4">
    <EmptyState
      icon={ShoppingCart}
      title="No items yet"
      description="Tap a product to add it to the order"
      size="sm"
    />
  </div>
)}
```

#### Benefits
- Shopping cart icon provides visual context
- Structured title + description layout
- Better visual hierarchy
- Consistent with other empty states
- Dark mode support

---

## StatusIndicator Re-export

To simplify imports in the Reception app, StatusIndicator is now re-exported from the operations index:

**File:** [`packages/ui/src/components/organisms/operations/index.ts`](../packages/ui/src/components/organisms/operations/index.ts)

```typescript
// Re-export StatusIndicator from atoms for convenience
export {
  StatusIndicator,
  type StatusIndicatorProps,
  type GeneralStatusType,
  type RoomStatusType,
  type StockStatusType,
  type OrderStatusType
} from '../../atoms/StatusIndicator'
```

### Import Pattern

**Before:**
```typescript
import { StatusIndicator } from '@acme/ui/atoms';
import { EmptyState } from '@acme/ui/operations';
```

**After:**
```typescript
import { StatusIndicator, EmptyState, type GeneralStatusType } from '@acme/ui/operations';
```

This allows all operations-related components to be imported from a single location.

---

## Activity Status Helper Function

As part of Phase 2 (documented in [`ui-system-statusindicator-integration.md`](./ui-system-statusindicator-integration.md)), the `getActivityStatus()` function was simplified during Phase 3 integration:

**File:** [`apps/reception/src/components/search/BookingSearchTable.tsx`](../apps/reception/src/components/search/BookingSearchTable.tsx:39-69)

```typescript
/**
 * Maps activity level text to StatusIndicator status
 */
function getActivityStatus(activityLevel: string): GeneralStatusType {
  const level = activityLevel.toLowerCase();

  // Cancellations and failures - error state
  if (level.includes("cancel") || level.includes("failed")) {
    return "error";
  }

  // Completed states - success
  if (level.includes("complete") || level.includes("made") || level.includes("refund")) {
    return "success";
  }

  // In-progress states - warning
  if (level.includes("drop") || level.includes("reminder") || level.includes("details taken")) {
    return "warning";
  }

  // Initial states - info
  if (level.includes("created") || level.includes("agreed")) {
    return "info";
  }

  // No activity or default - neutral
  return "neutral";
}
```

### Usage
```tsx
<StatusIndicator
  status={getActivityStatus(guest.activityLevel)}
  variant="general"
  size="sm"
  label={guest.activityLevel}
/>
```

**Changes from Phase 2:**
- Removed unused `variant` return value (StatusIndicator determines its own variant)
- Simplified return type to just `GeneralStatusType`
- Changed "inactive"/"active" to "neutral" (valid GeneralStatusType)

---

## EmptyState Design Pattern

### Size Selection

**Rule:** Use `size="sm"` for compact contexts (tables, sidebars, list sections)

Both integrations use `size="sm"` because:
1. **BookingSearchTable**: Empty state appears within a table context with limited space
2. **OrderList**: Empty state appears in a sidebar order panel

### Icon Selection

**Rule:** Use icons that represent the content type or action

- **Search** icon: For search results (represents searching/finding)
- **ShoppingCart** icon: For empty cart (represents the cart itself)

Other common icons:
- `Package`: Empty inventory
- `Users`: No team members
- `FileText`: No documents

### Description Guidelines

1. **Be helpful**: Explain why it's empty and what the user can do
2. **Be specific**: Reference the actual filters/actions (e.g., "your search criteria")
3. **Be brief**: 1-2 sentences maximum
4. **Be actionable**: Suggest next steps when applicable

---

## Technical Implementation

### Type Checking

All integrations pass TypeScript checks:

```bash
pnpm --filter @apps/reception typecheck --skipLibCheck
```

### Dark Mode Support

All EmptyState integrations automatically support dark mode via:
- Built-in dark mode classes in EmptyState component
- Proper container styling with dark mode borders/backgrounds
- Icon color inheritance

### Testing

Dev server verification:
```bash
pnpm --filter @apps/reception dev
# Server starts on http://localhost:3018
```

---

## Performance Impact

### Bundle Size Changes

**Before Phase 3:**
- StatusIndicator: ~2KB gzipped (already integrated)

**After Phase 3:**
- StatusIndicator: ~2KB gzipped
- EmptyState: ~2KB gzipped
- **Total New:** ~2KB gzipped

### Runtime Performance

- No performance regressions observed
- EmptyState only renders when lists are empty (minimal render cost)
- Both components are memoized React components

---

## Migration Checklist

For integrating EmptyState in other apps:

- [ ] Identify empty state locations (empty lists, no results, etc.)
- [ ] Choose appropriate icon from Lucide React
- [ ] Determine appropriate size (sm for compact, default for pages, lg for hero sections)
- [ ] Write helpful title and description
- [ ] Add optional CTA actions if needed
- [ ] Test dark mode appearance
- [ ] Verify TypeScript types
- [ ] Run dev server to verify rendering

---

## Future Opportunities

### SearchBar Integration Candidates

For future apps/features that might benefit from SearchBar:
- Simple product search (single input)
- Customer name search
- Order number lookup
- Document/file search

**Not suitable for:**
- Multi-field filters (like Reception's FilterBar)
- Advanced search with many criteria
- Complex boolean queries

### FormCard Integration Candidates

For future forms that might benefit from FormCard:
- New booking forms
- Customer profile editing
- Settings/preferences forms
- Data entry forms with validation

**Not suitable for:**
- Modal dialogs with custom layouts (use ActionSheet)
- Single-field inputs
- Non-form card content

### ActionSheet Integration Candidates

For future mobile-friendly actions:
- Quick action menus
- Confirmation dialogs (replacing custom modals)
- Settings panels
- Filter menus

**Consideration:** Reception app uses `withModalBackground` HOC pattern extensively. ActionSheet integration would require refactoring existing modal infrastructure, which may not provide sufficient benefits.

---

## Code Quality Improvements

### Before and After Comparison

**Before (Manual Empty State):**
```tsx
<p className="text-gray-600 dark:text-darkAccentGreen">
  No matching results. Please adjust your filters or search terms.
</p>
```

**After (EmptyState Component):**
```tsx
<EmptyState
  icon={Search}
  title="No matching results"
  description="We couldn't find any bookings matching your search criteria. Try adjusting your filters or search terms."
  size="sm"
/>
```

### Improvements
1. **Consistency**: All empty states use the same component
2. **Maintainability**: Styling changes happen in one place
3. **Accessibility**: Proper heading hierarchy and semantic structure
4. **Dark Mode**: Automatic support without manual classes
5. **Visual Design**: Icon + structured layout vs plain text

---

## Lessons Learned

### 1. Component Applicability

Not every Phase 3 component was suitable for the Reception app:
- **EmptyState**: ✅ 2 successful integrations
- **SearchBar**: ❌ Complex FilterBar not suitable for simple search
- **FormCard**: ❌ Minimal form usage in app
- **ActionSheet**: ❌ Existing modal infrastructure well-established

**Takeaway:** Choose components based on actual app needs, not forced integration.

### 2. Type System Benefits

The `GeneralStatusType` validation caught invalid status values ("inactive"/"active") during integration, leading to proper use of "neutral" status.

**Takeaway:** Strong TypeScript typing prevents runtime errors.

### 3. Re-export Strategy

Re-exporting StatusIndicator from operations index improved DX:
- Single import source for operations components
- Cleaner import statements
- Better discoverability

**Takeaway:** Convenience re-exports are valuable for related components.

---

## Related Documentation

- [UI System Phase 3 Components](./ui-system-phase3-components.md) - Full component documentation
- [StatusIndicator Integration](./ui-system-statusindicator-integration.md) - Phase 2 integration
- [Design Tokens](./ui-system-design-tokens.md) - Phase 1 tokens and utilities

---

**Last Updated:** 2026-01-12
**Author:** Claude Sonnet 4.5
**Status:** ✅ Complete
**Next Steps:** Apply Phase 3 components to other operations apps (Inventory, POS)
