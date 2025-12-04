// i18n-exempt -- Storybook demo copy and labels
import { type Meta, type StoryObj } from "@storybook/nextjs";
import { ProductBadge } from "../atoms/ProductBadge";
import { ProductCard } from "./ProductCard";
import type { SKU } from "@acme/types";
import { Cover } from "../atoms/primitives/Cover";

const product: SKU = {
  id: "1",
  slug: "sample-product",
  title: "Sample Product",
  price: 29,
  deposit: 0,
  stock: 0,
  forSale: true,
  forRental: false,
  media: [
    {
      url: "https://placehold.co/300x300",
      type: "image",
      altText: "Sample product",
    },
  ],
  sizes: [],
  description: "",
};

const meta: Meta<typeof ProductCard> = {
  title: "Organisms/ProductCard",
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
        className="absolute top-2 start-2"
      />
    </div>
  ),
};

export const OutOfStock: StoryObj<typeof ProductCard> = {
  render: (args) => (
    <div className="relative">
      <ProductCard {...args} />
      <div className="absolute inset-0 bg-fg/60 font-semibold text-bg">
        <Cover minH="[60vh]">Out of stock</Cover>
      </div>
    </div>
  ),
};
