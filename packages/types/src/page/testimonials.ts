import { z } from "zod";
import { PageComponentBase, baseComponentSchema } from "./base";

export interface TestimonialsComponent extends PageComponentBase {
  type: "Testimonials";
  testimonials?: { quote: string; name?: string }[];
}

export const testimonialsComponentSchema = baseComponentSchema.extend({
  type: z.literal("Testimonials"),
  testimonials: z
    .array(z.object({ quote: z.string(), name: z.string().optional() }))
    .optional(),
});
