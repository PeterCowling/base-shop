import { z } from "zod";

import {
  errorResult,
  formatError,
  jsonResult,
  paginationSchema,
  shopIdSchema,
} from "../utils/validation.js";

const listInventorySchema = paginationSchema.merge(shopIdSchema);

const checkStockSchema = z.object({
  shopId: z.string().min(1),
  sku: z.string().min(1),
});

export const inventoryTools = [
  {
    name: "inventory_list",
    description: "List inventory items for a shop",
    inputSchema: {
      type: "object",
      properties: {
        shopId: { type: "string", description: "The shop ID" },
        limit: { type: "number", description: "Max results (1-100)", default: 50 },
        offset: { type: "number", description: "Skip N results", default: 0 },
      },
      required: ["shopId"],
    },
  },
  {
    name: "inventory_check",
    description: "Check stock level for a specific SKU",
    inputSchema: {
      type: "object",
      properties: {
        shopId: { type: "string", description: "The shop ID" },
        sku: { type: "string", description: "The product SKU" },
      },
      required: ["shopId", "sku"],
    },
  },
] as const;

export async function handleInventoryTool(name: string, args: unknown) {
  try {
    switch (name) {
      case "inventory_list": {
        const { shopId, limit, offset } = listInventorySchema.parse(args);
        const { prisma } = await import("@acme/platform-core/db");
        const items = await prisma.inventoryItem.findMany({
          where: { shopId },
          skip: offset,
          take: limit,
          orderBy: { sku: "asc" },
        });
        const total = await prisma.inventoryItem.count({ where: { shopId } });
        return jsonResult({ items, total, limit, offset });
      }

      case "inventory_check": {
        const { shopId, sku } = checkStockSchema.parse(args);
        const { prisma } = await import("@acme/platform-core/db");
        const items = await prisma.inventoryItem.findMany({
          where: { shopId, sku },
        });
        const totalQuantity = items.reduce(
          (sum: number, item: { quantity: number }) => sum + item.quantity,
          0
        );
        return jsonResult({
          sku,
          shopId,
          variants: items,
          totalQuantity,
          inStock: totalQuantity > 0,
        });
      }

      default:
        return errorResult(`Unknown inventory tool: ${name}`);
    }
  } catch (error) {
    return errorResult(formatError(error));
  }
}
