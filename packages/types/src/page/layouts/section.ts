import { z } from "zod";
import { baseComponentSchema, type PageComponentBase } from "../base";
import type { PageComponent } from "../page";
import { pageComponentSchemaRef } from "./shared";

export interface SectionComponent extends PageComponentBase {
  type: "Section";
  children?: PageComponent[];
  /** Optional per-section grid column count for editor snapping */
  gridCols?: number;
  /** Optional per-section grid gutter (px/rem) for editor overlay */
  gridGutter?: string;
  /** Optional per-section toggle: enable grid snapping for children */
  gridSnap?: boolean;
}

export const sectionComponentSchema = baseComponentSchema.extend({
  type: z.literal("Section"),
  children: z.array(z.lazy(() => pageComponentSchemaRef)).default([]),
  gridCols: z.number().int().min(1).max(24).optional(),
  gridGutter: z.string().optional(),
  gridSnap: z.boolean().optional(),
});
