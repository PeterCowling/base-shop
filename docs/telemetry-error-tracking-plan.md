# Telemetry Error Tracking Implementation Plan

**Status:** Planning
**Created:** 2026-01-12
**Owner:** Engineering Team
**Approach:** Option B - All Apps Coverage

---

## Executive Summary

Extend `@acme/telemetry` into a lightweight internal error tracker with Cloudflare Worker + D1 storage. This replaces Sentry with a zero-cost, privacy-friendly solution that covers CMS + all shop apps (brikette, skylar, cochlearfit, xa, cover-me-pretty).

### Key Goals

- ✅ Zero-cost error tracking (no Sentry subscription)
- ✅ Full coverage: CMS + all shop apps
- ✅ Privacy-first: PII sanitization built-in
- ✅ Backwards compatible with existing telemetry usage
- ✅ Centralized visibility via CMS telemetry UI
- ✅ Long-term storage in Cloudflare D1

---

## Architecture Overview

```
┌─────────────────┐
│  Shop Apps      │
│  (brikette,     │
│   skylar, etc)  │
└────────┬────────┘
         │
         │ captureError()
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│  @acme/         │      │  CMS App         │
│  telemetry      │◄─────┤  (instrumentation│
│  (SDK)          │      │   ErrorBoundary) │
└────────┬────────┘      └──────────────────┘
         │
         │ POST /v1/telemetry
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│  telemetry-     │      │  Cloudflare D1   │
│  worker         │─────►│  (Long-term      │
│  (Ingestion)    │      │   Storage)       │
└────────┬────────┘      └──────────────────┘
         │
         │ GET /v1/telemetry
         │
         ▼
┌─────────────────┐
│  CMS Telemetry  │
│  UI             │
│  (Visualization)│
└─────────────────┘
```

---



## Phase 1: Telemetry SDK (current implementation)

**Location:** `packages/telemetry/src/`

- `TelemetryEvent` already includes error metadata (`kind`, `level`, `fingerprint`, `message`, `stack`) plus contextual fields such as `app`, `env`, `requestId`, `shopId`, and `url`. The shared shape is defined in `packages/telemetry/src/index.ts`.
- `captureError` is fully implemented: it normalizes the error, awaits `generateFingerprint`, sanitizes the context, trims stacks to 20 lines, and pushes the event to the buffer (bypassing sampling) only if `ENABLED` is true while respecting offline/`navigator.onLine` state.
- `fingerprint.ts` already hashes `error.name:message:topFrame` via Web Crypto and truncates to 16 hex characters for lightweight IDs. `trimStack` lives next to it and caps stack traces to a manageable length.
- `sanitize.ts` maintains an allowlist, truncates strings >1 000 chars, and hashes `userId`/`sessionId` for privacy before forwarding.
- Jest-based tests (`packages/telemetry/src/__tests__/captureError.test.ts`) exercise buffer behavior, fingerprint stability, sanitization, and the `ENABLED` guard (note the `webcrypto` polyfill in the setup).

**Next steps**

1. Keep the Jest tests in sync when modifying `captureError`, particularly around global `crypto`.
2. Extend the sanitize allowlist before sending new context keys to avoid inadvertent PII leaks.

---

## Phase 2: CMS Instrumentation (already wired)

**Location:** `apps/cms/src/`

- `apps/cms/src/utils/sentry.server.ts` now proxies to `captureError`, merging `getRequestContext()` metadata and keeping the previous `CaptureContext` type for backwards compatibility.
- `apps/cms/src/components/ErrorBoundary.tsx` reports errors through telemetry with the CMS app tag, component stack, and URL while preserving dev-time console logging.
- `apps/cms/instrumentation.ts` registers `uncaughtException` and `unhandledRejection` listeners that send fatal/error-level telemetry and still log to the console for operations.

**Next steps**

1. Confirm instrumentation runs early enough in the CMS bootstrapping path and tolerates Next's HMR reloads.
2. Validate `getRequestContext()` data is available when instrumentation captures server-side errors.

---

## Phase 3: Cloudflare Worker

**Location:** `apps/telemetry-worker/`
**Effort:** 2-3 days

### 3.1 Directory Structure

```
apps/telemetry-worker/
├── wrangler.toml
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts           # Main fetch handler
│   ├── endpoints.ts       # Route handlers
│   ├── validation.ts      # Payload validation
│   ├── storage.ts         # D1 operations
│   ├── cors.ts            # CORS helpers
│   └── scheduled.ts       # Retention cleanup
├── db/
│   └── migrations/
│       └── 0001_init.sql
└── __tests__/
    └── worker.test.ts
```

