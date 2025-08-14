import { z } from "zod";
import { baseComponentSchema, type PageComponentBase } from "./base";

export interface ImageComponent extends PageComponentBase {
  type: "Image";
  src?: string;
  alt?: string;
}

export const imageComponentSchema = baseComponentSchema.extend({
  type: z.literal("Image"),
  src: z.string().optional(),
  alt: z.string().optional(),
});

export interface TextComponent extends PageComponentBase {
  type: "Text";
  text?: string;
}

export const textComponentSchema = baseComponentSchema.extend({
  type: z.literal("Text"),
  text: z.string().optional(),
});

export interface CustomHtmlComponent extends PageComponentBase {
  type: "CustomHtml";
  html?: string;
}

export const customHtmlComponentSchema = baseComponentSchema.extend({
  type: z.literal("CustomHtml"),
  html: z.string().optional(),
});

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
  variant: z
    .enum(["default", "outline", "ghost", "destructive"])
    .optional(),
  size: z.enum(["sm", "md", "lg"]).optional(),
});

