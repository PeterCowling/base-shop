import type { Meta, StoryObj } from "@storybook/react";
import FeaturedProductBlock from "./FeaturedProductBlock";
import { PRODUCTS } from "@platform-core/src/products";

const meta: Meta<typeof FeaturedProductBlock> = {
  component: FeaturedProductBlock,
  args: {
    sku: PRODUCTS[0] as any,
  },
};
export default meta;

export const Default: StoryObj<typeof FeaturedProductBlock> = {};
