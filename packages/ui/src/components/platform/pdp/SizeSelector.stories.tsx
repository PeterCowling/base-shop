import type { Meta, StoryObj } from "@storybook/react";

import { SizeSelector } from "./index";

const meta: Meta<typeof SizeSelector> = {
  title: "Platform/PDP/SizeSelector",
  component: SizeSelector,
  args: {
    sizes: ["XS", "S", "M", "L", "XL"],
    onSelect: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof SizeSelector>;

export const Default: Story = {};

export const LongList: Story = {
  args: {
    sizes: ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"],
  },
};
