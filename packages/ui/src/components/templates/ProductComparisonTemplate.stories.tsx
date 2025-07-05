import { type Meta, type StoryObj } from "@storybook/react";
import type { Product } from "../organisms/ProductCard";
import { ProductComparisonTemplate } from "./ProductComparisonTemplate";

const products: Product[] = [
  {
    id: "1",
    title: "Product 1",
    image: "https://placehold.co/300",
    price: 1000,
  },
  {
    id: "2",
    title: "Product 2",
    image: "https://placehold.co/300",
    price: 1500,
  },
  {
    id: "3",
    title: "Product 3",
    image: "https://placehold.co/300",
    price: 2000,
  },
];

const meta: Meta<typeof ProductComparisonTemplate> = {
  component: ProductComparisonTemplate,
  args: { products },
};
export default meta;

export const Default: StoryObj<typeof ProductComparisonTemplate> = {};
