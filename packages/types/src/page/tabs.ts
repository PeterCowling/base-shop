import { z } from "zod";
import { PageComponentBase, baseComponentSchema } from "./base";
import type { PageComponent } from ".";

export interface TabsComponent extends PageComponentBase {
  type: "Tabs";
  labels?: string[];
  active?: number;
  children?: PageComponent[];
}

export const createTabsComponentSchema = (
  getPageComponentSchema: () => z.ZodType<PageComponent>
): z.ZodType<TabsComponent> =>
  baseComponentSchema.extend({
    type: z.literal("Tabs"),
    labels: z.array(z.string()).default([]),
    active: z.number().optional(),
    children: z.array(z.lazy(getPageComponentSchema)).default([]),
  });
