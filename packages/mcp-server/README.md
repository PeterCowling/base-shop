# @acme/mcp-server

MCP (Model Context Protocol) server for the base-shop platform, providing Claude with direct access to shop data, orders, inventory, and CMS content.

## Overview

This package implements an MCP server that exposes the base-shop platform data through a standardized protocol. It allows Claude Code to query and manipulate shop data directly during development sessions.

## Installation

The MCP server is configured in `.claude/settings.json` and runs automatically when Claude Code starts.

```bash
# Build the package
pnpm --filter @acme/mcp-server build

# Run manually (for testing)
pnpm --filter @acme/mcp-server start
```

## Available Tools

### Shop Tools

| Tool | Description |
|------|-------------|
| `shop_list` | List all shops with pagination |
| `shop_get` | Get full shop configuration by ID |
| `shop_health` | Get health/launch readiness status |

### Order Tools

| Tool | Description |
|------|-------------|
| `order_list` | List orders with filters (shop, status, customer) |
| `order_get` | Get order details by shop and session ID |

### Inventory Tools

| Tool | Description |
|------|-------------|
| `inventory_list` | List inventory items for a shop |
| `inventory_check` | Check stock level for a specific SKU |

### CMS Content Tools

| Tool | Description |
|------|-------------|
| `page_list` | List all pages for a shop |
| `page_get` | Get a page by slug |
| `page_create` | Create a new page |
| `page_update` | Update an existing page |
| `section_list` | List section templates |
| `section_get` | Get a section template by ID |
| `section_create` | Create a section template |
| `section_update` | Update a section template |

### Settings Tools

| Tool | Description |
|------|-------------|
| `settings_get` | Get shop settings |
| `settings_update` | Update shop settings (merge) |

### Product Tools

| Tool | Description |
|------|-------------|
| `product_list` | List all products for a shop |
| `product_get` | Get details for a specific product |
| `product_search` | Search products with filters (query, category, price range) |
| `product_stats` | Get product catalog statistics (counts, price ranges) |

### Analytics Tools

| Tool | Description |
|------|-------------|
| `analytics_aggregates` | Get analytics aggregates (page views, orders, discounts) |
| `analytics_events` | Get recent analytics events (last N events) |
| `analytics_summary` | Get analytics summary with insights |

### Health Tools

| Tool | Description |
|------|-------------|
| `health_check` | Test MCP server connectivity and database connection |
| `health_database` | Get database connection status and basic stats |

### SEO Tools

| Tool | Description |
|------|-------------|
| `seo_list_audits` | List all SEO audits for a shop |
| `seo_get_latest` | Get the most recent SEO audit with categorized recommendations |
| `seo_summary` | Get SEO summary with trends and recurring issues |

### Discount Tools

| Tool | Description |
|------|-------------|
| `discount_list` | List all discount codes with status (active/expired/upcoming) |
| `discount_get` | Get details for a specific discount code |
| `discount_validate` | Check if a discount code is currently valid |
| `discount_stats` | Get discount statistics including redemption counts |

### Theme Tools

| Tool | Description |
|------|-------------|
| `theme_get_tokens` | Get computed theme tokens for a shop (with optional filter) |
| `theme_list_presets` | List all saved theme presets for a shop |
| `theme_get_preset` | Get a specific theme preset's tokens |
| `theme_compare` | Compare theme tokens between shops or presets |
| `theme_validate` | Validate theme configuration and check for issues |

### Octorate Tools

| Tool | Description |
|------|-------------|
| `octorate_login_interactive` | Opens local Chrome, logs in, waits for you to complete MFA, saves session state |
| `octorate_calendar_check` | Uses saved session state to verify the calendar page can be opened headless |

### Startup-Loop Data Plane Tools

| Tool | Type | Description |
|------|------|-------------|
| `bos_cards_list` | Read | List Business OS cards scoped to startup-loop context |
| `bos_stage_doc_get` | Read | Read stage-doc content and current `entitySha` |
| `bos_stage_doc_patch_guarded` | Guarded write | Patch stage-doc with optimistic concurrency (`baseEntitySha`) |
| `loop_manifest_status` | Read | Read baseline manifest status and freshness envelope |
| `loop_learning_ledger_status` | Read | Read learning-ledger health and freshness |
| `loop_metrics_summary` | Read | Read aggregated loop metrics and freshness |

### Startup-Loop Policy Model

- Phase-1 strict enforcement applies to `bos_*` and `loop_*` tools only.
- Required policy metadata includes permission, side effects, allowed stages, and audit tag.
- Guarded writes require `current_stage`, `write_reason`, and `baseEntitySha`.
- Legacy non-loop tools run in compatibility mode and are logged for future annotation.
- Guarded write conflicts return `CONFLICT_ENTITY_SHA` with `re_read_required=true`; MCP does not auto-merge/retry.

## Resources

| URI | Description |
|-----|-------------|
| `schema://prisma` | The Prisma database schema |

## Configuration

The MCP server is configured in `.claude/settings.json`:

