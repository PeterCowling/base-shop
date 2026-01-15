# Rate Limiting Implementation

**Date:** 2026-01-12
**Status:** Complete
**Related:** `docs/security-audit-2026-01.md`

## Overview

Implemented comprehensive rate limiting across all critical CMS API endpoints to protect against abuse, DoS attacks, and resource exhaustion. This addresses High Priority Item #4 from the security audit.

## Implementation Details

### Infrastructure Created

**New Files:**
- [`apps/cms/src/lib/server/rateLimiter.ts`](../apps/cms/src/lib/server/rateLimiter.ts) - Rate limiting utilities and pre-configured limiters

**Package Updates:**
- [`packages/auth/src/index.ts`](../packages/auth/src/index.ts) - Exported `createRateLimiter` and `RateLimiter` type

### Rate Limiter Configurations

Created 5 pre-configured rate limiters for different operation types:

| Limiter | Limit | Duration | Use Case |
|---------|-------|----------|----------|
| `shopCreationLimiter` | 3 requests | 5 minutes | Shop creation/deployment operations |
| `inventoryLimiter` | 20 requests | 1 minute | Inventory import/update operations |
| `commentLimiter` | 30 requests | 1 minute | Comment creation/update operations |
| `uploadLimiter` | 10 requests | 1 minute | File upload operations (CSV, images) |
| `writeOperationLimiter` | 50 requests | 1 minute | General write operations |

### Helper Functions

**`getClientIp(req: Request): string`**
- Extracts client IP from request headers
- Respects `X-Forwarded-For` for proxied requests
- Falls back to `X-Real-IP` or "unknown"

**`applyRateLimit(limiter: RateLimiter, req: Request, key?: string): Promise<void>`**
- Applies rate limiting to a request
- Automatically skips in test environment
- Throws `rate_limit_exceeded` error when limit reached
- Supports optional key suffix for per-resource limiting

## Endpoints Protected

### Shop Creation/Deployment (5 endpoints)

**Very Restrictive: 3 requests per 5 minutes**

1. ✅ [`apps/cms/src/app/api/configurator/init-shop/route.ts`](../apps/cms/src/app/api/configurator/init-shop/route.ts) (POST)
2. ✅ [`apps/cms/src/app/api/deploy-shop/route.ts`](../apps/cms/src/app/api/deploy-shop/route.ts) (POST)
3. ✅ [`apps/cms/src/app/api/configurator/deploy-shop/route.ts`](../apps/cms/src/app/api/configurator/deploy-shop/route.ts) (POST)
4. ✅ [`apps/cms/src/app/api/launch-shop/route.ts`](../apps/cms/src/app/api/launch-shop/route.ts) (POST)
5. ✅ [`apps/cms/src/app/api/cloudflare/route.ts`](../apps/cms/src/app/api/cloudflare/route.ts) (POST)

**Rationale:** These operations are resource-intensive, involve external services (Cloudflare, deployment pipelines), and should be infrequent. A very restrictive limit prevents abuse while allowing legitimate usage.

### Inventory Operations (1 endpoint)

**Moderate: 20 requests per minute**

1. ✅ [`apps/cms/src/app/api/data/[shop]/inventory/import/route.ts`](../apps/cms/src/app/api/data/[shop]/inventory/import/route.ts) (POST)

**Rationale:** Bulk inventory imports can be large and database-intensive. The moderate limit allows legitimate batch updates while preventing system overload.

### Comment Operations (1 endpoint)

**Moderate: 30 requests per minute**

1. ✅ [`apps/cms/src/app/api/comments/[shop]/[pageId]/route.ts`](../apps/cms/src/app/api/comments/[shop]/[pageId]/route.ts) (POST)

**Rationale:** Comment creation involves file I/O and can be used for spam. The moderate limit allows active collaboration while preventing abuse.

### File Upload Operations (1 endpoint)

**Restrictive: 10 requests per minute**

1. ✅ [`apps/cms/src/app/api/upload-csv/[shop]/route.ts`](../apps/cms/src/app/api/upload-csv/[shop]/route.ts) (POST)

**Rationale:** File uploads consume bandwidth and storage. The restrictive limit prevents resource exhaustion while allowing normal file management workflows.

## Usage Pattern

