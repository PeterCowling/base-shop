import { z } from "zod";
import { PageComponentBase, baseComponentSchema } from "./base";

/** Slider of testimonials. `minItems`/`maxItems` limit visible testimonials */
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
