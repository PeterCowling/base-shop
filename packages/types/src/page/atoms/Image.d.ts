import { z } from "zod";
import { type PageComponentBase } from "../base";

export interface ImageComponent extends PageComponentBase {
  type: "Image";
  src?: string;
  alt?: string;
}

export declare const imageComponentSchema: z.ZodType<ImageComponent>;
