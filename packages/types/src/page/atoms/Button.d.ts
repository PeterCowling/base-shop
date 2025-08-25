import { z } from "zod";
import { type PageComponentBase } from "../base";

export interface ButtonComponent extends PageComponentBase {
  type: "Button";
  label?: string;
  href?: string;
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
}

export declare const buttonComponentSchema: z.ZodType<ButtonComponent>;
