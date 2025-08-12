import { type Meta, type StoryObj } from "@storybook/react";
import { ProductGalleryTemplate } from "./ProductGalleryTemplate";

const meta: Meta<typeof ProductGalleryTemplate> = {
  component: ProductGalleryTemplate,
  args: {
    products: [
      {
        id: "1",
        title: "Product 1",
        media: [{ url: "/placeholder.svg", type: "image" }],
        price: 10,
      },
      {
        id: "2",
        title: "Product 2",
        media: [{ url: "/placeholder.svg", type: "image" }],
        price: 20,
      },
      {
        id: "3",
        title: "Product 3",
        media: [{ url: "/placeholder.svg", type: "image" }],
        price: 30,
      },
    ],
    useCarousel: false,
    minItems: 1,
    maxItems: 5,
  },
  argTypes: {
    products: { control: "object" },
    useCarousel: { control: "boolean" },
    minItems: { control: { type: "number" } },
    maxItems: { control: { type: "number" } },
  },
};
export default meta;

export const Default: StoryObj<typeof ProductGalleryTemplate> = {};
