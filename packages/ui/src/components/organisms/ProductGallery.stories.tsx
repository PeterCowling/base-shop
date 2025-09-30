import { type Meta, type StoryObj } from "@storybook/react";
import { ProductGallery } from "./ProductGallery";

const meta = {
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
} satisfies Meta<typeof ProductGallery>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
