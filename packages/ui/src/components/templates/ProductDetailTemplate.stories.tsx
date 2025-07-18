import { type Meta, type StoryObj } from "@storybook/react";
import { ProductDetailTemplate } from "./ProductDetailTemplate";

const product = {
  id: "1",
  title: "Sample Product",
  image: "https://placehold.co/600",
  price: 99.99,
  description: "A wonderful item",
};

const meta: Meta<typeof ProductDetailTemplate> = {
  component: ProductDetailTemplate,
  args: { product },
};
export default meta;

export const Default: StoryObj<typeof ProductDetailTemplate> = {};
