import type { Meta, StoryObj } from "@storybook/react";
import ProductCarousel from "./ProductCarousel";
import { PRODUCTS } from "@acme/platform-core/products";

const meta: Meta<typeof ProductCarousel> = {
  component: ProductCarousel,
  args: { skus: PRODUCTS as any },
};
export default meta;

export const Default: StoryObj<typeof ProductCarousel> = {};

export const Bounded: StoryObj<typeof ProductCarousel> = {
  args: { minItems: 2, maxItems: 4 },
};