### 3.2 Worker Configuration

**File:** `apps/telemetry-worker/wrangler.toml`

```toml
name = "telemetry-worker"
main = "src/index.ts"
compatibility_date = "2025-12-26"

[vars]
# Comma-separated list of allowed origins for CORS
TELEMETRY_ALLOWED_ORIGINS = "https://cms.example.com,http://localhost:3006"

# Days to retain telemetry data (default: 90)
RETENTION_DAYS = "90"

# Optional: require auth token for POST
# TELEMETRY_AUTH_TOKEN = ""

[[d1_databases]]
binding = "DB"
database_name = "telemetry"
database_id = "" # Created via: wrangler d1 create telemetry

# Scheduled cleanup (daily at 3am UTC)
[triggers]
crons = ["0 3 * * *"]
```

### 3.3 D1 Schema

**File:** `apps/telemetry-worker/db/migrations/0001_init.sql`

```sql
-- Telemetry events table
CREATE TABLE telemetry_events (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL DEFAULT 'event',
  name TEXT NOT NULL,
  message TEXT,
  stack TEXT,
  fingerprint TEXT,
  level TEXT,
  ts INTEGER NOT NULL,
  app TEXT,
  env TEXT,
  request_id TEXT,
  shop_id TEXT,
  url TEXT,
  payload_json TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Indexes for common queries
CREATE INDEX idx_ts ON telemetry_events(ts);
CREATE INDEX idx_fingerprint_ts ON telemetry_events(fingerprint, ts) WHERE fingerprint IS NOT NULL;
CREATE INDEX idx_kind_ts ON telemetry_events(kind, ts);
CREATE INDEX idx_app_ts ON telemetry_events(app, ts) WHERE app IS NOT NULL;
CREATE INDEX idx_level_ts ON telemetry_events(level, ts) WHERE level IS NOT NULL;

-- Apply migration
-- Run: wrangler d1 execute telemetry --file=./db/migrations/0001_init.sql
```

### 3.4 Main Worker

**File:** `apps/telemetry-worker/src/index.ts`

```typescript
import { handlePost, handleGet, handleHealth } from './endpoints';
import { handleScheduled } from './scheduled';

export interface Env {
  DB: D1Database;
  TELEMETRY_ALLOWED_ORIGINS?: string;
  RETENTION_DAYS?: string;
  TELEMETRY_AUTH_TOKEN?: string;
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Health check
    if (request.method === 'GET' && url.pathname === '/health') {
      return handleHealth();
    }

    // POST /v1/telemetry - ingest events
    if (request.method === 'POST' && url.pathname === '/v1/telemetry') {
      return handlePost(request, env);
    }

    // GET /v1/telemetry - query events
    if (request.method === 'GET' && url.pathname === '/v1/telemetry') {
      return handleGet(request, env);
    }

    // OPTIONS for CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(request, env),
      });
    }

    return new Response('Not found', { status: 404 });
  },

  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    await handleScheduled(env);
  },
};

export default worker;
```

### 3.5 Endpoints Implementation

**File:** `apps/telemetry-worker/src/endpoints.ts`

