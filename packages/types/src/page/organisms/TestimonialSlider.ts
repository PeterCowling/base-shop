import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface TestimonialSliderComponent extends PageComponentBase {
  type: "TestimonialSlider";
  testimonials?: { quote: string; name?: string }[];
}

export const testimonialSliderComponentSchema = baseComponentSchema.extend({
  type: z.literal("TestimonialSlider"),
  testimonials: z
    .array(z.object({ quote: z.string(), name: z.string().optional() }))
    .optional(),
});

