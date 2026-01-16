# Authorization Standardization Plan

---
Type: Plan
Status: Active
Domain: CMS
Created: 2026-01-12
Created-by: Peter Cowling
Last-updated: 2026-01-16
Last-updated-by: Claude Opus 4.5
---

**Related:** `docs/security-audit-2026-01.md`

## Overview

This document tracks the standardization of authorization patterns across CMS API routes. The goal is to replace inconsistent manual role checks with standardized utilities from `@cms/actions/common/auth`.

## Current State

Analysis found **5 distinct authorization patterns** across 38+ API routes:

| Pattern | Files | Issue |
|---------|-------|-------|
| `ensureAuthorized()` only | 12 | Permissive - allows all non-viewer roles |
| Manual `["admin", "ShopAdmin"]` check | 17 | Hardcoded, duplicated, ignores RBAC |
| Permission-based `hasPermission()` | 7 | Proper RBAC, but inconsistent usage |
| Custom role resolution | 1 | Over-engineered |
| `ensureAuthorized()` + redundant check | 1 | Contradictory logic |

## Standardized Utilities

Located in [`apps/cms/src/actions/common/auth.ts`](../apps/cms/src/actions/common/auth.ts):

### `ensureAuthorized()`
**Use when:** Any authenticated user with write access (blocks viewers only)
```typescript
await ensureAuthorized();
```

### `ensureRole(allowedRoles: Role[])`
**Use when:** Specific roles are required (admin, ShopAdmin, etc.)
```typescript
await ensureRole(['admin', 'ShopAdmin']);
```

### `ensureHasPermission(permission: Permission)`
**Use when:** Permission-based check is more appropriate than role check
```typescript
await ensureHasPermission('manage_inventory');
await ensureHasPermission('manage_catalog');
await ensureHasPermission('manage_pages');
```

### `ensureCanRead()`
**Use when:** Read-only access is acceptable
```typescript
await ensureCanRead();
```

## Available Permissions

From `packages/auth/src/permissions.json`:

- `view_products`
- `add_to_cart`
- `checkout`
- `view_profile`
- `manage_profile`
- `change_password`
- `manage_cart`
- `view_orders`
- `manage_catalog`
- `manage_inventory`
- `manage_media`
- `manage_orders`
- `manage_pages`
- `manage_sessions`
- `process_returns`
- `manage_rentals`

## Migration Strategy

### Phase 1: Role-Based Endpoints (17 files) - COMPLETED

Replace manual `["admin", "ShopAdmin"]` checks with `ensureRole(['admin', 'ShopAdmin'])`:

**Priority High (Shop Management):**
- [x] `apps/cms/src/app/api/pages/[shop]/route.ts`
- [x] `apps/cms/src/app/api/configure-shop/[shop]/route.ts`
- [x] `apps/cms/src/app/api/shop-creation-state/[shop]/route.ts`
- [x] `apps/cms/src/app/api/launch-status/[shop]/route.ts`
- [x] `apps/cms/src/app/api/env/[shopId]/route.ts`
- [x] `apps/cms/src/app/api/configurator/init-shop/route.ts`

**Priority High (Content Management):**
- [x] `apps/cms/src/app/api/categories/[shop]/route.ts`
- [x] `apps/cms/src/app/api/page-draft/[shop]/route.ts`
- [x] `apps/cms/src/app/api/providers/shop/[shop]/route.ts`

**Priority Medium (Data Operations):**
- [x] `apps/cms/src/app/api/data/[shop]/return-logistics/route.ts`
- [x] `apps/cms/src/app/api/data/[shop]/inventory/[sku]/route.ts`
- [x] `apps/cms/src/app/api/data/[shop]/rental/pricing/route.ts`
- [x] `apps/cms/src/app/api/data/[shop]/inventory/import/route.ts`
- [x] `apps/cms/src/app/api/marketing/discounts/route.ts`

**Priority Low (Infrastructure):**
- [x] `apps/cms/src/app/api/configurator/validate-env/[shop]/route.ts`
- [x] `apps/cms/src/app/api/cloudflare/route.ts`

### Phase 2: Permission-Based Endpoints (Expand)
Consider converting role-based checks to permission-based where appropriate:

**Candidates for `manage_pages`:**
- `apps/cms/src/app/api/pages/[shop]/route.ts`
- `apps/cms/src/app/api/page-draft/[shop]/route.ts`
- `apps/cms/src/app/api/sections/[shop]/route.ts`

