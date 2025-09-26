import { z } from "zod";
import { baseComponentSchema, type PageComponentBase } from "../base";

export interface ShowcaseSectionComponent extends PageComponentBase {
  type: "ShowcaseSection";
  preset?: "featured" | "new" | "bestsellers" | "clearance" | "limited";
  layout?: "carousel" | "grid";
  limit?: number;
  endpoint?: string;
  gridCols?: 2 | 3 | 4;
}

export const showcaseSectionComponentSchema = baseComponentSchema.extend({
  type: z.literal("ShowcaseSection"),
  preset: z.enum(["featured", "new", "bestsellers", "clearance", "limited"]).optional(),
  layout: z.enum(["carousel", "grid"]).optional(),
  limit: z.number().int().positive().optional(),
  endpoint: z.string().optional(),
  gridCols: z.union([z.literal(2), z.literal(3), z.literal(4)]).optional(),
});

