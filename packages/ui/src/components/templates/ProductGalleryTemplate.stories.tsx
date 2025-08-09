import { type Meta, type StoryObj } from "@storybook/react";
import { ProductGalleryTemplate } from "./ProductGalleryTemplate";

const meta: Meta<typeof ProductGalleryTemplate> = {
  component: ProductGalleryTemplate,
  args: {
    products: [
      { id: "1", title: "Product 1", image: "/placeholder.svg", price: 10 },
      { id: "2", title: "Product 2", image: "/placeholder.svg", price: 20 },
      { id: "3", title: "Product 3", image: "/placeholder.svg", price: 30 },
    ],
    useCarousel: false,
    minItemsPerSlide: 1,
    maxItemsPerSlide: 4,
  },
  argTypes: {
    products: { control: "object" },
    useCarousel: { control: "boolean" },
    minItemsPerSlide: { control: { type: "number" } },
    maxItemsPerSlide: { control: { type: "number" } },
  },
};
export default meta;

export const Default: StoryObj<typeof ProductGalleryTemplate> = {};
export const Carousel: StoryObj<typeof ProductGalleryTemplate> = {
  args: { useCarousel: true },
};
