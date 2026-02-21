---
Type: Plan
Status: Archived
Domain: Infrastructure
Last-reviewed: 2026-02-14
Relates-to charter: none
Last-updated: 2026-02-14
Last-updated-by: Codex (archived)
Archived-Date: 2026-02-14
Audit-Ref: working-tree
Audit-Date: 2026-02-14
---

# MCP Server Implementation Plan

**Feature:** Model Context Protocol (MCP) Server Integration
**Status:** Substantially Complete (core features implemented, some enhancements pending)
**Created:** 2026-01-19
**Last Updated:** 2026-02-14

## Overview

Implement MCP servers to give Claude direct access to the base-shop codebase data, enabling richer debugging, content management, and development workflows.

## Goals

1. Create a new `@acme/mcp-server` package following monorepo conventions
2. Implement read-only database queries for shops, orders, inventory, users
3. Add CMS content tools for pages, sections, and themes
4. Build full CRUD operations with proper authorization
5. Configure Claude Code to use the MCP server

## Architecture

### Package Location (Actual Structure)

```
packages/mcp-server/
├── src/
│   ├── index.ts              # Server entrypoint
│   ├── server.ts             # MCP server setup
│   ├── booking-email.ts      # Booking email logic
│   ├── guest-email-activity.ts # Guest email tracking
│   ├── tools/
│   │   ├── index.ts          # Tool registry
│   │   ├── shops.ts          # Shop queries
│   │   ├── orders.ts         # Order queries
│   │   ├── inventory.ts      # Inventory operations
│   │   ├── pages.ts          # Page CRUD
│   │   ├── sections.ts       # Section templates
│   │   ├── settings.ts       # Shop settings
│   │   ├── products.ts       # Product management
│   │   ├── analytics.ts      # Analytics queries
│   │   ├── health.ts         # Health checks
│   │   ├── seo.ts            # SEO tools
│   │   ├── discounts.ts      # Discount management
│   │   ├── themes.ts         # Theme configuration
│   │   ├── bos.ts            # Business OS integration
│   │   ├── loop.ts           # Startup loop automation
│   │   ├── gmail.ts          # Gmail integration
│   │   ├── octorate.ts       # Octorate integration
│   │   ├── booking-email.ts  # Booking email tools
│   │   ├── guest-email-activity.ts # Guest tracking tools
│   │   ├── draft-generate.ts # Email draft generation
│   │   ├── draft-interpret.ts # Email intent parsing
│   │   ├── draft-quality-check.ts # Draft validation
│   │   ├── outbound-drafts.ts # Outbound email management
│   │   ├── policy.ts         # Policy engine
│   │   └── policy-decision.ts # Policy rules
│   ├── resources/
│   │   ├── schema.ts         # Prisma schema resource
│   │   ├── brikette-knowledge.ts # Domain knowledge
│   │   ├── draft-guide.ts    # Draft guidelines
│   │   ├── email-examples.ts # Email templates
│   │   └── voice-examples.ts # Brand voice examples
│   ├── utils/
│   │   ├── validation.ts     # Input validation with Zod
│   │   ├── email-mime.ts     # MIME handling
│   │   ├── email-signature.ts # Signature processing
│   │   ├── email-template.ts # Template engine
│   │   ├── template-ranker.ts # Template scoring
│   │   ├── template-lint.ts  # Template validation
│   │   ├── workflow-triggers.ts # Workflow automation
│   │   └── data-root.ts      # Data path resolution
│   ├── clients/
│   │   └── gmail.ts          # Gmail API client
│   ├── __tests__/            # Test suite (28 test files)
│   └── lib/                  # Additional libraries
├── scripts/
│   ├── run-integration-test.ts
│   ├── test-draft-generate.ts
│   ├── test-gmail-auth.ts
│   ├── collect-baseline-sample.ts
│   └── lint-templates.ts
├── data/                     # Email templates and examples
├── package.json
├── tsconfig.json
├── tsconfig.eslint.json
├── tsconfig.test.json
└── README.md
```

**Note:** Structure has expanded significantly beyond original plan to support email processing, booking management, and Business OS integration.

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

- [x] Create `packages/mcp-server/` directory structure
- [x] Add `package.json` with correct dependencies and exports
- [x] Add `tsconfig.json` extending workspace config
- [x] Create basic server entrypoint using `@modelcontextprotocol/sdk`
- [x] Add `bin` script for running the server

### Phase 2: Read-Only Database Tools

