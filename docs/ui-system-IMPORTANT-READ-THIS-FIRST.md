Type: Navigation Guide
Status: Critical
Domain: Design System
Last-reviewed: 2026-01-16

# ⚠️ IMPORTANT: Which Files to Review (Agent Runbook)

## Review Status Update

The issues found in the **first review** have already been fixed in the **second set of documents**.

### ❌ DO NOT USE THESE (Original - Contains Issues)

These files contain the issues from the first review:

```
docs/ui-system-enhancement-strategy.md          # ❌ Original - has issues
docs/ui-system-phase1-implementation.md         # ❌ Original - has issues
docs/ui-system-benefits-by-app.md              # ❌ Original - has issues
docs/ui-system-component-reference.md          # ❌ Original - has issues
```

**Status**: These are the FIRST DRAFT with known issues. Keep for reference only.

---

### ✅ USE THESE (Fixed - Ready for Implementation)

**For Phase 1 Implementation**:
```
docs/ui-system-phase1-implementation-fixed.md   # ✅ ALL ISSUES FIXED
```

**For Understanding Fixes**:
```
docs/ui-system-review-fixes.md                  # ✅ Detailed fix analysis
docs/ui-system-review-response-summary.md       # ✅ Executive summary
```

---

## Issues Already Fixed in New Documents

All issues from the review are **already resolved** in `ui-system-phase1-implementation-fixed.md`:

### ✅ Fixed: DataTable Accessor Pattern (Line 509)

**Old (broken)**:
```typescript
accessor: (row: T) => React.ReactNode  // ❌ Can't sort/filter JSX
```

**New (fixed)** - see `ui-system-phase1-implementation-fixed.md:509`:
```typescript
getValue: (row: T) => string | number | Date | boolean  // ✅ For sort/filter
cell?: (row: T) => React.ReactNode                      // ✅ For render
```

### ✅ Fixed: Feature Scope (Phase 1 MVP)

**New doc clearly states** - see `ui-system-phase1-implementation-fixed.md:645`:
```
Phase 1 MVP:
- ✅ Sort and search only
- ✅ Row click handler
- ✅ Loading/empty states

Phase 2 (documented, not built):
- ⏳ Pagination
- ⏳ Row selection
- ⏳ Column filtering
```

### ✅ Fixed: Dashboard Context Removed

**New doc** - see `ui-system-phase1-implementation-fixed.md:178`:
```typescript
// Phase 1: 3 contexts only
export type TokenContext = 'operations' | 'consumer' | 'hospitality'

// Phase 2 (commented out):
// | 'dashboard'
```

### ✅ Fixed: Complete CSS Variable Mapping

**New doc** - see `ui-system-phase1-implementation-fixed.md:280`:
```typescript
'.context-operations': {
  '--base-size': operationsTokens.typography['base-size'],
  '--heading-size': operationsTokens.typography['heading-size'],
  '--table-cell-padding': operationsTokens.spacing['table-cell-padding'],
  '--space-0': spacing[0],
  // ... all variables mapped
}
```

### ✅ Fixed: Import Paths Standardized

**New doc uses only canonical imports** - see `ui-system-phase1-implementation-fixed.md:506`:
```typescript
// ✅ Correct - relative imports in package source
import { Input } from '../../atoms/shadcn/Input'
import { Button } from '../../atoms/shadcn/Button'
```

---

## Questions - Already Answered

### Q1: DataTable API - Split or TanStack?

**Answer in fixed doc**: Split API (`getValue`/`cell`) implemented in Phase 1

See `ui-system-review-fixes.md:39`:
- Phase 1: Custom DataTable with split API
- Phase 2+: Consider TanStack Table

### Q2: Canonical Import Surface?

**Answer in fixed doc**: Shallow semantic subpaths

See `ui-system-review-fixes.md:310`:
```typescript
'@acme/ui/operations'           // ✅ Canonical
'@acme/ui/atoms/shadcn'         // ✅ Canonical
```

### Q3: Dashboard/Spacious in Phase 1?

**Answer in fixed doc**: Removed from Phase 1, documented for Phase 2

See `ui-system-review-fixes.md:207`:
- Phase 1: 3 contexts only (operations, consumer, hospitality)
- Phase 2: Add dashboard context and spacious density

---

## File Comparison Table

| Issue | Original Files | Fixed Files | Status |
|-------|---------------|-------------|---------|
| DataTable JSX bug | ❌ Has bug | ✅ Fixed with getValue/cell | RESOLVED |
| Feature scope | ❌ Unclear | ✅ Clear MVP scope | RESOLVED |
| Dashboard premature | ❌ Included | ✅ Removed from Phase 1 | RESOLVED |
| CSS variables | ❌ Incomplete | ✅ Complete mapping | RESOLVED |
| Import paths | ❌ Inconsistent | ✅ Standardized | RESOLVED |

---

## Next Steps

### If You Haven't Reviewed the Fixed Files Yet

1. **Read first**: `docs/ui-system-review-response-summary.md`
   - Quick overview of what was fixed

2. **Implement from**: `docs/ui-system-phase1-implementation-fixed.md`
   - This is the corrected, ready-to-use guide

3. **For details**: `docs/ui-system-review-fixes.md`
   - Deep dive on each fix and decision

### If You've Already Reviewed the Fixed Files

Confirm which version was reviewed:
- [ ] Original files (ui-system-phase1-implementation.md)
- [ ] Fixed files (ui-system-phase1-implementation-fixed.md)

If issues were found in the **fixed** files, provide:
- File name with "-fixed" suffix
- Line numbers from the fixed file
- Specific issues found

---

## File Timeline

1. **2026-01-12 (First Draft)**
   - Created 4 original strategy documents
   - Contains known issues

2. **2026-01-12 (After First Review)**
   - Created `ui-system-review-fixes.md`
   - Created `ui-system-phase1-implementation-fixed.md`
   - Created `ui-system-review-response-summary.md`
   - **All first review issues resolved**

3. **Now (Second Review)**
   - Appears to be reviewing original files again
   - Need to confirm which version is being reviewed

---

## Quick Decision Tree

```
Is the review targeting a file that ends in "-fixed.md"?
├─ Yes → Great! If issues were found, share them
└─ No → Review the "-fixed" version instead
         The original files are known to have issues
```

---

**Critical**: Before reporting issues, verify the review targets:
```
✅ docs/ui-system-phase1-implementation-fixed.md
```

NOT:
```
❌ docs/ui-system-phase1-implementation.md
```

---

**Need help?** Check:
- `ui-system-review-response-summary.md` - What changed
- `ui-system-review-fixes.md` - Why it changed
- This file - Which files to use

**Last updated**: 2026-01-12
**Status**: Awaiting confirmation of which files were reviewed
