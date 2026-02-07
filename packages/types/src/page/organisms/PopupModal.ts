import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface PopupModalComponent extends PageComponentBase {
  type: "PopupModal";
  trigger?: "load" | "delay" | "exit";
  delay?: number;
  content?: string;
}

export const popupModalComponentSchema = baseComponentSchema.extend({
  type: z.literal("PopupModal"),
  trigger: z.enum(["load", "delay", "exit"]).optional(),
  delay: z.number().int().min(0).optional(),
  content: z.string().optional(),
});

