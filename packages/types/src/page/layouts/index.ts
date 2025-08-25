import type { z } from "zod";

export let pageComponentSchemaRef: z.ZodTypeAny;
export const bindPageComponentSchema = (schema: z.ZodTypeAny) => {
  pageComponentSchemaRef = schema;
};

export * from "./header";
export * from "./footer";
export * from "./section";
export * from "./multi-column";
export * from "./tabs";

