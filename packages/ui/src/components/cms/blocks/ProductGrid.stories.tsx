import type { Meta, StoryObj } from "@storybook/react";
import ProductGrid from "./ProductGrid.client";
import { PRODUCTS } from "@acme/platform-core/products/index";

const meta = {
  component: ProductGrid,
  args: { skus: [...PRODUCTS] },
} satisfies Meta<typeof ProductGrid>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;

export const Bounded = {
  args: { minItems: 1, maxItems: 2 },
} satisfies Story;
