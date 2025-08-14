import { type Meta, type StoryObj } from "@storybook/react";
import { FeaturedProductTemplate } from "./FeaturedProductTemplate";
import type { SKU } from "@acme/types";

const meta: Meta<typeof FeaturedProductTemplate> = {
  component: FeaturedProductTemplate,
  args: {
    product: {
      id: "1",
      slug: "sample-product",
      title: "Sample Product",
      price: 99,
      deposit: 0,
      stock: 0,
      forSale: true,
      forRental: false,
      media: [{ url: "/placeholder.svg", type: "image" }],
      sizes: [],
      description: "",
      rating: 4,
      features: ["Feature A", "Feature B"],
    } as SKU & { rating: number; features: string[] },
    ctaLabel: "Add to cart",
  },
  argTypes: {
    product: { control: "object" },
    ctaLabel: { control: "text" },
    onAddToCart: { action: "add-to-cart" },
  },
};
export default meta;

export const Default: StoryObj<typeof FeaturedProductTemplate> = {};
