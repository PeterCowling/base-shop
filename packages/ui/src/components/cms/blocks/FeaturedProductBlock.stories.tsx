import type { Meta, StoryObj } from "@storybook/react";
import FeaturedProductBlock from "./FeaturedProductBlock";
import { PRODUCTS } from "@acme/platform-core/products/index";
import type { SKU } from "@acme/types";

const meta = {
  component: FeaturedProductBlock,
  args: {
    sku: PRODUCTS[0] as SKU,
  },
} satisfies Meta<typeof FeaturedProductBlock>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