```json
{
  "mcpServers": {
    "base-shop": {
      "command": "node",
      "args": ["./packages/mcp-server/dist/index.js"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      }
    }
  }
}
```

## Environment Variables

- `OCTORATE_USERNAME` - Octorate login username (required for `octorate_*` tools)
- `OCTORATE_PASSWORD` - Octorate login password (required for `octorate_*` tools; do not commit)
- `OCTORATE_STORAGE_STATE_PATH` - Optional path to storage state JSON (default: `.secrets/octorate/storage-state.json`)
- `OCTORATE_CHROME_EXECUTABLE` - Optional path to Chrome executable (defaults to common OS paths)
- `DATABASE_URL` - PostgreSQL connection string (required for Prisma operations)
- `BOS_AGENT_API_BASE_URL` - Base URL for Business OS agent API (required for `bos_*` tools)
- `BOS_AGENT_API_KEY` - API key for Business OS agent API (required for `bos_*` tools)
- `STARTUP_LOOP_ARTIFACT_ROOT` - Optional artifact root for `loop_*` tools (default: repo root)
- `STARTUP_LOOP_STALE_THRESHOLD_SECONDS` - Freshness threshold for `loop_*` tools (default: 30 days)

## Development

```bash
# Build
pnpm --filter @acme/mcp-server build

# Type check
pnpm --filter @acme/mcp-server exec tsc --noEmit

# Run in development mode
pnpm --filter @acme/mcp-server dev

# Run startup-loop integration suite (stable wrapper config)
pnpm --filter @acme/mcp-server test:startup-loop

# Run startup-loop MCP preflight checks (local/ci/deployed profiles)
pnpm preflight:mcp-startup-loop -- --profile local
```

## Architecture

```
src/
├── index.ts        # Server entrypoint (stdio transport)
├── server.ts       # MCP server setup and handlers
├── tools/          # Tool implementations
│   ├── index.ts    # Tool registry
│   ├── shops.ts    # Shop queries
│   ├── orders.ts   # Order queries
│   ├── inventory.ts# Inventory operations
│   ├── pages.ts    # Page CRUD
│   ├── sections.ts # Section CRUD
│   ├── settings.ts # Settings operations
│   ├── products.ts # Product catalog
│   ├── analytics.ts# Analytics data
│   ├── health.ts   # Health checks
│   ├── seo.ts      # SEO audit data
│   ├── discounts.ts# Discount/coupon tools
│   └── themes.ts   # Theme token tools
├── resources/
│   └── schema.ts   # Prisma schema resource
└── utils/
    └── validation.ts# Input validation with Zod
```

## Gmail API Setup

The MCP server can access Gmail for email automation tasks. This requires OAuth2 setup.

### Prerequisites

1. A Google account with Gmail
2. Access to Google Cloud Console

### Setup Steps

#### 1. Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"
4. Configure OAuth consent screen:
   - Go to "APIs & Services" > "OAuth consent screen"
   - Choose "External" user type (or "Internal" if using Google Workspace)
   - Fill in required fields (app name, support email)
   - Add scopes: `gmail.readonly`, `gmail.modify`, `gmail.compose`
   - Add your email as a test user (required for External apps in testing mode)
   - **Recommended:** Publish the app to production for long-lived refresh tokens
5. Create OAuth credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Desktop app" as application type
   - Download the JSON file
   - Rename it to `credentials.json`
   - Place it in `packages/mcp-server/`

#### 2. Authorize the Application

On first run (or if token expires):

```bash
# Navigate to mcp-server directory
cd packages/mcp-server

# Run the authorization script (coming in TASK-02)
# For now, the Gmail tools will prompt when needed
pnpm dev
```

A browser window will open asking you to authorize the application. After authorization:
- Token is saved to `token.json`
- Future runs will use the saved token
- Token refreshes automatically

### File Locations

| File | Purpose | Git Status |
|------|---------|------------|
| `credentials.json` | OAuth client credentials from Google | **Gitignored** - never commit |
| `token.json` | Access/refresh tokens after authorization | **Gitignored** - never commit |

### Token Refresh

- Tokens are automatically refreshed when expired
- If refresh fails (e.g., token revoked), re-run authorization
- Apps in "Testing" mode have 7-day token expiry; publish to production for longer validity

### Troubleshooting

| Issue | Solution |
|-------|----------|
| "Credentials not found" | Download OAuth credentials from Google Cloud Console |
| "Token not found" | Run interactive authorization |
| "Token expired" | Usually auto-refreshes; if not, delete `token.json` and re-authorize |
| "Access denied" | Ensure you're signed in as a test user (for apps in testing mode) |
| "Insufficient permissions" | Check that Gmail API scopes are configured correctly |

### Security Notes

- **Never commit** `credentials.json` or `token.json`
- These files are in `.gitignore` by default
- Treat `credentials.json` like a password
- `token.json` contains access tokens that could be used to access your email

## Security Notes

- Read operations are generally safe
- Mutation operations (create, update) should be used carefully
- No deletion operations are exposed
- Sensitive fields (passwords, tokens) are not exposed in responses
- Always use development/test databases, never production
