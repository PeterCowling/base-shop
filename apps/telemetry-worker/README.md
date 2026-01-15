# Telemetry Worker

Cloudflare Worker for ingesting and querying telemetry events from all apps.

## Features

- **Event Ingestion**: POST /v1/telemetry - accepts batched events
- **Event Query**: GET /v1/telemetry - query with filters (kind, app, level, time range)
- **D1 Storage**: Long-term storage with automatic retention cleanup
- **CORS Support**: Configurable allowed origins
- **Health Check**: GET /health endpoint
- **Scheduled Cleanup**: Daily cron job to prune old events

## Setup

### 1. Create D1 Database

```bash
cd apps/telemetry-worker
wrangler d1 create telemetry
```

Copy the database ID from the output and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "telemetry"
database_id = "YOUR_DATABASE_ID_HERE"
```

### 2. Run Migrations

```bash
wrangler d1 execute telemetry --file=./db/migrations/0001_init.sql
```

### 3. Configure Environment

Update `wrangler.toml` with your allowed origins:

```toml
[vars]
TELEMETRY_ALLOWED_ORIGINS = "https://cms.example.com,https://shop.example.com"
RETENTION_DAYS = "90"
```

## Development

```bash
pnpm dev
```

Worker will run at http://localhost:8791

## Deployment

```bash
wrangler deploy
```

## API Reference

### POST /v1/telemetry

Ingest events (batch or single).

**Request Body:**
```json
[
  {
    "name": "error",
    "kind": "error",
    "level": "error",
    "message": "Test error",
    "stack": "Error: Test error\n    at...",
    "fingerprint": "abc123",
    "ts": 1704067200000,
    "app": "cms",
    "env": "production"
  }
]
```

**Response:**
```json
{
  "success": true,
  "count": 1
}
```

### GET /v1/telemetry

Query events with filters.

**Query Parameters:**
- `kind` - Filter by event kind ("event" or "error")
- `name` - Filter by event name
- `app` - Filter by app
- `level` - Filter by error level ("info", "warning", "error", "fatal")
- `start` - Start timestamp (ms)
- `end` - End timestamp (ms)
- `limit` - Max results (default: 100, max: 1000)
- `cursor` - Pagination cursor (timestamp)

**Response:**
```json
{
  "events": [...],
  "cursor": "1704067200000"
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "ok": true,
  "ts": 1704067200000
}
```

## D1 Schema

See [db/migrations/0001_init.sql](db/migrations/0001_init.sql) for the schema.

**Indexes:**
- `idx_ts` - Time-based queries
- `idx_fingerprint_ts` - Error grouping by fingerprint
- `idx_kind_ts` - Filter by event kind
- `idx_app_ts` - Filter by app
- `idx_level_ts` - Filter by error level

## Configuration

### CORS

Configure allowed origins in `wrangler.toml`:

```toml
TELEMETRY_ALLOWED_ORIGINS = "https://cms.example.com,https://shop.example.com"
```

Leave empty or set to `*` for development.

### Retention

Configure retention period (default: 90 days):

```toml
RETENTION_DAYS = "90"
```

The scheduled cleanup job runs daily at 3am UTC.

### Authentication (Optional)

Add token-based auth for POST requests:

```toml
TELEMETRY_AUTH_TOKEN = "your-secret-token"
```

Clients must include: `Authorization: Bearer your-secret-token`

## Testing

```bash
pnpm typecheck
```

## Monitoring

- Check D1 query analytics in Cloudflare dashboard
- View worker logs: `wrangler tail`
- Monitor scheduled job runs in dashboard
