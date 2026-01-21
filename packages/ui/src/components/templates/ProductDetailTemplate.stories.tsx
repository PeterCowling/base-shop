import { type Meta, type StoryObj } from "@storybook/nextjs";

import type { SKU } from "@acme/types";

import { ProductDetailTemplate } from "./ProductDetailTemplate";

const product: SKU = {
  id: "1",
  slug: "sample-product",
  title: "Sample Product",
  price: 99.99,
  deposit: 0,
  stock: 0,
  forSale: true,
  forRental: false,
  media: [{ url: "https://placehold.co/600", type: "image" as const }],
  sizes: [],
  description: "A wonderful item",
};

const meta: Meta<typeof ProductDetailTemplate> = {
  title: "Templates/ProductDetailTemplate",
  component: ProductDetailTemplate,
  args: { product },
};
export default meta;

export const Default: StoryObj<typeof ProductDetailTemplate> = {};
