# @acme/mcp-cloudflare

MCP (Model Context Protocol) server for managing Cloudflare resources, enabling Claude to query and administer Pages, DNS, R2, and KV directly during development sessions.

## Overview

This package implements an MCP server that exposes Cloudflare management capabilities through a standardized protocol. It allows Claude Code to manage your Cloudflare infrastructure without leaving the development environment.

## Installation

The MCP server is configured in `.claude/settings.json` and runs automatically when Claude Code starts.

```bash
# Build the package
pnpm --filter @acme/mcp-cloudflare build

# Run manually (for testing)
pnpm --filter @acme/mcp-cloudflare start
```

## Required Environment Variables

```bash
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_ACCOUNT_ID=your-account-id
```

## API Token Scopes

Create a custom API token at https://dash.cloudflare.com/profile/api-tokens with these permissions:

| Resource | Permission | For |
|----------|------------|-----|
| Account.Pages | Read + Edit | Pages deployment tools |
| Zone.DNS | Read + Edit | DNS management tools |
| Account.R2 | Read + Edit | R2 storage tools |
| Account.KV | Read + Edit | KV namespace tools |
| Account.Analytics | Read | Analytics tools |
| Account.Audit Logs | Read | Audit log tools |
| Zone.Cache Purge | Purge | Cache purge tools |
| Zone.Firewall Services | Read | Security tools (read) |
| Zone.Security Settings | Read + Edit | Security level tools |
| Account.Workers Scripts | Read | Workers tools |
| Account.Workers Tail | Read | Workers tail (real-time logs) |
| Account.D1 | Read | D1 database tools |

## Available Tools

### Pages Tools (6 tools)

| Tool | Type | Description |
|------|------|-------------|
| `pages_list_projects` | Read | List all Pages projects |
| `pages_get_project` | Read | Get project details |
| `pages_list_deployments` | Read | List deployments for a project |
| `pages_get_deployment` | Read | Get deployment details |
| `pages_trigger_deploy` | Write | Trigger a new deployment |
| `pages_rollback` | Write | Rollback to a previous deployment |

### DNS Tools (6 tools)

| Tool | Type | Description |
|------|------|-------------|
| `dns_list_zones` | Read | List all DNS zones |
| `dns_get_zone` | Read | Get zone details |
| `dns_list_records` | Read | List DNS records for a zone |
| `dns_create_record` | Write | Create a DNS record |
| `dns_update_record` | Write | Update a DNS record |
| `dns_delete_record` | Write | Delete a DNS record |

### R2 Tools (5 tools)

| Tool | Type | Description |
|------|------|-------------|
| `r2_list_buckets` | Read | List all R2 buckets |
| `r2_get_bucket` | Read | Get bucket details |
| `r2_list_objects` | Read | List objects in a bucket |
| `r2_get_object_info` | Read | Get object metadata |
| `r2_delete_object` | Write | Delete an object |

### KV Tools (5 tools)

| Tool | Type | Description |
|------|------|-------------|
| `kv_list_namespaces` | Read | List KV namespaces |
| `kv_list_keys` | Read | List keys in a namespace |
| `kv_get_value` | Read | Get value for a key |
| `kv_put_value` | Write | Set a key-value pair |
| `kv_delete_key` | Write | Delete a key |

### Analytics Tools (3 tools)

| Tool | Type | Description |
|------|------|-------------|
| `analytics_get_zone` | Read | Get analytics data for a zone (requests, bandwidth, threats) |
| `analytics_get_workers` | Read | Get Workers analytics (requests, errors, CPU time) |
| `analytics_get_pages` | Read | Get Pages analytics (deployments, requests, bandwidth) |

### Audit Tools (3 tools)

| Tool | Type | Description |
|------|------|-------------|
| `audit_list_logs` | Read | List audit logs for the account |
| `audit_get_log` | Read | Get details for a specific audit log entry |
| `audit_search` | Read | Search audit logs with filters |

### Cache Tools (5 tools)

| Tool | Type | Description |
|------|------|-------------|
| `cache_purge_urls` | Write | Purge specific URLs from cache |
| `cache_purge_everything` | Write | Purge ALL cached content for a zone ⚠️ |
| `cache_purge_by_tag` | Write | Purge cache by cache tags |
| `cache_purge_by_prefix` | Write | Purge cache by URL prefix |
| `cache_purge_by_host` | Write | Purge cache by hostname |

### Security Tools (7 tools)

| Tool | Type | Description |
|------|------|-------------|
| `security_list_firewall_rules` | Read | List firewall rules for a zone |
| `security_get_firewall_rule` | Read | Get details of a specific firewall rule |
| `security_list_rate_limits` | Read | List rate limiting rules for a zone |
| `security_list_waf_packages` | Read | List WAF packages and rulesets |
| `security_get_level` | Read | Get current security level setting |
| `security_under_attack_mode` | Write | Enable/disable "I'm Under Attack" mode |
| `security_bot_fight_mode` | Write | Enable/disable Bot Fight Mode |

### Health Tools (3 tools)

| Tool | Type | Description |
|------|------|-------------|
| `cloudflare_test_connection` | Read | Test API connectivity and verify credentials |
| `cloudflare_account_info` | Read | Get account information and resource access |
| `cloudflare_token_verify` | Read | Verify API token and list permissions |

### Workers Tools (6 tools)

