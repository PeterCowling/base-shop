# Telemetry System Deployment Guide

This guide covers the deployment and configuration of the internal telemetry and error tracking system.

## Overview

The telemetry system consists of:
- **@acme/telemetry** - SDK for tracking events and errors
- **telemetry-worker** - Cloudflare Worker for ingestion and storage
- **CMS Telemetry UI** - Dashboard for viewing and analyzing events
- **Shop Integrations** - ErrorBoundary and instrumentation in all apps

## Prerequisites

- Cloudflare account with Workers and D1 access
- Wrangler CLI installed (`npm install -g wrangler`)
- Access to Cloudflare dashboard
- PostgreSQL database (for CMS)

## Part 1: Deploy Telemetry Worker

### 1.1 Create D1 Database

```bash
cd apps/telemetry-worker

# Create production database
wrangler d1 create telemetry-production

# Note the database_id from output, you'll need it for wrangler.toml
```

Update `apps/telemetry-worker/wrangler.toml` with your database ID:

```toml
[[d1_databases]]
binding = "DB"
database_name = "telemetry-production"
database_id = "YOUR_DATABASE_ID_HERE"
```

### 1.2 Run Migrations

```bash
# Apply database schema
wrangler d1 execute telemetry-production --file=./db/migrations/0001_init.sql
```

### 1.3 Configure Environment

Update `wrangler.toml` environment variables:

```toml
[env.production.vars]
ALLOWED_ORIGINS = "https://yourdomain.com,https://cms.yourdomain.com"
RETENTION_DAYS = "90"
```

For development:
```toml
[env.dev.vars]
ALLOWED_ORIGINS = "http://localhost:3006,http://localhost:3000"
RETENTION_DAYS = "30"
```

### 1.4 Deploy Worker

```bash
# Deploy to production
pnpm run deploy

# Or deploy to dev environment
wrangler deploy --env dev
```

Your worker will be available at: `https://telemetry-worker.YOUR_SUBDOMAIN.workers.dev`

### 1.5 Configure Custom Domain (Optional)

In Cloudflare dashboard:
1. Go to Workers & Pages
2. Select your telemetry-worker
3. Go to Settings > Triggers > Custom Domains
4. Add custom domain: `telemetry.yourdomain.com`

## Part 2: Configure Applications

### 2.1 Environment Variables

Add to `.env.local` for each application (CMS and all shops):

```bash
# Telemetry Configuration
NEXT_PUBLIC_TELEMETRY_ENDPOINT=https://telemetry.yourdomain.com/v1/telemetry
NEXT_PUBLIC_ENABLE_TELEMETRY=true
NEXT_PUBLIC_TELEMETRY_SAMPLE_RATE=1.0
```

**Environment-specific settings:**

**Development:**
```bash
NEXT_PUBLIC_TELEMETRY_ENDPOINT=http://localhost:8787/v1/telemetry
NEXT_PUBLIC_ENABLE_TELEMETRY=true
NEXT_PUBLIC_TELEMETRY_SAMPLE_RATE=1.0
```

**Staging:**
```bash
NEXT_PUBLIC_TELEMETRY_ENDPOINT=https://telemetry-dev.yourdomain.workers.dev/v1/telemetry
NEXT_PUBLIC_ENABLE_TELEMETRY=true
NEXT_PUBLIC_TELEMETRY_SAMPLE_RATE=0.5
```

**Production:**
```bash
NEXT_PUBLIC_TELEMETRY_ENDPOINT=https://telemetry.yourdomain.com/v1/telemetry
NEXT_PUBLIC_ENABLE_TELEMETRY=true
NEXT_PUBLIC_TELEMETRY_SAMPLE_RATE=0.1
```

### 2.2 Verify Instrumentation

Each shop application should have:

1. **instrumentation.ts** - Server-side error capture
2. **ErrorBoundary in layout** - Client-side error capture
3. **@acme/telemetry path mapping** in tsconfig.json

Verify files exist:
```bash
# Check instrumentation files
ls apps/*/instrumentation.ts

# Expected output:
# apps/brikette/instrumentation.ts
# apps/cms/instrumentation.ts
# apps/cochlearfit/instrumentation.ts
# apps/cover-me-pretty/instrumentation.ts
# apps/skylar/instrumentation.ts
# apps/xa/instrumentation.ts
```

### 2.3 Build and Deploy Applications

```bash
# Build all applications
pnpm build

# Deploy each application to your hosting platform
# (Cloudflare Pages, Vercel, etc.)
```

## Part 3: CMS Configuration

### 3.1 Update CMS Environment

Add to `apps/cms/.env.local`:

