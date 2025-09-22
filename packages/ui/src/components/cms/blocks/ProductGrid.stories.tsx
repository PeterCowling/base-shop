import type { Meta, StoryObj } from "@storybook/react";
import ProductGrid from "./ProductGrid.client";
import { PRODUCTS } from "@acme/platform-core/products/index";

const meta: Meta<typeof ProductGrid> = {
  component: ProductGrid,
  args: { skus: [...PRODUCTS] },
};
export default meta;

export const Default: StoryObj<typeof ProductGrid> = {};

export const Bounded: StoryObj<typeof ProductGrid> = {
  args: { minItems: 1, maxItems: 2 },
};
