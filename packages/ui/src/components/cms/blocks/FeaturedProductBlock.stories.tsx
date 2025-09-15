import type { Meta, StoryObj } from "@storybook/react";
import FeaturedProductBlock from "./FeaturedProductBlock";
import { PRODUCTS } from "@acme/platform-core/products/index";
import type { SKU } from "@acme/types";

const meta: Meta<typeof FeaturedProductBlock> = {
  component: FeaturedProductBlock,
  args: {
    sku: PRODUCTS[0] as SKU,
  },
};
export default meta;

export const Default: StoryObj<typeof FeaturedProductBlock> = {};