```bash
# Telemetry Worker endpoint (same as other apps)
NEXT_PUBLIC_TELEMETRY_ENDPOINT=https://telemetry.yourdomain.com/v1/telemetry
NEXT_PUBLIC_ENABLE_TELEMETRY=true

# CMS-specific: used for fetching events in UI
TELEMETRY_API_ENDPOINT=https://telemetry.yourdomain.com/v1/telemetry
```

### 3.2 Verify CMS UI Access

1. Start CMS: `pnpm --filter @apps/cms dev`
2. Navigate to: `http://localhost:3006/cms/telemetry`
3. Verify filters and presets load correctly
4. Test error presets: "All errors", "Fatal errors", "Recent errors"

## Part 4: Testing

### 4.1 Test Error Capture

**Server-side test:**

Add temporary code to any shop's `instrumentation.ts`:

```typescript
export async function register(): Promise<void> {
  // Test error after 5 seconds
  setTimeout(() => {
    void captureError(new Error("Test server error"), {
      app: "brikette",
      env: process.env.NODE_ENV,
      level: "error",
    });
  }, 5000);
}
```

**Client-side test:**

Add temporary code to any page:

```typescript
'use client'

export default function TestPage() {
  const triggerError = () => {
    throw new Error("Test client error");
  };

  return <button onClick={triggerError}>Trigger Error</button>;
}
```

### 4.2 Verify Worker Ingestion

Check worker logs:
```bash
wrangler tail telemetry-worker
```

You should see:
```
POST /v1/telemetry - 200 OK
Inserted 1 events
```

### 4.3 Verify CMS Dashboard

1. Navigate to CMS Telemetry: `/cms/telemetry`
2. Apply "Recent errors" preset
3. Verify test errors appear
4. Check error details include:
   - Error name and message
   - Stack trace
   - App name
   - Timestamp
   - Fingerprint (for grouping)

### 4.4 Test CORS

From browser console on your shop domain:

```javascript
fetch('https://telemetry.yourdomain.com/v1/telemetry', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify([{
    name: "test_event",
    ts: Date.now(),
    payload: { test: true }
  }])
}).then(r => console.log(r.status)); // Should log 200
```

## Part 5: Monitoring

### 5.1 Worker Metrics

Monitor in Cloudflare Dashboard:
- Workers & Pages > telemetry-worker > Metrics
- Track: Requests, Errors, Duration, D1 queries

### 5.2 D1 Database Metrics

- Workers & Pages > D1 > telemetry-production
- Track: Storage usage, Query performance

### 5.3 CMS Telemetry Dashboard

Use built-in presets:
- **All errors** - Monitor error rate
- **Fatal errors** - Critical issues requiring immediate attention
- **Recent errors** - Last 24 hours error trends
- **Build flow** - Track deployment pipeline errors
- **Time to launch** - Monitor performance metrics

### 5.4 Retention Cleanup

Automatic daily cleanup runs at midnight UTC via scheduled worker.

To manually trigger:
```bash
wrangler d1 execute telemetry-production --command="
DELETE FROM telemetry_events
WHERE created_at < unixepoch() - (90 * 86400)
"
```

## Part 6: Security

### 6.1 CORS Configuration

Update `ALLOWED_ORIGINS` in `wrangler.toml` to include only your domains:

```toml
[env.production.vars]
ALLOWED_ORIGINS = "https://brikette.com,https://skylar.com,https://cms.yourdomain.com"
```

### 6.2 Rate Limiting

Worker includes built-in limits:
- Max payload size: 1MB
- Max batch size: 100 events
- Max event name length: 200 chars

### 6.3 PII Protection

The SDK automatically sanitizes context:
- Only allowlisted fields are captured
- No automatic credential/token capture
- Stack traces are preserved for debugging

Review allowed context fields in `packages/telemetry/src/error.ts`:

```typescript
const ALLOWED_CONTEXT_KEYS = [
  'app', 'env', 'level', 'requestId', 'shopId',
  'url', 'componentStack', 'userId', 'sessionId'
];
```

## Part 7: Troubleshooting

### Error: "Failed to fetch telemetry events"

**Cause:** CORS or network issue

**Solution:**
1. Check `ALLOWED_ORIGINS` in `wrangler.toml`
2. Verify worker is deployed and accessible
3. Check browser console for CORS errors
4. Verify `NEXT_PUBLIC_TELEMETRY_ENDPOINT` is correct

### Error: "D1_ERROR: no such table: telemetry_events"

**Cause:** Database migration not run

**Solution:**
```bash
cd apps/telemetry-worker
wrangler d1 execute telemetry-production --file=./db/migrations/0001_init.sql
```

