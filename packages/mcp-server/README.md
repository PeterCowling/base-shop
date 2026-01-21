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

- `DATABASE_URL` - PostgreSQL connection string (required for Prisma operations)

## Development

```bash
# Build
pnpm --filter @acme/mcp-server build

# Type check
pnpm --filter @acme/mcp-server exec tsc --noEmit

# Run in development mode
pnpm --filter @acme/mcp-server dev
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

## Security Notes

- Read operations are generally safe
- Mutation operations (create, update) should be used carefully
- No deletion operations are exposed
- Sensitive fields (passwords, tokens) are not exposed in responses
- Always use development/test databases, never production
