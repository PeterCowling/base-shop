import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";
import type { PageComponent } from "../page";

import { pageComponentSchemaRef } from "./shared";

export interface MultiColumnComponent extends PageComponentBase {
  type: "MultiColumn";
  columns?: number;
  gap?: string;
  children?: PageComponent[];
}

export const multiColumnComponentSchema = baseComponentSchema.extend({
  type: z.literal("MultiColumn"),
  columns: z.number().optional(),
  gap: z.string().optional(),
  children: z.array(z.lazy(() => pageComponentSchemaRef)).default([]),
});
