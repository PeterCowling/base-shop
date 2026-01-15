# API Validation Migration Status

Track the progress of migrating API endpoints to use the validation infrastructure.

**Last Updated**: 2026-01-12

## Summary

- **Total Endpoints**: 97 route files
- **Migrated**: 7 endpoints (18 HTTP methods)
- **Remaining**: 90 endpoints
- **Coverage**: ~7.2%

## Migration Progress

### ✅ Completed (7 endpoints)

| Endpoint | Methods | Priority | Notes |
|----------|---------|----------|-------|
| `/api/campaigns` | POST | High | Email campaigns - had NO validation |
| `/api/categories/[shop]` | POST | High | Category trees - had NO validation |
| `/api/checkout-page/[shop]` | GET, POST | High | Checkout page management |
| `/api/library` | GET, POST, PATCH, DELETE | High | Component library CRUD |
| `/api/media` | GET, POST, PATCH, DELETE | High | Media management |
| `/api/pages/[shop]` | GET, POST | High | Page creation & listing |
| `/api/products` | GET | Medium | Product search (read-only) |

### 🔄 In Progress (0 endpoints)

None currently.

### 📋 Planned - High Priority (15 endpoints)

These endpoints handle sensitive operations or had weak validation:

| Endpoint | Methods | Why High Priority |
|----------|---------|-------------------|
| `/api/create-shop` | POST | Shop creation - critical security |
| `/api/launch-shop` | POST, PUT | Shop deployment - already validated |
| `/api/deploy-shop` | POST, PUT | Shop publishing - already validated |
| `/api/configure-shop/[shop]` | POST | Shop config - already validated |
| `/api/configurator/deploy-shop` | POST, PUT | Configurator deployment - already validated |
| `/api/sections/[shop]` | GET, POST, PATCH, DELETE | Section templates - already validated |
| `/api/page/[shop]` | POST | Page creation - needs response validation |
| `/api/pages/[shop]/[id]` | GET, PATCH, DELETE | Page operations - complex endpoint |
| `/api/products/[shop]/[id]` | GET, PATCH, DELETE | Product CRUD |
| `/api/data/[shop]/inventory/[sku]` | GET, PATCH | Inventory management - already validated |
| `/api/data/[shop]/rental/pricing` | GET, POST | Pricing config - already validated |
| `/api/rbac/users` | GET, POST, PATCH, DELETE | User management - security critical |
| `/api/auth/[...nextauth]` | ALL | Authentication - handled by NextAuth |
| `/api/comments/[shop]/[pageId]` | GET, POST, DELETE | Comments CRUD |
| `/api/configurator-progress` | GET, POST, PATCH | Configurator state |

### 📝 Planned - Medium Priority (30 endpoints)

Standard CRUD operations with existing validation:

| Category | Count | Examples |
|----------|-------|----------|
| Shop Data | 8 | `/api/data/[shop]/*` routes |
| Product Management | 5 | `/api/products/*` routes |
| Page Management | 6 | `/api/pages/*` routes |
| Section Management | 4 | `/api/sections/[shop]/*` routes |
| Template Management | 3 | `/api/templates/*` routes |
| Other | 4 | Various utility endpoints |

### 📊 Planned - Low Priority (48 endpoints)

Utility, dev, or rarely-used endpoints:

| Category | Count | Examples |
|----------|-------|----------|
| Internal Tools | 15 | Dev utilities, testing endpoints |
| Smoke Tests | 5 | `/api/launch-shop/smoke`, QA endpoints |
| Webhooks | 8 | Stripe, external integrations |
| Analytics | 5 | Tracking, metrics |
| Other | 15 | Misc utilities |

## Migration Phases

### Phase 1: Security Critical ✓ (Completed)

Endpoints with no validation or handling sensitive data:
- ✅ `/api/campaigns` - Email sending
- ✅ `/api/categories/[shop]` - Data structure
- 🔄 `/api/create-shop` - Shop creation (next)
- 🔄 `/api/rbac/users` - User management (next)

### Phase 2: High-Traffic Endpoints (In Progress)

Most-used endpoints that benefit from response validation:
- ✅ `/api/library` - Component library
- ✅ `/api/media` - Media management
- ✅ `/api/pages/[shop]` - Page listing
- ✅ `/api/products` - Product search
- 🔄 `/api/products/[shop]/[id]` - Product details
- 🔄 `/api/pages/[shop]/[id]` - Page operations

### Phase 3: Shop Management (Planned)

Already have body validation, need response validation:
- ✅ `/api/checkout-page/[shop]` - Checkout config
- 🔄 `/api/launch-shop` - Shop deployment
- 🔄 `/api/deploy-shop` - Shop publishing
- 🔄 `/api/configure-shop/[shop]` - Shop settings

### Phase 4: CRUD Operations (Planned)

