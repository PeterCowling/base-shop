import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";
import type { PageComponent } from "../page";

import { pageComponentSchemaRef } from "./shared";

export interface DatasetComponent extends PageComponentBase {
  type: "Dataset";
  children?: PageComponent[];
  source?: "products" | "blog" | "sanity" | "manual";
  collectionId?: string; // products
  skus?: { id: string }[]; // manual products
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  itemRoutePattern?: string; // e.g. /blog/{slug}
  cacheKey?: string;
  ttlMs?: number;
}

export const datasetComponentSchema = baseComponentSchema.extend({
  type: z.literal("Dataset"),
  children: z.array(z.lazy(() => pageComponentSchemaRef)).default([]),
  source: z.enum(["products", "blog", "sanity", "manual"]).optional(),
  collectionId: z.string().optional(),
  skus: z.array(z.object({ id: z.string() })).optional(),
  limit: z.number().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  itemRoutePattern: z.string().optional(),
  cacheKey: z.string().optional(),
  ttlMs: z.number().optional(),
});
