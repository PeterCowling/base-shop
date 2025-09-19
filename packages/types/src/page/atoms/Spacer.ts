import { z } from "zod";
import { baseComponentSchema, type PageComponentBase } from "../base";

export interface SpacerComponent extends PageComponentBase {
  type: "Spacer";
  /** Amount of vertical whitespace */
  height?: string;
}

export const spacerComponentSchema = baseComponentSchema.extend({
  type: z.literal("Spacer"),
  height: z.string().optional(),
});

