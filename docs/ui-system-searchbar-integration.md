# UI System - SearchBar Component Integration

**Date:** 2026-01-12
**Component:** SearchBar
**Apps Integrated:** Dashboard, CMS (UI Package)
**Status:** ✅ Complete

## Overview

This document details the integration of the SearchBar component into operations apps, upgrading simple text inputs to feature-rich search experiences with recent searches, keyboard shortcuts, and better UX.

## SearchBar Features

- **Recent Searches**: Dropdown showing last 5 searches
- **Click-Outside Handling**: Auto-close dropdown when clicking outside
- **Clear Button**: Quick way to clear the search input
- **Keyboard Shortcuts**: Support for keyboard navigation
- **Auto-Focus**: Optional auto-focus on mount
- **Accessible**: Proper ARIA attributes

## Integration Summary

| App | Location | Before | After | Features Added |
|-----|----------|--------|-------|----------------|
| **Dashboard** | Shops Page | Plain input | SearchBar | Recent searches, clear button |
| **CMS (UI)** | Media Library | Plain input | SearchBar | Recent searches, clear button |
| **Total** | **2 integrations** | - | - | - |

---

## Detailed Integrations

### 1. Dashboard Shops Page

**File:** [`apps/dashboard/src/pages/shops.tsx`](../apps/dashboard/src/pages/shops.tsx)

**Before:**
```tsx
<input
  value={query}
  onChange={(e) => setQuery(e.target.value)}
  placeholder="Search by name, id, or region"
  className="w-full max-w-sm rounded border border-slate-200 px-3 py-2 text-sm focus:border-blue-300 focus:outline-none"
/>
```

**After:**
```tsx
import { SearchBar } from "@acme/ui/operations";

// State
const [query, setQuery] = useState("");
const [recentSearches, setRecentSearches] = useState<string[]>([]);

// Handlers
const handleSearchChange = useCallback((value: string) => {
  setQuery(value);
  if (value.trim() && !recentSearches.includes(value.trim())) {
    setRecentSearches((prev) => [value.trim(), ...prev].slice(0, 5));
  }
}, [recentSearches]);

const handleSelectRecent = useCallback((search: string) => {
  setQuery(search);
}, []);

const handleClearRecent = useCallback(() => {
  setRecentSearches([]);
}, []);

// Render
<div className="w-full max-w-sm">
  <SearchBar
    value={query}
    onChange={handleSearchChange}
    placeholder="Search by name, id, or region"
    recentSearches={recentSearches}
    onSelectRecent={handleSelectRecent}
    onClearRecent={handleClearRecent}
    showRecent={recentSearches.length > 0}
  />
</div>
```

**Benefits:**
- Recent searches saved (up to 5)
- One-click to repeat previous searches
- Clear button for quick reset
- Better visual hierarchy

---

### 2. CMS Media Library

**File:** [`packages/ui/src/components/cms/media/Library.tsx`](../packages/ui/src/components/cms/media/Library.tsx)

**Before:**
```tsx
<Input
  type="search"
  placeholder={String(t("Search media..."))}
  value={query}
  onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
  className="w-full flex-1"
/>
```

**After:**
```tsx
import { SearchBar } from "../../organisms/operations/SearchBar";

// State
const [query, setQuery] = useState("");
const [recentSearches, setRecentSearches] = useState<string[]>([]);

// Handlers
const handleSearchChange = useCallback((value: string) => {
  setQuery(value);
  if (value.trim() && !recentSearches.includes(value.trim())) {
    setRecentSearches((prev) => [value.trim(), ...prev].slice(0, 5));
  }
}, [recentSearches]);

const handleSelectRecent = useCallback((search: string) => {
  setQuery(search);
}, []);

const handleClearRecent = useCallback(() => {
  setRecentSearches([]);
}, []);

// Render
<div className="w-full flex-1">
  <SearchBar
    value={query}
    onChange={handleSearchChange}
    placeholder={String(t("Search media..."))}
    recentSearches={recentSearches}
    onSelectRecent={handleSelectRecent}
    onClearRecent={handleClearRecent}
    showRecent={recentSearches.length > 0}
  />
</div>
```

