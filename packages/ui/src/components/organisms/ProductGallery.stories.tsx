import { type Meta, type StoryObj } from "@storybook/nextjs";

import { ProductGallery } from "./ProductGallery";

const meta: Meta<typeof ProductGallery> = {
  title: "Organisms/Product Gallery",
  component: ProductGallery,
  args: {
    media: [
      {
        type: "image",
        src: "https://placehold.co/600x600",
        alt: "Image 1",
      },
      {
        type: "image",
        src: "https://placehold.co/600x600?text=2",
        alt: "Image 2",
      },
    ],
  },
};
export default meta;

export const Default: StoryObj<typeof ProductGallery> = {};
