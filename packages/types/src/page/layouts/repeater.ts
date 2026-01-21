import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";
import type { PageComponent } from "../page";

import { pageComponentSchemaRef } from "./shared";

export interface RepeaterComponent extends PageComponentBase {
  type: "Repeater";
  children?: PageComponent[];
  limit?: number;
  filter?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  columns?: number;
  columnsDesktop?: number;
  columnsTablet?: number;
  columnsMobile?: number;
  gap?: string;
  gapDesktop?: string;
  gapTablet?: string;
  gapMobile?: string;
}

export const repeaterComponentSchema = baseComponentSchema.extend({
  type: z.literal("Repeater"),
  children: z.array(z.lazy(() => pageComponentSchemaRef)).default([]),
  limit: z.number().optional(),
  filter: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  columns: z.number().optional(),
  columnsDesktop: z.number().optional(),
  columnsTablet: z.number().optional(),
  columnsMobile: z.number().optional(),
  gap: z.string().optional(),
  gapDesktop: z.string().optional(),
  gapTablet: z.string().optional(),
  gapMobile: z.string().optional(),
});