**Benefits:**
- Recent media searches saved
- Faster repeat searches (common in media workflow)
- Consistent UX with other search interfaces
- Better discoverability

---

## Implementation Pattern

### Standard Integration Pattern

**1. Add imports:**
```typescript
import { useCallback, useState } from "react";
import { SearchBar } from "@acme/ui/operations";
```

**2. Add state:**
```typescript
const [query, setQuery] = useState("");
const [recentSearches, setRecentSearches] = useState<string[]>([]);
```

**3. Add handlers:**
```typescript
const handleSearchChange = useCallback((value: string) => {
  setQuery(value);
  // Save to recent searches (max 5, no duplicates)
  if (value.trim() && !recentSearches.includes(value.trim())) {
    setRecentSearches((prev) => [value.trim(), ...prev].slice(0, 5));
  }
}, [recentSearches]);

const handleSelectRecent = useCallback((search: string) => {
  setQuery(search);
}, []);

const handleClearRecent = useCallback(() => {
  setRecentSearches([]);
}, []);
```

**4. Replace input:**
```tsx
<SearchBar
  value={query}
  onChange={handleSearchChange}
  placeholder="Your placeholder"
  recentSearches={recentSearches}
  onSelectRecent={handleSelectRecent}
  onClearRecent={handleClearRecent}
  showRecent={recentSearches.length > 0}
/>
```

---

## Advanced Patterns

### With LocalStorage Persistence

For persistent recent searches across sessions:

```typescript
const STORAGE_KEY = "recent-searches-shops";

// Load from localStorage on mount
const [recentSearches, setRecentSearches] = useState<string[]>(() => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
});

// Save to localStorage when changed
const handleSearchChange = useCallback((value: string) => {
  setQuery(value);
  if (value.trim() && !recentSearches.includes(value.trim())) {
    const updated = [value.trim(), ...recentSearches].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
}, [recentSearches]);

const handleClearRecent = useCallback(() => {
  setRecentSearches([]);
  localStorage.removeItem(STORAGE_KEY);
}, []);
```

### With Debouncing

For expensive search operations:

```typescript
import { useDebouncedCallback } from "use-debounce";

const [inputValue, setInputValue] = useState("");
const [query, setQuery] = useState("");

const debouncedSearch = useDebouncedCallback((value: string) => {
  setQuery(value);
}, 300);

const handleSearchChange = useCallback((value: string) => {
  setInputValue(value);
  debouncedSearch(value);
  if (value.trim() && !recentSearches.includes(value.trim())) {
    setRecentSearches((prev) => [value.trim(), ...prev].slice(0, 5));
  }
}, [debouncedSearch, recentSearches]);
```

### With Keyboard Shortcuts

Adding command+K or ctrl+K shortcut:

```typescript
import { useEffect, useRef } from "react";

const searchRef = useRef<HTMLInputElement>(null);

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      searchRef.current?.focus();
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, []);

<SearchBar
  value={query}
  onChange={handleSearchChange}
  shortcutHint="⌘K"
  // ... other props
/>
```

---

## When to Use SearchBar

### ✅ Use SearchBar When:

1. **Simple Single-Field Search**
   - Searching through a list/table
   - Filtering by name, ID, or text
   - Example: Shop names, media filenames

2. **User Benefits from History**
   - Repeated searches are common
   - Users return to previous queries
   - Example: Media searches, product searches

3. **Quick, Interactive Search**
   - Results update as user types
   - No "submit" button needed
   - Example: Live filtering, autocomplete

### ❌ Don't Use SearchBar When:

1. **Complex Multi-Field Search**
   - Multiple filter inputs (date, category, status, etc.)
   - Use FilterBar or FormCard instead
   - Example: Reception booking search (firstName, lastName, bookingRef, date, etc.)

2. **Form Submission Required**
   - Search requires clicking a "Submit" button
   - Additional parameters needed beyond text
   - Use regular form with Input component

3. **Non-Text Search**
   - Date pickers, dropdowns, checkboxes
   - Use appropriate input types

---

## UX Benefits

### Before SearchBar

**User Experience:**
- Type search query
- Clear manually (select all + delete)
- Retype previous searches from memory
- No visual feedback on active search

**Problems:**
- Inefficient for repeat searches
- Poor discoverability
- No search history

