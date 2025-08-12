import { type Meta, type StoryObj } from "@storybook/react";
import { ProductBadge } from "../atoms/ProductBadge";
import { ProductCard, type Product } from "./ProductCard";

const product: Product = {
  id: "1",
  title: "Sample Product",
  media: [{ url: "https://placehold.co/300x300", type: "image" }],
  price: 29,
};

const meta: Meta<typeof ProductCard> = {
  component: ProductCard,
  args: { product },
};
export default meta;

export const Default: StoryObj<typeof ProductCard> = {};

export const WithBadge: StoryObj<typeof ProductCard> = {
  render: (args) => (
    <div className="relative">
      <ProductCard {...args} />
      <ProductBadge
        label="Sale"
        variant="sale"
        className="absolute top-2 left-2"
      />
    </div>
  ),
};

export const OutOfStock: StoryObj<typeof ProductCard> = {
  render: (args) => (
    <div className="relative">
      <ProductCard {...args} />
      <div className="absolute inset-0 flex items-center justify-center bg-fg/60 font-semibold text-bg">
        Out of stock
      </div>
    </div>
  ),
};
