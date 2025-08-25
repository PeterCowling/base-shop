import { z } from "zod";
import { type PageComponentBase } from "../base";

export interface TextComponent extends PageComponentBase {
  type: "Text";
  text?: string;
}

export declare const textComponentSchema: z.ZodType<TextComponent>;
