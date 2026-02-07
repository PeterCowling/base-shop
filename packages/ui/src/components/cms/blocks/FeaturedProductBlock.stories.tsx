import type { Meta, StoryObj } from "@storybook/nextjs";

import { PRODUCTS } from "@acme/platform-core/products/index";
import type { SKU } from "@acme/types";

import FeaturedProductBlock from "./FeaturedProductBlock";

const meta: Meta<typeof FeaturedProductBlock> = {
  title: "CMS Blocks/FeaturedProductBlock",
  component: FeaturedProductBlock,
  args: {
    sku: PRODUCTS[0] as SKU,
  },
};
export default meta;

export const Default: StoryObj<typeof FeaturedProductBlock> = {};
