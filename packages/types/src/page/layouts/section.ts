import { z } from "zod";
import { baseComponentSchema, type PageComponentBase } from "../base";
import type { PageComponent } from "../page";
import { pageComponentSchemaRef } from "./shared";

export interface SectionComponent extends PageComponentBase {
  type: "Section";
  children?: PageComponent[];
}

export const sectionComponentSchema = baseComponentSchema.extend({
  type: z.literal("Section"),
  children: z.array(z.lazy(() => pageComponentSchemaRef)).default([]),
});