- [x] `shop_list` - List all shops with summary data
- [x] `shop_get` - Get full shop configuration by ID
- [x] `shop_health` - Get shop health/launch readiness
- [x] `order_list` - List orders with filters (shop, status, date range)
- [x] `order_get` - Get order details by ID
- [x] `inventory_list` - List inventory items by shop
- [x] `inventory_check` - Check stock for specific SKU
- [ ] `user_list` - List CMS users (NOT IMPLEMENTED)
- [x] `settings_get` - Get shop settings

### Phase 3: CMS Content Tools

- [x] `page_list` - List pages for a shop
- [x] `page_get` - Get page content by slug
- [x] `page_create` - Create new page
- [x] `page_update` - Update page content
- [x] `section_list` - List section templates
- [x] `section_get` - Get section template by ID
- [x] `section_create` - Create section template
- [x] `section_update` - Update section template

### Phase 4: Full CRUD & Mutations

- [ ] `shop_create` - Create new shop (NOT IMPLEMENTED)
- [ ] `shop_update` - Update shop configuration (NOT IMPLEMENTED)
- [ ] `order_update_status` - Update order status (NOT IMPLEMENTED)
- [ ] `inventory_adjust` - Adjust inventory quantity (NOT IMPLEMENTED)
- [x] `settings_update` - Update shop settings

### Phase 5: Resources & Prompts

- [x] Expose Prisma schema as MCP resource
- [ ] Add `shop_context` prompt for debugging workflows (NOT IMPLEMENTED)
- [ ] Add `order_debug` prompt for order investigation (NOT IMPLEMENTED)

### Phase 6: Configuration & Documentation

- [x] Add MCP server config to `.claude/settings.json`
- [x] Create README with usage instructions
- [x] Add to workspace build pipeline
- [x] Document available tools in `.claude/SKILLS_INDEX.md` (partial - referenced in process-emails skill)

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

- [x] MCP server starts without errors
- [x] Claude can query shops and orders
- [x] Claude can read and write CMS content
- [ ] All mutations are properly authorized (partial - no auth.ts utility, but mutations work)
- [x] Documentation is complete (README exists)

## File Estimates vs Actuals

### Original Estimate
**Total:** ~840 lines across 12 files

### Actual Implementation
**Total:** 73+ TypeScript files (45 source files, 28 test files)

Key file sizes (actual):
| File | Lines | Purpose |
|------|-------|---------|
| `packages/mcp-server/src/tools/gmail.ts` | ~78KB | Gmail integration |
| `packages/mcp-server/src/tools/loop.ts` | ~70KB | Startup loop automation |
| `packages/mcp-server/src/tools/draft-generate.ts` | ~32KB | Email draft generation |
| `packages/mcp-server/src/tools/bos.ts` | ~24KB | Business OS integration |
| `packages/mcp-server/src/tools/draft-interpret.ts` | ~20KB | Email intent parsing |
| `packages/mcp-server/src/tools/draft-quality-check.ts` | ~12KB | Draft validation |
| `packages/mcp-server/src/tools/themes.ts` | ~11KB | Theme configuration |
| `packages/mcp-server/src/utils/email-template.ts` | ~11KB | Template engine |
| `packages/mcp-server/src/resources/brikette-knowledge.ts` | ~10KB | Domain knowledge |
| `packages/mcp-server/src/tools/outbound-drafts.ts` | ~9KB | Outbound email management |

**Implementation significantly exceeded original scope** with extensive email processing, Business OS integration, and automation capabilities.

