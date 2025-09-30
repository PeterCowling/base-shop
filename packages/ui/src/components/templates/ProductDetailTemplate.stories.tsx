import { type Meta, type StoryObj } from "@storybook/react";
import { ProductDetailTemplate } from "./ProductDetailTemplate";
import type { SKU } from "@acme/types";

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

const meta = {
  component: ProductDetailTemplate,
  args: { product },
} satisfies Meta<typeof ProductDetailTemplate>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
