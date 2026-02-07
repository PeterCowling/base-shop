import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface ButtonComponent extends PageComponentBase {
  type: "Button";
  label?: string;
  href?: string;
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
}

export const buttonComponentSchema = baseComponentSchema.extend({
  type: z.literal("Button"),
  label: z.string().optional(),
  href: z.string().optional(),
  variant: z.enum(["default", "outline", "ghost", "destructive"]).optional(),
  size: z.enum(["sm", "md", "lg"]).optional(),
});

