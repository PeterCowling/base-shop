import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";
import type { PageComponent } from "../page";

import { pageComponentSchemaRef } from "./shared";

export interface TabsComponent extends PageComponentBase {
  type: "Tabs";
  labels?: string[];
  active?: number;
  children?: PageComponent[];
}

export const tabsComponentSchema = baseComponentSchema.extend({
  type: z.literal("Tabs"),
  labels: z.array(z.string()).default([]),
  active: z.number().optional(),
  children: z.array(z.lazy(() => pageComponentSchemaRef)).default([]),
});
