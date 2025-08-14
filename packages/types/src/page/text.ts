import { z } from "zod";
import { PageComponentBase, baseComponentSchema } from "./base";

export interface TextComponent extends PageComponentBase {
  type: "Text";
  text?: string;
}

export const textComponentSchema = baseComponentSchema.extend({
  type: z.literal("Text"),
  text: z.string().optional(),
});
