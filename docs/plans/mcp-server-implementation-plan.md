---
Type: Plan
Status: Draft
Domain: Infrastructure
Last-reviewed: 2026-01-19
Relates-to charter: none
---

# MCP Server Implementation Plan

**Feature:** Model Context Protocol (MCP) Server Integration
**Status:** Draft
**Created:** 2026-01-19

## Overview

Implement MCP servers to give Claude direct access to the base-shop codebase data, enabling richer debugging, content management, and development workflows.

## Goals

1. Create a new `@acme/mcp-server` package following monorepo conventions
2. Implement read-only database queries for shops, orders, inventory, users
3. Add CMS content tools for pages, sections, and themes
4. Build full CRUD operations with proper authorization
5. Configure Claude Code to use the MCP server

## Architecture

### Package Location

```
packages/mcp-server/
├── src/
│   ├── index.ts              # Server entrypoint
│   ├── server.ts             # MCP server setup
│   ├── tools/
│   │   ├── index.ts          # Tool registry
│   │   ├── shops.ts          # Shop queries
│   │   ├── orders.ts         # Order queries
│   │   ├── inventory.ts      # Inventory operations
│   │   ├── pages.ts          # Page CRUD
│   │   ├── sections.ts       # Section templates
│   │   └── settings.ts       # Shop settings
│   ├── resources/
│   │   └── schema.ts         # Expose Prisma schema as resource
│   └── utils/
│       ├── auth.ts           # Authorization helpers
│       └── validation.ts     # Input validation with Zod
├── package.json
├── tsconfig.json
└── README.md
```

### Dependency Graph

```
@acme/mcp-server
    ├── @acme/platform-core    (data access via repositories)
    ├── @acme/config           (environment variables)
    ├── @acme/auth             (authorization checks)
    ├── @acme/zod-utils        (input validation)
    └── @modelcontextprotocol/sdk (MCP protocol)
```

## Implementation Tasks

### Phase 1: Package Scaffolding

- [ ] Create `packages/mcp-server/` directory structure
- [ ] Add `package.json` with correct dependencies and exports
- [ ] Add `tsconfig.json` extending workspace config
- [ ] Create basic server entrypoint using `@modelcontextprotocol/sdk`
- [ ] Add `bin` script for running the server

### Phase 2: Read-Only Database Tools

- [ ] `shop_list` - List all shops with summary data
- [ ] `shop_get` - Get full shop configuration by ID
- [ ] `shop_health` - Get shop health/launch readiness
- [ ] `order_list` - List orders with filters (shop, status, date range)
- [ ] `order_get` - Get order details by ID
- [ ] `inventory_list` - List inventory items by shop
- [ ] `inventory_check` - Check stock for specific SKU
- [ ] `user_list` - List CMS users
- [ ] `settings_get` - Get shop settings

### Phase 3: CMS Content Tools

- [ ] `page_list` - List pages for a shop
- [ ] `page_get` - Get page content by slug
- [ ] `page_create` - Create new page
- [ ] `page_update` - Update page content
- [ ] `section_list` - List section templates
- [ ] `section_get` - Get section template by ID
- [ ] `section_create` - Create section template
- [ ] `section_update` - Update section template

### Phase 4: Full CRUD & Mutations

- [ ] `shop_create` - Create new shop
- [ ] `shop_update` - Update shop configuration
- [ ] `order_update_status` - Update order status
- [ ] `inventory_adjust` - Adjust inventory quantity
- [ ] `settings_update` - Update shop settings

### Phase 5: Resources & Prompts

- [ ] Expose Prisma schema as MCP resource
- [ ] Add `shop_context` prompt for debugging workflows
- [ ] Add `order_debug` prompt for order investigation

### Phase 6: Configuration & Documentation

- [ ] Add MCP server config to `.claude/settings.json`
- [ ] Create README with usage instructions
- [ ] Add to workspace build pipeline
- [ ] Document available tools in `.claude/SKILLS_INDEX.md`

## Technical Details

### Server Implementation

```typescript
// packages/mcp-server/src/server.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server(
  { name: "base-shop-mcp", version: "1.0.0" },
  { capabilities: { tools: {}, resources: {} } }
);

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    { name: "shop_list", description: "List all shops", inputSchema: {...} },
    // ... more tools
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "shop_list": return handleShopList(request.params.arguments);
    // ... more handlers
  }
});
```

### Tool Example

```typescript
// packages/mcp-server/src/tools/shops.ts
import { getShop, listShops } from "@acme/platform-core/shops";
import { z } from "zod";

export const shopListSchema = z.object({
  limit: z.number().optional().default(50),
  offset: z.number().optional().default(0),
});

export async function handleShopList(args: unknown) {
  const { limit, offset } = shopListSchema.parse(args);
  const shops = await listShops({ limit, offset });
  return {
    content: [{ type: "text", text: JSON.stringify(shops, null, 2) }]
  };
}
```

### Claude Configuration

```jsonc
// .claude/settings.json (addition)
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

## Security Considerations

1. **Read-only by default** - Mutation tools require explicit opt-in
2. **No secrets in responses** - Filter sensitive fields (passwords, tokens)
3. **Input validation** - All tool inputs validated with Zod schemas
4. **Environment isolation** - Use test/dev database, never production
5. **Audit logging** - Log all MCP tool invocations for debugging

## Testing Strategy

1. Unit tests for each tool handler
2. Integration tests with test database
3. Manual testing via Claude Code

## Success Criteria

- [ ] MCP server starts without errors
- [ ] Claude can query shops and orders
- [ ] Claude can read and write CMS content
- [ ] All mutations are properly authorized
- [ ] Documentation is complete

## File Estimates

| File | Lines | Purpose |
|------|-------|---------|
| `src/index.ts` | ~20 | Entrypoint |
| `src/server.ts` | ~100 | Server setup |
| `src/tools/shops.ts` | ~80 | Shop tools |
| `src/tools/orders.ts` | ~100 | Order tools |
| `src/tools/inventory.ts` | ~60 | Inventory tools |
| `src/tools/pages.ts` | ~120 | Page CRUD |
| `src/tools/sections.ts` | ~100 | Section CRUD |
| `src/tools/settings.ts` | ~50 | Settings tools |
| `src/utils/auth.ts` | ~40 | Auth helpers |
| `src/utils/validation.ts` | ~30 | Shared schemas |
| `package.json` | ~40 | Package config |
| `README.md` | ~100 | Documentation |

**Total:** ~840 lines across 12 files

## Dependencies to Add

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "@acme/platform-core": "workspace:^",
    "@acme/config": "workspace:^",
    "@acme/zod-utils": "workspace:^",
    "zod": "^3.23.0"
  }
}
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Database connection in Claude context | Use connection pooling, handle reconnects |
| Large query results | Implement pagination, limit response sizes |
| Stale data | Add cache invalidation, use fresh queries |
| Schema changes | Version tools, handle migrations gracefully |

## References

- [MCP Specification](https://modelcontextprotocol.io/docs)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Existing MCP Servers](https://github.com/modelcontextprotocol/servers)


## Active tasks

No active tasks at this time.
