import {
  errorResult,
  formatError,
  jsonResult,
  paginationSchema,
  shopIdSchema,
} from "../utils/validation.js";

const listShopsSchema = paginationSchema;
const getShopSchema = shopIdSchema;

export const shopTools = [
  {
    name: "shop_list",
    description: "List all shops in the platform with pagination",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max results (1-100)", default: 50 },
        offset: { type: "number", description: "Skip N results", default: 0 },
      },
    },
  },
  {
    name: "shop_get",
    description: "Get full configuration for a specific shop by ID",
    inputSchema: {
      type: "object",
      properties: {
        shopId: { type: "string", description: "The shop ID" },
      },
      required: ["shopId"],
    },
  },
  {
    name: "shop_health",
    description: "Get health/launch readiness status for a shop",
    inputSchema: {
      type: "object",
      properties: {
        shopId: { type: "string", description: "The shop ID" },
      },
      required: ["shopId"],
    },
  },
] as const;

export async function handleShopTool(name: string, args: unknown) {
  try {
    switch (name) {
      case "shop_list": {
        const { limit, offset } = listShopsSchema.parse(args);
        const page = Math.floor(offset / limit) + 1;
        const { listShops } = await import("@acme/platform-core/repositories/shops.server");
        const shops = await listShops(page, limit);
        return jsonResult({ shops, page, limit, count: shops.length });
      }

      case "shop_get": {
        const { shopId } = getShopSchema.parse(args);
        const { readShop } = await import("@acme/platform-core/repositories/shops.server");
        const shop = await readShop(shopId);
        return jsonResult(shop);
      }

      case "shop_health": {
        const { shopId } = getShopSchema.parse(args);
        const { deriveOperationalHealth } = await import("@acme/platform-core/shops/health");
        const health = await deriveOperationalHealth(shopId);
        return jsonResult(health);
      }

      default:
        return errorResult(`Unknown shop tool: ${name}`);
    }
  } catch (error) {
    return errorResult(formatError(error));
  }
}
