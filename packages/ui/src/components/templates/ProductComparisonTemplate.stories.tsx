import { type Meta, type StoryObj } from "@storybook/nextjs";
import type { SKU } from "@acme/types";
import { ProductComparisonTemplate } from "./ProductComparisonTemplate";

const products: SKU[] = [
  {
    id: "1",
    slug: "product-1",
    title: "Product 1",
    price: 1000,
    deposit: 0,
    stock: 0,
    forSale: true,
    forRental: false,
    media: [{ url: "https://placehold.co/300", type: "image" }],
    sizes: [],
    description: "",
  },
  {
    id: "2",
    slug: "product-2",
    title: "Product 2",
    price: 1500,
    deposit: 0,
    stock: 0,
    forSale: true,
    forRental: false,
    media: [{ url: "https://placehold.co/300", type: "image" }],
    sizes: [],
    description: "",
  },
  {
    id: "3",
    slug: "product-3",
    title: "Product 3",
    price: 2000,
    deposit: 0,
    stock: 0,
    forSale: true,
    forRental: false,
    media: [{ url: "https://placehold.co/300", type: "image" }],
    sizes: [],
    description: "",
  },
];

const meta: Meta<typeof ProductComparisonTemplate> = {
  component: ProductComparisonTemplate,
  args: { products },
};
export default meta;

export const Default: StoryObj<typeof ProductComparisonTemplate> = {};