### After SearchBar

**User Experience:**
- Type search query
- Click X button to clear
- Select from recent searches dropdown
- Visual clear/active states
- Keyboard shortcuts (optional)

**Benefits:**
- Faster workflow for repeat operations
- Better discoverability of past searches
- Reduced cognitive load
- Professional, polished feel

---

## Performance Considerations

### Recent Searches Limit

```typescript
// Limit to 5 recent searches to prevent dropdown overflow
setRecentSearches((prev) => [value.trim(), ...prev].slice(0, 5));
```

**Why 5?**
- Fits in dropdown without scrolling
- Enough to be useful
- Not overwhelming

### Duplicate Prevention

```typescript
if (value.trim() && !recentSearches.includes(value.trim())) {
  setRecentSearches((prev) => [value.trim(), ...prev].slice(0, 5));
}
```

**Why check duplicates?**
- Prevents duplicate entries in recent searches
- Keeps dropdown clean
- Better UX

### Trimming

Always `.trim()` search values to prevent whitespace-only searches:

```typescript
value.trim()
```

---

## Migration Checklist

When upgrading an input to SearchBar:

- [ ] Import SearchBar from `@acme/ui/operations`
- [ ] Add `recentSearches` state
- [ ] Create `handleSearchChange` callback with recent search logic
- [ ] Create `handleSelectRecent` callback
- [ ] Create `handleClearRecent` callback
- [ ] Replace `<input>` or `<Input>` with `<SearchBar>`
- [ ] Pass all required props
- [ ] Set `showRecent={recentSearches.length > 0}`
- [ ] Test functionality (search, recent dropdown, clear button)
- [ ] Consider adding localStorage persistence (optional)
- [ ] Consider adding keyboard shortcuts (optional)

---

## Future Enhancement Opportunities

### Potential Future Integrations

**Reception App:**
- Individual search fields in FilterBar (if separated)
- Activity search

**CMS App:**
- Product search
- Page search
- Section search

**Dashboard App:**
- History search
- Workboard search/filter

### Feature Enhancements

1. **Search Suggestions**: Show autocomplete suggestions based on available data
2. **Search Highlighting**: Highlight matching terms in results
3. **Advanced Filters**: Toggle for advanced filter panel
4. **Search Analytics**: Track popular searches to improve UX

---

## Related Documentation

- [Phase 3 Component Documentation](./ui-system-phase3-components.md)
- [EmptyState Integration](./ui-system-phase3-operations-integration.md)
- [Design Tokens](./ui-system-design-tokens.md)

---

## Quick Reference

### Basic Usage

```tsx
import { SearchBar } from "@acme/ui/operations";

const [query, setQuery] = useState("");
const [recentSearches, setRecentSearches] = useState<string[]>([]);

<SearchBar
  value={query}
  onChange={(value) => {
    setQuery(value);
    if (value.trim() && !recentSearches.includes(value.trim())) {
      setRecentSearches(prev => [value.trim(), ...prev].slice(0, 5));
    }
  }}
  placeholder="Search..."
  recentSearches={recentSearches}
  onSelectRecent={(search) => setQuery(search)}
  onClearRecent={() => setRecentSearches([])}
  showRecent={recentSearches.length > 0}
/>
```

### All Props

```typescript
interface SearchBarProps {
  value: string;                    // Required: Current search value
  onChange: (value: string) => void; // Required: Change handler
  placeholder?: string;              // Optional: Placeholder text
  disabled?: boolean;                // Optional: Disable input
  recentSearches?: string[];        // Optional: Array of recent searches
  onSelectRecent?: (search: string) => void; // Optional: Recent search selected
  onClearRecent?: () => void;       // Optional: Clear all recent searches
  showRecent?: boolean;             // Optional: Show recent searches dropdown
  autoFocus?: boolean;              // Optional: Auto-focus on mount
  className?: string;               // Optional: Additional CSS classes
  shortcutHint?: string;           // Optional: Keyboard shortcut hint (e.g., "⌘K")
}
```

---

**Last Updated:** 2026-01-12
**Component Version:** 1.0.0
**Status:** ✅ Active in 2 locations
**Maintainer:** UI System Team
