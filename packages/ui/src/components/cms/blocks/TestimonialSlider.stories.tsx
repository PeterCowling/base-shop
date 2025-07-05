import type { Meta, StoryObj } from "@storybook/react";
import TestimonialSlider from "./TestimonialSlider";

const meta: Meta<typeof TestimonialSlider> = {
  component: TestimonialSlider,
  args: {
    testimonials: [
      { quote: "Amazing!", name: "Alice" },
      { quote: "Would buy again", name: "Bob" },
    ],
  },
};
export default meta;

export const Default: StoryObj<typeof TestimonialSlider> = {};
