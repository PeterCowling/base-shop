# UI System Phase 4 - Quick Reference Card

**Date:** 2026-01-12
**Status:** ✅ Production Ready

---

## 📦 Components Available

| Component | Use Case | Bundle |
|-----------|----------|--------|
| **Pagination** | Table/list navigation | ~3KB |
| **Timeline** | Activity/audit logs | ~3KB |
| **FilterPanel** | Complex filtering | ~3KB |
| **BulkActions** | Multi-select operations | ~2.5KB |

---

## ✅ Completed Integrations (6 total)

### Pagination (4 integrations)
1. **Reception** - Booking search results
2. **CMS** - Products list
3. **Dashboard** - Shops list
4. **Dashboard** - History page (with Timeline)

### Timeline (2 integrations)
5. **Reception** - Booking activity log
6. **Dashboard** - Deployment history (with Pagination)

---

## 🚀 Quick Start: Pagination

```typescript
import { Pagination } from '@acme/ui/operations';
import { useCallback, useMemo, useState } from 'react';

// 1. Add state
const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(20);

// 2. Calculate pagination
const totalPages = Math.ceil(items.length / pageSize);
const paginatedItems = useMemo(() => {
  const startIndex = (currentPage - 1) * pageSize;
  return items.slice(startIndex, startIndex + pageSize);
}, [items, currentPage, pageSize]);

// 3. Add handlers
const handlePageChange = useCallback((page: number) => {
  setCurrentPage(page);
}, []);

const handlePageSizeChange = useCallback((size: number) => {
  setPageSize(size);
  setCurrentPage(1);
}, []);

// 4. Render paginated data
{paginatedItems.map(item => <div>{item}</div>)}

// 5. Add component
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  pageSize={pageSize}
  totalItems={items.length}
  onPageChange={handlePageChange}
  onPageSizeChange={handlePageSizeChange}
  showPageSizeSelector
  showFirstLast
/>
```

**Time to integrate:** ~20 minutes

---

## 🚀 Quick Start: Timeline

```typescript
import { Timeline, type TimelineEvent } from '@acme/ui/operations';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useMemo } from 'react';

// 1. Transform data
const timelineEvents = useMemo<TimelineEvent[]>(() => {
  return activities.map(activity => ({
    id: activity.id,
    timestamp: new Date(activity.timestamp),
    title: activity.title,
    description: activity.description,
    icon: activity.success ? CheckCircle2 : XCircle,
    iconColor: activity.success ? 'green' : 'red',
    user: activity.user,
    metadata: <div>{/* Optional custom content */}</div>
  }));
}, [activities]);

// 2. Render
<Timeline
  events={timelineEvents}
  showTime
  showDate
  emptyMessage="No activities"
/>
```

**Time to integrate:** ~15 minutes

---

## 🎨 Timeline Color Guide

| Color | Use Case | Examples |
|-------|----------|----------|
| `blue` | Info, creation | Created, assigned, updated |
| `green` | Success | Completed, approved, delivered |
| `yellow` | Warning, in-progress | Pending, processing, review |
| `red` | Error, failure | Failed, rejected, cancelled |
| `gray` | Neutral | Viewed, logged, general |

---

## 💡 Pro Tips

### Pagination + Filters
Always reset to page 1 when filters change:
```typescript
useEffect(() => {
  setCurrentPage(1);
}, [search, status]); // Reset when filters change
```

### Timeline + Pagination
Perfect combo for long activity lists:
```typescript
const paginatedEvents = useMemo(() => {
  const start = (currentPage - 1) * pageSize;
  return timelineEvents.slice(start, start + pageSize);
}, [timelineEvents, currentPage, pageSize]);

<Timeline events={paginatedEvents} showTime />
<Pagination {...paginationProps} />
```

### SearchBar + Pagination
Proven pattern in Dashboard shops list:
```typescript
// SearchBar for filtering
<SearchBar value={query} onChange={setQuery} />

// Pagination for results
<Pagination
  totalItems={filteredItems.length}
  // ... other props
/>
```

---

## 📋 Integration Checklist

### For Pagination:
- [ ] Import Pagination component
- [ ] Add state (currentPage, pageSize)
- [ ] Calculate totalPages
- [ ] Create paginatedItems with useMemo
- [ ] Add handlers (page change, page size change)
- [ ] Replace items.map with paginatedItems.map
- [ ] Add Pagination component below list
- [ ] Add reset logic for filters (useEffect)
- [ ] Test navigation and page size changes

### For Timeline:
- [ ] Import Timeline and TimelineEvent
- [ ] Import appropriate icons from lucide-react
- [ ] Transform data to TimelineEvent[] with useMemo
- [ ] Map activity types to icon colors
- [ ] Replace list with Timeline component
- [ ] Configure showTime/showDate
- [ ] Set emptyMessage
- [ ] Test with empty data
- [ ] Verify chronological order

---

## 🎯 Next Integration Opportunities

### High Priority
- **FilterPanel** in CMS product filters (complex multi-criteria)
- **BulkActions** in CMS product management (bulk edit/delete)
- **Timeline** in CMS order history
- **Pagination** in Reception financial transactions

### Estimated Time
- Pagination: 20-30 min per integration
- Timeline: 15-20 min per integration
- FilterPanel: 45-60 min (more complex)
- BulkActions: 30-45 min per integration

---

## 📚 Full Documentation

- **[Phase 4 Components](./ui-system-phase4-components.md)** - Full API reference
- **[Phase 4 Integration Guide](./ui-system-phase4-integration.md)** - Detailed examples
- **[Phase 4 Executive Summary](./ui-system-phase4-executive-summary.md)** - High-level overview
- **[Complete Overview](./ui-system-complete-overview.md)** - All phases 1-4

---

## 📊 Success Metrics

- **6 integrations** completed
- **3 apps** enhanced (Reception, CMS, Dashboard)
- **~115 minutes** total integration time
- **~19 minutes** average per integration
- **0 breaking changes** introduced
- **100% type-safe** implementations

---

**Version:** 1.0
**Last Updated:** 2026-01-12
**Status:** ✅ Production Ready
