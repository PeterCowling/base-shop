// i18n-exempt -- Storybook demo copy and labels
import { type Meta, type StoryObj } from "@storybook/react";
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

const meta = {
  component: ProductCard,
  args: { product },
} satisfies Meta<typeof ProductCard>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;

export const WithBadge = {
  decorators: [
    (Story) => (
      <div className="relative">
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <>
      <ProductCard {...args} />
      <ProductBadge
        label="Sale"
        variant="sale"
        className="absolute top-2 start-2"
      />
    </>
  ),
} satisfies Story;

export const OutOfStock = {
  decorators: [
    (Story) => (
      <div className="relative">
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <>
      <ProductCard {...args} />
      <div className="absolute inset-0 bg-fg/60 font-semibold text-bg">
        <Cover minH="[60vh]">Out of stock</Cover>
      </div>
    </>
  ),
} satisfies Story;
