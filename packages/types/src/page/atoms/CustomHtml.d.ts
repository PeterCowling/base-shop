import { z } from "zod";
import { type PageComponentBase } from "../base";

export interface CustomHtmlComponent extends PageComponentBase {
  type: "CustomHtml";
  html?: string;
}

export declare const customHtmlComponentSchema: z.ZodType<CustomHtmlComponent>;
