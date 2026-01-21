import { type z } from "zod";

export let pageComponentSchemaRef: z.ZodTypeAny;
export const bindPageComponentSchema = (schema: z.ZodTypeAny) => {
  pageComponentSchemaRef = schema;
};