### No errors appearing in CMS

**Cause:** Telemetry disabled or endpoint misconfigured

**Solution:**
1. Check `NEXT_PUBLIC_ENABLE_TELEMETRY=true` in app `.env.local`
2. Verify `NEXT_PUBLIC_TELEMETRY_ENDPOINT` is set correctly
3. Check browser network tab for failed requests
4. Check worker logs: `wrangler tail telemetry-worker`

### Events not retained

**Cause:** Scheduled cleanup not running or retention too short

**Solution:**
1. Verify scheduled trigger in Cloudflare Dashboard
2. Increase `RETENTION_DAYS` in `wrangler.toml`
3. Redeploy worker: `pnpm run deploy`

### TypeScript errors in instrumentation.ts

**Cause:** Missing @acme/telemetry path mapping

**Solution:**
Add to app's `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@acme/telemetry": [
        "../../packages/telemetry/dist/index.d.ts",
        "../../packages/telemetry/src/index.ts"
      ]
    }
  }
}
```

## Part 8: Maintenance

### Update Schema

To add new fields to telemetry_events:

1. Create new migration file:
```bash
touch apps/telemetry-worker/db/migrations/0002_add_field.sql
```

2. Add migration SQL:
```sql
ALTER TABLE telemetry_events ADD COLUMN new_field TEXT;
CREATE INDEX idx_new_field ON telemetry_events(new_field);
```

3. Apply migration:
```bash
wrangler d1 execute telemetry-production --file=./db/migrations/0002_add_field.sql
```

### Backup D1 Database

```bash
# Export all events to JSON
wrangler d1 execute telemetry-production \
  --command="SELECT * FROM telemetry_events" \
  --json > telemetry-backup.json
```

### Monitor Costs

Cloudflare Free Tier includes:
- 100,000 Worker requests/day
- 5GB D1 storage
- 5 million D1 reads/day
- 100,000 D1 writes/day

Monitor usage in Cloudflare Dashboard to avoid overages.

## Part 9: Migration from Sentry

If migrating from Sentry:

1. **Keep Sentry active** during initial rollout
2. **Deploy telemetry-worker** and verify it's working
3. **Enable telemetry** in one shop app first (staging)
4. **Monitor both systems** for 1-2 weeks
5. **Compare error capture** between Sentry and telemetry
6. **Gradually enable** in remaining apps
7. **Remove Sentry SDK** once confident in telemetry coverage
8. **Cancel Sentry subscription**

To remove Sentry from CMS:
```bash
# Already done in Phase 2, but for reference:
pnpm --filter @apps/cms remove @sentry/nextjs
```

Remove from `next.config.mjs`:
```javascript
// Delete: import { withSentryConfig } from '@sentry/nextjs'
// Delete: withSentryConfig wrapper
```

## Part 10: Advanced Configuration

### Custom Error Grouping

Edit `packages/telemetry/src/error.ts` to customize fingerprinting:

```typescript
// Current: name + message + top stack frame
// Alternative: name + message only (groups similar errors)
const fingerprintData = `${name}:${message}`;
```

### Sample Rate by Environment

In app `.env.*` files:
```bash
# Development: capture everything
NEXT_PUBLIC_TELEMETRY_SAMPLE_RATE=1.0

# Staging: capture 50%
NEXT_PUBLIC_TELEMETRY_SAMPLE_RATE=0.5

# Production: capture 10% (high traffic)
NEXT_PUBLIC_TELEMETRY_SAMPLE_RATE=0.1
```

### Custom Context Fields

To add new context fields, update both:

1. `packages/telemetry/src/error.ts` - Add to `ALLOWED_CONTEXT_KEYS`
2. `apps/telemetry-worker/src/types.ts` - Add to `TelemetryEvent` interface

### Query API Authentication

To secure the query endpoint, add authentication:

```typescript
// apps/telemetry-worker/src/endpoints.ts
export async function handleGet(request: Request, env: Env): Promise<Response> {
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${env.TELEMETRY_API_KEY}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  // ... rest of handler
}
```

Add `TELEMETRY_API_KEY` to wrangler.toml and CMS environment.

## Summary

You've now deployed a complete internal telemetry and error tracking system:

✅ Telemetry worker deployed to Cloudflare
✅ D1 database configured and migrated
✅ All shop apps instrumented
✅ CMS telemetry UI updated
✅ Error tracking active across all applications

For support, check:
- Worker logs: `wrangler tail telemetry-worker`
- CMS dashboard: `/cms/telemetry`
- This documentation: `docs/telemetry-deployment.md`
