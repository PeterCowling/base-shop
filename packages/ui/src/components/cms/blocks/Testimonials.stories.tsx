import type { Meta, StoryObj } from "@storybook/nextjs";
import Testimonials from "./Testimonials";

const meta: Meta<typeof Testimonials> = {
  component: Testimonials,
  args: {
    testimonials: [
      { quote: "Great service!", name: "Alice" },
      { quote: "Love the products!", name: "Bob" },
    ],
  },
};
export default meta;

export const Default: StoryObj<typeof Testimonials> = {};
