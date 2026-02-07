import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface ValuePropsComponent extends PageComponentBase {
  type: "ValueProps";
  items?: { icon: string; title: string; desc: string }[];
}

export const valuePropsComponentSchema = baseComponentSchema.extend({
  type: z.literal("ValueProps"),
  items: z
    .array(z.object({ icon: z.string(), title: z.string(), desc: z.string() }))
    .optional(),
});