```typescript
import type { Env } from './index';
import { validateEvents } from './validation';
import { insertEvents, queryEvents } from './storage';
import { getCorsHeaders, checkOrigin } from './cors';

export async function handlePost(
  request: Request,
  env: Env
): Promise<Response> {
  const corsHeaders = getCorsHeaders(request, env);

  // Check CORS origin
  if (!checkOrigin(request, env)) {
    return new Response('Forbidden', {
      status: 403,
      headers: corsHeaders,
    });
  }

  // Optional: Check auth token
  if (env.TELEMETRY_AUTH_TOKEN) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${env.TELEMETRY_AUTH_TOKEN}`) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  try {
    const body = await request.json();
    const events = Array.isArray(body) ? body : [body];

    // Validate size (<1MB) and shape
    const validation = validateEvents(events);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert to D1
    await insertEvents(env.DB, events);

    return new Response(JSON.stringify({ success: true, count: events.length }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function handleGet(
  request: Request,
  env: Env
): Promise<Response> {
  const corsHeaders = getCorsHeaders(request, env);

  if (!checkOrigin(request, env)) {
    return new Response('Forbidden', { status: 403, headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const params = {
      kind: url.searchParams.get('kind') || undefined,
      name: url.searchParams.get('name') || undefined,
      app: url.searchParams.get('app') || undefined,
      level: url.searchParams.get('level') || undefined,
      start: parseInt(url.searchParams.get('start') || '0') || undefined,
      end: parseInt(url.searchParams.get('end') || '0') || undefined,
      limit: Math.min(parseInt(url.searchParams.get('limit') || '100'), 1000),
      cursor: url.searchParams.get('cursor') || undefined,
    };

    const result = await queryEvents(env.DB, params);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export function handleHealth(): Response {
  return new Response(JSON.stringify({ ok: true, ts: Date.now() }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

### 3.6 Storage Operations

**File:** `apps/telemetry-worker/src/storage.ts`

```typescript
export async function insertEvents(
  db: D1Database,
  events: TelemetryEvent[]
): Promise<void> {
  const stmt = db.prepare(`
    INSERT INTO telemetry_events
    (id, kind, name, message, stack, fingerprint, level, ts, app, env, request_id, shop_id, url, payload_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const batch = events.map(event => {
    const id = crypto.randomUUID();
    return stmt.bind(
      id,
      event.kind || 'event',
      event.name,
      event.message || null,
      event.stack || null,
      event.fingerprint || null,
      event.level || null,
      event.ts,
      event.app || null,
      event.env || null,
      event.requestId || null,
      event.shopId || null,
      event.url || null,
      JSON.stringify(event.payload || {})
    );
  });

  await db.batch(batch);
}

export async function queryEvents(
  db: D1Database,
  params: QueryParams
): Promise<{ events: TelemetryEvent[]; cursor?: string }> {
  let sql = 'SELECT * FROM telemetry_events WHERE 1=1';
  const bindings: unknown[] = [];

  if (params.kind) {
    sql += ' AND kind = ?';
    bindings.push(params.kind);
  }
  if (params.name) {
    sql += ' AND name = ?';
    bindings.push(params.name);
  }
  if (params.app) {
    sql += ' AND app = ?';
    bindings.push(params.app);
  }
  if (params.level) {
    sql += ' AND level = ?';
    bindings.push(params.level);
  }
  if (params.start) {
    sql += ' AND ts >= ?';
    bindings.push(params.start);
  }
  if (params.end) {
    sql += ' AND ts <= ?';
    bindings.push(params.end);
  }
  if (params.cursor) {
    sql += ' AND ts < ?';
    bindings.push(parseInt(params.cursor));
  }

  sql += ' ORDER BY ts DESC LIMIT ?';
  bindings.push(params.limit);

  const result = await db.prepare(sql).bind(...bindings).all();

  const events = result.results.map(row => ({
    id: row.id,
    kind: row.kind,
    name: row.name,
    message: row.message,
    stack: row.stack,
    fingerprint: row.fingerprint,
    level: row.level,
    ts: row.ts,
    app: row.app,
    env: row.env,
    requestId: row.request_id,
    shopId: row.shop_id,
    url: row.url,
    payload: JSON.parse(row.payload_json),
  }));

  const cursor = events.length === params.limit
    ? String(events[events.length - 1].ts)
    : undefined;

  return { events, cursor };
}
```

### 3.7 CORS Configuration

**File:** `apps/telemetry-worker/src/cors.ts`

```typescript
import type { Env } from './index';

export function getCorsHeaders(request: Request, env: Env): HeadersInit {
  const origin = request.headers.get('origin') || '*';

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export function checkOrigin(request: Request, env: Env): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // Allow non-browser requests

  const allowedOrigins = env.TELEMETRY_ALLOWED_ORIGINS?.split(',') || [];

  // Allow any origin if not configured (dev mode)
  if (allowedOrigins.length === 0) return true;

  return allowedOrigins.some(allowed =>
    origin === allowed.trim() || allowed.trim() === '*'
  );
}
```

### 3.8 Scheduled Cleanup

**File:** `apps/telemetry-worker/src/scheduled.ts`

```typescript
import type { Env } from './index';

export async function handleScheduled(env: Env): Promise<void> {
  const retentionDays = parseInt(env.RETENTION_DAYS || '90');
  const cutoffTs = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);

  const result = await env.DB.prepare(
    'DELETE FROM telemetry_events WHERE ts < ?'
  ).bind(cutoffTs).run();

  console.log(`[scheduled] Pruned ${result.meta.changes} old events (older than ${retentionDays} days)`);
}
```

---

## Phase 4: Shop Apps Integration

**Location:** All shop apps
**Effort:** 1-2 days

### 4.1 Shared ErrorBoundary Component

**File:** `packages/ui/src/components/ErrorBoundary.tsx` (new)

```typescript
'use client';

import React from 'react';
import { captureError } from '@acme/telemetry';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  app: string; // Required: app identifier
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    captureError(error, {
      app: this.props.app,
      componentStack: errorInfo.componentStack,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    });

    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 text-center">
          <h1 className="text-2xl font-semibold mb-4">Something went wrong</h1>
          <button
            onClick={() => window.location.reload()}
            className="underline"
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 4.2 Shop Integration Template

**For each shop (brikette, skylar, cochlearfit, xa, cover-me-pretty):**

#### Step 1: Add Dependency

```bash
# Already added via tsconfig path mapping
# Just ensure package.json has it
pnpm --filter @apps/brikette add @acme/telemetry
```

#### Step 2: Add Instrumentation

**File:** `apps/brikette/instrumentation.ts` (new/update)

```typescript
import { captureError } from '@acme/telemetry';

export async function register(): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    console.log('[instrumentation] Brikette error tracking enabled');
  }

  process.on('uncaughtException', (err: unknown) => {
    const error = err instanceof Error ? err : new Error(String(err));
    captureError(error, {
      app: 'brikette',
      env: process.env.NODE_ENV,
      level: 'fatal',
    });
    console.error('[instrumentation] uncaughtException', error);
  });

  process.on('unhandledRejection', (reason: unknown) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    captureError(error, {
      app: 'brikette',
      env: process.env.NODE_ENV,
      level: 'error',
    });
    console.error('[instrumentation] unhandledRejection', error);
  });
}
```

#### Step 3: Use Shared ErrorBoundary

**File:** `apps/brikette/src/root.tsx` (or main layout)

```typescript
import { ErrorBoundary } from '@acme/ui/components/ErrorBoundary';

export function Root() {
  return (
    <ErrorBoundary app="brikette">
      {/* existing app content */}
    </ErrorBoundary>
  );
}
```

#### Step 4: Environment Configuration

**File:** `apps/brikette/.env.template`

```bash
# Telemetry worker endpoint
NEXT_PUBLIC_TELEMETRY_ENDPOINT=https://telemetry.example.workers.dev/v1/telemetry

# Enable telemetry in production
NEXT_PUBLIC_ENABLE_TELEMETRY=true

# Sample rate (0.0 to 1.0)
NEXT_PUBLIC_TELEMETRY_SAMPLE_RATE=1.0
```

### 4.3 Shop Integration Checklist

**Per shop:**

- [ ] Add `@acme/telemetry` to package.json
- [ ] Create/update `instrumentation.ts`
- [ ] Replace local ErrorBoundary with shared component
- [ ] Add `NEXT_PUBLIC_TELEMETRY_ENDPOINT` to env
- [ ] Test error capture in dev
- [ ] Deploy and verify in staging
- [ ] Monitor in production

**Rollout order:**
1. Brikette (most mature codebase)
2. Skylar (active development)
3. Cochlearfit
4. XA
5. Cover-me-pretty

---

## Phase 5: CMS Telemetry UI Updates (existing dashboard)

**Location:** `apps/cms/src/app/cms/telemetry/`

- The page renders `TelemetryHeader`, `TelemetrySummaryCards`, and `TelemetryFiltersPanel`. Filters encompass name, time range, kind, level, and app dimensions (`telemetryUtils.ts`), and the panel renders the line chart plus the `TelemetryEventTable`.
- `TelemetryFiltersPanel` already exposes presets for general, build flow, timer, and error-focused queries (see `getPresets` in `telemetryUtils.ts`), and `filterTelemetryEvents` applies kind/level/app filtering as part of the existing pipeline.
- The event breakdown table (`TelemetryEventTable.tsx`) lists each event name with counts and last seen times; no separate error grouping or detail overlay currently exists.
- The CMS telemetry page fetches raw events from `NEXT_PUBLIC_TELEMETRY_ENDPOINT` (fallback `/api/telemetry`), tracks loading/error states via `TelemetryAnalyticsView`, and uses `Toast` for feedback.

**Next steps**

1. If you still need error-grouping views, add new components and wiring, but clearly document the current filtering/cell behavior so future updates align with the existing layout.
2. Translate the existing presets/labels before introducing new view toggles or filters (see Phase 6).

---

## Phase 6: i18n Keys (current coverage)

**Location:** `packages/i18n/src/`

- `packages/i18n/src/en.json` already defines the keys the UI uses today, including `cms.telemetry.*` for filters (`kind`, `level`, `app`, preset labels such as `cms.telemetry.presets.buildFlow.label`), summary metrics, and table captions. Search for `cms.telemetry.` to see the full set.
- German and Italian translations mirror the English keys via `packages/i18n/src/de.json` and `it.json`. No extra `viewMode` or `groupedBy` keys exist in the repo, so new toggles would require adding them explicitly in all locales.
- Keep the key list in sync when adding new UI copy (e.g., additional telemetry controls or preset labels).

**Next steps**

1. If new UI copy is introduced (view modes, grouping, detail panels), add the key to `en.json` and propagate to `de.json`/`it.json` (or flag for translators).
2. Remove unused telemetry keys if the UI no longer renders them to reduce translation noise.

---
## Phase 7: Configuration & Documentation

**Effort:** 1 hour

### 7.1 Environment Variables

**File:** `.env.template` (root)

```bash
# Telemetry / Error Tracking
# Worker endpoint for telemetry ingestion (deploy apps/telemetry-worker first)
NEXT_PUBLIC_TELEMETRY_ENDPOINT=https://telemetry.example.workers.dev/v1/telemetry

# Enable telemetry in production (set to "true" for production/staging)
NEXT_PUBLIC_ENABLE_TELEMETRY=false

# Sample rate for non-error events (0.0 to 1.0, default: 1.0 = 100%)
NEXT_PUBLIC_TELEMETRY_SAMPLE_RATE=1.0
```

**Worker config:** `apps/telemetry-worker/wrangler.toml` still defines `TELEMETRY_ALLOWED_ORIGINS`, `RETENTION_DAYS`, and the optional `TELEMETRY_AUTH_TOKEN`. Keep those in sync with deployment-specific overrides.

### 7.2 Deployment Guide

**File:** `docs/telemetry-error-tracking-deployment.md` (new)

```markdown
# Telemetry Error Tracking - Deployment Guide

## Prerequisites

- Cloudflare account with Workers + D1 enabled
- `wrangler` CLI installed: `npm install -g wrangler`

## 1. Create D1 Database

```bash
cd apps/telemetry-worker
wrangler d1 create telemetry
```

Copy the database_id to `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "telemetry"
database_id = "YOUR_DATABASE_ID_HERE"
```

## 2. Run Migrations

```bash
wrangler d1 execute telemetry --file=./db/migrations/0001_init.sql
```

## 3. Configure Environment

Update `wrangler.toml` with production origins:

```toml
[vars]
TELEMETRY_ALLOWED_ORIGINS = "https://cms.yourcompany.com,https://brikette.hostel"
RETENTION_DAYS = "90"
```

## 4. Deploy Worker

```bash
pnpm --filter @apps/telemetry-worker deploy
# or
wrangler deploy
```

Note the worker URL (e.g., `https://telemetry-worker.yourname.workers.dev`)

## 5. Update App Configurations

In each app's `.env.production`:

```bash
NEXT_PUBLIC_TELEMETRY_ENDPOINT=https://telemetry-worker.yourname.workers.dev/v1/telemetry
NEXT_PUBLIC_ENABLE_TELEMETRY=true
```

## 6. Verify

Test the health endpoint:

```bash
curl https://telemetry-worker.yourname.workers.dev/health
# Should return: {"ok":true,"ts":...}
```

Test event ingestion:

```bash
curl -X POST https://telemetry-worker.yourname.workers.dev/v1/telemetry \
  -H "Content-Type: application/json" \
  -d '[{"name":"test","ts":1234567890}]'
```

## 7. Monitor

- View logs: `wrangler tail`
- Query D1: `wrangler d1 execute telemetry --command "SELECT COUNT(*) FROM telemetry_events"`
- Check CMS telemetry UI: `https://cms.example.com/cms/telemetry`

## Troubleshooting

### CORS errors
- Verify `TELEMETRY_ALLOWED_ORIGINS` includes your app domains
- Check browser console for specific origin rejection

### No events appearing
- Check `NEXT_PUBLIC_ENABLE_TELEMETRY=true` in app env
- Verify `NEXT_PUBLIC_TELEMETRY_ENDPOINT` points to worker
- Check worker logs with `wrangler tail`

### D1 quota exceeded
- Check retention settings (default 90 days)
- Manually prune: `wrangler d1 execute telemetry --command "DELETE FROM telemetry_events WHERE ts < ..."`
```

---

## Testing Strategy

### Unit Tests

**SDK tests:**
```bash
pnpm --filter @acme/telemetry test
```

**Worker tests:**
```bash
pnpm --filter @apps/telemetry-worker test
```

### Integration Tests

**Manual testing checklist:**

1. **CMS Error Boundary:**
   - Trigger error in CMS component
   - Verify event in D1: `wrangler d1 execute telemetry --command "SELECT * FROM telemetry_events WHERE kind='error' ORDER BY ts DESC LIMIT 5"`
   - Check CMS telemetry UI shows error

2. **CMS Instrumentation:**
   - Trigger unhandled rejection: `Promise.reject(new Error('test'))`
   - Verify capture in telemetry

3. **Shop Error (Brikette):**
   - Add test error in Brikette component
   - Verify appears in CMS telemetry UI with `app='brikette'`

4. **Fingerprint Stability:**
   - Trigger same error multiple times
   - Verify same fingerprint in D1
   - Verify grouped correctly in UI

5. **PII Sanitization:**
   - Capture error with context containing PII (email, password)
   - Verify sanitized in D1 payload

6. **Worker CORS:**
   - Test POST from allowed origin (should work)
   - Test POST from disallowed origin (should 403)

7. **Worker Pagination:**
   - Insert 150 events
   - Query with `limit=100`
   - Use cursor to fetch next page

8. **Scheduled Cleanup:**
   - Set `RETENTION_DAYS=1`
   - Insert old event (ts = 2 days ago)
   - Trigger scheduled job: `wrangler dev --test-scheduled`
   - Verify old event deleted

### Load Testing (Optional)

```bash
# Simulate 1000 errors/sec for 10 seconds
for i in {1..10000}; do
  curl -X POST https://telemetry-worker.yourname.workers.dev/v1/telemetry \
    -H "Content-Type: application/json" \
    -d '[{"name":"error","kind":"error","ts":'$(date +%s000)'}]' &
done
wait
```

---

## Rollout Plan

### Week 1: Foundation
- [ ] Phase 1: SDK extensions
- [ ] Phase 2: CMS integration
- [ ] Unit tests pass

### Week 2: Infrastructure
- [ ] Phase 3: Worker implementation
- [ ] D1 database created
- [ ] Worker deployed to staging
- [ ] Manual testing complete

### Week 3: UI & Shop Integration
- [ ] Phase 4: Shop apps integration (Brikette only)
- [ ] Phase 5: CMS UI updates
- [ ] Phase 6: i18n keys
- [ ] Phase 7: Documentation

### Week 4: Rollout
- [ ] Deploy worker to production
- [ ] Enable CMS error tracking
- [ ] Monitor for 1 week
- [ ] Roll out to Brikette
- [ ] Monitor for 1 week

### Week 5+: Expand
- [ ] Roll out to Skylar
- [ ] Roll out to Cochlearfit
- [ ] Roll out to XA
- [ ] Roll out to Cover-me-pretty

---

## Success Criteria

- [ ] All apps emit error events with stable fingerprints
- [ ] Worker stores events in D1 (verified via queries)
- [ ] CMS telemetry UI surfaces filtered events and summary metrics
- [ ] PII sanitization verified (no emails/passwords in D1)
- [ ] CORS properly configured (no console errors)
- [ ] Retention cleanup works (old events deleted)
- [ ] Zero-cost within Cloudflare free tier limits
- [ ] Backwards compatible (existing telemetry still works)
- [ ] No Sentry dependency remaining in production

---

## Monitoring & Alerting

### Metrics to Track

**Worker metrics (via Cloudflare dashboard):**
- Requests/sec
- Error rate
- D1 query latency
- Storage usage

**Application metrics (via CMS UI):**
- Errors/day by app
- Error rate by fingerprint
- Fatal error count
- Response time (P50, P90, P99)

### Alerts

**Critical:**
- Fatal error count > 10/hour
- Worker error rate > 5%
- D1 storage > 80% quota

**Warning:**
- Error count increased >50% week-over-week
- New error fingerprint appears
- Worker response time > 500ms P90

---

## Cost Analysis

### Cloudflare Free Tier

- **Workers:** 100k requests/day (POST + GET)
- **D1:** 5GB storage, 5M row reads/day, 100k row writes/day
- **Scheduled:** Unlimited cron triggers

### Estimated Usage

**Assumptions:**
- 5 apps × 1,000 users × 0.1 errors/day = 500 errors/day
- 500 errors + 1,000 regular events = 1,500 POST requests/day
- 100 CMS telemetry UI loads × 100 events = 10,000 GET requests/day
- Retention: 90 days

**Usage:**
- **Worker requests:** 11,500/day (~0.35M/month) ✅ Well under 100k/day
- **D1 writes:** 1,500/day (~45k/month) ✅ Well under 100k/day
- **D1 storage:** ~135k events × 2KB = ~270MB ✅ Well under 5GB

**Cost:** $0/month (within free tier) ✅

---

## Security Considerations

### Data Privacy

- ✅ PII stripped via allowlist (no emails, names, passwords)
- ✅ User IDs hashed before storage
- ✅ Stack traces trimmed (20 lines max)
- ✅ CORS enforced (only allowed origins)
- ✅ Optional auth token for POST endpoint

### Compliance

- **GDPR:** No personal data stored (fingerprints are content-based hashes)
- **Data Retention:** Configurable (default 90 days), auto-pruned
- **Data Location:** Cloudflare D1 (EU region available if needed)

---

## Migration from Sentry

### Comparison

| Feature | Sentry | Our Solution |
|---------|--------|--------------|
| Error tracking | ✅ | ✅ |
| Grouping | ✅ | ✅ (fingerprints) |
| Stack traces | ✅ | ✅ |
| Context | ✅ | ✅ (sanitized) |
| Alerting | ✅ | ⚠️ Manual |
| Source maps | ✅ | ❌ |
| Performance | ✅ | ❌ (events only) |
| Cost | 💰 $26-80/mo | ✅ $0/mo |

### What We Lose

- Source map resolution (stack traces are minified in prod)
- Built-in alerting (need to build custom)
- Performance monitoring (use separate tool)
- Advanced features (release tracking, replays, etc.)

### Mitigation

- **Source maps:** Keep Sentry for critical apps, use internal for others
- **Alerting:** Build simple alerts based on CMS telemetry queries
- **Performance:** Use Web Vitals via existing telemetry

---

## Future Enhancements

### Phase 8+ (Optional)

1. **Source Map Support**
   - Upload source maps to worker KV
   - Resolve stack traces server-side
   - Display original source in UI

2. **Alerting**
   - Email alerts for fatal errors
   - Webhook integration (Slack, Discord)
   - Threshold-based alerts

3. **Performance Tracking**
   - Core Web Vitals ingestion
   - API latency tracking
   - User flow timing

4. **Advanced Filtering**
   - Regex search in messages
   - Multi-select filters
   - Saved filter presets

5. **Exports**
   - CSV export for reporting
   - JSON export for analysis
   - Scheduled reports

---

## Appendix: File Size Constraints

Per `AGENTS.md`: All files must be <350 LOC.

**File breakdown:**

| File | Est. LOC | Status |
|------|----------|--------|
| `packages/telemetry/src/index.ts` | ~150 | ✅ |
| `packages/telemetry/src/fingerprint.ts` | ~50 | ✅ |
| `packages/telemetry/src/sanitize.ts` | ~80 | ✅ |
| `apps/telemetry-worker/src/index.ts` | ~60 | ✅ |
| `apps/telemetry-worker/src/endpoints.ts` | ~120 | ✅ |
| `apps/telemetry-worker/src/storage.ts` | ~100 | ✅ |
| `apps/telemetry-worker/src/validation.ts` | ~50 | ✅ |
| `apps/telemetry-worker/src/cors.ts` | ~30 | ✅ |
| `apps/telemetry-worker/src/scheduled.ts` | ~20 | ✅ |
| `apps/cms/.../ErrorDetailPanel.tsx` | ~150 | ✅ |
| `apps/cms/.../ErrorGroupingTable.tsx` | ~120 | ✅ |

All files well under 350 LOC limit ✅

---

**Document Status:** Ready for implementation
**Next Step:** Review and approval, then proceed with Phase 1
**Questions/Feedback:** Open an issue or discussion in the repository
