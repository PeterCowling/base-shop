import type { Meta, StoryObj } from "@storybook/nextjs";
import ProductCarousel from "./ProductCarousel";
import { PRODUCTS } from "@acme/platform-core/products/index";
import type { SKU } from "@acme/types";

const meta: Meta<typeof ProductCarousel> = {
  title: "CMS Blocks/ProductCarousel",
  component: ProductCarousel,
  args: { skus: PRODUCTS as SKU[] },
};
export default meta;

export const Default: StoryObj<typeof ProductCarousel> = {};

export const Bounded: StoryObj<typeof ProductCarousel> = {
  args: { minItems: 2, maxItems: 4 },
};
