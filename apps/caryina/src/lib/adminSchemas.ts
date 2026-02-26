import { z } from "zod";

export const mediaItemInputSchema = z.object({
  url: z.string().min(1),
  type: z.enum(["image", "video"]).default("image"),
  altText: z.string().optional(),
});

/**
 * Request body schema for creating a new product.
 * MVP: title/description are English-only; the API defaults all locales to the English value.
 * price must be in minor currency units (e.g. 2500 = €25.00).
 */
export const createProductSchema = z.object({
  sku: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(""),
  price: z.number().int().positive(),
  currency: z.string().min(1).default("EUR"),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  media: z.array(mediaItemInputSchema).default([]),
  forSale: z.boolean().optional().default(true),
});

/**
 * Request body schema for updating an existing product.
 * All fields are optional; only provided fields are patched.
 */
export const updateProductSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().int().positive().optional(),
  currency: z.string().min(1).optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  media: z.array(mediaItemInputSchema).optional(),
  forSale: z.boolean().optional(),
});

/** Request body schema for updating an inventory item's quantity. */
export const updateInventorySchema = z.object({
  quantity: z.number().int().min(0),
  variantAttributes: z.record(z.string()).optional().default({}),
});
