import type { Meta, StoryObj } from "@storybook/react";
import FeaturedProduct from "./FeaturedProductBlock";
import { PRODUCTS } from "@platform-core/src/products";

const meta: Meta<typeof FeaturedProduct> = {
  component: FeaturedProduct,
  args: { sku: PRODUCTS[0] },
};
export default meta;

export const Default: StoryObj<typeof FeaturedProduct> = {};
