import { z } from "zod";

import {
  errorResult,
  formatError,
  jsonResult,
  shopIdSchema,
} from "../utils/validation.js";

const listProductsSchema = shopIdSchema;
const getProductSchema = shopIdSchema.extend({
  productId: z.string().min(1),
});
const searchProductsSchema = shopIdSchema.extend({
  query: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  inStock: z.boolean().optional(),
});

export const productTools = [
  {
    name: "product_list",
    description: "List all products for a shop",
    inputSchema: {
      type: "object",
      properties: {
        shopId: { type: "string", description: "The shop ID" },
      },
      required: ["shopId"],
    },
  },
  {
    name: "product_get",
    description: "Get details for a specific product",
    inputSchema: {
      type: "object",
      properties: {
        shopId: { type: "string", description: "The shop ID" },
        productId: { type: "string", description: "The product ID" },
      },
      required: ["shopId", "productId"],
    },
  },
  {
    name: "product_search",
    description: "Search products with filters",
    inputSchema: {
      type: "object",
      properties: {
        shopId: { type: "string", description: "The shop ID" },
        query: { type: "string", description: "Search query (searches name, description)" },
        category: { type: "string", description: "Filter by category" },
        minPrice: { type: "number", description: "Minimum price" },
        maxPrice: { type: "number", description: "Maximum price" },
        inStock: { type: "boolean", description: "Only show in-stock items" },
      },
      required: ["shopId"],
    },
  },
  {
    name: "product_stats",
    description: "Get product catalog statistics for a shop",
    inputSchema: {
      type: "object",
      properties: {
        shopId: { type: "string", description: "The shop ID" },
      },
      required: ["shopId"],
    },
  },
] as const;

interface Product {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  price?: number;
  category?: string;
  categories?: string[];
  status?: string;
  inventory?: number;
  stock?: number;
  variants?: Array<{ price?: number; inventory?: number }>;
}

export async function handleProductTool(name: string, args: unknown) {
  try {
    switch (name) {
      case "product_list": {
        const { shopId } = listProductsSchema.parse(args);
        const { readRepo } = await import("@acme/platform-core/repositories/products.server");
        const products = await readRepo<Product>(shopId);

        return jsonResult({
          shopId,
          count: products.length,
          products: products.slice(0, 50).map((p) => ({
            id: p.id,
            name: p.name || p.title,
            price: p.price,
            category: p.category || p.categories?.[0],
            status: p.status,
          })),
          note: products.length > 50 ? `Showing first 50 of ${products.length} products` : undefined,
        });
      }

      case "product_get": {
        const { shopId, productId } = getProductSchema.parse(args);
        const { getProductById } = await import("@acme/platform-core/repositories/products.server");
        const product = await getProductById<Product>(shopId, productId);

        if (!product) {
          return errorResult(`Product not found: ${productId}`);
        }

        return jsonResult(product);
      }

      case "product_search": {
        const { shopId, query, category, minPrice, maxPrice, inStock } = searchProductsSchema.parse(args);
        const { readRepo } = await import("@acme/platform-core/repositories/products.server");
        let products = await readRepo<Product>(shopId);

        // Apply filters
        if (query) {
          const q = query.toLowerCase();
          products = products.filter(
            (p) =>
              (p.name || p.title || "").toLowerCase().includes(q) ||
              (p.description || "").toLowerCase().includes(q)
          );
        }

        if (category) {
          products = products.filter(
            (p) =>
              p.category === category ||
              p.categories?.includes(category)
          );
        }

        if (minPrice !== undefined) {
          products = products.filter((p) => (p.price || 0) >= minPrice);
        }

        if (maxPrice !== undefined) {
          products = products.filter((p) => (p.price || 0) <= maxPrice);
        }

        if (inStock === true) {
          products = products.filter(
            (p) =>
              (p.inventory || p.stock || 0) > 0 ||
              p.variants?.some((v) => (v.inventory || 0) > 0)
          );
        }

        return jsonResult({
          shopId,
          filters: { query, category, minPrice, maxPrice, inStock },
          count: products.length,
          products: products.slice(0, 50).map((p) => ({
            id: p.id,
            name: p.name || p.title,
            price: p.price,
            category: p.category || p.categories?.[0],
            status: p.status,
          })),
        });
      }

      case "product_stats": {
        const { shopId } = listProductsSchema.parse(args);
        const { readRepo } = await import("@acme/platform-core/repositories/products.server");
        const products = await readRepo<Product>(shopId);

        // Calculate statistics
        const categories = new Set<string>();
        let totalValue = 0;
        let inStockCount = 0;
        let outOfStockCount = 0;
        let priceSum = 0;
        let priceCount = 0;

        for (const p of products) {
          if (p.category) categories.add(p.category);
          if (p.categories) p.categories.forEach((c) => categories.add(c));

          if (p.price) {
            priceSum += p.price;
            priceCount++;
            totalValue += p.price * (p.inventory || p.stock || 1);
          }

          const stock = p.inventory || p.stock || 0;
          if (stock > 0) {
            inStockCount++;
          } else {
            outOfStockCount++;
          }
        }

        return jsonResult({
          shopId,
          totalProducts: products.length,
          categories: {
            count: categories.size,
            list: Array.from(categories).slice(0, 20),
          },
          inventory: {
            inStock: inStockCount,
            outOfStock: outOfStockCount,
            inStockRate: products.length > 0
              ? `${((inStockCount / products.length) * 100).toFixed(1)}%`
              : "N/A",
          },
          pricing: {
            averagePrice: priceCount > 0 ? (priceSum / priceCount).toFixed(2) : "N/A",
            estimatedCatalogValue: totalValue.toFixed(2),
          },
        });
      }

      default:
        return errorResult(`Unknown product tool: ${name}`);
    }
  } catch (error) {
    return errorResult(formatError(error));
  }
}
