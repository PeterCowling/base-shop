import { z } from "zod";
import { PageComponentBase, baseComponentSchema } from "./base";

export interface VideoBlockComponent extends PageComponentBase {
  type: "VideoBlock";
  src?: string;
  autoplay?: boolean;
}

export const videoBlockComponentSchema = baseComponentSchema.extend({
  type: z.literal("VideoBlock"),
  src: z.string().optional(),
  autoplay: z.boolean().optional(),
});
