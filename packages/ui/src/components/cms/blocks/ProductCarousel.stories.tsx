import type { Meta, StoryObj } from "@storybook/react";
import ProductCarousel from "./ProductCarousel";
import { PRODUCTS } from "@acme/platform-core/products/index";
import type { SKU } from "@acme/types";

const meta = {
  component: ProductCarousel,
  args: { skus: PRODUCTS as SKU[] },
} satisfies Meta<typeof ProductCarousel>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;

export const Bounded = {
  args: { minItems: 2, maxItems: 4 },
} satisfies Story;
