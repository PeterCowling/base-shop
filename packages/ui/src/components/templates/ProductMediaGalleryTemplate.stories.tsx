import { type Meta, type StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { ProductMediaGalleryTemplate } from "./ProductMediaGalleryTemplate";
import type { SKU } from "@acme/types";

const meta: Meta<typeof ProductMediaGalleryTemplate> = {
  component: ProductMediaGalleryTemplate,
  args: {
    product: {
      id: "1",
      slug: "media-product",
      title: "Media Product",
      price: 49,
      deposit: 0,
      stock: 0,
      forSale: true,
      forRental: false,
      media: [
        { type: "image" as const, url: "/placeholder.svg" },
        { type: "image" as const, url: "/placeholder.svg" },
      ],
      sizes: [],
      description: "",
    } as SKU,
    ctaLabel: "Add to cart",
    onAddToCart: fn(),
  },
  argTypes: {
    product: { control: "object" },
    ctaLabel: { control: "text" },
  },
};
export default meta;

export const Default: StoryObj<typeof ProductMediaGalleryTemplate> = {};
