import type { Meta, StoryObj } from "@storybook/react";
import Testimonials from "./Testimonials";

const meta = {
  component: Testimonials,
  args: {
    testimonials: [
      { quote: "Great service!", name: "Alice" },
      { quote: "Love the products!", name: "Bob" },
    ],
  },
} satisfies Meta<typeof Testimonials>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
