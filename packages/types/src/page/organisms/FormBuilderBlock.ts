import { z } from "zod";
import { baseComponentSchema, type PageComponentBase } from "../base";
import { formFieldSchema, type FormField } from "../forms";

export interface FormBuilderBlockComponent extends PageComponentBase {
  type: "FormBuilderBlock";
  action?: string;
  method?: string;
  fields?: FormField[];
  submitLabel?: string;
}

export const formBuilderBlockComponentSchema = baseComponentSchema.extend({
  type: z.literal("FormBuilderBlock"),
  action: z.string().optional(),
  method: z.string().optional(),
  fields: z.array(formFieldSchema).optional(),
  submitLabel: z.string().optional(),
});

