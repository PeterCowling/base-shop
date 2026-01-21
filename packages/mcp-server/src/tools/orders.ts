import { z } from "zod";

import {
  errorResult,
  formatError,
  jsonResult,
  orderFilterSchema,
} from "../utils/validation.js";

const listOrdersSchema = orderFilterSchema;

const getOrderSchema = z.object({
  shopId: z.string().min(1),
  sessionId: z.string().min(1),
});

export const orderTools = [
  {
    name: "order_list",
    description: "List orders with optional filters (shop, status, customer)",
    inputSchema: {
      type: "object",
      properties: {
        shopId: { type: "string", description: "Filter by shop ID" },
        status: { type: "string", description: "Filter by order status" },
        customerId: { type: "string", description: "Filter by customer ID" },
        limit: { type: "number", description: "Max results (1-100)", default: 50 },
        offset: { type: "number", description: "Skip N results", default: 0 },
      },
    },
  },
  {
    name: "order_get",
    description: "Get details for a specific order by shop and session ID",
    inputSchema: {
      type: "object",
      properties: {
        shopId: { type: "string", description: "The shop ID" },
        sessionId: { type: "string", description: "The order session ID" },
      },
      required: ["shopId", "sessionId"],
    },
  },
] as const;

export async function handleOrderTool(name: string, args: unknown) {
  try {
    switch (name) {
      case "order_list": {
        const { shopId, status, customerId, limit, offset } = listOrdersSchema.parse(args);
        const { listOrders, getOrdersForCustomer } = await import("@acme/platform-core/orders");

        let orders;
        if (customerId && shopId) {
          orders = await getOrdersForCustomer(shopId, customerId);
        } else if (shopId) {
          orders = await listOrders(shopId);
        } else {
          return errorResult("shopId is required to list orders");
        }

        if (status) {
          orders = orders.filter((o) => o.status === status);
        }

        const paginated = orders.slice(offset, offset + limit);
        return jsonResult({
          orders: paginated,
          total: orders.length,
          limit,
          offset,
        });
      }

      case "order_get": {
        const { shopId, sessionId } = getOrderSchema.parse(args);
        const { listOrders } = await import("@acme/platform-core/orders");
        const orders = await listOrders(shopId);
        const order = orders.find((o) => o.sessionId === sessionId);
        if (!order) {
          return errorResult(`Order not found: ${shopId}/${sessionId}`);
        }
        return jsonResult(order);
      }

      default:
        return errorResult(`Unknown order tool: ${name}`);
    }
  } catch (error) {
    return errorResult(formatError(error));
  }
}
