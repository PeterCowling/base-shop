import { z } from "zod";
import { baseComponentSchema, type PageComponentBase } from "../base";
import type { PageComponent } from "../page";
import { pageComponentSchemaRef } from "./shared";

export interface TabsAccordionContainerComponent extends PageComponentBase {
  type: "TabsAccordionContainer";
  children?: PageComponent[];
  mode?: "tabs" | "accordion";
  tabs?: string[];
}

export const tabsAccordionContainerComponentSchema = baseComponentSchema.extend({
  type: z.literal("TabsAccordionContainer"),
  children: z.array(z.lazy(() => pageComponentSchemaRef)).default([]),
  mode: z.enum(["tabs", "accordion"]).optional(),
  tabs: z.array(z.string()).optional(),
});