## Dependencies (Actual Implementation)

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "@acme/platform-core": "workspace:^",
    "@acme/config": "workspace:^",
    "@acme/zod-utils": "workspace:^",
    "@google-cloud/local-auth": "^3.0.1",
    "google-auth-library": "^10.5.0",
    "googleapis": "^171.0.0",
    "playwright-core": "1.57.0",
    "zod": "^3.25.73"
  },
  "devDependencies": {
    "@types/node": "^20.19.4",
    "tsx": "^4.19.0",
    "typescript": "^5.8.3"
  }
}
```

**Additional dependencies added for:**
- Google APIs (Gmail integration)
- Playwright (Octorate automation)
- TSX (development execution)

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


## Additional Features Implemented (Beyond Original Plan)

The following tools and features were implemented beyond the original scope:

### Additional Tool Categories
- **Products Tools** (`products.ts`) - Product queries and management
- **Analytics Tools** (`analytics.ts`) - Shop analytics queries
- **Health Tools** (`health.ts`) - System health checks
- **SEO Tools** (`seo.ts`) - SEO data and configuration
- **Discount Tools** (`discounts.ts`) - Discount code management
- **Theme Tools** (`themes.ts`) - Theme configuration
- **Business OS Tools** (`bos.ts`) - Business OS integration (24KB implementation)
- **Loop Tools** (`loop.ts`) - Startup loop automation (70KB implementation)
- **Gmail Tools** (`gmail.ts`) - Gmail integration (78KB implementation)
- **Octorate Tools** (`octorate.ts`) - Octorate booking system integration
- **Email Draft Tools** (`draft-generate.ts`, `draft-interpret.ts`, `draft-quality-check.ts`, `outbound-drafts.ts`) - Email drafting and processing pipeline
- **Booking Email Tools** (`booking-email.ts`, `guest-email-activity.ts`) - Booking-specific email handling

### Additional Resources
- **Brikette Knowledge** (`brikette-knowledge.ts`) - Domain-specific knowledge base
- **Draft Guide** (`draft-guide.ts`) - Email drafting guidelines
- **Email Examples** (`email-examples.ts`) - Email template examples
- **Voice Examples** (`voice-examples.ts`) - Brand voice examples

### Additional Utilities
- **Email Processing** (`email-mime.ts`, `email-signature.ts`, `email-template.ts`) - Email handling utilities
- **Template Management** (`template-ranker.ts`, `template-lint.ts`) - Template quality tools
- **Workflow Triggers** (`workflow-triggers.ts`) - Automated workflow detection
- **Policy Engine** (`policy.ts`, `policy-decision.ts`) - Tool authorization and governance

### Test Coverage
Comprehensive test coverage added in `__tests__/` including:
- Gmail integration tests
- Draft generation and interpretation tests
- Email template tests
- Pipeline integration tests
- Policy decision tests
- Workflow trigger tests

## Outstanding Items

### Not Yet Implemented
1. **Auth Utilities** (`packages/mcp-server/src/utils/auth.ts`) - Authorization helpers planned but not created
2. **User Management Tools** (`user_list`) - CMS user queries
3. **Additional Mutation Tools**:
   - `shop_create` - Create new shop
   - `shop_update` - Update shop configuration
   - `order_update_status` - Update order status
   - `inventory_adjust` - Adjust inventory quantity
4. **Prompts** - No MCP prompt handlers implemented (`shop_context`, `order_debug`)

### Recommendations
1. Create `packages/mcp-server/src/utils/auth.ts` with authorization helpers for mutation operations
2. Implement remaining CRUD operations for shops and orders
3. Add MCP prompt support for common debugging workflows
4. Complete SKILLS_INDEX.md documentation for all MCP tools

## Fact-Check Summary (2026-02-14)

### What Was Found

✅ **Package exists and is fully operational**
- `/Users/petercowling/base-shop/packages/mcp-server/` is a complete, working package
- Built and configured with proper TypeScript setup
- Registered in Claude settings at `.claude/settings.json`

✅ **Core implementation substantially exceeds original plan**
- Original estimate: ~840 lines across 12 files
- Actual: 73+ TypeScript files including comprehensive test coverage
- Major additions: Gmail integration, Business OS tools, email processing pipeline, booking management

✅ **All Phase 1-3 tasks completed** except `user_list` tool

✅ **Phase 4 (Mutations)** partially complete
- `settings_update` implemented
- Missing: `shop_create`, `shop_update`, `order_update_status`, `inventory_adjust`

❌ **Phase 5 (Resources & Prompts)** partially complete
- Prisma schema resource: ✅ Implemented
- Additional resources added (brikette-knowledge, draft-guide, etc.)
- Prompts (`shop_context`, `order_debug`): ❌ Not implemented

✅ **Phase 6 (Configuration)** complete
- MCP server configured in `.claude/settings.json`
- README.md exists
- Build pipeline integrated
- Partial SKILLS_INDEX.md documentation

### Key Discrepancies Fixed

1. **Status**: Changed from "Draft" to "Substantially Complete"
2. **Task checkboxes**: Updated 31 checkboxes to reflect actual implementation state
3. **Architecture diagram**: Updated to show actual file structure (much larger than planned)
4. **Dependencies**: Updated to include Google APIs, Playwright
5. **File estimates**: Updated to reflect ~100x larger implementation
6. **Added "Additional Features"** section documenting scope expansion
7. **Added "Outstanding Items"** section listing what's still missing

### Recommendations for Plan Maintenance

1. Consider splitting this into multiple plans (email processing, Business OS integration, core MCP)
2. Create dedicated plan for email pipeline (draft-generate, draft-interpret, etc.)
3. Document tool policies and governance model
4. Complete missing auth utilities and mutation tools if needed
5. Add MCP prompt support for debugging workflows

## Active tasks

No active tasks at this time.