Standard CRUD endpoints:
- 🔄 `/api/data/[shop]/*` - Various data endpoints
- 🔄 `/api/sections/[shop]/*` - Section management
- 🔄 `/api/comments/*` - Comments
- 🔄 `/api/templates/*` - Templates

### Phase 5: Utilities & Internal (Future)

Low-priority internal tools:
- 🔄 Dev utilities
- 🔄 Smoke tests
- 🔄 Webhooks (may skip - external format)
- 🔄 Analytics (may skip - logging)

## Next Recommended Endpoints

Based on priority and impact, migrate these next:

### Batch 1: User Management (Critical)
1. `/api/rbac/users` (GET, POST, PATCH, DELETE)
2. `/api/create-shop` (POST)

### Batch 2: Product CRUD
3. `/api/products/[shop]/[id]` (GET, PATCH, DELETE)
4. `/api/products/[shop]/slugs` (GET)

### Batch 3: Page Operations
5. `/api/pages/[shop]/[id]` (GET, PATCH, DELETE)
6. `/api/page/[shop]` (POST) - needs response validation

### Batch 4: Shop Management
7. `/api/launch-shop` (POST, PUT) - add response validation
8. `/api/deploy-shop` (POST, PUT) - add response validation
9. `/api/configure-shop/[shop]` (POST) - add response validation

## Statistics by HTTP Method

| Method | Total | Migrated | Remaining |
|--------|-------|----------|-----------|
| GET | ~35 | 4 | ~31 |
| POST | ~30 | 7 | ~23 |
| PATCH | ~20 | 4 | ~16 |
| DELETE | ~12 | 3 | ~9 |
| PUT | ~5 | 0 | ~5 |

## Benefits by Endpoint Type

### Already Validated (Body Only)
These already have `validateBody` but need `validateResponse`:
- `/api/launch-shop`
- `/api/deploy-shop`
- `/api/configure-shop/[shop]`
- `/api/configurator/deploy-shop`
- `/api/sections/[shop]`
- `/api/data/[shop]/inventory/[sku]`
- `/api/data/[shop]/rental/pricing`

**Effort**: Low (just add response schemas)
**Impact**: Medium (completes end-to-end validation)

### No Validation
These have no validation at all:
- `/api/rbac/users`
- `/api/comments/[shop]/[pageId]`
- `/api/configurator-progress`
- Many utility endpoints

**Effort**: High (need both body and response schemas)
**Impact**: High (major security improvement)

### Mixed Validation
These have some manual validation but not standardized:
- `/api/products/[shop]/[id]`
- `/api/pages/[shop]/[id]`
- Various data endpoints

**Effort**: Medium (standardize existing validation)
**Impact**: High (type safety + consistency)

## Migration Velocity

| Week | Endpoints Migrated | Cumulative |
|------|-------------------|------------|
| Week 1 | 7 | 7 (7.2%) |
| Week 2 (goal) | 8 | 15 (15.5%) |
| Week 3 (goal) | 10 | 25 (25.8%) |
| Week 4 (goal) | 10 | 35 (36.1%) |

At this velocity:
- 50% coverage: ~5 weeks
- 80% coverage: ~10 weeks
- 100% coverage: ~13 weeks

## Skip Candidates

Some endpoints may not need full validation:

### Authentication Routes
- `/api/auth/[...nextauth]` - Handled by NextAuth.js
- **Recommendation**: Skip

### Webhooks
- `/api/webhooks/stripe` - External format, rarely changes
- `/api/webhooks/*` - External integrations
- **Recommendation**: Light validation only

### Internal Tools
- `/api/dev/*` - Development utilities
- `/api/smoke/*` - Test endpoints
- **Recommendation**: Low priority, skip if time-constrained

### Simple Proxies
- Endpoints that just proxy to another service
- **Recommendation**: Validate inputs, skip response validation

## Testing Strategy

For each migrated endpoint:

1. **Unit Tests**: Validate schema parsing
2. **Integration Tests**: Test full request/response cycle
3. **Error Cases**: Test validation failures
4. **Type Tests**: Verify TypeScript inference
5. **Performance**: Ensure validation overhead is minimal

## Documentation Updates

For each batch:

1. Update this status tracker
2. Add types to `apiTypes.ts`
3. Add client examples to `apiClient.example.ts`
4. Update main documentation if patterns change

## Notes

- Focus on security-critical endpoints first
- Batch similar endpoints together for efficiency
- Some endpoints already have body validation from Phase 1 (previous work)
- Response validation is the main gap for most endpoints
- Type generation happens automatically once schemas are in place

---

**Legend**:
- ✅ Completed
- 🔄 In Progress / Planned
- ⏸️ Paused
- ⏭️ Skipped
- ❌ Blocked

**Priority Levels**:
- **High**: Security-critical, high-traffic, or no validation
- **Medium**: Standard CRUD with some validation
- **Low**: Utilities, internal tools, rarely used
