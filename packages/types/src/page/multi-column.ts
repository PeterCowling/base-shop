import { z } from "zod";
import { PageComponentBase, baseComponentSchema } from "./base";
import type { PageComponent } from ".";

export interface MultiColumnComponent extends PageComponentBase {
  type: "MultiColumn";
  columns?: number;
  gap?: string;
  children?: PageComponent[];
}

export const createMultiColumnComponentSchema = (
  getPageComponentSchema: () => z.ZodType<PageComponent>
): z.ZodType<MultiColumnComponent> =>
  baseComponentSchema.extend({
    type: z.literal("MultiColumn"),
    columns: z.number().optional(),
    gap: z.string().optional(),
    children: z.array(z.lazy(getPageComponentSchema)).default([]),
  });
