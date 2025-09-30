import type { Meta, StoryObj } from "@storybook/react";
import TestimonialSlider from "./TestimonialSlider";

const meta = {
  component: TestimonialSlider,
  args: {
    testimonials: [
      { quote: "Amazing!", name: "Alice" },
      { quote: "Would buy again", name: "Bob" },
    ],
  },
} satisfies Meta<typeof TestimonialSlider>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