| Tool | Type | Description |
|------|------|-------------|
| `workers_list` | Read | List all Workers scripts in the account |
| `workers_get` | Read | Get details for a specific Worker (handlers, bindings) |
| `workers_list_routes` | Read | List Worker routes for a zone |
| `workers_list_cron_triggers` | Read | List cron triggers for a Worker |
| `workers_get_logs` | Read | Get logging status and recommendations for a Worker |
| `workers_tail_start` | Read | Start a tail session for real-time Worker logs |

### D1 Database Tools (6 tools)

| Tool | Type | Description |
|------|------|-------------|
| `d1_list_databases` | Read | List all D1 databases in the account |
| `d1_get_database` | Read | Get details for a specific database |
| `d1_list_tables` | Read | List all tables in a database |
| `d1_query` | Read | Execute a read-only SQL query (SELECT/PRAGMA only) |
| `d1_table_info` | Read | Get schema info for a table (columns, indexes) |
| `d1_stats` | Read | Get database statistics (size, row counts) |

## Resources

| URI | Description |
|-----|-------------|
| `cloudflare://account` | Current Cloudflare account information |

## Configuration

Add to `.claude/settings.json`:

```json
{
  "mcpServers": {
    "cloudflare": {
      "command": "node",
      "args": ["./packages/mcp-cloudflare/dist/index.js"],
      "env": {
        "CLOUDFLARE_API_TOKEN": "${CLOUDFLARE_API_TOKEN}",
        "CLOUDFLARE_ACCOUNT_ID": "${CLOUDFLARE_ACCOUNT_ID}"
      }
    }
  }
}
```

## Example Usage

Once configured, Claude can:

```
"List all my Pages projects"
→ Uses pages_list_projects

"Show me the latest deployment for shop-acme"
→ Uses pages_list_deployments with projectName: "shop-acme"

"Add a CNAME record for www pointing to shop-acme.pages.dev"
→ Uses dns_create_record

"What's in the product-pipeline-evidence bucket?"
→ Uses r2_list_objects

"Get the value of 'config' key in the session-store namespace"
→ Uses kv_get_value
```

## Safety & Confirmation Pattern

All write operations require explicit confirmation before execution. This ensures you always have visibility into what will happen before any changes are made.

### How It Works

When you call a write operation **without** `confirm: true`:

1. The tool returns a **preview** of what will happen
2. Shows current state and proposed changes
3. Provides the exact parameters to execute

When you call with `confirm: true`:

1. The operation executes
2. Returns success confirmation

### Example Flow

```
User: "Create a CNAME record for www pointing to example.pages.dev"

Claude calls: dns_create_record({ zoneId: "...", type: "CNAME", name: "www", content: "example.pages.dev" })

Response:
{
  "status": "CONFIRMATION_REQUIRED",
  "message": "⚠️ This will CREATE a new DNS record...",
  "preview": {
    "action": "CREATE DNS RECORD",
    "zone": "example.com",
    "record": { "type": "CNAME", "name": "www", "content": "example.pages.dev" }
  },
  "toExecute": { ... , "confirm": true }
}

User: "Yes, go ahead"

Claude calls: dns_create_record({ ..., confirm: true })

Response: { "message": "✅ DNS record created successfully", ... }
```

### Write Operations Requiring Confirmation

| Tool | Risk Level | Description |
|------|------------|-------------|
| `dns_create_record` | Medium | Creates new DNS record |
| `dns_update_record` | High | Modifies existing DNS |
| `dns_delete_record` | **Critical** | Deletes DNS record |
| `pages_trigger_deploy` | Medium | Triggers new deployment |
| `pages_rollback` | Medium | Rolls back to previous version |
| `r2_delete_object` | High | Deletes stored file |
| `kv_put_value` | Medium | Creates/overwrites KV data |
| `kv_delete_key` | High | Deletes KV key |
| `cache_purge_urls` | Medium | Purges specific URLs |
| `cache_purge_everything` | **Critical** | Purges ALL cached content |
| `cache_purge_by_tag` | Medium | Purges by cache tag |
| `cache_purge_by_prefix` | Medium | Purges by URL prefix |
| `cache_purge_by_host` | High | Purges all cache for a host |
| `security_under_attack_mode` | High | Changes security mode |
| `security_bot_fight_mode` | Medium | Toggles bot protection |

### Security Notes

- Use scoped API tokens with minimum required permissions
- Never use global API key
- Consider using separate tokens for production vs staging
- The server filters sensitive data from responses
- All write operations require explicit confirmation

## Architecture

```
src/
├── index.ts              # Server entrypoint
├── server.ts             # MCP server setup
├── client.ts             # Cloudflare API wrapper
├── tools/
│   ├── index.ts          # Tool registry
│   ├── pages.ts          # Pages tools
│   ├── dns.ts            # DNS tools
│   ├── r2.ts             # R2 tools
│   ├── kv.ts             # KV tools
│   ├── analytics.ts      # Analytics tools
│   ├── audit.ts          # Audit log tools
│   ├── cache.ts          # Cache purge tools
│   ├── security.ts       # Security tools
│   ├── health.ts         # Health check tools
│   ├── workers.ts        # Workers tools
│   └── d1.ts             # D1 database tools
├── resources/
│   └── account.ts        # Account resource
└── utils/
    └── validation.ts     # Zod schemas
```

## Development

```bash
# Build
pnpm --filter @acme/mcp-cloudflare build

# Type check
pnpm --filter @acme/mcp-cloudflare exec tsc --noEmit

# Run in development mode
pnpm --filter @acme/mcp-cloudflare dev
```