**Candidates for `manage_catalog`:**
- `apps/cms/src/app/api/categories/[shop]/route.ts`
- `apps/cms/src/app/api/providers/shop/[shop]/route.ts`

**Candidates for `manage_inventory`:**
- Already using permission-based checks

**Candidates for `manage_media`:**
- `apps/cms/src/app/api/upload-csv/[shop]/route.ts`

### Phase 3: Fix Logical Issues (2 files) - COMPLETED
- [x] `apps/cms/src/app/api/deploy-shop/route.ts` - Simplified to use `ensureRole()`
- [x] `apps/cms/src/app/api/configurator/deploy-shop/route.ts` - Simplified to use `ensureRole()`

### Phase 4: Add Missing Auth (Review)
Some endpoints have no auth on GET but require auth on POST/PATCH/DELETE:
- [ ] Review: `apps/cms/src/app/api/sections/[shop]/route.ts` - GET has no auth
- [ ] Review: `apps/cms/src/app/api/globals/route.ts` - GET has no auth

## Security Fixes Applied (2026-01-16)

### 1. Test Auth Bypass Fix
Added `NODE_ENV === 'test'` check to all test bypass conditions in auth utilities:
- `ensureAuthorized()` - Fixed
- `ensureCanRead()` - Fixed
- `ensureRole()` - Created with proper check

This prevents accidental bypass in production if `CMS_TEST_ASSUME_ADMIN=1` is accidentally set.

### 2. Rate Limiting Bypass Fix
Fixed header order priority in rate-limiting identity functions across 4 API routes:
- `apps/cover-me-pretty/src/app/api/ai/pose/route.ts`
- `apps/cover-me-pretty/src/app/api/ai/segment/route.ts`
- `apps/cover-me-pretty/src/app/api/ai/depth/route.ts`
- `apps/cover-me-pretty/src/app/api/tryon/garment/route.ts`

**Before:** `x-forwarded-for` was checked before `cf-connecting-ip` (spoofable)
**After:** `cf-connecting-ip` (CDN-verified) is checked first, then falls back to `x-forwarded-for`

## Migration Pattern

### Before (Pattern 2 - Manual Check):
```typescript
export async function POST(req: NextRequest, context: { params: Promise<{ shop: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "ShopAdmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // ... rest of handler
}
```

### After (Standardized):
```typescript
import { ensureRole } from "@cms/actions/common/auth";

export async function POST(req: NextRequest, context: { params: Promise<{ shop: string }> }) {
  await ensureRole(['admin', 'ShopAdmin']);
  // ... rest of handler
}
```

### Alternative (Permission-Based):
```typescript
import { ensureHasPermission } from "@cms/actions/common/auth";

export async function POST(req: NextRequest, context: { params: Promise<{ shop: string }> }) {
  await ensureHasPermission('manage_pages');
  // ... rest of handler
}
```

## Benefits

1. **Consistency** - All endpoints use the same authorization pattern
2. **DRY** - Eliminates 17+ instances of duplicated role checking logic
3. **Type Safety** - Uses `Role` type from `@auth/types` instead of strings
4. **Maintainability** - Authorization logic centralized in one place
5. **Test Support** - Built-in mock session support for testing
6. **RBAC Ready** - Easy to migrate from role-based to permission-based checks

## Testing Strategy

For each migrated endpoint:
1. Verify authenticated access still works
2. Verify unauthorized access is properly rejected
3. Verify role restrictions work correctly
4. Run existing test suite for the endpoint

## Progress Tracking

- **Phase 1:** 17/17 files migrated (COMPLETED 2026-01-16)
- **Phase 2:** 0 endpoints converted to permission-based (pending future work)
- **Phase 3:** 2/2 logical issues fixed (COMPLETED 2026-01-16)
- **Phase 4:** 0 endpoints reviewed (pending future work)

## Related Files

- [`apps/cms/src/actions/common/auth.ts`](../apps/cms/src/actions/common/auth.ts) - Authorization utilities
- [`packages/auth/src/permissions.json`](../packages/auth/src/permissions.json) - Permission definitions
- [`packages/auth/src/roles.json`](../packages/auth/src/roles.json) - Role definitions
- [`docs/security-audit-2026-01.md`](./security-audit-2026-01.md) - Security audit report

## Next Steps

1. ~~Begin Phase 1 migration with high-priority shop management endpoints~~ DONE
2. ~~Run tests after each file migration~~ DONE
3. Consider adding new permissions for CMS-specific operations (Phase 2)
4. Document any endpoints that need special authorization logic
5. Review Phase 4 endpoints for missing auth on GET routes
