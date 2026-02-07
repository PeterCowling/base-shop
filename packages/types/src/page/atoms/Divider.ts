import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface DividerComponent extends PageComponentBase {
  type: "Divider";
  /** Thickness of the divider */
  height?: string;
}

export const dividerComponentSchema = baseComponentSchema.extend({
  type: z.literal("Divider"),
  height: z.string().optional(),
});

