import type { Meta, StoryObj } from "@storybook/nextjs";

import Testimonials from "./Testimonials";

const meta: Meta<typeof Testimonials> = {
  title: "CMS Blocks/Testimonials",
  component: Testimonials,
  args: {
    testimonials: [
      { quote: "Great service!", name: "Alice" },
      { quote: "Love the products!", name: "Bob" },
    ],
  },
};
export default meta;

type Story = StoryObj<typeof Testimonials>;
const baseArgs = meta.args!;

export const Default: Story = {};
export const Loading: Story = {
  args: { ...baseArgs },
  parameters: { dataState: "loading" },
};
export const Empty: Story = {
  args: { testimonials: [] },
  parameters: { dataState: "empty" },
};
export const Error: Story = {
  args: { ...baseArgs },
  parameters: { dataState: "error" },
};
export const RTL: Story = {
  args: { ...baseArgs },
  parameters: { rtl: true },
};
