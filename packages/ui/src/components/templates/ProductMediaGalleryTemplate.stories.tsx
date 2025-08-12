import { type Meta, type StoryObj } from "@storybook/react";
import { ProductMediaGalleryTemplate } from "./ProductMediaGalleryTemplate";

const meta: Meta<typeof ProductMediaGalleryTemplate> = {
  component: ProductMediaGalleryTemplate,
  args: {
    product: {
      id: "1",
      title: "Media Product",
      price: 49,
      media: [
        { url: "/placeholder.svg", type: "image" },
        { url: "/placeholder.svg", type: "image" },
      ],
    },
    ctaLabel: "Add to cart",
  },
  argTypes: {
    product: { control: "object" },
    ctaLabel: { control: "text" },
    onAddToCart: { action: "add-to-cart" },
  },
};
export default meta;

export const Default: StoryObj<typeof ProductMediaGalleryTemplate> = {};