All protected endpoints follow the same pattern:

```typescript
import { applyRateLimit, shopCreationLimiter } from "@/lib/server/rateLimiter";

export async function POST(req: Request) {
  try {
    await ensureRole(['admin', 'ShopAdmin']);
    await applyRateLimit(shopCreationLimiter, req);

    // ... rest of handler
  } catch (err) {
    if ((err as Error).message === "rate_limit_exceeded") {
      return NextResponse.json(
        { error: "Too Many Requests" },
        { status: 429 }
      );
    }
    // ... other error handling
  }
}
```

## Storage Backend

Rate limiting uses the existing `rate-limiter-flexible` library with support for:

1. **Memory Storage (default)** - Fast, single-instance, suitable for development
2. **KV Storage** - Distributed, production-ready (Cloudflare Workers KV)
3. **Redis** - Future enhancement for distributed deployments

The implementation automatically selects the appropriate backend based on:
- `RATE_LIMIT_STORE_PROVIDER` environment variable
- Availability of KV binding (`LOGIN_RATE_LIMIT_KV`)

## Error Handling

When rate limit is exceeded:
- **HTTP Status:** 429 Too Many Requests
- **Error Message:** `"rate_limit_exceeded"` (internal) or `"Too Many Requests"` (user-facing)
- **Behavior:** Request is rejected before processing

Rate limits are applied **after authentication** but **before** resource-intensive operations, ensuring:
1. Only authenticated users count toward limits
2. Failed auth attempts don't consume rate limit quota
3. Resource exhaustion is prevented early

## Testing Considerations

- Rate limiting is **automatically disabled** in test environment (`NODE_ENV === "test"`)
- No test code changes required
- Existing tests continue to work without modification

## Security Benefits

1. **DoS Protection** - Prevents resource exhaustion attacks
2. **Brute Force Prevention** - Limits repeated attempts on write operations
3. **Resource Management** - Controls server load from expensive operations
4. **Spam Prevention** - Limits comment/upload spam
5. **Fair Usage** - Ensures resources are shared fairly among users

## Future Enhancements

### Potential Improvements

1. **Per-User Limits** - Track limits by user ID instead of IP
2. **Dynamic Limits** - Adjust limits based on system load
3. **Redis Backend** - For multi-instance deployments
4. **Monitoring** - Track rate limit hits in telemetry
5. **Allowlisting** - Bypass limits for trusted IPs/users
6. **Graceful Degradation** - Return estimated wait time in 429 responses

### Additional Endpoints to Consider

While all critical write operations are now protected, future work could add rate limiting to:
- Read-heavy endpoints (if abuse detected)
- Search/query endpoints
- Export operations
- Report generation endpoints

## Related Documentation

- [Security Audit Report](./security-audit-2026-01.md) - Original audit identifying this need
- [Authorization Standardization](./auth-standardization-2026-01.md) - Related security work
- [Auth Package Rate Limiter](../packages/auth/src/rateLimiter.ts) - Core implementation

## Verification

To verify rate limiting is working:

```bash
# Test shop creation rate limit (should fail on 4th request within 5 minutes)
for i in {1..4}; do
  curl -X POST http://localhost:3006/api/configurator/init-shop \
    -H "Content-Type: application/json" \
    -H "Cookie: $AUTH_COOKIE" \
    -d '{"id":"test-shop-'$i'"}' \
    && echo "\nRequest $i: Success" \
    || echo "\nRequest $i: Failed"
done

# Test comment rate limit (should fail on 31st request within 1 minute)
for i in {1..31}; do
  curl -X POST http://localhost:3006/api/comments/test/page-1 \
    -H "Content-Type: application/json" \
    -H "Cookie: $AUTH_COOKIE" \
    -d '{"componentId":"comp-1","text":"Test comment '$i'"}' \
    && echo "\nRequest $i: Success" \
    || echo "\nRequest $i: Failed"
done
```

## Summary

✅ **8 critical endpoints** now protected with rate limiting
✅ **5 rate limiter configurations** tailored to operation types
✅ **Zero breaking changes** - tests unaffected, backward compatible
✅ **Production-ready** - supports multiple storage backends
✅ **Well-documented** - clear usage patterns and examples

Rate limiting implementation is complete and ready for production deployment.
