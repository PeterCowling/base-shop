import { z } from "zod";
import { PageComponentBase, baseComponentSchema } from "./base";
import type { PageComponent } from ".";

export interface SectionComponent extends PageComponentBase {
  type: "Section";
  children?: PageComponent[];
}

export const createSectionComponentSchema = (
  getPageComponentSchema: () => z.ZodType<PageComponent>
): z.ZodType<SectionComponent> =>
  baseComponentSchema.extend({
    type: z.literal("Section"),
    children: z.array(z.lazy(getPageComponentSchema)).default([]),
  });
