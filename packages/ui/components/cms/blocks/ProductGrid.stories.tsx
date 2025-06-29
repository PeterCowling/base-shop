import type { Meta, StoryObj } from "@storybook/react";
import ProductGrid from "./ProductGrid";

const meta: Meta<typeof ProductGrid> = {
  component: ProductGrid,
  args: {},
};
export default meta;

export const Default: StoryObj<typeof ProductGrid> = {};
